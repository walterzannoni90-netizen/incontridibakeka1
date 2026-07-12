import { useRouter } from "@/hooks/useRouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowUpRight, BookOpen, Clock3, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { blogArticles } from "@/data/blog-data";
import SitePromoBanner from "@/components/SitePromoBanner";

const CITIES = [
  "Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna",
  "Firenze", "Catania", "Bari", "Venezia", "Verona", "Messina", "Padova",
  "Trieste", "Brescia", "Parma", "Taranto", "Modena", "Reggio Calabria",
  "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini",
  "Salerno", "Ferrara", "Sassari", "Siracusa", "Pescara", "Monza",
  "Latina", "Bergamo", "Trento", "Vicenza", "Terni", "Novara",
  "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena",
  "Lecce", "Bolzano", "Cosenza", "Pisa", "Siena", "Aosta",
  "Crotone", "Como", "Lucca", "Mantova", "Varese",
];

const CATEGORIES = [
  { slug: "guide", title: "Guide e Consigli", gradient: "from-blue-600 to-purple-600" },
  { slug: "incontri", title: "Incontri per Città", gradient: "from-purple-600 to-pink-600" },
  { slug: "escort", title: "Escort per Città", gradient: "from-pink-600 to-red-600" },
  { slug: "trans", title: "Trans per Città", gradient: "from-rose-600 to-purple-600" },
  { slug: "uomo-cerca-uomo", title: "Uomo Cerca Uomo per Città", gradient: "from-indigo-600 to-blue-600" },
];

export default function Blog() {
  const { navigate } = useRouter();
  const featured = blogArticles.slice(0, 3);

  const articlesByCategory = (slug: string) =>
    blogArticles.filter(a => a.category === slug);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/70 via-background to-background dark:from-violet-950/20">
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 text-white py-16 md:py-24">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 relative">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white mb-6 gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" /> Torna agli annunci
          </Button>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-cyan-200"><BookOpen className="h-4 w-4" /> Magazine</div>
          <h1 className="max-w-3xl text-4xl md:text-6xl font-bold font-poppins mb-4">Guide per connessioni più consapevoli</h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Oltre 100 guide per orientarsi tra annunci, privacy e incontri nelle città italiane.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs text-white/70">
            <span className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Sicurezza pratica</span>
            <span className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-2"><MapPin className="h-4 w-4 text-pink-300" /> Guide locali</span>
            <span className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-2"><Sparkles className="h-4 w-4 text-amber-300" /> Consigli utili</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <section className="mb-16">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-primary">In evidenza</p>
          <h2 className="mb-6 font-poppins text-3xl font-bold">Da leggere oggi</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((article, index) => (
              <Card key={article.slug} onClick={() => navigate(`/blog/${article.slug}`)} className={`group cursor-pointer overflow-hidden rounded-3xl border-0 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${index === 0 ? "bg-gradient-to-br from-violet-700 to-purple-950" : index === 1 ? "bg-gradient-to-br from-cyan-700 to-slate-950" : "bg-gradient-to-br from-fuchsia-700 to-rose-950"}`}>
                <div className="flex min-h-64 flex-col p-6"><span className="text-xs font-bold uppercase tracking-wider text-white/60">{article.categoryTitle}</span><h3 className="mt-4 font-poppins text-xl font-bold leading-snug">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/65">{article.excerpt}</p><div className="mt-auto flex items-center justify-between pt-6 text-xs font-semibold"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> 5 min</span><ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div></div>
              </Card>
            ))}
          </div>
        </section>

        <SitePromoBanner variant="discover" compact />
        {CATEGORIES.map(cat => {
          const articles = articlesByCategory(cat.slug).slice(0, 6);
          if (articles.length === 0) return null;
          return (
            <section key={cat.slug} className="mb-16">
              <h2 className="text-2xl font-bold font-poppins mb-6 flex items-center gap-3">
                <span className={`w-1 h-6 bg-gradient-to-b ${cat.gradient} rounded-full`} />
                {cat.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map(article => (
                  <Card
                    key={article.slug}
                    className="group cursor-pointer overflow-hidden rounded-2xl border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl"
                    onClick={() => navigate(`/blog/${article.slug}`)}
                  >
                    <div className="flex min-h-52 flex-col p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{article.categoryTitle}</span>
                        {article.city && (
                          <span className="text-[10px] text-muted-foreground">— {article.city}</span>
                        )}
                      </div>
                      <h3 className="font-poppins font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{article.excerpt}</p>
                      <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-primary">Leggi la guida <ArrowUpRight className="h-3.5 w-3.5" /></span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}

        {/* CITY GRID */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold font-poppins mb-6 flex items-center gap-3">
            <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            Annunci per Città
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {CITIES.map(city => (
              <Card
                key={city}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/incontri/${city.toLowerCase()}`)}
              >
                <div className="p-3 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-medium truncate">{city}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FOOTER SEO */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30">
          <h2 className="text-xl font-bold font-poppins mb-4">Perché scegliere Incontri di Bakeka</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">✅ Controlli e segnalazioni</h3>
              <p>Ogni annuncio può essere segnalato e gestito dal pannello di moderazione.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">🛡️ Privacy garantita</h3>
              <p>Messaggi riservati e strumenti pensati per limitare la diffusione dei dati personali.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">🇮🇹 Made in Italy</h3>
              <p>Guide dedicate alle principali città italiane, da Nord a Sud.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
