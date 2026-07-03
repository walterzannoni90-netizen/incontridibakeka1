import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/hooks/useRouter";
import { useAuth } from "@/hooks/useAuth";
import { ITALIAN_CITIES, COUNTRIES, slugify } from "@shared/data";
import { Heart, MapPin, Star, Search, LogOut, LogIn, Menu, X, Plus, ChevronDown, Phone, MessageCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Ad {
  id: string;
  title: string;
  description: string;
  city: string;
  age: number;
  image: string;
  category: string;
  price?: string;
  rating: number;
  review_count: number;
  is_premium: boolean;
  is_sponsored: boolean;
}

const CATEGORIES = [
  { id: "donna-cerca-uomo", name: "Donna Cerca Uomo", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
  { id: "uomo-cerca-donna", name: "Uomo Cerca Donna", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
  { id: "uomo-cerca-uomo", name: "Uomo Cerca Uomo", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
  { id: "donna-cerca-donna", name: "Donna Cerca Donna", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" },
  { id: "coppie", name: "Coppie", image: "https://images.unsplash.com/photo-1516214104703-3e8c20108eaa?w=400&h=400&fit=crop" },
  { id: "cerco-amici", name: "Cerco Amici", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop" },
];

export default function Home() {
  const { navigate } = useRouter();
  const { user: currentUser, login, logout } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    city: "Roma",
    age: "25",
    category: CATEGORIES[0].id,
    image: "",
    price: "",
  });
  const [busy, setBusy] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("IT");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    loadAds();
    handlePaymentCallback();
    if (!localStorage.getItem("ageAccepted")) {
      setShowDisclaimer(true);
    }
  }, []);

  const handlePaymentCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    if (!status) return;

    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", newUrl);

    if (status === "cancel") {
      alert("Pagamento annullato.");
      return;
    }

    if (status === "success") {
      const userId = sessionStorage.getItem("stripeUserId");
      const credits = sessionStorage.getItem("stripeCredits");
      sessionStorage.removeItem("stripeUserId");
      sessionStorage.removeItem("stripeCredits");

      if (userId) {
        try {
          const stored = localStorage.getItem("currentUser");
          const localUser = stored ? JSON.parse(stored) : null;
          const authToken = localStorage.getItem("authToken");
          if (localUser && authToken && localUser.id === userId) {
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=credits&id=eq.${userId}`, {
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${authToken}` },
            });
            const profiles = await resp.json();
            if (profiles?.[0]) {
              login({ ...localUser, credits: profiles[0].credits }, authToken);
            }
          }
        } catch (e) {
          console.error("Errore aggiornamento crediti:", e);
        }
      }
      alert(`Pagamento riuscito! ${credits || ""} crediti aggiunti.`);
    }
  };

  const loadAds = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/ads?select=*&is_active=eq.true&order=is_sponsored.desc,is_premium.desc,created_at.desc&limit=12`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setAds(data || []);
    } catch (error) {
      console.error("Errore caricamento annunci:", error);
    } finally {
      setLoading(false);
    }
  };

  const runSearch = () => {
    const section = document.getElementById("ads-section");
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openPublish = () => {
    if (!currentUser) {
      setAuthModal("login");
      return;
    }
    setPublishOpen(true);
  };

  const handleAuth = async () => {
    if (!authForm.email || !authForm.password || (authModal === "register" && !authForm.name)) {
      alert("Compila tutti i campi richiesti.");
      return;
    }

    setBusy(true);
    try {
      const endpoint =
        authModal === "login"
          ? `${SUPABASE_URL}/auth/v1/token?grant_type=password`
          : `${SUPABASE_URL}/auth/v1/signup`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authForm.email,
          password: authForm.password,
          data: { name: authForm.name || authForm.email.split("@")[0] },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || data.msg || data.error || "Accesso non riuscito");

      const authUser = data.user;
      const token = data.access_token;
      if (!authUser || !token) {
        alert("Controlla la tua email per confermare l'account, poi accedi.");
        setAuthModal("login");
        return;
      }

      const profile = {
        id: authUser.id,
        email: authUser.email || authForm.email,
        name: authForm.name || authUser.user_metadata?.name || authForm.email.split("@")[0],
        is_admin: false,
        credits: authModal === "register" ? 20 : 0,
      };

      if (authModal === "register") {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify(profile),
        }).catch(() => {});
      } else {
        const profileResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${authUser.id}`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
        }).catch(() => null);
        const profiles = profileResp?.ok ? await profileResp.json() : [];
        if (profiles?.[0]) Object.assign(profile, profiles[0]);
      }

      login(profile, token);
      setAuthModal(null);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore accesso.");
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

    setBusy(true);
    try {
      const payload = {
        title: publishForm.title,
        description: publishForm.description,
        city: publishForm.city,
        age: Number(publishForm.age) || null,
        category: publishForm.category,
        image: publishForm.image || null,
        price: publishForm.price || null,
        user_id: currentUser.id,
        is_active: true,
        is_premium: false,
        is_sponsored: false,
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

      setPublishOpen(false);
      setPublishForm({
        title: "",
        description: "",
        city: "Roma",
        age: "25",
        category: CATEGORIES[0].id,
        image: "",
        price: "",
      });
      await loadAds();
      alert("Annuncio pubblicato.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore pubblicazione.");
    } finally {
      setBusy(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* 18+ DISCLAIMER */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-destructive">18+</span>
            </div>
            <h2 className="text-xl font-bold mb-3 font-poppins">Avviso di Età</h2>
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
        className="md:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        onClick={openPublish}
        aria-label="Pubblica annuncio"
      >
        <Plus className="w-6 h-6" />
      </button>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">B</div>
            <span className="text-lg font-bold text-primary hidden sm:inline">Incontri di Bakeka</span>
            <span className="text-lg font-bold text-primary sm:hidden">Bakeka</span>
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
                {selectedCity || "Tutte le città"}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {cityDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-50 py-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { setSelectedCity(null); setCityDropdownOpen(false); }}
                  >
                    🇮🇹 Tutte le città
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
                <div className="absolute top-full right-0 mt-1 w-48 max-h-72 overflow-y-auto bg-white border border-border rounded-lg shadow-lg z-50 py-1">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                      onClick={() => { setSelectedCountry(c.code); setCountryDropdownOpen(false); }}
                    >
                      <span>{c.flag}</span> {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="container py-4 space-y-3">
                {/* City selector mobile */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Città</label>
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border text-sm"
                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {selectedCity || "Tutte le città"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {cityDropdownOpen && (
                    <div className="mt-1 w-full max-h-48 overflow-y-auto border border-border rounded-lg py-1">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => { setSelectedCity(null); setCityDropdownOpen(false); }}
                      >
                        Tutte le città
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
                          onClick={() => { setSelectedCountry(c.code); setCountryDropdownOpen(false); }}
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
                    <span>📝</span> Pubblica Annuncio
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
                    <span>✨</span> Registrati
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
        <section className="relative min-h-[400px] md:h-96 bg-gradient-to-br from-primary via-purple-500 to-secondary overflow-hidden flex items-center">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="relative container flex flex-col items-center justify-center text-center text-white py-12 md:py-0">
            <h1 className="text-4xl md:text-6xl font-bold mb-3 md:mb-4 font-poppins drop-shadow-lg">
              Connessioni Autentiche
            </h1>
            <p className="text-lg md:text-2xl mb-6 md:mb-8 opacity-90 max-w-2xl px-2">
              Il marketplace più affidabile per incontri e amicizie in Italia
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto" onClick={runSearch}>
                <Search className="w-5 h-5" />
                Scopri Annunci
              </Button>
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto bg-white/90 hover:bg-white border-white text-primary" onClick={openPublish}>
                Pubblica Annuncio
              </Button>
            </div>
          </div>
        </section>

      {/* CATEGORIES */}
        <section className="py-8 md:py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-12 text-center font-poppins">
            Sfoglia per Categoria
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Card
                key={cat.id}
                className="overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all group"
                onClick={() => {
                  setCategoryFilter(categoryFilter === cat.id ? null : cat.id);
                  document.getElementById("ads-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                    <p className="text-xs font-bold text-white drop-shadow">{cat.name}</p>
                  </div>
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
              {(searchTerm || categoryFilter) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredAds.length} risultati
                  {categoryFilter ? ` in ${CATEGORIES.find((c) => c.id === categoryFilter)?.name}` : ""}
                </p>
              )}
            </div>
            {(searchTerm || categoryFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter(null);
                }}
              >
                Cancella filtri
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64 bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nessun annuncio disponibile</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {filteredAds.map((ad) => (
              <Card
                key={ad.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => navigate(`/ad/${slugify(ad.title)}-${ad.id}`)}
              >
                  <div className="relative h-36 md:h-48 bg-muted overflow-hidden">
                    {ad.image ? (
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        👤
                      </div>
                    )}
                    {ad.is_sponsored && (
                      <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-bold">
                        ⭐ SuperTop
                      </div>
                    )}
                    {ad.is_premium && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                        👑 Premium
                      </div>
                    )}
                    <button
                      className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAd(ad);
                      }}
                      aria-label="Salva o contatta"
                    >
                      <Heart className="w-5 h-5 text-primary" />
                    </button>
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-bold text-base md:text-lg mb-1 md:mb-2 line-clamp-1">
                      {ad.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2">
                      {ad.description}
                    </p>
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {ad.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-medium">{ad.rating}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AD DETAIL MODAL */}
      {selectedAd && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAd(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-96 overflow-y-auto"
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
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAd(null)}
                  className="text-2xl"
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
                  className="flex-1 gap-2"
                  onClick={() => {
                    if (!currentUser) {
                      setSelectedAd(null);
                      setAuthModal("login");
                      return;
                    }
                    navigate(`/ad/${slugify(selectedAd.title)}-${selectedAd.id}`);
                  }}
                >
                  💬 Contatta
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    const saved = JSON.parse(localStorage.getItem("savedAds") || "[]");
                    localStorage.setItem("savedAds", JSON.stringify([...new Set([...saved, selectedAd.id])]));
                    alert("Annuncio salvato.");
                  }}
                >
                  <Heart className="w-4 h-4" />
                  Salva
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AUTH MODAL */}
      {authModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setAuthModal(null)}
        >
          <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-poppins">
                {authModal === "login" ? "Accedi" : "Registrati"}
              </h2>
              <button onClick={() => setAuthModal(null)} className="text-2xl">×</button>
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
                {authModal === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* PUBLISH MODAL */}
      {publishOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPublishOpen(false)}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-poppins">Pubblica Annuncio</h2>
              <button onClick={() => setPublishOpen(false)} className="text-2xl">×</button>
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
              <Input
                placeholder="Città"
                value={publishForm.city}
                onChange={(e) => setPublishForm({ ...publishForm, city: e.target.value })}
              />
              <Input
                placeholder="Età"
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
                className="md:col-span-2"
                placeholder="URL foto"
                value={publishForm.image}
                onChange={(e) => setPublishForm({ ...publishForm, image: e.target.value })}
              />
              <Textarea
                className="md:col-span-2"
                rows={5}
                placeholder="Descrizione"
                value={publishForm.description}
                onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button className="flex-1" onClick={handlePublish} disabled={busy}>
                {busy ? "Pubblicazione..." : "Pubblica"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPublishOpen(false)}>
                Annulla
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-muted/50 border-t border-border py-8 md:py-12 mt-8 md:mt-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="font-bold mb-4">Incontri di Bakeka</h4>
                <p className="text-sm text-muted-foreground">
                  Il marketplace più affidabile per connessioni autentiche.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Link Utili</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary">Chi Siamo</a></li>
                  <li><a href="#" className="hover:text-primary">Contatti</a></li>
                  <li><a href="#" className="hover:text-primary">Blog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legale</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary">Termini e Condizioni</a></li>
                  <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary">Cookie Policy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Seguici</h4>
                <div className="flex gap-4">
                  <a href="#" className="text-primary hover:text-primary-foreground">Facebook</a>
                  <a href="#" className="text-primary hover:text-primary-foreground">Instagram</a>
                </div>
              </div>
            </div>

            {/* Cities grid */}
            <div className="border-t border-border pt-6 mb-6">
              <h4 className="font-bold mb-3 text-sm">Città in Evidenza</h4>
              <div className="flex flex-wrap gap-2">
                {ITALIAN_CITIES.slice(0, 40).map((city) => (
                  <button
                    key={city}
                    className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-muted transition-colors"
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
              <p>&copy; 2026 Incontri di Bakeka. Tutti i diritti riservati.</p>
            </div>
          </div>
        </footer>
    </div>
  );
}
