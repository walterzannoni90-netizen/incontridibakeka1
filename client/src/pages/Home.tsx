import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/hooks/useRouter";
import { Heart, MapPin, Star, Search, LogOut, LogIn, Menu, X } from "lucide-react";

const SUPABASE_URL = "https://rdqsmfgpbuswzilgbjyr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXNtZmdwYnVzd3ppbGdianlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzYyMTcsImV4cCI6MjA5ODQxMjIxN30.EthEz46lh_bnJzjpQi9GrXiQsinyb5g47V1p1bwlL_E";

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

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  credits?: number;
}

const CATEGORIES = [
  { id: "donna-cerca-uomo", name: "Donna Cerca Uomo", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
  { id: "uomo-cerca-donna", name: "Uomo Cerca Donna", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
  { id: "uomo-cerca-uomo", name: "Uomo Cerca Uomo", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
  { id: "donna-cerca-donna", name: "Donna Cerca Donna", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" },
  { id: "coppie", name: "Coppie", image: "https://images.unsplash.com/photo-1516214104703-3e8c20108eaa?w=400&h=400&fit=crop" },
  { id: "cerco-amici", name: "Cerco Amici", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop" },
];

const AUTH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function persistSession(token: string, user: CurrentUser) {
  localStorage.setItem("authToken", token);
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem(
    "authSession",
    JSON.stringify({ savedAt: Date.now(), expiresAt: Date.now() + AUTH_SESSION_TTL_MS })
  );
}

function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("authSession");
}

export default function Home() {
  const { navigate } = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
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

  useEffect(() => {
    loadAds();
    checkAuth();
  }, []);

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

  const checkAuth = () => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("currentUser");
    const session = localStorage.getItem("authSession");
    if (token && user) {
      try {
        const sessionData = session ? JSON.parse(session) : null;
        if (sessionData?.expiresAt && Date.now() > sessionData.expiresAt) {
          clearSession();
          return;
        }
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("Errore parsing user:", e);
        clearSession();
      }
    }
  };

  const logout = () => {
    clearSession();
    setCurrentUser(null);
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

      const profile: CurrentUser = {
        id: authUser.id,
        email: authUser.email || authForm.email,
        name: authForm.name || authUser.user_metadata?.name || authForm.email.split("@")[0],
        is_admin: authForm.email.toLowerCase() === "walterzannoni90@outlook.it",
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

      persistSession(token, profile);
      setCurrentUser(profile);
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
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">B</div>
            <span className="text-xl font-bold text-primary">Bakeka</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Input
              placeholder="Cerca annunci..."
              className="w-64"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
            {currentUser ? (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/shop")}
                  className="gap-2"
                >
                  💰 {currentUser.credits || 0} crediti
                </Button>
                <span className="text-sm text-foreground">{currentUser.name}</span>
                {currentUser.is_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="gap-2"
                  >
                    ⚙️ Admin
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Esci
                </Button>
              </div>
            ) : (
              <Button size="sm" className="gap-2" onClick={() => setAuthModal("login")}>
                <LogIn className="w-4 h-4" />
                Accedi
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
          <div className="md:hidden border-t border-border p-4 space-y-4">
            <Input
              placeholder="Cerca annunci..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
            {currentUser ? (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                Esci ({currentUser.name})
              </Button>
            ) : (
              <Button className="w-full gap-2" onClick={() => setAuthModal("login")}>
                <LogIn className="w-4 h-4" />
                Accedi
              </Button>
            )}
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-96 bg-gradient-to-br from-primary via-purple-400 to-secondary overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative container h-full flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 font-poppins">
            Connessioni Autentiche
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Il marketplace più affidabile per incontri e amicizie in Italia
          </p>
          <div className="flex gap-4">
            <Button size="lg" variant="secondary" className="gap-2" onClick={runSearch}>
              <Search className="w-5 h-5" />
              Scopri Annunci
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={openPublish}>
              Pubblica Annuncio
            </Button>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center font-poppins">
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
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs font-bold text-white">{cat.name}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ADS SECTION */}
      <section className="py-16" id="ads-section">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold font-poppins">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
              <Card
                key={ad.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => navigate(`/ad?id=${ad.id}`)}
              >
                  <div className="relative h-48 bg-muted overflow-hidden">
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
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">
                      {ad.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {ad.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
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
                    navigate(`/ad?id=${selectedAd.id}`);
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
      <footer className="bg-muted/50 border-t border-border py-12 mt-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Bakeka</h4>
              <p className="text-sm text-muted-foreground">
                Il marketplace più affidabile per connessioni autentiche.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Link Utili</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">
                    Chi Siamo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Contatti
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legale</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">
                    Termini e Condizioni
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Seguici</h4>
              <div className="flex gap-4">
                <a href="#" className="text-primary hover:text-primary-foreground">
                  Facebook
                </a>
                <a href="#" className="text-primary hover:text-primary-foreground">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Incontri di Bakeka. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
