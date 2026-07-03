import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { id: "donna-cerca-uomo", name: "Donna Cerca Uomo", icon: "👩" },
  { id: "uomo-cerca-donna", name: "Uomo Cerca Donna", icon: "👨" },
  { id: "uomo-cerca-uomo", name: "Uomo Cerca Uomo", icon: "👨‍❤️‍👨" },
  { id: "donna-cerca-donna", name: "Donna Cerca Donna", icon: "👩‍❤️‍👩" },
  { id: "coppie", name: "Coppie", icon: "💑" },
  { id: "cerco-amici", name: "Cerco Amici", icon: "🤝" },
];

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("Errore parsing user:", e);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img
              src="/manus-storage/logo-bakeka_15393e4f.png"
              alt="Bakeka"
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-primary">Bakeka</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Input
              placeholder="Cerca annunci..."
              className="w-64"
              type="search"
            />
            {currentUser ? (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/shop"}
                  className="gap-2"
                >
                  💰 {currentUser.credits || 0} crediti
                </Button>
                <span className="text-sm text-foreground">{currentUser.name}</span>
                {currentUser.is_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = "/admin"}
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
              <Button size="sm" className="gap-2">
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
            <Input placeholder="Cerca annunci..." type="search" />
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
              <Button className="w-full gap-2">
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
            backgroundImage: "url(/manus-storage/hero-background_d3388cb4.png)",
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
            <Button size="lg" variant="secondary" className="gap-2">
              <Search className="w-5 h-5" />
              Scopri Annunci
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
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
                className="p-4 text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="text-4xl mb-2">{cat.icon}</div>
                <p className="text-sm font-medium">{cat.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ADS SECTION */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8 font-poppins">
            Annunci in Evidenza
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64 bg-muted animate-pulse" />
              ))}
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nessun annuncio disponibile</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
              <Card
                key={ad.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => window.location.href = `/ad?id=${ad.id}`}
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
                    <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-muted">
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
                <Button className="flex-1 gap-2">
                  💬 Contatta
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Heart className="w-4 h-4" />
                  Salva
                </Button>
              </div>
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
