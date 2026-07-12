import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useStripe } from "@/hooks/useStripe";
import { useRouter } from "@/hooks/useRouter";
import { ArrowLeft, Zap, CheckCircle, Loader2, Coins } from "lucide-react";
import PageIntro from "@/components/PageIntro";

const CREDIT_PACKS = [
  { credits: 10, price: 4.99, popular: false, features: ["Rendi Premium per 1 giorno", "Risali nei risultati 2 volte"] },
  { credits: 30, price: 9.99, popular: true, features: ["Rendi Premium per 7 giorni", "Evidenzia con SuperHot", "Risali nei risultati 5 volte"] },
  { credits: 70, price: 19.99, popular: false, features: ["Rendi Premium per 30 giorni", "Sponsorizza SuperTop 7 giorni", "Risali illimitato"] },
  { credits: 150, price: 34.99, popular: false, features: ["Rendi Premium illimitato", "Sponsorizza SuperTop 30 giorni", "Tutte le funzioni premium", "Priorita nel supporto"] },
];

export default function Shop() {
  const { user, updateUser } = useAuth();
  const { navigate } = useRouter();
  const { createCheckoutSession, verifyPayment, handlePaymentCallback } = useStripe();
  const [loadingPack, setLoadingPack] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Gestisce il callback dopo il pagamento Stripe
  useEffect(() => {
    const callback = handlePaymentCallback();
    if (callback?.success && callback.sessionId) {
      setVerifying(true);
      toast.info("Verifica pagamento in corso...");

      verifyPayment(callback.sessionId)
        .then((result) => {
          if (result?.status === "completed") {
            toast.success("Pagamento completato!", {
              description: `Hai ricevuto ${result.credits} crediti. Totale: ${result.totalCredits}`,
            });
            // Aggiorna i crediti dell'utente nel contesto
            updateUser({ credits: result.totalCredits, has_paid: result.has_paid });
            // Rimuovi i parametri URL
            window.history.replaceState({}, "", "/shop");
          } else {
            toast.warning("Pagamento in elaborazione", {
              description: "I crediti verranno aggiornati a breve.",
            });
          }
        })
        .catch((err) => {
          toast.error("Errore verifica pagamento", { description: err.message });
        })
        .finally(() => {
          setVerifying(false);
        });
    } else if (callback && !callback.success) {
      toast.info("Pagamento annullato", { description: callback.message });
      window.history.replaceState({}, "", "/shop");
    }
  }, [handlePaymentCallback, verifyPayment, updateUser]);

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
    try {
      setLoadingPack(credits);
      toast.info("Reindirizzamento a Stripe in corso...", {
        description: `${credits} crediti in preparazione.`,
      });
      await createCheckoutSession(credits);
    } catch (error) {
      console.error("Errore acquisto:", error);
      const message = error instanceof Error ? error.message : "Errore durante l'acquisto. Riprova.";
      toast.error("Acquisto non riuscito", { description: message });
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Torna agli annunci
        </Button>

        <PageIntro eyebrow="Visibilità e risultati" title="Dai più forza ai tuoi annunci" description="Scegli un pacchetto, paga in sicurezza con Stripe e usa i crediti per vetrina e promozioni." icon={Coins}>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-white">Saldo: {user.credits || 0} crediti</span>
          </div>
        </PageIntro>

        {verifying && (
          <Card className="mb-6 p-4 text-center bg-yellow-50 border-yellow-200">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-yellow-600" />
            <p className="text-yellow-800">Verifica pagamento in corso...</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.credits}
              className={`relative rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                pack.popular
                  ? "border-2 border-primary shadow-lg scale-105"
                  : "border border-border"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  POPOLARE
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-foreground">{pack.credits}</div>
                <div className="text-sm text-muted-foreground">crediti</div>
              </div>

              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-primary">€{pack.price}</div>
              </div>

              <ul className="space-y-3 mb-6">
                {pack.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full gap-2"
                variant={pack.popular ? "default" : "outline"}
                onClick={() => handleBuyCredits(pack.credits)}
                disabled={loadingPack === pack.credits || verifying}
              >
                {loadingPack === pack.credits ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Acquista
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            I pagamenti sono gestiti in modo sicuro tramite Stripe. I crediti vengono aggiunti immediatamente dopo la conferma del pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}
