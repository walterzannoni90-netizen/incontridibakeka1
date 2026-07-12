import { ArrowRight, BadgeCheck, Crown, MapPin, MessageCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

type Variant = "discover" | "safe" | "publish" | "boost";

const content = {
  discover: {
    eyebrow: "Incontri nella tua città",
    title: "Persone reali, nuove connessioni",
    description: "Sfoglia le categorie e trova gli annunci più vicini a te.",
    action: "Esplora gli annunci",
    href: "/#ads-section",
    Icon: MapPin,
    theme: "from-violet-950 via-violet-900/95 to-fuchsia-900/70",
  },
  safe: {
    eyebrow: "La tua privacy conta",
    title: "Conosci e conversa con più sicurezza",
    description: "Profili, messaggi riservati e strumenti per segnalare contenuti sospetti.",
    action: "Scopri come funziona",
    href: "/blog",
    Icon: ShieldCheck,
    theme: "from-slate-950 via-indigo-950/95 to-cyan-900/70",
  },
  publish: {
    eyebrow: "Fatti trovare",
    title: "Pubblica il tuo annuncio in pochi minuti",
    description: "Racconta chi sei, scegli la città e raggiungi persone interessate.",
    action: "Pubblica un annuncio",
    href: "/#publish",
    Icon: Sparkles,
    theme: "from-fuchsia-950 via-purple-900/95 to-rose-900/70",
  },
  boost: {
    eyebrow: "Più visibilità, quando vuoi",
    title: "Porta il tuo annuncio in primo piano",
    description: "Usa i crediti per attivare Vetrina o Premium scegliendo una durata chiara e reale.",
    action: "Scopri crediti e Vetrina",
    href: "/shop",
    Icon: Zap,
    theme: "from-amber-950 via-violet-950/95 to-fuchsia-900/75",
  },
} satisfies Record<Variant, Record<string, unknown>>;

export default function SitePromoBanner({ variant = "discover", compact = false }: { variant?: Variant; compact?: boolean }) {
  const [, navigate] = useLocation();
  const item = content[variant];
  const Icon = item.Icon;

  const handleClick = () => {
    if (item.href === "/#ads-section") {
      navigate("/");
      window.setTimeout(() => document.getElementById("ads-section")?.scrollIntoView({ behavior: "smooth" }), 80);
      return;
    }
    if (item.href === "/#publish") {
      navigate("/?publish=1");
      return;
    }
    navigate(item.href);
  };

  return (
    <section className={compact ? "px-3 py-5 md:px-6" : "container py-7 md:py-10"} aria-label={item.eyebrow}>
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/15 text-white shadow-xl shadow-violet-950/15">
        <img
          src="/images/site-promo-banner.png"
          alt="Città digitale italiana, connessioni, chat e sicurezza"
          className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${item.theme}`} />
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm" />
        <div className="absolute bottom-5 right-8 hidden rotate-3 items-center gap-3 rounded-2xl border border-white/20 bg-black/20 px-4 py-3 shadow-2xl backdrop-blur-md md:flex">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-violet-950"><Crown className="h-5 w-5" /></span>
          <div><p className="text-xs font-bold">Metti in evidenza</p><p className="text-[10px] text-white/65">Durata sempre visibile</p></div>
        </div>
        <div className={`relative flex items-center px-5 ${compact ? "min-h-40 py-6 md:px-8" : "min-h-52 py-8 md:min-h-64 md:px-10"}`}>
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-200">
              <Icon className="h-4 w-4" /> {item.eyebrow}
            </div>
            <h2 className={`font-poppins font-bold leading-tight ${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"}`}>
              {item.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/80 md:mt-3 md:text-base">{item.description}</p>
            <Button onClick={handleClick} className="mt-5 gap-2 bg-white text-violet-900 hover:bg-white/90">
              {item.action} <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-white/70">
              <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Profili verificabili</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Messaggi riservati</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
