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
