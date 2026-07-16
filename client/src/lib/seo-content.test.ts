import { describe, expect, it } from "vitest";
import { blogArticles } from "@/data/blog-data";
import { CATEGORIES } from "@/data/categories";

describe("contenuti SEO indicizzabili", () => {
  it("mantiene un catalogo categorie senza slug duplicati", () => {
    const ids = CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      CATEGORIES.every((category) => category.description.length > 50),
    ).toBe(true);
  });

  it("pubblica solo guide originali sulla piattaforma", () => {
    const slugs = blogArticles.map((article) => article.slug);
    const completeText = blogArticles
      .map(
        (article) => `${article.title}\n${article.excerpt}\n${article.content}`,
      )
      .join("\n")
      .toLowerCase();

    expect(blogArticles.length).toBeGreaterThanOrEqual(8);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(completeText).not.toContain("bakecaincontrii.com");
    expect(completeText).not.toContain("migliore alternativa");
    expect(blogArticles.every((article) => article.content.length > 900)).toBe(
      true,
    );
  });

  it("usa date editoriali coerenti e categorie note", () => {
    const allowedCategories = new Set([
      "piattaforma",
      "pubblicare",
      "sicurezza",
      "visibilita",
    ]);
    for (const article of blogArticles) {
      expect(allowedCategories.has(article.category)).toBe(true);
      expect(Date.parse(article.publishedAt)).not.toBeNaN();
      expect(Date.parse(article.updatedAt)).not.toBeNaN();
      expect(Date.parse(article.updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(article.publishedAt),
      );
    }
  });
});
