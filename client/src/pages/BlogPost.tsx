import { useRouter } from "@/hooks/useRouter";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, MapPin, Calendar, Clock3, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { blogArticles } from "@/data/blog-data";
import SitePromoBanner from "@/components/SitePromoBanner";
import { setPageMetadata } from "@/lib/seo";

const ARTICLES_MAP: Record<string, typeof blogArticles[0]> = {};
blogArticles.forEach(a => { ARTICLES_MAP[a.slug] = a; });

export default function BlogPost() {
  const { navigate } = useRouter();
  const [, params] = useRoute<{ slug: string }>("/blog/:slug");
  const slug = params?.slug || "";
  const article = ARTICLES_MAP[slug];
  const headings = article?.content.split("\n").filter(line => line.startsWith("## ")).map(line => line.replace("## ", "")) ?? [];

  useEffect(() => {
    if (article) {
      setPageMetadata({
        title: `${article.title} | Incontri di Bakeka`,
        description: article.excerpt,
        path: `/blog/${article.slug}/`,
      });
    } else {
      setPageMetadata({
        title: "Articolo non disponibile | Incontri di Bakeka",
        description: "Questa guida non è disponibile.",
        path: `/blog/${slug}/`,
        robots: "noindex,nofollow",
      });
    }
  }, [article, slug]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Articolo non trovato</h2>
          <p className="text-muted-foreground mb-4">L'articolo che cerchi non esiste o è stato rimosso.</p>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Torna al blog
          </Button>
        </div>

        <SitePromoBanner variant="safe" compact />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/60 via-background to-background dark:from-violet-950/20">
      <article className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <Button variant="ghost" size="sm" className="mb-8 gap-2" onClick={() => navigate("/blog")}>
          <ArrowLeft className="w-4 h-4" /> Torna al blog
        </Button>

        <header className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 p-6 text-white shadow-2xl shadow-violet-950/20 md:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative max-w-4xl">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200 px-2 py-1 rounded-full bg-white/10">{article.categoryTitle}</span>
            {article.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {article.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {article.date}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-poppins mb-4 leading-tight">{article.title}</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-white/70">{article.excerpt}</p>
          <div className="mt-6 flex items-center gap-4 text-xs text-white/60"><span className="flex items-center gap-1"><Clock3 className="h-4 w-4" /> 5 min di lettura</span><span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Consigli pratici</span></div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block"><div className="sticky top-6 rounded-2xl border bg-card p-5 shadow-sm"><p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary"><BookOpen className="h-4 w-4" /> In questa guida</p><div className="space-y-3">{headings.slice(0, 8).map((heading, i) => <p key={i} className="text-sm leading-snug text-muted-foreground">{i + 1}. {heading}</p>)}</div></div></aside>
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm md:p-10">
          {article.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return <h2 key={i} className="mt-10 border-l-4 border-primary pl-4 font-poppins text-2xl font-bold first:mt-0 mb-4">{line.replace("## ", "")}</h2>;
            }
            if (line.startsWith("### ")) {
              return <h3 key={i} className="text-lg font-bold mt-6 mb-3">{line.replace("### ", "")}</h3>;
            }
            if (line.startsWith("- **")) {
              const parts = line.match(/- \*\*(.+?)\*\*: (.+)/);
              if (parts) {
                return <p key={i} className="mb-2"><strong>{parts[1]}</strong>: {parts[2]}</p>;
              }
            }
            if (line.startsWith("- ")) {
              const text = line.replace("- ", "");
              if (text.match(/^\*\*(.+?)\*\*/)) {
                return <p key={i} className="mb-1 ml-4">• {text}</p>;
              }
              return <p key={i} className="mb-1 ml-4">• {text}</p>;
            }
            if (line.match(/^\d+\.\s/)) {
              return <p key={i} className="mb-1 ml-4">{line}</p>;
            }
            if (line.trim() === "") {
              return <div key={i} className="h-3" />;
            }
            return <p key={i} className="mb-4 text-[15px] leading-8 text-foreground/80 md:text-base">{line}</p>;
          })}
        </div>
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30 text-center">
          <h3 className="font-bold text-lg mb-2">Pronto a conoscere persone nuove?</h3>
          <p className="text-muted-foreground mb-4">Registrati su Incontri di Bakeka e scopri gli annunci disponibili nella tua città.</p>
          <Button size="lg" className="gap-2" onClick={() => navigate("/")}>
            Vedi gli annunci <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </article>
    </div>
  );
}
