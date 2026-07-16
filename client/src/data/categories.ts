import rawCategories from "@shared/categories.json";

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const CATEGORIES: CategoryDefinition[] = rawCategories;

export function getCategoryBySlug(
  slug: string,
): CategoryDefinition | undefined {
  return CATEGORIES.find((category) => category.id === slug);
}
