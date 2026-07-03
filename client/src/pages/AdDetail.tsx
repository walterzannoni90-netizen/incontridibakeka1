import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "@/hooks/useRouter";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin,
  Star,
  MessageCircle,
  Heart,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string;
  city: string;
  age: number;
  image: string;
  images: string[];
  category: string;
  price?: string;
  rating: number;
  review_count: number;
  is_premium: boolean;
  is_sponsored: boolean;
  is_verified: boolean;
  views: number;
  created_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  name: string;
  phone: string;
  avatar_url: string;
}

export default function AdDetail() {
  const { getQueryParam, navigate } = useRouter();
  const { get, patch } = useSupabase();
  const { user, token: authToken } = useAuth();

  const [ad, setAd] = useState<Ad | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>("");
  const [saved, setSaved] = useState(false);

  const adId = getQueryParam("id");

  useEffect(() => {
    if (!adId) {
      navigate("/");
      return;
    }
    loadAd();
  }, [adId]);

  const loadAd = async () => {
    try {
      const ads = await get("ads", `select=*&id=eq.${adId}`);
      if (!ads || ads.length === 0) {
        navigate("/");
        return;
      }

      const adData = ads[0];
      setAd(adData);
      setMainImage(adData.images?.[0] || adData.image || "");

      // Incrementa views
      if (adId) {
        await patch(
          "ads",
          { views: (adData.views || 0) + 1 },
          { id: adId },
          authToken || undefined
        ).catch(() => {});
      }

      // Carica profilo utente
      if (adData.user_id) {
        const profiles = await get(
          "profiles",
          `select=*&id=eq.${adData.user_id}`
        ).catch(() => []);
        if (profiles && profiles.length > 0) {
          setProfile(profiles[0]);
        }
      }
    } catch (error) {
      console.error("Errore caricamento annuncio:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (type: "whatsapp" | "message" | "email") => {
    if (!user) {
      alert("Accedi per contattare");
      return;
    }

    if (!ad) return;

    try {
      // Registra il contatto
      await get("ad_contacts", "", authToken || undefined).catch(() => {});

      if (type === "whatsapp" && profile?.phone) {
        // Apri WhatsApp
        const message = `Ciao, sono interessato al tuo annuncio: ${ad.title}`;
        const whatsappUrl = `https://wa.me/${profile.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
      } else if (type === "email" && profile?.id) {
        // Apri form di contatto
        alert("Email contact - implementare form");
      } else if (type === "message") {
        // Apri chat interna
        alert("Internal message - implementare chat");
      }
    } catch (error) {
      console.error("Errore contatto:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Caricamento annuncio...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Annuncio non trovato</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Button>
        </div>
      </div>
    );
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : [ad.image];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="container h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
          <h1 className="text-xl font-bold font-poppins flex-1 text-center">
            {ad.title}
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden mb-4">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-6xl">👤</div>
                )}
              </div>
            </Card>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      mainImage === img ? "border-primary" : "border-border"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <Card className="p-6 mt-6">
              <h2 className="text-2xl font-bold mb-4 font-poppins">
                Descrizione
              </h2>
              <p className="text-foreground whitespace-pre-wrap mb-6">
                {ad.description}
              </p>

              {ad.price && (
                <div className="bg-accent/10 border border-accent rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Prezzo</p>
                  <p className="text-2xl font-bold text-accent">{ad.price}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-bold capitalize">
                    {ad.category?.replace(/-/g, " ")}
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Visualizzazioni</p>
                  <p className="font-bold">{ad.views + 1}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {ad.is_sponsored && (
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">
                  ⭐ SuperTop
                </span>
              )}
              {ad.is_premium && (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                  👑 Premium
                </span>
              )}
              {ad.is_verified && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  ✅ Verificato
                </span>
              )}
            </div>

            {/* Info Card */}
            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span>{ad.city}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>👤 {ad.age} anni</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="font-bold">{ad.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({ad.review_count} recensioni)
                  </span>
                </div>
              </div>
            </Card>

            {/* Contact Card */}
            <Card className="p-6 mb-6">
              <h3 className="font-bold mb-4 font-poppins">Contatta</h3>
              <div className="space-y-3">
                {profile?.phone && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleContact("whatsapp")}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleContact("message")}
                >
                  <Mail className="w-4 h-4" />
                  Messaggio
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleContact("email")}
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </Card>

            {/* Save Button */}
            <Button
              variant={saved ? "default" : "outline"}
              className="w-full gap-2"
              onClick={() => setSaved(!saved)}
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Salvato" : "Salva"}
            </Button>

            {/* Info */}
            <p className="text-xs text-muted-foreground mt-6 text-center">
              Annuncio #{ad.id.slice(0, 8)} • Pubblicato il{" "}
              {new Date(ad.created_at).toLocaleDateString("it-IT")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
