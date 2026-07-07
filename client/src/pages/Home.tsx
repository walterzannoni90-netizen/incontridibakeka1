import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/hooks/useRouter";
import { useAuth } from "@/hooks/useAuth";
import { useStripe } from "@/hooks/useStripe";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/contexts/ThemeContext";
import { ITALIAN_CITIES, COUNTRIES, slugify } from "@shared/data";
import { Heart, MapPin, Star, Search, LogOut, LogIn, Menu, X, Plus, ChevronDown, Phone, MessageCircle, Moon, Sun, Bookmark, Info, Shield, Eye, Sparkles, ImagePlus, Lock, UploadCloud, Loader2, Clock, Calendar, Trash2, Crown } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_CONFIGURED = SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project");

const PAGE_SIZE = 12;

// Costo in crediti per la vetrina in base alla durata (giorni)
const VETRINA_COSTS: Record<number, number> = { 1: 10, 3: 25, 7: 50 };

const HAIR_COLORS = ["neri", "castani", "biondi", "rossi", "grigi", "altri"];
const BODY_TYPES = ["snello", "normale", "formoso", "sportivo", "curvy"];
const ETHNICITIES = ["italiana", "europea", "sudamericana", "asiatica", "africana", "mista"];

// Un annuncio mostra la foto nitida nel grid solo se e premium o ha una vetrina attiva
function isAdBoosted(ad: Ad): boolean {
  if (ad.is_premium || ad.is_sponsored) return true;
  if (ad.boosted_until) {
    const until = new Date(ad.boosted_until).getTime();
    const start = ad.vetrina_scheduled_at ? new Date(ad.vetrina_scheduled_at).getTime() : 0;
    const now = Date.now();
    return now >= start && now < until;
  }
  return false;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  city: string;
  country?: string;
  age: number;
  image: string;
  images?: string[];
  category: string;
  price?: string;
  phone?: string;
  whatsapp?: string;
  rating: number;
  review_count: number;
  is_premium: boolean;
  is_sponsored: boolean;
  is_verified?: boolean;
  views?: number;
  user_id?: string;
  has_paid?: boolean;
  // Campi dettaglio
  hair_color?: string;
  body_type?: string;
  ethnicity?: string;
  services?: string;
  availability_hours?: string;
  height?: number;
  weight?: number;
  // Vetrina / boost
  boosted_until?: string;
  vetrina_scheduled_at?: string;
  vetrina_duration_days?: number;
  created_at?: string;
}

