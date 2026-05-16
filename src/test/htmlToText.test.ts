import { describe, expect, it } from "vitest";
import { htmlToText } from "../util/htmlToText.js";

describe("htmlToText", () => {
  it("strips tags and preserves line breaks", () => {
    const text = htmlToText("<div><p>Hello &amp; world</p><br/><p>Line 2</p></div>");
    expect(text).toContain("Hello & world");
    expect(text).toContain("Line 2");
  });
});
