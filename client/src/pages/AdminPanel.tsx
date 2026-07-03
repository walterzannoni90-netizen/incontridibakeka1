import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/hooks/useRouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  Eye,
  EyeOff,
  Search,
  Users,
  FileText,
  Settings,
  Edit3,
  Save,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  Rocket,
  CreditCard,
  Ban,
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
  category: string;
  price?: string;
  is_active: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  is_boosted?: boolean;
  is_verified?: boolean;
  views?: number;
  rating: number;
  review_count: number;
  created_at: string;
  user_id: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  is_verified: boolean;
  credits: number;
  has_paid?: boolean;
  subscription_tier?: string;
  created_at?: string;
}

interface Report {
  id: string;
  ad_id: string;
  ad_title: string;
  reason: string;
  status: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  user_email?: string;
  amount?: number;
  credits?: number;
  status: string;
  type?: string;
  created_at: string;
}

// No demo data - real data only from Supabase
const DEMO_ADS: Ad[] = [];
const DEMO_USERS: User[] = [];
const DEMO_REPORTS: Report[] = [];
const DEMO_TRANSACTIONS: Transaction[] = [];

export default function AdminPanel() {
  const { isAdmin, loading: authLoading, logout, token: authToken, user: currentUser } = useAuth();
  const { navigate } = useRouter();

  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAds, setSearchAds] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ad>>({});
  const [activeTab, setActiveTab] = useState("ads");

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin, authLoading]);

  const loadData = async () => {
    if (!SUPABASE_CONFIGURED) {
      setAds(DEMO_ADS);
      setUsers(DEMO_USERS);
      setReports(DEMO_REPORTS);
      setTransactions(DEMO_TRANSACTIONS);
      setLoading(false);
      return;
    }
    try {
      const headers: Record<string, string> = {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const [adsResp, usersResp] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/ads?select=*&order=created_at.desc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, { headers }),
      ]);
      const adsData = await adsResp.json();
      const usersData = await usersResp.json();
      setAds(adsData || []);
      setUsers(usersData || []);

      // Segnalazioni (tabella ad_reports)
      try {
        const reportsResp = await fetch(`${SUPABASE_URL}/rest/v1/ad_reports?select=*&order=created_at.desc`, { headers });
        if (reportsResp.ok) {
          const reportsData = await reportsResp.json();
          setReports(reportsData || []);
        }
      } catch {}

      // Transazioni (tabella transactions)
      try {
        const txResp = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc`, { headers });
        if (txResp.ok) {
          const txData = await txResp.json();
          setTransactions(txData || []);
        }
      } catch {}
    } catch (error) {
      console.error("Errore caricamento dati admin:", error);
      setAds(DEMO_ADS);
      setUsers(DEMO_USERS);
      setReports(DEMO_REPORTS);
      setTransactions(DEMO_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  const updateAd = async (adId: string, patch: Partial<Ad>) => {
    if (!SUPABASE_CONFIGURED) {
      setAds(ads.map((a) => (a.id === adId ? { ...a, ...patch } : a)));
      return;
    }
    const query = `id=eq.${adId}`;
    await fetch(`${SUPABASE_URL}/rest/v1/ads?${query}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    });
    loadData();
  };

  const updateProfile = async (userId: string, patch: Partial<User>) => {
    if (!SUPABASE_CONFIGURED) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
      return;
    }
    const query = `id=eq.${userId}`;
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?${query}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    });
    loadData();
  };

  const handleDeleteAd = async (adId: string, title: string) => {
    if (!confirm(`Eliminare l'annuncio "${title}"?`)) return;
    if (!SUPABASE_CONFIGURED) {
      setAds(ads.filter((a) => a.id !== adId));
      return;
    }
    await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${adId}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${authToken}` },
    });
    toast.success("Annuncio eliminato.");
    loadData();
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Eliminare l'utente "${userName}"? Tutti i suoi annunci verranno rimossi.`)) return;
    if (!SUPABASE_CONFIGURED) {
      setUsers(users.filter((u) => u.id !== userId));
      return;
    }
    // Delete user's ads first
    await fetch(`${SUPABASE_URL}/rest/v1/ads?user_id=eq.${userId}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${authToken}` },
    });
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${authToken}` },
    });
    toast.success("Utente eliminato.");
    loadData();
  };

  const handleSaveEdit = async () => {
    if (!editingAd) return;
    await updateAd(editingAd.id, editForm);
    toast.success("Annuncio aggiornato.");
    setEditingAd(null);
    setEditForm({});
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    await updateProfile(userId, { credits: (u.credits || 0) + amount });
    toast.success(`+${amount} crediti aggiunti.`);
  };

  const handleToggleBoost = async (ad: Ad) => {
    const next = !ad.is_boosted;
    await updateAd(ad.id, { is_boosted: next });
    toast.success(next ? "Annuncio boostato." : "Boost rimosso.");
  };

  const handleResolveReport = async (reportId: string) => {
    if (!SUPABASE_CONFIGURED) {
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
      return;
    }
    await fetch(`${SUPABASE_URL}/rest/v1/ad_reports?id=eq.${reportId}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "resolved" }),
    });
    toast.success("Segnalazione risolta.");
    loadData();
  };

  const handleDismissReport = async (reportId: string) => {
    if (!SUPABASE_CONFIGURED) {
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: "dismissed" } : r)));
      return;
    }
    await fetch(`${SUPABASE_URL}/rest/v1/ad_reports?id=eq.${reportId}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "dismissed" }),
    });
    toast.success("Segnalazione ignorata.");
    loadData();
  };

  const filteredAds = ads.filter((ad) =>
    ad.title.toLowerCase().includes(searchAds.toLowerCase()) ||
    ad.city.toLowerCase().includes(searchAds.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.name.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const pendingReports = reports.filter((r) => r.status === "pending");
  const totalRevenue = transactions
    .filter((t) => t.status === "completed" || t.status === "succeeded" || t.status === "paid")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const stats = {
    totalAds: ads.length,
    activeAds: ads.filter((a) => a.is_active).length,
    premiumAds: ads.filter((a) => a.is_premium).length,
    sponsoredAds: ads.filter((a) => a.is_sponsored).length,
    boostedAds: ads.filter((a) => a.is_boosted).length,
    totalUsers: users.length,
    verifiedUsers: users.filter((u) => u.is_verified).length,
    paidUsers: users.filter((u) => u.has_paid).length,
    pendingReports: pendingReports.length,
    totalViews: ads.reduce((sum, a) => sum + (a.views || 0), 0),
    totalTransactions: transactions.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">Caricamento pannello admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <h1 className="text-lg md:text-2xl font-bold font-poppins">Pannello Admin</h1>
            {!SUPABASE_CONFIGURED && (
              <span className="hidden md:inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Modalita Demo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-muted-foreground">{currentUser?.name}</span>
            <Button variant="outline" onClick={logout} className="gap-2">
              Esci
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6 md:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-muted-foreground">Annunci Totali</p>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-primary">{stats.totalAds}</p>
          </Card>
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-muted-foreground">Utenti</p>
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-secondary">{stats.totalUsers}</p>
          </Card>
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-muted-foreground">Visualizzazioni</p>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-accent">{stats.totalViews}</p>
          </Card>
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-muted-foreground">Ricavi (€)</p>
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{totalRevenue.toFixed(2)}</p>
          </Card>
        </div>

        {/* Secondary stats */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
          <span className="text-xs md:text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium">
            👑 Premium: {stats.premiumAds}
          </span>
          <span className="text-xs md:text-sm bg-accent/10 text-accent px-3 py-1.5 rounded-lg font-medium">
            ⭐ Sponsor: {stats.sponsoredAds}
          </span>
          <span className="text-xs md:text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-lg font-medium">
            🚀 Boost: {stats.boostedAds}
          </span>
          <span className="text-xs md:text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-lg font-medium">
            ✓ Verificati: {stats.verifiedUsers}/{stats.totalUsers}
          </span>
          <span className="text-xs md:text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium">
            💳 Paganti: {stats.paidUsers}
          </span>
          {stats.pendingReports > 0 && (
            <span className="text-xs md:text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-lg font-medium">
              ⚠ Segnalazioni: {stats.pendingReports}
            </span>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="ads" className="gap-1.5 text-xs md:text-sm">
              <FileText className="w-4 h-4" /> Annunci ({ads.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs md:text-sm">
              <Users className="w-4 h-4" /> Utenti ({users.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 text-xs md:text-sm">
              <AlertTriangle className="w-4 h-4" /> Segnalazioni ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1.5 text-xs md:text-sm">
              <CreditCard className="w-4 h-4" /> Transazioni ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="boosts" className="gap-1.5 text-xs md:text-sm">
              <Rocket className="w-4 h-4" /> Boost ({stats.boostedAds})
            </TabsTrigger>
          </TabsList>

          {/* ADS TAB */}
          <TabsContent value="ads" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per titolo o citta..."
                  value={searchAds}
                  onChange={(e) => setSearchAds(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left font-semibold">Annuncio</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left font-semibold hidden md:table-cell">Citta</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Stato</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Premium</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Sponsor</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold hidden md:table-cell">Views</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad) => (
                    <tr key={ad.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2">
                          {ad.image && (
                            <img src={ad.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[180px]">{ad.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{ad.category?.replace(/-/g, " ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 hidden md:table-cell">{ad.city}</td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <button
                          onClick={() => updateAd(ad.id, { is_active: !ad.is_active })}
                          className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                          title={ad.is_active ? "Disattiva" : "Attiva"}
                        >
                          {ad.is_active ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <button
                          onClick={() => updateAd(ad.id, { is_premium: !ad.is_premium })}
                          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                            ad.is_premium ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/20"
                          }`}
                          title="Toggle Premium"
                        >
                          👑
                        </button>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <button
                          onClick={() => updateAd(ad.id, { is_sponsored: !ad.is_sponsored })}
                          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                            ad.is_sponsored ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-accent/20"
                          }`}
                          title="Toggle Sponsor"
                        >
                          ⭐
                        </button>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center hidden md:table-cell">
                        <span className="text-muted-foreground">{ad.views || 0}</span>
                      </td>
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditingAd(ad); setEditForm(ad); }}
                            className="p-1.5 rounded hover:bg-primary/10 text-primary"
                            title="Modifica"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id, ad.title)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nessun annuncio trovato
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o email..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left font-semibold">Utente</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Verificato</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Pagante</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold hidden md:table-cell">Abbonamento</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Crediti</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <button
                          onClick={() => updateProfile(u.id, { is_verified: !u.is_verified })}
                          className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                          title={u.is_verified ? "Rimuovi verifica" : "Verifica"}
                        >
                          {u.is_verified ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <button
                          onClick={() => updateProfile(u.id, { has_paid: !u.has_paid })}
                          className="inline-flex items-center justify-center hover:scale-110 transition-transform"
                          title={u.has_paid ? "Segna come non pagante" : "Segna come pagante"}
                        >
                          {u.has_paid ? (
                            <CreditCard className="w-5 h-5 text-green-600" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-muted-foreground/40" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center hidden md:table-cell">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          u.subscription_tier === "premium"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {u.subscription_tier || "free"}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-accent">{u.credits || 0}</span>
                          <button
                            onClick={() => handleAddCredits(u.id, 10)}
                            className="ml-1 w-6 h-6 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:scale-110 transition-transform text-xs font-bold"
                            title="+10 crediti"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20"
                          title="Elimina utente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nessun utente trovato
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">Nessuna segnalazione. Tutto sotto controllo!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className={`p-4 ${report.status === "pending" ? "border-red-200 dark:border-red-900/40" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={`w-4 h-4 ${report.status === "pending" ? "text-red-500" : "text-green-500"}`} />
                          <h4 className="font-bold text-sm">{report.ad_title || "Annuncio"}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Motivo: {report.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          Segnalato il {new Date(report.created_at).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveReport(report.id)}
                              className="gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Risolvi
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDismissReport(report.id)}
                              className="gap-1.5"
                            >
                              <Ban className="w-3.5 h-3.5" /> Ignora
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                handleDeleteAd(report.ad_id, report.ad_title || "annuncio");
                                handleResolveReport(report.id);
                              }}
                              className="gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Elimina annuncio
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ {report.status === "dismissed" ? "Ignorata" : "Risolto"}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TRANSACTIONS TAB */}
          <TabsContent value="transactions" className="space-y-4">
            {transactions.length === 0 ? (
              <Card className="p-8 text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">Nessuna transazione registrata.</p>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left font-semibold">ID</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left font-semibold hidden md:table-cell">Utente</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Tipo</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Importo</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Crediti</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Stato</th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold hidden md:table-cell">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 md:px-4 py-3 font-mono text-xs">{t.id.slice(0, 8)}</td>
                        <td className="px-3 md:px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{t.user_email || t.user_id.slice(0, 8)}</td>
                        <td className="px-3 md:px-4 py-3 text-center text-xs">{t.type || "crediti"}</td>
                        <td className="px-3 md:px-4 py-3 text-center font-semibold">{t.amount ? `€${t.amount.toFixed(2)}` : "—"}</td>
                        <td className="px-3 md:px-4 py-3 text-center text-accent font-semibold">{t.credits ?? "—"}</td>
                        <td className="px-3 md:px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            t.status === "completed" || t.status === "succeeded" || t.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : t.status === "pending"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 text-center hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("it-IT")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* BOOSTS TAB */}
          <TabsContent value="boosts" className="space-y-4">
            <Card className="p-4 mb-2 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/40">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Rocket className="w-4 h-4 text-purple-600" />
                Boosta manualmente un annuncio per dargli maggiore visibilita nei risultati.
              </p>
            </Card>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left font-semibold">Annuncio</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold hidden md:table-cell">Citta</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Stato Boost</th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-center font-semibold">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-3 md:px-4 py-3">
                        <div className="flex items-center gap-2">
                          {ad.image && (
                            <img src={ad.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{ad.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{ad.category?.replace(/-/g, " ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 hidden md:table-cell">{ad.city}</td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        {ad.is_boosted ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            🚀 Boostato
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non boostato</span>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant={ad.is_boosted ? "outline" : "default"}
                          onClick={() => handleToggleBoost(ad)}
                          className="gap-1.5"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          {ad.is_boosted ? "Rimuovi boost" : "Boosta"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {ads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nessun annuncio disponibile
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings section */}
        <Card className="p-4 md:p-6 mt-6">
          <h3 className="font-bold mb-3 flex items-center gap-2 font-poppins">
            <Settings className="w-5 h-5" /> Impostazioni Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Database Supabase</span>
              <span className={`font-semibold ${SUPABASE_CONFIGURED ? "text-green-600" : "text-amber-600"}`}>
                {SUPABASE_CONFIGURED ? "✓ Connesso" : "⚠ Non configurato"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Pagamenti Stripe</span>
              <span className={`font-semibold ${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? "text-green-600" : "text-amber-600"}`}>
                {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? "✓ Configurato" : "⚠ Non configurato"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Sistema contatti</span>
              <span className="font-semibold text-green-600">WhatsApp</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">Modalita</span>
              <span className={`font-semibold ${SUPABASE_CONFIGURED ? "text-green-600" : "text-amber-600"}`}>
                {SUPABASE_CONFIGURED ? "Produzione" : "Demo"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* EDIT AD MODAL */}
      {editingAd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditingAd(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-poppins">Modifica Annuncio</h2>
              <button onClick={() => setEditingAd(null)} className="text-2xl text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                className="md:col-span-2"
                placeholder="Titolo"
                value={editForm.title || ""}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
              <Input
                placeholder="Citta"
                value={editForm.city || ""}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
              <Input
                placeholder="Prezzo"
                value={editForm.price || ""}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              />
              <Input
                placeholder="Eta"
                type="number"
                value={editForm.age || ""}
                onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
              />
              <Input
                placeholder="Categoria"
                value={editForm.category || ""}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
              <Input
                className="md:col-span-2"
                placeholder="URL immagine"
                value={editForm.image || ""}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
              />
              <Textarea
                className="md:col-span-2"
                rows={4}
                placeholder="Descrizione"
                value={editForm.description || ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
              <div className="flex flex-wrap gap-4 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_active || false}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  />
                  Attivo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_premium || false}
                    onChange={(e) => setEditForm({ ...editForm, is_premium: e.target.checked })}
                  />
                  Premium
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_sponsored || false}
                    onChange={(e) => setEditForm({ ...editForm, is_sponsored: e.target.checked })}
                  />
                  Sponsor
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_boosted || false}
                    onChange={(e) => setEditForm({ ...editForm, is_boosted: e.target.checked })}
                  />
                  Boost
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.is_verified || false}
                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                  />
                  Verificato
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button className="flex-1 gap-2" onClick={handleSaveEdit}>
                <Save className="w-4 h-4" /> Salva
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditingAd(null)}>
                Annulla
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
