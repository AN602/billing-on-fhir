import { describe, expect, it } from "vitest";
import { clearOpsCatalogCacheForTests, getOpsCatalogIndex } from "../config/opsCatalog.js";

describe("opsCatalog", () => {
  it("loads catalog independent of process cwd", () => {
    const originalCwd = process.cwd();
    try {
      clearOpsCatalogCacheForTests();
      process.chdir("/tmp");
      const index = getOpsCatalogIndex();
      expect(index.entries.length).toBeGreaterThan(0);
    } finally {
      process.chdir(originalCwd);
      clearOpsCatalogCacheForTests();
    }
  });
});
