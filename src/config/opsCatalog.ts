import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeForExactMatch, splitWords } from "../util/textNormalize.js";

type OpsCatalogNode = {
  code: string;
  description: string;
  children?: OpsCatalogNode[];
};

export type OpsCatalogEntry = {
  code: string;
  description: string;
  normalizedDescription: string;
  firstToken: string;
};

export type OpsCatalogIndex = {
  entries: OpsCatalogEntry[];
  byNormalizedDescription: Map<string, OpsCatalogEntry[]>;
  byFirstToken: Map<string, OpsCatalogEntry[]>;
};

let cachedIndex: OpsCatalogIndex | undefined;

function flattenNodes(nodes: OpsCatalogNode[], into: OpsCatalogNode[]): void {
  for (const node of nodes) {
    into.push({ code: node.code, description: node.description });
    if (node.children?.length) {
      flattenNodes(node.children, into);
    }
  }
}

function parseCatalog(): OpsCatalogNode[] {
  const moduleDir = fileURLToPath(new URL(".", import.meta.url));
  const catalogPath = resolve(moduleDir, "../../resources/ops2026syst_kodes.json");
  const raw = readFileSync(catalogPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("OPS catalog must be a JSON array");
  }
  return parsed as OpsCatalogNode[];
}

function buildIndex(): OpsCatalogIndex {
  const tree = parseCatalog();
  const flatNodes: OpsCatalogNode[] = [];
  flattenNodes(tree, flatNodes);

  const entries: OpsCatalogEntry[] = [];
  const byNormalizedDescription = new Map<string, OpsCatalogEntry[]>();
  const byFirstToken = new Map<string, OpsCatalogEntry[]>();

  for (const item of flatNodes) {
    const normalizedDescription = normalizeForExactMatch(item.description);
    if (!normalizedDescription) {
      continue;
    }

    const firstToken = splitWords(normalizedDescription)[0] ?? "";
    if (!firstToken) {
      continue;
    }

    const entry: OpsCatalogEntry = {
      code: item.code,
      description: item.description,
      normalizedDescription,
      firstToken,
    };

    entries.push(entry);

    const withSameDescription = byNormalizedDescription.get(normalizedDescription) ?? [];
    withSameDescription.push(entry);
    byNormalizedDescription.set(normalizedDescription, withSameDescription);

    const withSameFirstToken = byFirstToken.get(firstToken) ?? [];
    withSameFirstToken.push(entry);
    byFirstToken.set(firstToken, withSameFirstToken);
  }

  return {
    entries,
    byNormalizedDescription,
    byFirstToken,
  };
}

export function getOpsCatalogIndex(): OpsCatalogIndex {
  if (!cachedIndex) {
    cachedIndex = buildIndex();
  }
  return cachedIndex;
}

export function clearOpsCatalogCacheForTests(): void {
  cachedIndex = undefined;
}
