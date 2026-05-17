import { describe, expect, it } from "vitest";
import { parseArgs } from "../cli.js";

describe("parseArgs", () => {
  it("throws when both json-only and html-only are set", () => {
    expect(() => parseArgs(["node", "cli", "bundle.json", "--json-only", "--html-only"]))
      .toThrowError(/mutually exclusive/i);
  });

  it("parses case summary flag", () => {
    const parsed = parseArgs(["node", "cli", "bundle.json", "--case-summary"]);
    expect(parsed.caseSummary).toBe(true);
  });
});
