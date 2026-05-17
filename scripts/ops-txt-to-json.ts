import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

type IcdCode = {
  code: string;
  description: string;
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
    throw new Error("Usage: yarn convert <input.xml> <output-folder>");
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

async function main(): Promise<void> {
  const { inputPath, outDir } = parseArgs(process.argv);
  const resolvedInputPath = resolve(process.cwd(), inputPath);
  const resolvedOutDir = resolve(process.cwd(), outDir);

  const raw = await readFile(resolvedInputPath, "utf-8");
  
  const data: IcdCode[] = [];

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
  await writeFile(outputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`Converted ${inputPath} -> ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("Failed to convert XML file", error);
  process.exitCode = 1;
});