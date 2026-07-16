const SITE_URL = "https://incontridibakeka.com";

function ensureMeta(
  selector: string,
  attribute: "name" | "property",
  value: string,
) {
  let element = document.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  return element;
}

export function canonicalUrl(path = "/"): string {
  const cleanPath = `/${path}`.replace(/\/{2,}/g, "/").split(/[?#]/)[0];
  const normalizedPath =
    cleanPath === "/" || cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;
  return `${SITE_URL}${normalizedPath}`;
}

export function setPageMetadata({
  title,
  description,
  path,
  image,
  robots,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  robots?: string;
}) {
  const canonical = canonicalUrl(path);
  document.title = title;

  ensureMeta('meta[name="description"]', "name", "description").content =
    description;
  ensureMeta('meta[property="og:title"]', "property", "og:title").content =
    title;
  ensureMeta(
    'meta[property="og:description"]',
    "property",
    "og:description",
  ).content = description;
  ensureMeta('meta[property="og:url"]', "property", "og:url").content =
    canonical;
  ensureMeta('meta[name="twitter:title"]', "name", "twitter:title").content =
    title;
  ensureMeta(
    'meta[name="twitter:description"]',
    "name",
    "twitter:description",
  ).content = description;

  if (image) {
    ensureMeta('meta[property="og:image"]', "property", "og:image").content =
      image;
    ensureMeta('meta[name="twitter:image"]', "name", "twitter:image").content =
      image;
  }

  if (robots) {
    ensureMeta('meta[name="robots"]', "name", "robots").content = robots;
  }

  let canonicalLink = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.rel = "canonical";
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = canonical;
}

export function replaceJsonLd(id: string, value: Record<string, unknown>) {
  document.getElementById(id)?.remove();
  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(value);
  document.head.appendChild(script);
}
