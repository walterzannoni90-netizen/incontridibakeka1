import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "site-promo-banner-dismissed";

export default function SitePromoBanner() {
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.sessionStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/20 bg-violet-950 text-white shadow-2xl shadow-violet-950/35 md:bottom-5"
      aria-label="Scopri Incontri di Bakeka"
    >
      <img
        src="/images/site-promo-banner.png"
        alt="Città italiana digitale con simboli di connessione, chat e sicurezza"
        className="absolute inset-0 h-full w-full object-cover object-center md:object-[65%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-violet-950 via-violet-950/95 to-violet-950/20" />
      <div className="relative flex min-h-32 items-center gap-4 px-5 py-5 pr-12 md:min-h-40 md:px-8 md:py-6">
        <div className="max-w-xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            <ShieldCheck className="h-4 w-4" />
            Incontri più semplici e sicuri
          </div>
          <h2 className="font-poppins text-xl font-bold leading-tight md:text-3xl">
            Trova nuove connessioni nella tua città
          </h2>
          <p className="mt-1.5 hidden max-w-lg text-sm text-white/80 sm:block">
            Esplora gli annunci, scegli chi conoscere e conversa in modo riservato.
          </p>
          <Button
            size="sm"
            className="mt-3 gap-2 bg-white text-violet-800 hover:bg-white/90 md:mt-4"
            onClick={() => {
              dismiss();
              navigate("/#ads-section");
              window.setTimeout(() => document.getElementById("ads-section")?.scrollIntoView({ behavior: "smooth" }), 50);
            }}
          >
            Scopri gli annunci <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-full bg-black/25 p-2 text-white/80 backdrop-blur-sm transition hover:bg-black/45 hover:text-white"
        aria-label="Chiudi banner"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
