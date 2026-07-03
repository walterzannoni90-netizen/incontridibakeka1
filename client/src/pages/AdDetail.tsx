import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "@/hooks/useRouter";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@shared/data";
import {
  MapPin,
  Star,
  Heart,
  ArrowLeft,
  ChevronRight,
  Home as HomeIcon,
  Eye,
  Shield,
  Flag,
  Share2,
  Phone,
  MessageCircle,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_CONFIGURED = SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project");

interface Ad {
  id: string;
  title: string;
  description: string;
  city: string;
  age: number;
  image: string;
  images?: string[];
  category: string;
  price?: string;
  rating: number;
  review_count: number;
  is_premium: boolean;
  is_sponsored: boolean;
  is_verified?: boolean;
  views?: number;
  created_at: string;
  user_id: string;
  phone?: string;
  whatsapp?: string;
}

interface Profile {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  avatar_url?: string;
}

// Fallback demo ads
const DEMO_ADS_MAP: Record<string, Ad> = {
  "demo1": { id: "demo1", title: "Sofia - Dolce e passionale", description: "Ciao amore, sono Sofia. Una ragazza solare, educata e piena di sorprese. Disponibile per cene, eventi e momenti di relax. Chiamami per conoscermi meglio.", city: "Roma", age: 26, image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "150€/ora", rating: 5, review_count: 42, is_premium: true, is_sponsored: false, is_verified: true, views: 3420, created_at: new Date().toISOString(), user_id: "demo", phone: "+393331234567", whatsapp: "+393331234567" },
  "demo2": { id: "demo2", title: "Giulia - Bellissima Escort MILANO", description: "Ragazza elegante, classe e bellezza in un unico pacchetto. Ricevo in ambiente pulito e discrezione. Solo per uomini educati.", city: "Milano", age: 24, image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "200€/ora", rating: 5, review_count: 68, is_premium: true, is_sponsored: true, is_verified: true, views: 5610, created_at: new Date().toISOString(), user_id: "demo", phone: "+393337654321", whatsapp: "+393337654321" },
  "demo3": { id: "demo3", title: "Valentina - Rosa", description: "Sono Valentina, ragazza italiana 100%. Simpatica, allegra e molto calda. Passionale ed esigente come te. Ti aspetto tutti i giorni.", city: "Firenze", age: 28, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "120€/ora", rating: 4, review_count: 23, is_premium: false, is_sponsored: false, is_verified: false, views: 890, created_at: new Date().toISOString(), user_id: "demo", phone: "+393881122334", whatsapp: "+393881122334" },
  "demo4": { id: "demo4", title: "Marco - Atleta urbano", description: "Ragazzo sportivo, educato e discreto. Disponibile per compagne di serata, cene ed eventi. Ottima conversazione.", city: "Bologna", age: 30, image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1000&fit=crop", category: "uomo-cerca-donna", price: "100€/ora", rating: 4, review_count: 15, is_premium: false, is_sponsored: false, is_verified: true, views: 450, created_at: new Date().toISOString(), user_id: "demo", phone: "+393556677889", whatsapp: "+393556677889" },
  "demo5": { id: "demo5", title: "Alessia - Italiana vera", description: "Ciao! Sono Alessia, ragazza italiana di 25 anni. Solare, simpatica e bellissima. Amo la compagnia e le serate piacevoli. Scrivimi!", city: "Napoli", age: 25, image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "80€/ora", rating: 5, review_count: 31, is_premium: false, is_sponsored: true, is_verified: true, views: 2100, created_at: new Date().toISOString(), user_id: "demo", phone: "+393444556677", whatsapp: "+393444556677" },
  "demo6": { id: "demo6", title: "Chiara & Luca - Coppia aperta", description: "Coppia giovane e curiosa. Cerchiamo persone come noi per serate divertenti e leggere. Esperienza rispettosa e igienica.", city: "Torino", age: 29, image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop", category: "coppie", price: "200€/coppia", rating: 4, review_count: 12, is_premium: false, is_sponsored: false, is_verified: false, views: 670, created_at: new Date().toISOString(), user_id: "demo", phone: "+393223344556", whatsapp: "+393223344556" },
  "demo7": { id: "demo7", title: "Ilenia - Modella napoletana", description: "Bellissima ragazza napoletana, alta, formosa. Per uomini di classe che sanno apprezzare la vera bellezza italiana.", city: "Salerno", age: 27, image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "100€/ora", rating: 5, review_count: 19, is_premium: true, is_sponsored: false, is_verified: true, views: 1230, created_at: new Date().toISOString(), user_id: "demo", phone: "+393116677889", whatsapp: "+393116677889" },
  "demo8": { id: "demo8", title: "Davide - Ragazzo dolce e discreto", description: "Ragazzo 28 anni, educatissimo, discreto. Per donne che cercano compagnia di qualita. Disponibile anche per eventi e cene di lavoro.", city: "Roma", age: 28, image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&h=1000&fit=crop", category: "uomo-cerca-donna", price: "90€/ora", rating: 4, review_count: 8, is_premium: false, is_sponsored: false, is_verified: false, views: 320, created_at: new Date().toISOString(), user_id: "demo", phone: "+393998877665", whatsapp: "+393998877665" },
  "demo9": { id: "demo9", title: "Martina - Trasgressiva", description: "Ciao tesoro! Sono Martina, ragazza toscana. Solare, allegra e molto disponibile. Ti faro impazzire. Chiamami ora!", city: "Firenze", age: 23, image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "70€/ora", rating: 4, review_count: 27, is_premium: false, is_sponsored: false, is_verified: false, views: 540, created_at: new Date().toISOString(), user_id: "demo", phone: "+393778899001", whatsapp: "+393778899001" },
  "demo10": { id: "demo10", title: "Federica - Italiana calda", description: "Ragazza italiana, tutta naturale. Formosa e passionale. Per veri uomini che sanno trattare una donna. Ti aspetto!", city: "Brescia", age: 29, image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "90€/ora", rating: 5, review_count: 35, is_premium: true, is_sponsored: false, is_verified: true, views: 1890, created_at: new Date().toISOString(), user_id: "demo", phone: "+393009988776", whatsapp: "+393009988776" },
  "demo11": { id: "demo11", title: "Luca & Sara - Coppia torinese", description: "Coppia 30enni torinese. Cerchiamo singoli o coppie per serate di convivialita. Foto reali, garanzia pulizia e discrezione.", city: "Torino", age: 30, image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800&h=1000&fit=crop", category: "coppie", price: "150€/serata", rating: 4, review_count: 7, is_premium: false, is_sponsored: false, is_verified: false, views: 410, created_at: new Date().toISOString(), user_id: "demo", phone: "+393112233445", whatsapp: "+393112233445" },
  "demo12": { id: "demo12", title: "Elena - Veneto in corpo", description: "Ragazza veneta, educata e molto carina. Amo le serate eleganti e le cene a lume di candela. Baci appassionati garantiti.", city: "Venezia", age: 26, image: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800&h=1000&fit=crop", category: "donna-cerca-uomo", price: "110€/ora", rating: 5, review_count: 22, is_premium: false, is_sponsored: true, is_verified: true, views: 980, created_at: new Date().toISOString(), user_id: "demo", phone: "+393441122334", whatsapp: "+393441122334" },
};

export default function AdDetail() {
  const { getQueryParam, navigate, currentPath } = useRouter();
  const { user, token: authToken } = useAuth();

  const [ad, setAd] = useState<Ad | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const adId = getQueryParam("id") || (() => {
    const match = currentPath.match(/^\/ad\/(.+)$/);
    if (match) {
      const slug = match[1];
      const parts = slug.split("-");
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.length >= 5) return lastPart;
      return slug;
    }
    return null;
  })();

  useEffect(() => {
    if (!adId) {
      navigate("/");
      return;
    }
    loadAd();
  }, [adId]);

  const loadAd = async () => {
    if (!SUPABASE_CONFIGURED) {
      const demoAd = DEMO_ADS_MAP[adId!];
      if (demoAd) {
        setAd(demoAd);
        setMainImage(demoAd.image);
        setProfile({ id: "demo", name: demoAd.title.split(" - ")[0], phone: demoAd.phone || "", whatsapp: demoAd.whatsapp || "" });
        const savedAds = JSON.parse(localStorage.getItem("savedAds") || "[]");
        setSaved(savedAds.includes(demoAd.id));
      } else {
        const found = Object.values(DEMO_ADS_MAP).find((a) =>
          `${slugify(a.title)}-${a.id}` === adId || a.id === adId
        );
        if (found) {
          setAd(found);
          setMainImage(found.image);
          setProfile({ id: "demo", name: found.title.split(" - ")[0], phone: found.phone || "", whatsapp: found.whatsapp || "" });
          const savedAds = JSON.parse(localStorage.getItem("savedAds") || "[]");
          setSaved(savedAds.includes(found.id));
        } else {
          navigate("/");
          return;
        }
      }
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/ads?select=*&id=eq.${adId}`,
        { headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" } }
      );
      const ads = await response.json();
      if (!ads || ads.length === 0) {
        navigate("/");
        return;
      }

      const adData = ads[0];
      setAd(adData);
      setMainImage(adData.images?.[0] || adData.image || "");
      const savedAds = JSON.parse(localStorage.getItem("savedAds") || "[]");
      setSaved(savedAds.includes(adData.id));

      // Incrementa views
      if (authToken) {
        await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${adId}`, {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ views: (adData.views || 0) + 1 }),
        }).catch(() => {});
      }

      // Carica profilo
      if (adData.user_id) {
        const profileResp = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${adData.user_id}`,
          { headers: { apikey: SUPABASE_KEY } }
        ).catch(() => null);
        const profiles = profileResp?.ok ? await profileResp.json() : [];
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

  const handleWhatsApp = () => {
    if (!ad) return;
    const phone = profile?.whatsapp || profile?.phone || ad.whatsapp || ad.phone;
    if (!phone) {
      alert("Numero WhatsApp non disponibile per questo annuncio.");
      return;
    }
    const message = `Ciao, ho visto il tuo annuncio "${ad.title}" su Incontri di Bakeka e sono interessato.`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePhoneCall = () => {
    if (!ad) return;
    const phone = profile?.phone || ad.phone;
    if (!phone) {
      alert("Numero di telefono non disponibile per questo annuncio.");
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: ad?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      });
    }
  };

  const handleReport = () => {
    setShowReportModal(false);
    alert("Segnalazione inviata. Il nostro team valutera il contenuto.");
  };

  const toggleSave = () => {
    if (!ad) return;
    const savedAds = JSON.parse(localStorage.getItem("savedAds") || "[]");
    const nextSaved = !saved;
    const nextIds = nextSaved
      ? [...new Set([...savedAds, ad.id])]
      : savedAds.filter((id: string) => id !== ad.id);
    localStorage.setItem("savedAds", JSON.stringify(nextIds));
    setSaved(nextSaved);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">Caricamento annuncio...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-xl mb-4 text-muted-foreground">Annuncio non trovato</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Button>
        </div>
      </div>
    );
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : [ad.image].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Indietro</span>
          </Button>
          <h1 className="text-base md:text-xl font-bold font-poppins flex-1 text-center truncate px-2">
            {ad.title}
          </h1>
          <Button variant="ghost" size="icon" onClick={handleShare} className="w-10 h-10 flex-shrink-0">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
        {/* Breadcrumb */}
        <div className="container py-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
            <button onClick={() => navigate("/")} className="hover:text-primary flex items-center gap-1">
              <HomeIcon className="w-3 h-3" /> Home
            </button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => navigate("/")} className="hover:text-primary capitalize">
              {ad.category?.replace(/-/g, " ") || "Categoria"}
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium truncate">{ad.city}</span>
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden mb-4 border-0 shadow-md">
              <div className="relative aspect-[4/3] md:aspect-video bg-muted flex items-center justify-center">
                {mainImage ? (
                  <img src={mainImage} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-6xl">👤</div>
                )}
                {ad.is_sponsored && (
                  <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                    ⭐ SuperTop
                  </div>
                )}
                {ad.is_verified && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Shield className="w-3 h-3" /> Verificato
                  </div>
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
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      mainImage === img ? "border-primary ring-2 ring-primary/20" : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <Card className="p-4 md:p-6 mt-4 md:mt-6 border-0 shadow-md">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 font-poppins">Descrizione</h2>
              <p className="text-foreground whitespace-pre-wrap mb-6 leading-relaxed">{ad.description}</p>

              {ad.price && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Prezzo</p>
                  <p className="text-2xl font-bold text-accent">{ad.price}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                  <p className="font-bold capitalize text-sm">{ad.category?.replace(/-/g, " ")}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Eta</p>
                  <p className="font-bold">{ad.age} anni</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Visualizzazioni
                  </p>
                  <p className="font-bold">{(ad.views || 0) + 1}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {ad.is_sponsored && (
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">⭐ SuperTop</span>
              )}
              {ad.is_premium && (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">👑 Premium</span>
              )}
              {ad.is_verified && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">✅ Verificato</span>
              )}
            </div>

            {/* Info Card */}
            <Card className="p-6 mb-4 border-0 shadow-md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium">{ad.city}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <span className="text-muted-foreground">👤</span>
                  <span className="font-medium">{ad.age} anni</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="font-bold">{ad.rating}</span>
                  <span className="text-sm text-muted-foreground">({ad.review_count} recensioni)</span>
                </div>
              </div>
            </Card>

            {/* Contact Card - WhatsApp only */}
            <Card className="p-4 md:p-6 mb-4 border-0 shadow-md">
              <h3 className="font-bold mb-4 font-poppins">Contatta su WhatsApp</h3>
              <div className="space-y-3">
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-5 h-5" />
                  Scrivi su WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handlePhoneCall}
                >
                  <Phone className="w-4 h-4" />
                  Chiama ora
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-3">
                I contatti avvengono esclusivamente tramite WhatsApp o telefono.
              </p>
            </Card>

            {/* Save + Report */}
            <Button
              variant={saved ? "default" : "outline"}
              className="w-full gap-2 mb-3"
              onClick={toggleSave}
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Salvato" : "Salva annuncio"}
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground text-sm"
              onClick={() => setShowReportModal(true)}
            >
              <Flag className="w-3.5 h-3.5" />
              Segnala annuncio
            </Button>

            <p className="text-xs text-muted-foreground mt-6 text-center">
              Annuncio #{ad.id.slice(0, 8)} • Pubblicato il{" "}
              {new Date(ad.created_at).toLocaleDateString("it-IT")}
            </p>
          </div>
        </div>
      </div>

      {/* Share toast */}
      {showShareToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          Link copiato negli appunti
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-poppins">Segnala annuncio</h2>
              <button onClick={() => setShowReportModal(false)} className="text-2xl text-muted-foreground hover:text-foreground">×</button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Segnala questo annuncio se ritieni che violi le nostre regole. Il nostro team esaminera la segnalazione.
            </p>
            <div className="space-y-2 mb-4">
              {["Contenuto inappropriato", "Annuncio falso o truffa", "Minorile", "Spam o phishing"].map((reason) => (
                <button
                  key={reason}
                  className="w-full text-left px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-sm transition-colors"
                  onClick={handleReport}
                >
                  {reason}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
