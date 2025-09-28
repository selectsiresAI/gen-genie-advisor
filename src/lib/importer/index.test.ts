// @ts-nocheck
import { describe, expect, it } from "vitest";
import { suggestMapping, toCanonicalValue } from "./index";

describe("suggestMapping", () => {
  it("should map exact synonyms", () => {
    const map = suggestMapping(["PTA Leite", "Nome"]);
    expect(map["PTA Leite"]).toBe("ptam");
  });

  it("should avoid duplicate mappings", () => {
    const map = suggestMapping(["PTAM", "PTA Milk"]);
    expect(map["PTAM"]).toBe("ptam");
    expect(map["PTA Milk"]).toBeNull();
  });
});

describe("toCanonicalValue", () => {
  it("should convert kg to lbs for PTAM", () => {
    const value = toCanonicalValue("ptam", "PTA Milk (kg)", 5);
    expect(value).toBeCloseTo(11.0231, 3);
  });

  it("should keep percent values as-is", () => {
    const value = toCanonicalValue("ptaf_pct", "PTA FAT %", "3.2%");
    expect(value).toBeCloseTo(3.2, 1);
  });
});
