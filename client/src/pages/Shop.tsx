import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useStripe } from "@/hooks/useStripe";
import { useRouter } from "@/hooks/useRouter";
import { ArrowLeft, Zap, Star, CheckCircle, Loader2 } from "lucide-react";

const STRIPE_CONFIGURED = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

const CREDIT_PACKS = [
  { credits: 10, price: 4.99, popular: false, features: ["Rendi Premium per 1 giorno", "Risali nei risultati 2 volte"] },
  { credits: 30, price: 9.99, popular: true, features: ["Rendi Premium per 7 giorni", "Evidenzia con SuperHot", "Risali nei risultati 5 volte"] },
  { credits: 70, price: 19.99, popular: false, features: ["Rendi Premium per 30 giorni", "Sponsorizza SuperTop 7 giorni", "Risali illimitato"] },
  { credits: 150, price: 34.99, popular: false, features: ["Rendi Premium illimitato", "Sponsorizza SuperTop 30 giorni", "Tutte le funzioni premium", "Priorita nel supporto"] },
];

export default function Shop() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { createCheckoutSession } = useStripe();
  const [loadingPack, setLoadingPack] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔐</div>
          <p className="mb-4 text-muted-foreground">Accedi per acquistare crediti e potenziare i tuoi annunci</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleBuyCredits = async (credits: number) => {
    if (!STRIPE_CONFIGURED) {
      toast.error("Pagamenti non configurati", {
        description: "Configura Stripe nel file .env per abilitare gli acquisti.",
      });
      return;
    }
    try {
      setLoadingPack(credits);
      setRedirecting(true);
      toast.info("Reindirizzamento a Stripe in corso...", {
        description: `${credits} crediti in preparazione.`,
      });
      // crea la sessione di checkout e reindirizza a Stripe
      await createCheckoutSession(user.id, credits);
      // Se arriviamo qui senza redirect (URL mancante), resetta lo stato
      setLoadingPack(null);
      setRedirecting(false);
      toast.success("Sessione di pagamento pronta.");
    } catch (error) {
      console.error("Errore acquisto:", error);
      const message =
        error instanceof Error ? error.message : "Errore durante l'acquisto. Riprova.";
      toast.error("Acquisto non riuscito", { description: message });
      setLoadingPack(null);
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container h-16 flex items-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold font-poppins mb-3 md:mb-4">
              Shop Crediti
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-3">
              Acquista crediti per potenziare i tuoi annunci
            </p>
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-bold px-4 py-2 rounded-full">
              <Zap className="w-5 h-5" />
              Crediti attuali: {user.credits || 0}
            </div>
          </div>

          {/* Credit Packs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            {CREDIT_PACKS.map((pack) => (
              <Card
                key={pack.credits}
                className={`p-5 md:p-6 relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
                  pack.popular ? "ring-2 ring-accent shadow-lg" : ""
                }`}
              >
                {pack.popular && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-bold">
                    PIU VENDUTO
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl md:text-4xl font-bold text-primary">{pack.credits}</p>
                    <p className="text-muted-foreground text-sm">crediti</p>
                  </div>
                  <Zap className={`w-10 h-10 ${pack.popular ? "text-accent" : "text-primary/40"}`} />
                </div>

                <div className="mb-4">
                  <p className="text-2xl md:text-3xl font-bold">&euro;{pack.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    &euro;{(pack.price / pack.credits).toFixed(2)} per credito
                  </p>
                </div>

                <ul className="space-y-1.5 mb-5">
                  {pack.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                      className="w-full gap-2"
                      onClick={() => handleBuyCredits(pack.credits)}
                      disabled={loadingPack !== null || redirecting}
                      variant={pack.popular ? "default" : "outline"}
                    >
                      {loadingPack === pack.credits ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Elaborazione...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Acquista
                        </>
                      )}
                    </Button>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="p-6 md:p-8 bg-muted/50 border-0">
            <h3 className="text-lg font-bold mb-4 font-poppins">Come usare i crediti?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="font-semibold text-sm">Premium (50 crediti)</p>
                  <p className="text-xs text-muted-foreground">Il tuo annuncio appare in cima con badge dorato</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-semibold text-sm">SuperTop (100 crediti)</p>
                  <p className="text-xs text-muted-foreground">Sponsorizzazione premium, massima visibilita</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-semibold text-sm">SuperHot (30 crediti)</p>
                  <p className="text-xs text-muted-foreground">Evidenzia il tuo annuncio con bordo speciale</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⬆️</span>
                <div>
                  <p className="font-semibold text-sm">Risali (5 crediti)</p>
                  <p className="text-xs text-muted-foreground">Porta il tuo annuncio in alto nei risultati</p>
                </div>
              </div>
            </div>
          </Card>

          {!STRIPE_CONFIGURED && (
            <div className="mt-6 text-center">
              <Card className="p-5 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
                <div className="flex items-start gap-3 text-left">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      Pagamenti non ancora configurati
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-500">
                      Imposta <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40">VITE_STRIPE_PUBLISHABLE_KEY</code> e i relativi
                      <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 mx-1">VITE_STRIPE_PRICE_*</code>
                      nel file <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40">.env</code> per abilitare gli acquisti tramite Stripe.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Overlay durante il reindirizzamento a Stripe */}
      {redirecting && (
        <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-sm">
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
            <p className="font-semibold mb-1">Reindirizzamento a Stripe…</p>
            <p className="text-sm text-muted-foreground">Attendi, stai per essere portato al pagamento sicuro.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
