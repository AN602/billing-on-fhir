// Build an index of resources by canonical reference key.
//
// Example keys:
// - Patient/Peb48644a34fc5982ae
// - Encounter/P3de9680c9d8c453273
// - Composition/b0a08c6f-dc53-4ee4-a83a-c242714c8144
//
// Intended implementation:
// - Iterate over Bundle.entry[].resource.
// - Store each resource by `${resourceType}/${id}`.
// - Also optionally map fullUrl values to the same resource.
// - Provide helpers getResource(ref), getResourcesByType(type), hasResource(ref).
//
// This index is the foundation for resolving FHIR references throughout the prototype.

import type { DataQualityIssue } from "../billing/dossierTypes.js";
import type { Bundle, Resource } from "./types.js";

export type ResourceIndex = {
  byKey: Map<string, Resource>;
  byFullUrl: Map<string, Resource>;
  byType: Map<string, Resource[]>;
  resourceTypeCounts: Record<string, number>;
  entriesWithoutResource: number;
  issues: DataQualityIssue[];
  getByReference: (reference: string) => Resource | undefined;
  getByType: (resourceType: string) => Resource[];
  has: (reference: string) => boolean;
};

export function makeResourceRef(resource: Resource): string {
  return resource.id ? `${resource.resourceType}/${resource.id}` : resource.resourceType;
}

export function buildResourceIndex(bundle: Bundle): ResourceIndex {
  const byKey = new Map<string, Resource>();
  const byFullUrl = new Map<string, Resource>();
  const byType = new Map<string, Resource[]>();
  const resourceTypeCounts: Record<string, number> = {};
  const issues: DataQualityIssue[] = [];
  let entriesWithoutResource = 0;

  for (const entry of bundle.entry) {
    if (!entry.resource) {
      entriesWithoutResource += 1;
      issues.push({
        severity: "warning",
        code: "ENTRY_WITHOUT_RESOURCE",
        message: "Bundle entry has no embedded resource.",
      });
      continue;
    }

    const resource = entry.resource;
    resourceTypeCounts[resource.resourceType] = (resourceTypeCounts[resource.resourceType] ?? 0) + 1;

    const typedResources = byType.get(resource.resourceType) ?? [];
    typedResources.push(resource);
    byType.set(resource.resourceType, typedResources);

    if (resource.id) {
      const key = `${resource.resourceType}/${resource.id}`;
      if (byKey.has(key)) {
        issues.push({
          severity: "warning",
          code: "DUPLICATE_RESOURCE_KEY",
          message: `Duplicate resource key detected: ${key}`,
          resourceRef: key,
        });
      }
      byKey.set(key, resource);
    }

    if (entry.fullUrl) {
      byFullUrl.set(entry.fullUrl, resource);
    }
  }

  const getByReference = (reference: string): Resource | undefined => {
    return byKey.get(reference) ?? byFullUrl.get(reference);
  };

  const getByType = (resourceType: string): Resource[] => byType.get(resourceType) ?? [];
  const has = (reference: string): boolean => Boolean(getByReference(reference));

  return { byKey, byFullUrl, byType, resourceTypeCounts, entriesWithoutResource, issues, getByReference, getByType, has };
}
