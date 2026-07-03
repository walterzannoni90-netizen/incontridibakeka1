import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useStripe } from "@/hooks/useStripe";
import { useRouter } from "@/hooks/useRouter";
import { ArrowLeft, Zap, Star } from "lucide-react";

const CREDIT_PACKS = [
  { credits: 10, price: 4.99, popular: false },
  { credits: 30, price: 9.99, popular: true },
  { credits: 70, price: 19.99, popular: false },
  { credits: 150, price: 34.99, popular: false },
];

export default function Shop() {
  const { user } = useAuth();
  const { createCheckoutSession } = useStripe();
  const { navigate } = useRouter();
  const [loadingPack, setLoadingPack] = useState<number | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="mb-4">Accedi per acquistare crediti</p>
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
      await createCheckoutSession(user.id, credits);
    } catch (error) {
      console.error("Errore acquisto:", error);
      alert("Errore durante l'acquisto. Riprova.");
      setLoadingPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="container h-16 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold font-poppins mb-3 md:mb-4">
              Shop Crediti
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Acquista crediti per potenziare i tuoi annunci
            </p>
            <p className="text-primary font-bold mt-3 md:mt-4">
              Crediti attuali: {user.credits || 0}
            </p>
          </div>

          {/* Credit Packs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
            {CREDIT_PACKS.map((pack) => (
              <Card
                key={pack.credits}
                className={`p-5 md:p-8 relative overflow-hidden transition-all hover:shadow-lg ${
                  pack.popular ? "ring-2 ring-accent" : ""
                }`}
              >
                {pack.popular && (
                  <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-4 py-1 text-sm font-bold">
                    PIU VENDUTO
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-4xl font-bold text-primary">
                      {pack.credits}
                    </p>
                    <p className="text-muted-foreground">crediti</p>
                  </div>
                  <Zap className="w-12 h-12 text-accent" />
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold">
                    €{pack.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    €{(pack.price / pack.credits).toFixed(2)} per credito
                  </p>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => handleBuyCredits(pack.credits)}
                  disabled={loadingPack !== null}
                  variant={pack.popular ? "default" : "outline"}
                >
                  {loadingPack === pack.credits ? (
                    <>
                      <span className="animate-spin">⏳</span>
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
          <Card className="p-8 bg-muted/50">
            <h3 className="text-lg font-bold mb-4 font-poppins">
              Come usare i crediti?
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">👑</span>
                <span>Rendi il tuo annuncio Premium (50 crediti)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">⭐</span>
                <span>Sponsorizza in SuperTop (100 crediti)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-bold">🔥</span>
                <span>Evidenzia con SuperHot (30 crediti)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 font-bold">⬆️</span>
                <span>Risali nei risultati (5 crediti)</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
