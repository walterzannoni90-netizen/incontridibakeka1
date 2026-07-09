import { useEffect, useState } from "react";
import { useRouter } from "@/hooks/useRouter";
import { ITALIAN_CITIES } from "@shared/data";
import Home from "./Home";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

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
      document.title = `Incontri a ${cityName} — Annunci di incontri | Incontri di Bakeka`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          "content",
          `Trova annunci di incontri a ${cityName}. Profili verificati, annunci reali. ${cityName} incontri, amicizie e molto altro su Incontri di Bakeka.`
        );
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = `Trova annunci di incontri a ${cityName}. Profili verificati, annunci reali. ${cityName} incontri, amicizie e molto altro su Incontri di Bakeka.`;
        document.head.appendChild(meta);
      }

      const oldBreadcrumb = document.getElementById("ld-breadcrumb");
      if (oldBreadcrumb) oldBreadcrumb.remove();
      const script = document.createElement("script");
      script.id = "ld-breadcrumb";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://incontridibakeka.com/" },
          { "@type": "ListItem", "position": 2, "name": `Incontri a ${cityName}`, "item": `https://incontridibakeka.com/incontri/${slugify(cityName)}` },
        ],
      });
      document.head.appendChild(script);
    } else {
      navigate("/", { replace: true });
      return;
    }

    setReady(true);
  }, [currentPath]);

  if (!ready) return null;

  return <Home key={initialCity} initialCity={initialCity} />;
}
