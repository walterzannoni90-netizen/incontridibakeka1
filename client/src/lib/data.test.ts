import { describe, expect, it } from "vitest";
import { COUNTRIES, ITALIAN_CITIES, slugify } from "@shared/data";

describe("shared location data", () => {
  it("does not contain duplicate cities", () => {
    expect(new Set(ITALIAN_CITIES).size).toBe(ITALIAN_CITIES.length);
  });

  it("does not contain duplicate country codes", () => {
    const codes = COUNTRIES.map((country) => country.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("creates stable URL slugs for accented and punctuated names", () => {
    expect(slugify("Forlì")).toBe("forli");
    expect(slugify("L'Aquila")).toBe("laquila");
    expect(slugify("Reggio  Emilia")).toBe("reggio-emilia");
  });
});
