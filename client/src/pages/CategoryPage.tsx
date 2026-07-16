import { useEffect, useMemo } from "react";
import { getCategoryBySlug } from "@/data/categories";
import { useRouter } from "@/hooks/useRouter";
import { canonicalUrl, replaceJsonLd, setPageMetadata } from "@/lib/seo";
import Home from "./Home";

export default function CategoryPage() {
  const { currentPath, navigate } = useRouter();
  const categorySlug = useMemo(
    () =>
      currentPath
        .split("/categoria/")
        .pop()
        ?.split(/[/?#]/)[0]
        ?.toLowerCase() || "",
    [currentPath],
  );
  const category = getCategoryBySlug(categorySlug);

  useEffect(() => {
    if (!category) {
      navigate("/404", { replace: true });
      return;
    }

    const path = `/categoria/${category.id}/`;
    setPageMetadata({
      title: `${category.name} — Annunci personali in Italia`,
      description: `${category.description} Consulta esclusivamente gli annunci attivi su Incontri di Bakeka.`,
      path,
    });
    replaceJsonLd("ld-category-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: canonicalUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: category.name,
          item: canonicalUrl(path),
        },
      ],
    });

    return () => document.getElementById("ld-category-breadcrumb")?.remove();
  }, [category, navigate]);

  if (!category) return null;

  return <Home key={category.id} initialCategory={category.id} />;
}
