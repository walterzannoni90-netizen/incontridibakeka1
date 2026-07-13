import { ArrowRight, BookOpen, Download, ShieldCheck } from "lucide-react";

const GUIDE_PATH = "/downloads/guida-incontri-consapevoli.pdf";

export default function SafetyGuidePromo() {
  return (
    <section className="relative overflow-hidden bg-[#100b22] py-16 text-white md:py-24" aria-labelledby="safety-guide-title">
      <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_12%_20%,rgba(139,92,246,.38),transparent_32%),radial-gradient(circle_at_86%_75%,rgba(244,114,182,.25),transparent_28%)]" />
      <div className="container relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-2xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-100 backdrop-blur">
            <ShieldCheck className="h-4 w-4" /> Risorsa gratuita
          </span>
          <h2 id="safety-guide-title" className="font-poppins text-4xl font-black leading-[1.04] sm:text-5xl md:text-6xl">
            Prima tu. Sempre.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-violet-100/80">
            Una guida originale e pratica per proteggere privacy, confini e benessere prima, durante e dopo un incontro.
          </p>
          <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Checklist rapide", "Privacy digitale", "Contatti utili"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] px-3 py-3 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-pink-400" /> {item}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={GUIDE_PATH}
              download="Guida-Incontri-Consapevoli.pdf"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#21133f] shadow-xl shadow-violet-950/30 transition hover:-translate-y-0.5 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            >
              <Download className="h-5 w-5" /> Scarica la guida PDF
            </a>
            <a
              href={GUIDE_PATH}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              <BookOpen className="h-5 w-5" /> Sfogliala online <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-4 text-xs text-violet-200/60">PDF gratuito · lettura rapida · aggiornato a luglio 2026</p>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:mr-0">
          <div className="absolute -inset-4 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-violet-500/30 to-pink-500/20 blur-xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/40 backdrop-blur">
            <img
              src="/images/guida-incontri-home.jpg"
              alt="Due persone adulte conversano durante un incontro serale"
              className="aspect-[4/3] w-full rounded-[1.45rem] object-cover object-[72%_center]"
              loading="lazy"
              width="1800"
              height="1013"
            />
            <div className="absolute inset-x-7 bottom-7 rounded-2xl border border-white/15 bg-[#120b25]/85 p-5 backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-pink-300">Guida essenziale</p>
              <p className="mt-1 font-poppins text-2xl font-black">Incontri consapevoli</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
