import { useRouter } from "@/hooks/useRouter";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useEffect } from "react";
import { blogArticles } from "@/data/blog-data";

const ARTICLES_MAP: Record<string, typeof blogArticles[0]> = {};
blogArticles.forEach(a => { ARTICLES_MAP[a.slug] = a; });

export default function BlogPost() {
  const { navigate } = useRouter();
  const [, params] = useRoute<{ slug: string }>("/blog/:slug");
  const slug = params?.slug || "";
  const article = ARTICLES_MAP[slug];

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — Incontri di Bakeka`;
    }
  }, [article]);

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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-8 gap-2" onClick={() => navigate("/blog")}>
          <ArrowLeft className="w-4 h-4" /> Torna al blog
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">{article.categoryTitle}</span>
            {article.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {article.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {article.date}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-poppins mb-4">{article.title}</h1>
          <p className="text-lg text-muted-foreground">{article.excerpt}</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {article.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return <h2 key={i} className="text-xl font-bold mt-8 mb-4">{line.replace("## ", "")}</h2>;
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
            return <p key={i} className="mb-3 leading-relaxed">{line}</p>;
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30 text-center">
          <h3 className="font-bold text-lg mb-2">Pronto a conoscere persone nuove?</h3>
          <p className="text-muted-foreground mb-4">Registrati su Incontri di Bakeka e scopri annunci verificati nella tua città. Alternativa moderna e sicura a bakecaincontrii.com.</p>
          <Button size="lg" onClick={() => navigate("/")}>
            Vedi gli annunci
          </Button>
        </div>
      </article>
    </div>
  );
}
