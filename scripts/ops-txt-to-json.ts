import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

type OpsCode = {
  code: string;
  description: string;
};

type OpsCodeNode = {
  code: string;
  description: string;
  children: OpsCodeNode[];
};

type CliArgs = {
  inputPath: string;
  outDir: string;
};

// Captures:
// - field 7 as code
// - field 9 as description
//
// Example:
// 4;T;N;1;1-10;1-10;1-100;N;Klinische Untersuchung...
const recordRegex = /^(?:[^;]*;){6}([^;]*);[^;]*;([^;]*)/;

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const inputPath = args[0];
  const outDir = args[1];

  if (!inputPath || !outDir) {
    throw new Error("Usage: yarn convert:ops-txt <input.txt> <output-folder>");
  }

  return { inputPath, outDir };
}

function buildOutputPath(inputPath: string, outDir: string): string {
  const inputFilename = basename(inputPath);
  const inputExtension = extname(inputFilename);
  const outputFilename = inputExtension
    ? inputFilename.slice(0, -inputExtension.length) + ".json"
    : `${inputFilename}.json`;

  return resolve(process.cwd(), outDir, outputFilename);
}

function findExistingParentCode(code: string, knownCodes: Set<string>): string | undefined {
  const dotIndex = code.indexOf(".");
  if (dotIndex === -1) {
    return undefined;
  }

  const base = code.slice(0, dotIndex);
  const suffix = code.slice(dotIndex + 1);

  for (let length = suffix.length - 1; length >= 1; length -= 1) {
    const candidate = `${base}.${suffix.slice(0, length)}`;
    if (knownCodes.has(candidate)) {
      return candidate;
    }
  }

  if (knownCodes.has(base)) {
    return base;
  }

  return undefined;
}

function sortTree(nodes: OpsCodeNode[]): void {
  nodes.sort((a, b) => a.code.localeCompare(b.code));
  for (const node of nodes) {
    sortTree(node.children);
  }
}

function toHierarchy(entries: OpsCode[]): OpsCodeNode[] {
  const knownCodes = new Set(entries.map((entry) => entry.code));
  const nodesByCode = new Map<string, OpsCodeNode>();

  for (const entry of entries) {
    nodesByCode.set(entry.code, {
      code: entry.code,
      description: entry.description,
      children: [],
    });
  }

  const roots: OpsCodeNode[] = [];
  for (const entry of entries) {
    const node = nodesByCode.get(entry.code);
    if (!node) {
      continue;
    }

    const parentCode = findExistingParentCode(entry.code, knownCodes);
    if (!parentCode) {
      roots.push(node);
      continue;
    }

    const parentNode = nodesByCode.get(parentCode);
    if (!parentNode) {
      roots.push(node);
      continue;
    }

    parentNode.children.push(node);
  }

  sortTree(roots);
  return roots;
}

async function main(): Promise<void> {
  const { inputPath, outDir } = parseArgs(process.argv);
  const resolvedInputPath = resolve(process.cwd(), inputPath);
  const resolvedOutDir = resolve(process.cwd(), outDir);

  const raw = await readFile(resolvedInputPath, "utf-8");
  
  const data: OpsCode[] = [];

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const match = line.match(recordRegex);

    if (!match) {
      console.warn(`Skipping invalid line: ${line}`);
      continue;
    }

    const [, code, desc] = match;

    data.push({
      code: code.trim(),
      description: desc.trim(),
    });
  }

  await mkdir(resolvedOutDir, { recursive: true });

  const outputPath = buildOutputPath(inputPath, outDir);
  const hierarchy = toHierarchy(data);
  await writeFile(outputPath, JSON.stringify(hierarchy, null, 2), "utf-8");

  console.log(`Converted ${inputPath} -> ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("Failed to convert XML file", error);
  process.exitCode = 1;
});
