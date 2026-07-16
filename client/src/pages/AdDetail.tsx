import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "@/hooks/useRouter";
import SitePromoBanner from "@/components/SitePromoBanner";
import { trackEvent } from "@/lib/analytics";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Eye,
  Crown,
  Zap,
  Clock,
  AlertTriangle,
  Heart,
  Share2,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Ruler,
  Weight,
  Palette,
  Maximize2,
  X,
} from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  age: number | null;
  category: string;
  image: string | null;
  images: string[] | null;
  price: string | null;
  phone: string | null;
  whatsapp: string | null;
  calls_only: boolean;
  is_active: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  has_paid?: boolean;
  is_verified: boolean;
  rating: number;
  review_count: number;
  views: number;
  boosted_until?: string | null;
  premium_until?: string | null;
  vetrina_until?: string | null;
  vetrina_scheduled_at?: string | null;
  hair_color: string | null;
  body_type: string | null;
  ethnicity: string | null;
  services: string | null;
  availability_hours: string | null;
  height: number | null;
  weight: number | null;
  created_at: string;
  user_id: string;
}

function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setMetaName(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export default function AdDetail() {
  const { user } = useAuth();
  const { navigate, currentPath } = useRouter();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [liked, setLiked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const adId = currentPath.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)?.[0] || "";

  const loadAd = useCallback(async () => {
    const client = supabase;
    if (!adId || !client) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await client
        .from("ads")
        .select("*")
        .eq("id", adId)
        .single();
      if (error) throw error;
      setAd(data as unknown as Ad | null);
    } catch (e: any) {
      toast.error(e.message || "Annuncio non trovato");
    } finally {
      setLoading(false);
    }
  }, [adId]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") setCurrentImage(i => Math.max(0, i - 1));
      if (event.key === "ArrowRight") setCurrentImage(i => Math.min((ad?.images?.length || (ad?.image ? 1 : 0)) - 1, i + 1));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, ad]);

  useEffect(() => {
    if (!ad) return;
    document.title = `${ad.title} — Incontri a ${ad.city} | Incontri di Bakeka`;
    const desc = `Annuncio: ${ad.title}. ${ad.city}, ${ad.category}. ${ad.description?.slice(0, 150)}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = desc;
      document.head.appendChild(meta);
    }
    const metaOg = document.querySelector('meta[property="og:title"]');
    if (metaOg) metaOg.setAttribute("content", `${ad.title} — Incontri di Bakeka`);
    const metaOgDesc = document.querySelector('meta[property="og:description"]');
    if (metaOgDesc) metaOgDesc.setAttribute("content", desc);
    let linkCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.rel = "canonical";
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", window.location.href.split("?")[0]);
    const shareImage = ad.images?.[0] || ad.image || "https://incontridibakeka.com/images/site-promo-banner.png";
    setMetaProperty("og:image", shareImage);
    setMetaProperty("og:url", window.location.href.split("?")[0]);
    setMetaName("twitter:image", shareImage);

    const oldBreadcrumb = document.getElementById("ld-breadcrumb");
    if (oldBreadcrumb) oldBreadcrumb.remove();
    const breadScript = document.createElement("script");
    breadScript.id = "ld-breadcrumb";
    breadScript.type = "application/ld+json";
    breadScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://incontridibakeka.com/" },
        { "@type": "ListItem", "position": 2, "name": ad.city ? `Incontri a ${ad.city}` : "Annunci", "item": ad.city ? `https://incontridibakeka.com/incontri/${ad.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}` : "https://incontridibakeka.com/" },
        { "@type": "ListItem", "position": 3, "name": ad.title.slice(0, 60), "item": window.location.href.split("?")[0] },
      ],
    });
    document.head.appendChild(breadScript);
  }, [ad]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Inserisci un motivo per la segnalazione");
      return;
    }
    if (!supabase || !user) {
      toast.error("Accedi per inviare una segnalazione");
      return;
    }
    try {
      const { error } = await supabase.from("ad_reports").insert({
        ad_id: adId,
        reporter_id: user.id,
        reason: reportReason,
      });
      if (error) throw error;
      toast.success("Segnalazione inviata. Grazie per la collaborazione!");
      setReporting(false);
      setReportReason("");
    } catch (e: any) {
      toast.error(e.message || "Errore invio segnalazione");
    }
  };

  const handleShare = async () => {
    try {
      void trackEvent("share", { ad_id: ad?.id, city: ad?.city });
      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set("utm_source", "shared-link");
      shareUrl.searchParams.set("utm_medium", "organic");
      shareUrl.searchParams.set("utm_campaign", "ad-share");
      if (navigator.share && ad) {
        await navigator.share({ title: ad.title, text: `Guarda questo annuncio a ${ad.city}`, url: shareUrl.toString() });
        return;
      }
      await navigator.clipboard.writeText(shareUrl.toString());
      toast.success("Link copiato: condividilo dove preferisci!");
    } catch {
      toast.error("Errore copia link");
    }
  };

  const trackContact = (contactType: "whatsapp" | "phone" | "message") => {
    void trackEvent("contact_open", {
      ad_id: ad?.id,
      city: ad?.city,
      contact_type: contactType,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-8 w-32 bg-muted rounded animate-shimmer mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-[4/3] bg-muted rounded-xl animate-shimmer" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 animate-shimmer" />
              <div className="h-4 bg-muted rounded w-1/2 animate-shimmer" />
              <div className="h-4 bg-muted rounded w-1/3 animate-shimmer" />
              <div className="h-24 bg-muted rounded animate-shimmer mt-6" />
              <div className="h-12 bg-muted rounded animate-shimmer" />
            </div>
          </div>
        </div>
        <SitePromoBanner variant="publish" compact />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Annuncio non trovato</h2>
          <p className="text-muted-foreground mb-4">L'annuncio che stai cercando non esiste o è stato rimosso.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna agli annunci
          </Button>
        </Card>
      </div>
    );
  }

  const now = Date.now();
  const premiumActive = !!ad.premium_until && now < new Date(ad.premium_until).getTime();
  const vetrinaActive = !!ad.vetrina_until
    && now >= (ad.vetrina_scheduled_at ? new Date(ad.vetrina_scheduled_at).getTime() : 0)
    && now < new Date(ad.vetrina_until).getTime();
  const boostActive = premiumActive || vetrinaActive;
  const storedImages = ad.images?.length ? ad.images : ad.image ? [ad.image] : [];
  const allImages = boostActive ? storedImages : storedImages.slice(0, 1);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Torna agli annunci
        </Button>

        <div className="relative grid grid-cols-1 gap-8 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/70 p-4 shadow-2xl shadow-violet-950/10 md:p-7 lg:grid-cols-[1.08fr_.92fr] dark:border-violet-900/50 dark:from-background dark:via-background dark:to-violet-950/20">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl" />
          {/* Images migliorato */}
          <div className="animate-fade-up">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted mb-4 group shadow-lg">
              {allImages.length > 0 ? (
                <>
                  <img
                    src={allImages[currentImage]}
                    alt={ad.title}
                    className={`w-full h-full object-cover transition-transform duration-500 ${boostActive ? "cursor-zoom-in group-hover:scale-105" : "blur-xl scale-110"}`}
                    onClick={() => boostActive && setLightboxOpen(true)}
                  />
                  {boostActive && <button type="button" onClick={() => setLightboxOpen(true)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/80" aria-label="Ingrandisci foto">
                    <Maximize2 className="h-5 w-5" />
                  </button>}
                  {!boostActive && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><span className="rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">Foto oscurata · annuncio non promosso</span></div>}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage(i => Math.max(0, i - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentImage(i => Math.min(allImages.length - 1, i + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                        {currentImage + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">
                  📸 Nessuna immagine
                </div>
              )}
              {premiumActive && (
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                  <Crown className="w-3 h-3 mr-1" /> Premium
                </Badge>
              )}
              {vetrinaActive && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                  <Zap className="w-3 h-3 mr-1" /> In Vetrina
                </Badge>
              )}
              {ad.is_verified && (
                <Badge className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verificato
                </Badge>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 hover:opacity-90 ${
                      idx === currentImage ? "border-primary ring-1 ring-primary/30 scale-105" : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info migliorato */}
          <div className="relative animate-fade-up lg:py-2" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 font-poppins">{ad.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {ad.city}, {ad.country}
                  {ad.age && <span className="text-muted-foreground/50">•</span>}
                  {ad.age && <span>{ad.age} anni</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setLiked(!liked)}
                  className={`transition-all duration-200 ${liked ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : ""}`}>
                  <Heart className={`w-4 h-4 transition-all ${liked ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}
                  className="transition-all duration-200 hover:bg-primary/10">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Eye className="w-4 h-4" />
                {ad.views} visualizzazioni
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                {new Date(ad.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>

            {ad.price && (
              <div className="inline-flex items-center gap-2 bg-primary/5 text-primary font-bold text-lg px-4 py-2 rounded-xl mb-4">
                <Sparkles className="w-4 h-4" />
                {ad.price}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full" />
                  Descrizione
                </h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{ad.description}</p>
              </div>

              {/* Dettagli migliorati */}
              {(ad.height || ad.weight || ad.hair_color || ad.body_type || ad.ethnicity || ad.services || ad.availability_hours) && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <span className="w-1 h-4 bg-primary rounded-full" />
                    Dettagli profilo
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ad.height && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Altezza:</span>
                        <span className="font-medium">{ad.height} cm</span>
                      </div>
                    )}
                    {ad.weight && (
                      <div className="flex items-center gap-2 text-sm">
                        <Weight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Peso:</span>
                        <span className="font-medium">{ad.weight} kg</span>
                      </div>
                    )}
                    {ad.hair_color && (
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Capelli:</span>
                        <span className="font-medium capitalize">{ad.hair_color}</span>
                      </div>
                    )}
                    {ad.body_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground">💪</span>
                        <span className="text-muted-foreground">Fisico:</span>
                        <span className="font-medium capitalize">{ad.body_type}</span>
                      </div>
                    )}
                    {ad.ethnicity && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground">🌍</span>
                        <span className="text-muted-foreground">Etnia:</span>
                        <span className="font-medium capitalize">{ad.ethnicity}</span>
                      </div>
                    )}
                    {ad.availability_hours && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Disponibilità:</span>
                        <span className="font-medium">{ad.availability_hours}</span>
                      </div>
                    )}
                  </div>
                  {ad.services && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">Servizi:</span>
                      <p className="text-sm mt-0.5">{ad.services}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Solo chiamate badge */}
            {ad.calls_only && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm font-medium text-amber-800 dark:text-amber-300">
                <Phone className="w-4 h-4" />
                Solo chiamate — contatta solo telefonicamente
              </div>
            )}
             {/* Pulsanti contatto migliorati */}
            <div className="sticky bottom-3 z-10 flex gap-3 rounded-2xl border border-border/70 bg-background/90 p-2 mb-6 shadow-xl backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              {ad.whatsapp && (
                <Button
                  variant={ad.calls_only ? "outline" : "default"}
                  className={`flex-1 gap-2 shadow-lg transition-all duration-200 hover:scale-[1.02] ${
                    ad.calls_only
                      ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      : "border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40"
                  }`}
                  asChild
                >
                  <a
                    href={`https://wa.me/${ad.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Ciao :) Ho visto il tuo profilo su incontridibakeka.com e mi hai incuriosito/a. Mi presento, sono una persona genuina in cerca di bei momenti. Se ti va, possiamo scambiare due chiacchiere e vedere se c'è feeling. Ti aspetto!`)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => trackContact("whatsapp")}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {ad.calls_only ? "Scrivi (non preferito)" : "WhatsApp"}
                  </a>
                </Button>
              )}
              {(ad.phone || ad.whatsapp) && (
                <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all duration-200 hover:scale-[1.02]" asChild>
                  <a href={`tel:${ad.phone || ad.whatsapp}`} onClick={() => trackContact("phone")}>
                    <Phone className="w-4 h-4" />
                    Chiama
                  </a>
                </Button>
              )}
              {ad.user_id && user && user.id !== ad.user_id && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/5 transition-all duration-200 hover:scale-[1.02]"
                  onClick={async () => {
                    try {
                      if (!supabase || !user) { toast.error("Devi accedere per contattare"); return; }
                      const token = (await supabase.auth.getSession()).data.session?.access_token;
                      if (!token) throw new Error();
                      const checkRes = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/conversations?ad_id=eq.${ad.id}&buyer_id=eq.${user.id}&seller_id=eq.${ad.user_id}&select=id`,
                        { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }
                      );
                      const existing = await checkRes.json();
                      if (Array.isArray(existing) && existing.length > 0) {
                        trackContact("message");
                        navigate(`/messages/${existing[0].id}`);
                        return;
                      }
                      const createRes = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/conversations`,
                        {
                          method: "POST",
                          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" },
                          body: JSON.stringify({
                            ad_id: ad.id,
                            buyer_id: user.id,
                            seller_id: ad.user_id,
                            ad_title: ad.title,
                            last_message: "Conversazione iniziata",
                          }),
                        }
                      );
                      if (!createRes.ok) throw new Error("Conversazione non creata");
                      const created = await createRes.json();
                      trackContact("message");
                      navigate(`/messages/${created[0]?.id || created.id}`);
                    } catch { toast.error("Errore creazione conversazione"); }
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Contatta
                </Button>
              )}
              {!ad.phone && !ad.whatsapp && !(ad.user_id && user && user.id !== ad.user_id) && (
                <div className="w-full text-center text-sm text-muted-foreground bg-muted/50 rounded-xl py-4">
                  {ad.user_id && user && user.id === ad.user_id ? "Aggiungi un numero nell'editor annuncio" : "Nessun contatto disponibile per questo annuncio"}
                </div>
              )}
            </div>

            {/* Segnalazione */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-all"
                onClick={() => setReporting(!reporting)}
              >
                <Flag className="w-4 h-4 mr-2" />
                Segnala annuncio
              </Button>

              {reporting && (
                <div className="mt-4 p-4 bg-muted rounded-xl animate-fade-up">
                  <textarea
                    className="w-full p-3 rounded-lg border bg-background mb-3 text-sm resize-none"
                    rows={3}
                    placeholder="Descrivi il problema con questo annuncio..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReporting(false)}>Annulla</Button>
                    <Button size="sm" onClick={handleReport} className="gap-1.5">
                      <Flag className="w-3.5 h-3.5" /> Invia segnalazione
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {lightboxOpen && boostActive && allImages.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Visualizzatore foto" onClick={() => setLightboxOpen(false)}>
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25" aria-label="Chiudi foto">
            <X className="h-6 w-6" />
          </button>
          <img src={allImages[currentImage]} alt={`${ad.title} - foto ${currentImage + 1}`} className="max-h-[90vh] max-w-[96vw] select-none object-contain" onClick={(event) => event.stopPropagation()} />
          {allImages.length > 1 && (
            <>
              <button type="button" onClick={(event) => { event.stopPropagation(); setCurrentImage(i => i === 0 ? allImages.length - 1 : i - 1); }} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 md:left-8" aria-label="Foto precedente">
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); setCurrentImage(i => i === allImages.length - 1 ? 0 : i + 1); }} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 md:right-8" aria-label="Foto successiva">
                <ChevronRight className="h-7 w-7" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-bold text-white">
                {currentImage + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
