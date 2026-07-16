import { useEffect, useState } from "react";
import { useRouter } from "@/hooks/useRouter";
import { ITALIAN_CITIES, slugify } from "@shared/data";
import { canonicalUrl, replaceJsonLd, setPageMetadata } from "@/lib/seo";
import Home from "./Home";

export default function CityPage() {
  const { navigate, currentPath } = useRouter();
  const [initialCity, setInitialCity] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const citySlug = currentPath.split("/incontri/").pop()?.split("/")[0]?.split("?")[0];
    if (!citySlug) {
      navigate("/");
      return;
    }

    const cityName = ITALIAN_CITIES.find(
      (c) => slugify(c) === citySlug.toLowerCase()
    );

    if (cityName) {
      setInitialCity(cityName);
      const path = `/incontri/${slugify(cityName)}/`;
      setPageMetadata({
        title: `Incontri a ${cityName} — Annunci personali attivi`,
        description: `Consulta gli annunci personali attivi pubblicati dagli utenti a ${cityName}.`,
        path,
      });
      replaceJsonLd("ld-breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": canonicalUrl("/") },
          { "@type": "ListItem", "position": 2, "name": `Incontri a ${cityName}`, "item": canonicalUrl(path) },
        ],
      });
    } else {
      navigate("/", { replace: true });
      return;
    }

    setReady(true);

    return () => document.getElementById("ld-breadcrumb")?.remove();
  }, [currentPath, navigate]);

  if (!ready) return null;

  return <Home key={initialCity} initialCity={initialCity} />;
}
