import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { convertXML } from "simple-xml-to-json";

type CliArgs = {
  inputPath: string;
  outDir: string;
};

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

  const xmlContent = await readFile(resolvedInputPath, "utf-8");
  const convertedJson = convertXML(xmlContent);

  await mkdir(resolvedOutDir, { recursive: true });

  const outputPath = buildOutputPath(inputPath, outDir);
  await writeFile(outputPath, JSON.stringify(convertedJson, null, 2), "utf-8");

  console.log(`Converted ${inputPath} -> ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("Failed to convert XML file", error);
  process.exitCode = 1;
});