const CATEGORIES = [
  { id: "donna-cerca-uomo", name: "Donna Cerca Uomo", image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=600&fit=crop", count: "180+ annunci" },
  { id: "uomo-cerca-donna", name: "Uomo Cerca Donna", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop", count: "20+ annunci" },
  { id: "trans", name: "Trans", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=600&fit=crop", count: "15+ annunci" },
  { id: "donna-cerca-donna", name: "Donna Cerca Donna", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=600&fit=crop", count: "10+ annunci" },
  { id: "uomo-cerca-uomo", name: "Uomo Cerca Uomo", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop", count: "8+ annunci" },
  { id: "coppie", name: "Coppie", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=600&fit=crop", count: "5+ annunci" },
  { id: "massaggi", name: "Massaggi", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=600&fit=crop", count: "12+ annunci" },
  { id: "accompagnatrici", name: "Accompagnatrici", image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=600&fit=crop", count: "25+ annunci" },
  { id: "evento-festa", name: "Eventi e Feste", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=600&fit=crop", count: "3+ annunci" },
  { id: "amicizia", name: "Amicizia", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=600&fit=crop", count: "7+ annunci" },
];

// No demo data - real data only from Supabase
const DEMO_ADS: Ad[] = [];

export default function Home({ initialCity }: { initialCity?: string | null }) {
  const { navigate } = useRouter();
  const { user: currentUser, login, logout, updateUser } = useAuth();
  const { handlePaymentCallback: stripePaymentCallback } = useStripe();
  const { theme, toggleTheme } = useTheme();
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    city: "Roma",
    country: "IT",
    age: "25",
    category: CATEGORIES[0].id,
    image: "",
    price: "",
    phone: "",
    whatsapp: "",
    hair_color: "",
    body_type: "",
    ethnicity: "",
    services: "",
    availability_hours: "",
    height: "",
    weight: "",
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  // Scheduling vetrina
  const [scheduleVetrina, setScheduleVetrina] = useState(false);
  const [vetrinaDuration, setVetrinaDuration] = useState(1);
  const [vetrinaStartAt, setVetrinaStartAt] = useState("");
  // Limite annunci giornaliero
  const [adsPostedToday, setAdsPostedToday] = useState(0);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(initialCity || null);
  const [selectedCountry, setSelectedCountry] = useState("IT");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  const [savedAds, setSavedAds] = useState<string[]>([]);

  // Numero massimo di foto in base allo stato premium dell'utente
  const maxPhotos = currentUser?.has_paid ? 5 : 1;
  const hasPaid = !!currentUser?.has_paid;
  const dailyLimit = hasPaid ? 2 : 1;

  useEffect(() => {
    loadAds(true);
    handlePaymentResult();
    if (!localStorage.getItem("ageAccepted")) {
      setShowDisclaimer(true);
    }
    setSavedAds(JSON.parse(localStorage.getItem("savedAds") || "[]"));
  }, []);

  useEffect(() => {
    let title = "Incontri di Bakeka — Marketplace Affidabile";
    let desc = "Il marketplace più affidabile per incontri e amicizie in Italia. Profili verificati, connessioni reali.";
    if (selectedCity && categoryFilter) {
      const cat = CATEGORIES.find(c => c.id === categoryFilter);
      title = `${cat?.name || "Annunci"} a ${selectedCity} — Incontri di Bakeka`;
      desc = `Trova annunci di ${cat?.name?.toLowerCase() || "incontri"} a ${selectedCity}. Profili verificati, annunci reali.`;
    } else if (selectedCity) {
      title = `Incontri a ${selectedCity} — Annunci di incontri | Incontri di Bakeka`;
      desc = `Trova annunci di incontri a ${selectedCity}. Profili verificati, annunci reali. ${selectedCity} incontri, amicizie e molto altro.`;
    } else if (categoryFilter) {
      const cat = CATEGORIES.find(c => c.id === categoryFilter);
      title = `${cat?.name || "Annunci"} — Incontri di Bakeka`;
      desc = `Trova annunci di ${cat?.name?.toLowerCase() || "incontri"}. Profili verificati, annunci reali su Incontri di Bakeka.`;
    }
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
  }, [selectedCity, categoryFilter]);

  // Processa il risultato del callback Stripe (usando useStripe) e aggiorna i crediti
  const handlePaymentResult = async () => {
    const result = stripePaymentCallback();
    if (!result) return;
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", newUrl);

    if (!result.success) {
      alert("Pagamento annullato.");
      return;
    }
    if (currentUser) {
      try {
        const { data: profile } = await supabase!
          .from("profiles")
          .select("credits, has_paid")
          .eq("id", currentUser.id)
          .single();
        if (profile) {
          updateUser({ credits: profile.credits, has_paid: profile.has_paid });
        }
      } catch (e) {
        console.error("Errore aggiornamento crediti:", e);
      }
    }
    alert(`Pagamento riuscito! ${result.credits || ""} crediti aggiunti.`);
  };

  const loadAds = async (reset = false) => {
    if (!SUPABASE_CONFIGURED) {
      setAds(DEMO_ADS);
      setLoading(false);
      return;
    }
    try {
      const offset = reset ? 0 : ads.length;
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/ads?select=*&is_active=eq.true&order=is_sponsored.desc,is_premium.desc,created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const fetched: Ad[] = data && data.length > 0 ? data : [];
      if (reset) {
        setAds(fetched.length > 0 ? fetched : DEMO_ADS);
      } else {
        setAds((prev) => [...prev, ...fetched]);
      }
      setHasMore(fetched.length === PAGE_SIZE);
    } catch (error) {
      console.error("Errore caricamento annunci:", error);
      if (reset) setAds(DEMO_ADS);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadAds(false);
  };

  // Carica le foto su Supabase Storage (bucket 'ads') e ritorna gli URL pubblici
  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const token = localStorage.getItem("authToken");
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${currentUser?.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/ads/${path}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Upload foto non riuscito: ${res.status} ${txt}`);
      }
      urls.push(`${SUPABASE_URL}/storage/v1/object/public/ads/${path}`);
    }
    return urls;
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = maxPhotos - photoFiles.length;
    const toAdd = files.slice(0, remaining);
    setPhotoFiles((prev) => [...prev, ...toAdd]);
    setPhotoPreviewUrls((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Conta quanti annunci l'utente ha pubblicato nelle ultime 24 ore
  const checkDailyLimit = async (): Promise<number> => {
    if (!currentUser || !SUPABASE_CONFIGURED) return 0;
    const token = localStorage.getItem("authToken");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/ads?select=id&user_id=eq.${currentUser.id}&created_at=gte.${since}`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
      );
      const data = await resp.json();
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  };

  const runSearch = () => {
    const section = document.getElementById("ads-section");
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openPublish = async () => {
    if (!currentUser) {
      setAuthModal("login");
      return;
    }
    // Verifica il limite giornaliero di annunci
    const count = await checkDailyLimit();
    setAdsPostedToday(count);
    if (count >= dailyLimit) {
      setLimitMessage(
        hasPaid
          ? "Hai raggiunto il limite di 2 annunci al giorno."
          : "Hai raggiunto il limite di 1 annuncio gratuito al giorno. Acquista crediti per pubblicarne di piu."
      );
      setPublishOpen(true);
      return;
    }
    setLimitMessage(null);
    setPublishOpen(true);
  };

  const toggleSaveAd = (adId: string) => {
    const current = JSON.parse(localStorage.getItem("savedAds") || "[]");
    const isSaved = current.includes(adId);
    const next = isSaved
      ? current.filter((id: string) => id !== adId)
      : [...new Set([...current, adId])];
    localStorage.setItem("savedAds", JSON.stringify(next));
    setSavedAds(next);
  };

  const handleAuth = async () => {
    if (!authForm.email || !authForm.password || (authModal === "register" && !authForm.name)) {
      alert("Compila tutti i campi richiesti.");
      return;
    }

    setBusy(true);
    try {
      if (authModal === "register") {
        await register(authForm.email, authForm.password, authForm.name || authForm.email.split("@")[0]);
      } else {
        await login(authForm.email, authForm.password);
      }
      setAuthModal(null);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Accesso non riuscito.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    const token = localStorage.getItem("authToken");
    if (!currentUser || !token) {
      setAuthModal("login");
      return;
    }
    if (!publishForm.title || !publishForm.description) {
      alert("Titolo e descrizione sono obbligatori.");
      return;
    }

    if (!SUPABASE_CONFIGURED) {
      alert("Database non configurato. Crea un file .env con le credenziali Supabase per pubblicare annunci reali.");
      return;
    }

    // Controllo limite giornaliero prima di pubblicare
    const count = await checkDailyLimit();
    if (count >= dailyLimit) {
      setAdsPostedToday(count);
      setLimitMessage(
        hasPaid
          ? "Hai raggiunto il limite di 2 annunci al giorno."
          : "Hai raggiunto il limite di 1 annuncio gratuito al giorno. Acquista crediti per pubblicarne di piu."
      );
      return;
    }

    setBusy(true);
    try {
      // 1. Upload delle foto su Supabase Storage
      let uploadedImages: string[] = [];
      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        uploadedImages = await uploadPhotos(photoFiles);
        setUploadingPhotos(false);
      }
      const mainImage = uploadedImages[0] || null;

      // 2. Gestione vetrina (boost) con crediti
      let boostedUntil: string | null = null;
      let vetrinaScheduledAt: string | null = null;
      let vetrinaDurationDays: number | null = null;
      let isSponsored = false;
      if (scheduleVetrina) {
        const cost = VETRINA_COSTS[vetrinaDuration] ?? 0;
        const userCredits = currentUser.credits || 0;
        if (cost > 0 && userCredits < cost) {
          alert(`Non hai abbastanza crediti per la vetrina. Servono ${cost} crediti.`);
          setBusy(false);
          return;
        }
        const startAt = vetrinaStartAt ? new Date(vetrinaStartAt) : new Date();
        if (isNaN(startAt.getTime())) {
          alert("Data di inizio vetrina non valida.");
          setBusy(false);
          return;
        }
        const untilDate = new Date(startAt.getTime() + vetrinaDuration * 24 * 60 * 60 * 1000);
        vetrinaScheduledAt = startAt.toISOString();
        boostedUntil = untilDate.toISOString();
        vetrinaDurationDays = vetrinaDuration;
        // Se la vetrina parte subito, attiva is_sponsored
        isSponsored = startAt.getTime() <= Date.now();

        // Scala i crediti sul profilo
        if (cost > 0) {
          const newCredits = userCredits - cost;
          await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`, {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({ credits: newCredits }),
          }).catch(() => {});
          updateUser({ credits: newCredits });
        }
      }

      const payload = {
        title: publishForm.title,
        description: publishForm.description,
        city: publishForm.city,
        country: publishForm.country || "IT",
        age: Number(publishForm.age) || null,
        category: publishForm.category,
        image: mainImage,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        price: publishForm.price || null,
        phone: publishForm.phone || null,
        whatsapp: publishForm.whatsapp || null,
        user_id: currentUser.id,
        has_paid: hasPaid,
        hair_color: publishForm.hair_color || null,
        body_type: publishForm.body_type || null,
        ethnicity: publishForm.ethnicity || null,
        services: publishForm.services || null,
        availability_hours: publishForm.availability_hours || null,
        height: publishForm.height ? Number(publishForm.height) : null,
        weight: publishForm.weight ? Number(publishForm.weight) : null,
        boosted_until: boostedUntil,
        vetrina_scheduled_at: vetrinaScheduledAt,
        vetrina_duration_days: vetrinaDurationDays,
        is_active: true,
        is_premium: false,
        is_sponsored: isSponsored,
        rating: 5,
        review_count: 0,
      };
      const response = await fetch(`${SUPABASE_URL}/rest/v1/ads`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Pubblicazione non riuscita");

      // Reset form
      setPublishOpen(false);
      setPublishForm({ title: "", description: "", city: "Roma", country: "IT", age: "25", category: CATEGORIES[0].id, image: "", price: "", phone: "", whatsapp: "", hair_color: "", body_type: "", ethnicity: "", services: "", availability_hours: "", height: "", weight: "" });
      photoFiles.forEach((_, i) => URL.revokeObjectURL(photoPreviewUrls[i]));
      setPhotoFiles([]);
      setPhotoPreviewUrls([]);
      setScheduleVetrina(false);
      setVetrinaDuration(1);
      setVetrinaStartAt("");
      setLimitMessage(null);
      await loadAds(true);
      alert(scheduleVetrina ? "Annuncio pubblicato e vetrina programmata!" : "Annuncio pubblicato.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore pubblicazione.");
    } finally {
      setUploadingPhotos(false);
      setBusy(false);
    }
  };

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    setCountryDropdownOpen(false);
    if (code !== "IT") {
      alert("Presto disponibile in altri paesi. Al momento gli annunci sono disponibili solo in Italia.");
      setSelectedCountry("IT");
    }
  };

  const openInfoModal = (type: string) => {
    setInfoModal(type);
  };

  const filteredAds = ads.filter((ad) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [ad.title, ad.description, ad.city, ad.category].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    const matchesCategory = !categoryFilter || ad.category === categoryFilter;
    const matchesCity = !selectedCity || ad.city?.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCategory && matchesCity;
  });

  const INFO_CONTENT: Record<string, { title: string; body: string }> = {
    "chi-siamo": { title: "Chi Siamo", body: "Incontri di Bakeka e la piattaforma leader in Italia per annunci personali. Offriamo uno spazio sicuro e verificato dove adulti consenzienti possono connettersi. Lavoriamo ogni giorno per garantire sicurezza, privacy e qualita. Tutti i nostri profili Premium sono verificati manualmente." },
    "contatti": { title: "Contatti", body: "Per qualsiasi domanda o supporto, scrivici a: supporto@incontridibakeka.it\n\nRispondiamo entro 24 ore. Per segnalazioni di abuso o contenuti inappropriate, utilizza il pulsante 'Segnala' presente in ogni annuncio." },
    "blog": { title: "Blog", body: "Il nostro blog arrivera presto! Pubblicheremo guide su sicurezza negli incontri, consigli per creare annunci efficaci, e storie di successo dei nostri utenti. Resta sintonizzato." },
    "termini": { title: "Termini e Condizioni", body: "1. Il sito e destinato esclusivamente a maggiori di 18 anni.\n2. Tutti gli annunci devono rispettare le leggi italiane.\n3. E vietato pubblicare contenuti illegali, offensivi o non consensuali.\n4. La piattaforma non si rende responsabile degli incontri tra utenti.\n5. Ogni utente e responsabile dei propri annunci e comportamenti.\n6. I crediti acquistati non sono rimborsabili.\n7. La pubblicazione di annunci falsi comporta ban permanente." },
    "privacy": { title: "Privacy Policy", body: "1. I tuoi dati personali sono protetti secondo il GDPR (Regolamento UE 2016/679).\n2. Non condividiamo i tuoi dati con terzi senza consenso.\n3. Le informazioni di contatto sono visibili solo agli utenti autenticati.\n4. Puoi richiedere la cancellazione del tuo account in qualsiasi momento.\n5. Utilizziamo cookie tecnici per il funzionamento del sito.\n6. I messaggi tra utenti sono privati e crittografati." },
    "cookie": { title: "Cookie Policy", body: "1. Utilizziamo cookie tecnici necessari per il funzionamento del sito (sessione, autenticazione).\n2. Utilizziamo cookie analitici anonimi per migliorare il servizio.\n3. Non vendiamo i dati dei cookie a terzi.\n4. Puoi gestire le tue preferenze cookie dalle impostazioni del browser.\n5. Continuando a navigare accetti l'uso dei cookie." },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 18+ DISCLAIMER */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-card rounded-2xl max-w-md w-full p-6 md:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-destructive">18+</span>
            </div>
            <h2 className="text-xl font-bold mb-3 font-poppins">Avviso di Eta</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Questo sito contiene contenuti destinati esclusivamente a un pubblico adulto. Accedendo dichiari di avere almeno 18 anni e di accettare i nostri Termini e Condizioni d'uso.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                onClick={() => {
                  localStorage.setItem("ageAccepted", "true");
                  setShowDisclaimer(false);
                }}
              >
                ACCETTO
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = "https://www.google.com";
                }}
              >
                Rifiuto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING PUBLISH BUTTON (mobile) */}
      <button
        className="md:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        onClick={openPublish}
        aria-label="Pubblica annuncio"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border shadow-sm text-foreground">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/logo.svg" alt="Incontri di Bakeka" className="h-9 w-auto" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* City selector */}
            <div className="relative">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                onClick={() => { setCityDropdownOpen(!cityDropdownOpen); setCountryDropdownOpen(false); }}
              >
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {selectedCity || "Tutte le citta"}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {cityDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white dark:bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { setSelectedCity(null); setCityDropdownOpen(false); }}
                  >
                    Tutte le citta
                  </button>
                  {ITALIAN_CITIES.map((city) => (
                    <button
                      key={city}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setSelectedCity(city); setCityDropdownOpen(false); }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Country selector */}
            <div className="relative">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                onClick={() => { setCountryDropdownOpen(!countryDropdownOpen); setCityDropdownOpen(false); }}
              >
                {COUNTRIES.find(c => c.code === selectedCountry)?.flag} {COUNTRIES.find(c => c.code === selectedCountry)?.name}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {countryDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 max-h-72 overflow-y-auto bg-white dark:bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                      onClick={() => handleCountrySelect(c.code)}
                    >
                      <span>{c.flag}</span> {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            {toggleTheme && (
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
                onClick={toggleTheme}
                aria-label="Cambia tema"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}

            <Input
              placeholder="Cerca annunci..."
              className="w-48"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/shop")}
                  className="gap-1.5"
                >
                  <span className="text-accent">💰</span>
                  <span className="font-semibold">{currentUser.credits || 0}</span>
                </Button>
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
                </div>
                {currentUser.is_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="gap-1.5"
                  >
                    <span>⚙️</span> Admin
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Esci
                </Button>
              </div>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => setAuthModal("login")}>
                <LogIn className="w-4 h-4" /> Accedi
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2 text-foreground">
            {toggleTheme && (
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
                onClick={toggleTheme}
                aria-label="Cambia tema"
              >
                {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            )}
            <button
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white dark:bg-card text-foreground">
            <div className="container py-4 space-y-3">
                {/* City selector mobile */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Citta</label>
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm"
                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {selectedCity || "Tutte le citta"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {cityDropdownOpen && (
                    <div className="mt-1 w-full max-h-48 overflow-y-auto border border-border rounded-lg py-1">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => { setSelectedCity(null); setCityDropdownOpen(false); }}
                      >
                        Tutte le citta
                      </button>
                      {ITALIAN_CITIES.map((city) => (
                        <button
                          key={city}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => { setSelectedCity(city); setCityDropdownOpen(false); }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Country selector mobile */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Paese</label>
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm"
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                  >
                    <span className="flex items-center gap-1.5">
                      {COUNTRIES.find(c => c.code === selectedCountry)?.flag} {COUNTRIES.find(c => c.code === selectedCountry)?.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {countryDropdownOpen && (
                    <div className="mt-1 w-full max-h-48 overflow-y-auto border border-border rounded-lg py-1">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          onClick={() => handleCountrySelect(c.code)}
                        >
                          <span>{c.flag}</span> {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search */}
              <Input
                placeholder="Cerca annunci..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
              />

              {currentUser ? (
                <>
                  {/* User info bar */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                      {currentUser.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
                      <button
                        className="text-xs text-accent font-semibold flex items-center gap-1"
                        onClick={() => { navigate("/shop"); setMobileMenuOpen(false); }}
                      >
                        <span>💰</span> {currentUser.credits || 0} crediti
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <Button
                    variant="default"
                    className="w-full gap-2"
                    onClick={() => { openPublish(); setMobileMenuOpen(false); }}
                  >
                    <Plus className="w-4 h-4" /> Pubblica Annuncio
                  </Button>

                  {currentUser.is_admin && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
                    >
                      <span>⚙️</span> Pannello Admin
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => { navigate("/shop"); setMobileMenuOpen(false); }}
                  >
                    <span>💰</span> Acquista Crediti
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2 text-destructive hover:bg-destructive/5 border-destructive/20"
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" /> Esci
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full gap-2"
                    onClick={() => { setAuthModal("login"); setMobileMenuOpen(false); }}
                  >
                    <LogIn className="w-4 h-4" /> Accedi
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => { setAuthModal("register"); setMobileMenuOpen(false); }}
                  >
                    <Sparkles className="w-4 h-4" /> Registrati
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
        <section className="relative min-h-[420px] md:h-[480px] overflow-hidden flex items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-primary to-purple-600" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600&h=600&fit=crop)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/50 via-transparent to-transparent" />
          <div className="relative container flex flex-col items-center justify-center text-center text-white py-12 md:py-0 z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4 text-sm">
              <Shield className="w-4 h-4" />
              <span>Profili verificati. Connessioni reali.</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 md:mb-4 font-poppins drop-shadow-lg">
              Connessioni Autentiche
            </h1>
            <p className="text-lg md:text-2xl mb-6 md:mb-8 opacity-90 max-w-2xl px-2">
              Il marketplace piu affidabile per incontri e amicizie in Italia
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto shadow-lg" onClick={runSearch}>
                <Search className="w-5 h-5" />
                Scopri Annunci
              </Button>
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto bg-white/90 hover:bg-white border-white text-primary shadow-lg" onClick={openPublish}>
                <Plus className="w-5 h-5" />
                Pubblica Annuncio
              </Button>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-8 md:py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-center font-poppins">
            Sfoglia per Categoria
          </h2>
          <p className="text-center text-muted-foreground mb-6 md:mb-12">Trova esattamente quello che cerchi</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {CATEGORIES.map((cat) => (
              <Card
                key={cat.id}
                className="overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-0"
                onClick={() => {
                  setCategoryFilter(categoryFilter === cat.id ? null : cat.id);
                  document.getElementById("ads-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/60 transition-all" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                    <p className="text-xs md:text-sm font-bold text-white drop-shadow">{cat.name}</p>
                    <p className="text-[10px] text-white/70 mt-0.5">{cat.count}</p>
                  </div>
                  {categoryFilter === cat.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          </div>
        </section>

        {/* ADS SECTION */}
        <section className="py-8 md:py-16" id="ads-section">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold font-poppins">
                  Annunci in Evidenza
                </h2>
                {(searchTerm || categoryFilter || selectedCity) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredAds.length} risultati
                    {categoryFilter ? ` in ${CATEGORIES.find((c) => c.id === categoryFilter)?.name}` : ""}
                    {selectedCity ? ` a ${selectedCity}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {savedAds.length > 0 && (
                  <Button variant="ghost" className="gap-2 text-muted-foreground">
                    <Bookmark className="w-4 h-4" />
                    {savedAds.length} salvati
                  </Button>
                )}
                {(searchTerm || categoryFilter || selectedCity) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter(null);
                      setSelectedCity(null);
                    }}
                  >
                    Cancella filtri
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-muted animate-pulse">
                    <div className="h-36 md:h-52 bg-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg text-muted-foreground mb-4">Nessun annuncio trovato</p>
                <Button variant="outline" onClick={() => { setSearchTerm(""); setCategoryFilter(null); setSelectedCity(null); }}>
                  Mostra tutti gli annunci
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredAds.map((ad) => {
                const boosted = isAdBoosted(ad);
                return (
                <Card
                  key={ad.id}
                  className={`overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    ad.is_sponsored ? "ring-1 ring-accent/40" : ""
                  } ${ad.is_premium ? "ring-1 ring-primary/30" : ""}`}
                  onClick={() => navigate(`/ad/${slugify(ad.title)}-${ad.id}`)}
                >
                    <div className="relative h-36 md:h-52 bg-gradient-to-br from-primary/20 to-purple-300/20 overflow-hidden">
                      {ad.image ? (
                        <img
                          src={ad.image}
                          alt={ad.title}
                          className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${
                            !boosted ? "blur-xl scale-110" : ""
                          }`}
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {ad.category === "uomo-cerca-donna" ? "👨" : ad.category === "trans" ? "⚧️" : "👤"}
                        </div>
                      )}
                      {/* Badge Premium / lucchetto sulle foto sfocate */}
                      {!boosted && ad.image && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                          <div className="bg-black/60 text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                            <Lock className="w-3 h-3" /> Premium
                          </div>
                          <span className="text-[10px] text-white/80">Clicca per vedere</span>
                        </div>
                      )}
                      {ad.is_sponsored && (
                        <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded text-[10px] md:text-xs font-bold shadow-md">
                          ⭐ SuperTop
                        </div>
                      )}
                      {ad.is_premium && !ad.is_sponsored && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] md:text-xs font-bold shadow-md">
                          👑 Premium
                        </div>
                      )}
                      {ad.is_verified && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-md">
                          ✓ Verificato
                        </div>
                      )}
                      <button
                        className={`absolute bottom-2 right-2 rounded-full p-2 shadow-md transition-all active:scale-90 ${
                          savedAds.includes(ad.id) ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveAd(ad.id);
                        }}
                        aria-label="Salva annuncio"
                      >
                        <Heart className={`w-4 h-4 ${savedAds.includes(ad.id) ? "fill-current" : "text-primary"}`} />
                      </button>
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-1">
                        {ad.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {ad.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[60px]">{ad.city || "Italia"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          <span className="font-medium">{ad.rating > 0 ? ad.rating : "Nuovo"}</span>
                        </div>
                      </div>
                      {ad.price && (
                        <p className="text-xs font-bold text-accent mt-2">{ad.price}</p>
                      )}
                    </div>
                  </Card>
                );
              })}
              </div>
            )}

            {/* PAGINAZIONE - Carica altri */}
            {!loading && filteredAds.length > 0 && hasMore && !searchTerm && !categoryFilter && !selectedCity && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore} className="gap-2">
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Caricamento...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> Carica altri annunci
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* TRUST BADGES SECTION */}
        <section className="py-8 md:py-12 bg-muted/30 border-t border-border">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-sm mb-1">Profili Verificati</h3>
                <p className="text-xs text-muted-foreground">Tutti i profili Premium sono verificati manualmente</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-1">Privacy Protetta</h3>
                <p className="text-xs text-muted-foreground">I tuoi dati sono al sicuro e mai condivisi</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-sm mb-1">Recensioni Reali</h3>
                <p className="text-xs text-muted-foreground">Sistema di recensioni verificato e trasparente</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-bold text-sm mb-1">Messaggi Privati</h3>
                <p className="text-xs text-muted-foreground">Comunica in modo sicuro e discreto</p>
              </div>
            </div>
          </div>
        </section>

        {/* INFO MODAL */}
        {infoModal && INFO_CONTENT[infoModal] && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setInfoModal(null)}
          >
            <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-poppins">{INFO_CONTENT[infoModal].title}</h2>
                <button onClick={() => setInfoModal(null)} className="text-2xl text-muted-foreground hover:text-foreground">×</button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {INFO_CONTENT[infoModal].body}
              </p>
            </Card>
          </div>
        )}

        {/* AD QUICK-MODAL (Heart click) */}
        {selectedAd && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAd(null)}
          >
            <Card
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold font-poppins mb-2">
                      {selectedAd.title}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {selectedAd.city} • {selectedAd.age} anni
                      {selectedAd.is_verified && (
                        <span className="text-green-600 font-semibold text-sm">✓ Verificato</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAd(null)}
                    className="text-2xl text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                {selectedAd.image && (
                  <img
                    src={selectedAd.image}
                    alt={selectedAd.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                <p className="text-foreground mb-4">{selectedAd.description}</p>

                {selectedAd.price && (
                  <p className="text-lg font-bold text-accent mb-4">
                    💰 {selectedAd.price}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (!currentUser) {
                        setSelectedAd(null);
                        setAuthModal("login");
                        return;
                      }
                      const phone = (selectedAd as any).phone || (selectedAd as any).whatsapp || "+393331234567";
                      const msg = `Ciao, ho visto il tuo annuncio "${selectedAd.title}" su Incontri di Bakeka.`;
                      window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant={savedAds.includes(selectedAd.id) ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => toggleSaveAd(selectedAd.id)}
                  >
                    <Heart className={`w-4 h-4 ${savedAds.includes(selectedAd.id) ? "fill-current" : ""}`} />
                    {savedAds.includes(selectedAd.id) ? "Salvato" : "Salva"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* AUTH MODAL */}
        {authModal && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setAuthModal(null)}
          >
            <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-poppins">
                  {authModal === "login" ? "Accedi" : "Registrati"}
                </h2>
                <button onClick={() => setAuthModal(null)} className="text-2xl text-muted-foreground hover:text-foreground">×</button>
              </div>

              <div className="space-y-4">
                {authModal === "register" && (
                  <Input
                    placeholder="Nome"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  />
                )}
                <Input
                  placeholder="Email"
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />

                <Button className="w-full" onClick={handleAuth} disabled={busy}>
                  {busy ? "Attendi..." : authModal === "login" ? "Entra" : "Crea account"}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setAuthModal(authModal === "login" ? "register" : "login")}
                >
                  {authModal === "login" ? "Non hai un account? Registrati" : "Hai gia un account? Accedi"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* PUBLISH MODAL */}
        {publishOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setPublishOpen(false)}
          >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-poppins">Pubblica Annuncio</h2>
                <button onClick={() => setPublishOpen(false)} className="text-2xl text-muted-foreground hover:text-foreground">×</button>
              </div>

              {/* Messaggio limite giornaliero */}
              {limitMessage ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{limitMessage}</p>
                      {!hasPaid && (
                        <Button
                          size="sm"
                          className="mt-3 gap-1.5"
                          onClick={() => { setPublishOpen(false); navigate("/shop"); }}
                        >
                          💰 Acquista crediti
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Info limite */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 bg-muted/50 rounded-lg px-3 py-2">
                    <span>Annunci pubblicati oggi: <strong className="text-foreground">{adsPostedToday}/{dailyLimit}</strong></span>
                    <span className="flex items-center gap-1">
                      {hasPaid ? <><Crown className="w-3.5 h-3.5 text-amber-500" /> Account Premium</> : "Account gratuito"}
                    </span>
                  </div>

                  {/* UPLOAD FOTO */}
                  <div className="mb-5">
                    <Label className="mb-2 block">Foto {hasPaid ? `(max ${maxPhotos})` : `(max ${maxPhotos} - upgrade premium per 5)`}</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple={hasPaid}
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    {photoPreviewUrls.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                        {photoPreviewUrls.map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={url} alt={`anteprima ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Rimuovi foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-bold">Principale</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {photoPreviewUrls.length < maxPhotos && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhotos}
                        className="w-full border-2 border-dashed border-border rounded-lg py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {uploadingPhotos ? (
                          <><Loader2 className="w-6 h-6 animate-spin" /> Caricamento...</>
                        ) : (
                          <>
                            <ImagePlus className="w-6 h-6" />
                            <span className="text-sm font-medium">Carica foto</span>
                            <span className="text-xs">PNG, JPG fino a {maxPhotos - photoPreviewUrls.length} rimanenti</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      className="md:col-span-2"
                      placeholder="Titolo annuncio"
                      value={publishForm.title}
                      onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={publishForm.category}
                      onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={publishForm.city}
                      onChange={(e) => setPublishForm({ ...publishForm, city: e.target.value })}
                    >
                      {ITALIAN_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Eta"
                      type="number"
                      min="18"
                      value={publishForm.age}
                      onChange={(e) => setPublishForm({ ...publishForm, age: e.target.value })}
                    />
                    <Input
                      placeholder="Prezzo o info"
                      value={publishForm.price}
                      onChange={(e) => setPublishForm({ ...publishForm, price: e.target.value })}
                    />
                    <Input
                      placeholder="Telefono (es. +39 333 1234567)"
                      value={publishForm.phone}
                      onChange={(e) => setPublishForm({ ...publishForm, phone: e.target.value })}
                    />
                    <Input
                      placeholder="WhatsApp (es. +39 333 1234567)"
                      value={publishForm.whatsapp}
                      onChange={(e) => setPublishForm({ ...publishForm, whatsapp: e.target.value })}
                    />
                    <Textarea
                      className="md:col-span-2"
                      rows={5}
                      placeholder="Descrizione"
                      value={publishForm.description}
                      onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                    />
                  </div>

                  {/* CAMPI DETTAGLIO */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4" /> Dettagli (opzionale)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block text-xs">Colore capelli</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={publishForm.hair_color}
                          onChange={(e) => setPublishForm({ ...publishForm, hair_color: e.target.value })}
                        >
                          <option value="">Seleziona...</option>
                          {HAIR_COLORS.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs">Corporatura</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={publishForm.body_type}
                          onChange={(e) => setPublishForm({ ...publishForm, body_type: e.target.value })}
                        >
                          <option value="">Seleziona...</option>
                          {BODY_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs">Etnia</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={publishForm.ethnicity}
                          onChange={(e) => setPublishForm({ ...publishForm, ethnicity: e.target.value })}
                        >
                          <option value="">Seleziona...</option>
                          {ETHNICITIES.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs">Orari disponibilita</Label>
                        <Input
                          placeholder="es. 10:00-22:00"
                          value={publishForm.availability_hours}
                          onChange={(e) => setPublishForm({ ...publishForm, availability_hours: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs">Altezza (cm)</Label>
                        <Input
                          type="number"
                          min="100"
                          max="250"
                          placeholder="es. 170"
                          value={publishForm.height}
                          onChange={(e) => setPublishForm({ ...publishForm, height: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs">Peso (kg)</Label>
                        <Input
                          type="number"
                          min="30"
                          max="200"
                          placeholder="es. 60"
                          value={publishForm.weight}
                          onChange={(e) => setPublishForm({ ...publishForm, weight: e.target.value })}
                        />
                      </div>
                      <Textarea
                        className="md:col-span-2"
                        rows={3}
                        placeholder="Servizi offerti"
                        value={publishForm.services}
                        onChange={(e) => setPublishForm({ ...publishForm, services: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SCHEDULAZIONE VETRINA */}
                  {(currentUser?.credits || 0) > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={scheduleVetrina}
                          onChange={(e) => setScheduleVetrina(e.target.checked)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-sm font-bold flex items-center gap-2 text-accent">
                          <Sparkles className="w-4 h-4" /> Metti in vetrina (boost)
                        </span>
                      </label>
                      {scheduleVetrina && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-accent/5 rounded-lg p-4">
                          <div>
                            <Label className="mb-1.5 block text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Durata vetrina</Label>
                            <select
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                              value={vetrinaDuration}
                              onChange={(e) => setVetrinaDuration(Number(e.target.value))}
                            >
                              <option value={1}>1 giorno ({VETRINA_COSTS[1]} crediti)</option>
                              <option value={3}>3 giorni ({VETRINA_COSTS[3]} crediti)</option>
                              <option value={7}>7 giorni ({VETRINA_COSTS[7]} crediti)</option>
                            </select>
                          </div>
                          <div>
                            <Label className="mb-1.5 block text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Inizio (opzionale, altrimenti subito)</Label>
                            <Input
                              type="datetime-local"
                              value={vetrinaStartAt}
                              onChange={(e) => setVetrinaStartAt(e.target.value)}
                            />
                          </div>
                          <p className="md:col-span-2 text-xs text-muted-foreground">
                            Costo: <strong className="text-foreground">{VETRINA_COSTS[vetrinaDuration]} crediti</strong> • Saldo attuale: <strong className="text-foreground">{currentUser?.credits || 0} crediti</strong>
                            {(currentUser?.credits || 0) < (VETRINA_COSTS[vetrinaDuration] ?? 0) && (
                              <span className="text-destructive font-semibold"> • Crediti insufficienti</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button className="flex-1" onClick={handlePublish} disabled={busy}>
                      {busy ? (uploadingPhotos ? "Caricamento foto..." : "Pubblicazione...") : "Pubblica"}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setPublishOpen(false)}>
                      Annulla
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* FOOTER */}
        <footer className="bg-muted/50 dark:bg-card/50 border-t border-border py-8 md:py-12 mt-0">
            <div className="container">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/logo.svg" alt="Incontri di Bakeka" className="h-8 w-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Il marketplace piu affidabile per connessioni autentiche in Italia.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-4">Link Utili</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><button onClick={() => openInfoModal("chi-siamo")} className="hover:text-primary transition-colors text-left">Chi Siamo</button></li>
                    <li><button onClick={() => openInfoModal("contatti")} className="hover:text-primary transition-colors text-left">Contatti</button></li>
                    <li><button onClick={() => openInfoModal("blog")} className="hover:text-primary transition-colors text-left">Blog</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4">Legale</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><button onClick={() => openInfoModal("termini")} className="hover:text-primary transition-colors text-left">Termini e Condizioni</button></li>
                    <li><button onClick={() => openInfoModal("privacy")} className="hover:text-primary transition-colors text-left">Privacy Policy</button></li>
                    <li><button onClick={() => openInfoModal("cookie")} className="hover:text-primary transition-colors text-left">Cookie Policy</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4">Seguici</h4>
                  <div className="flex gap-3 mb-2">
                    <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold opacity-50 cursor-not-allowed" title="Coming Soon">F</span>
                    <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold opacity-50 cursor-not-allowed" title="Coming Soon">I</span>
                    <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold opacity-50 cursor-not-allowed" title="Coming Soon">T</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Coming Soon</p>
                </div>
              </div>

              {/* Cities grid */}
              <div className="border-t border-border pt-6 mb-6">
                <h4 className="font-bold mb-3 text-sm">Citta in Evidenza</h4>
                <div className="flex flex-wrap gap-2">
                  {ITALIAN_CITIES.slice(0, 40).map((city) => (
                    <button
                      key={city}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        selectedCity === city
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-primary hover:bg-muted"
                      }`}
                      onClick={() => {
                        setSelectedCity(city);
                        document.getElementById("ads-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pubblica annuncio bar */}
              <div className="border-t border-border pt-6 mb-6 text-center">
                <Button onClick={openPublish} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Pubblica il tuo Annuncio
                </Button>
              </div>

              <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
                <p className="mb-2">Tutti gli annunci sono destinati a maggiori di 18 anni.</p>
                <p>&copy; 2026 Incontri di Bakeka. Tutti i diritti riservati.</p>
              </div>
            </div>
          </footer>
      </div>
    );
  }
