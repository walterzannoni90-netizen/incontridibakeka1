import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/hooks/useRouter";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Users,
  Store,
  Flag,
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Eye,
  Ban,
  Check,
  Trash2,
  Star,
  Tag,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  PanelTop,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingReports: number;
  totalTransactions: number;
  totalRevenue: number;
  premiumUsers: number;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  is_verified: boolean;
  credits: number;
  has_paid: boolean;
  ads_count: number;
  created_at: string;
}

interface AdRow {
  id: string;
  title: string;
  description: string;
  city: string;
  category: string;
  user_id: string;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  has_paid?: boolean;
  created_at: string;
  views: number;
  profiles?: { name: string; email: string } | null;
}

interface ReportRow {
  id: string;
  ad_id: string;
  reason: string;
  status: string;
  created_at: string;
  ads: { title: string; user_id: string } | null;
  profiles: { name: string; email: string } | null;
}

interface TransactionRow {
  id: string;
  user_id: string;
  stripe_session_id: string;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
  profiles?: { name: string; email: string } | null;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

const ITEMS_PER_PAGE = 20;

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "donna-cerca-uomo", name: "Donna cerca uomo", icon: "♀️" },
  { id: "uomo-cerca-donna", name: "Uomo cerca donna", icon: "♂️" },
  { id: "donna-cerca-donna", name: "Donna cerca donna", icon: "👩‍❤️‍👩" },
  { id: "uomo-cerca-uomo", name: "Uomo cerca uomo", icon: "👨‍❤️‍👨" },
  { id: "trans", name: "Trans", icon: "⚧️" },
  { id: "coppie", name: "Coppie", icon: "👫" },
  { id: "massaggi", name: "Massaggi", icon: "💆" },
  { id: "accompagnatrici", name: "Accompagnatrici", icon: "💃" },
  { id: "evento-festa", name: "Eventi & Feste", icon: "🎉" },
  { id: "amicizia", name: "Amicizia", icon: "🤝" },
];

async function count(table: string, filter?: string, value?: any): Promise<number> {
  if (!supabase) return 0;
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter && value !== undefined) q = q.eq(filter, value);
  const { count: c } = await q;
  return c ?? 0;
}

async function sum(table: string, column: string): Promise<number> {
  if (!supabase) return 0;
  const { data } = await supabase.from(table).select(column);
  if (!data) return 0;
  return data.reduce((s: number, r: any) => s + (Number(r[column]) || 0), 0);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminPanel() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { navigate } = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "ads" | "reports" | "transactions" | "categories">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({ open: false, title: "", message: "", action: async () => {} });
  const [editCategoryDialog, setEditCategoryDialog] = useState<{
    open: boolean;
    item: CategoryItem | null;
  }>({ open: false, item: null });
  const [creditsDialog, setCreditsDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: "", userName: "" });
  const [manualCredits, setManualCredits] = useState(10);
  const [cityViews, setCityViews] = useState<{city:string;views:number}[]>([]);
  const [topAds, setTopAds] = useState<{title:string;phone:string;city:string;views:number}[]>([]);

  useEffect(() => {
    if (!supabase || !isAdmin) return;
    (async () => {
      const { data } = await supabase.from("ads").select("city,views");
      if (data) {
        const map: Record<string,number> = {};
        data.forEach((a: any) => {
          const c = a.city || "Sconosciuta";
          map[c] = (map[c] || 0) + (a.views || 0);
        });
        setCityViews(Object.entries(map).map(([city, views]) => ({ city, views })).sort((a,b) => b.views - a.views));
      }
      const { data: top } = await supabase.from("ads").select("title,phone,views").order("views", { ascending: false }).limit(5);
      if (top) setTopAds(top as any);
    })();
  }, [isAdmin]);

  const totalViews = cityViews.reduce((s, c) => s + c.views, 0);

  const loadData = useCallback(async (tab?: string) => {
    if (!supabase) return;
    try {
      setLoading(true);
      setError(null);
      const currentTab = tab || activeTab;

      const promises: Promise<any>[] = [
        count("profiles"),
        count("ads"),
        count("ads", "is_active", true),
        count("ad_reports", "status", "pending"),
        count("transactions", "status", "completed"),
        (async () => {
          if (!supabase) return 0;
          const { data } = await supabase.from("transactions").select("amount").eq("status", "completed");
          if (!data) return 0;
          return data.reduce((s, r: any) => s + (Number(r.amount) || 0), 0);
        })(),
      ];

      if (currentTab === "users") {
        const q = supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        if (searchQuery) {
          q.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }
        promises.push(q.range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1).then(r => {
          setUsers((r.data || []) as UserRow[]);
          return r;
        }));
        const countQ = supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        if (searchQuery) {
          countQ.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }
        promises.push(countQ.then(r => setTotalItems(r.count ?? 0)));
      }

      if (currentTab === "ads") {
        const q = supabase
          .from("ads")
          .select("*, profiles(name,email)")
          .order("created_at", { ascending: false });
        if (searchQuery) {
          q.or(`title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
        }
        promises.push(q.range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1).then(r => {
          setAds((r.data || []) as AdRow[]);
          return r;
        }));
        const countQ = supabase
          .from("ads")
          .select("*", { count: "exact", head: true });
        if (searchQuery) {
          countQ.or(`title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
        }
        promises.push(countQ.then(r => setTotalItems(r.count ?? 0)));
      }

      if (currentTab === "reports") {
        promises.push(
          supabase
            .from("ad_reports")
            .select("*, ads(title,user_id), profiles(name,email)")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
            .then(r => {
              setReports((r.data || []) as unknown as ReportRow[]);
              return r;
            })
        );
        promises.push(
          supabase
            .from("ad_reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")
            .then(r => setTotalItems(r.count ?? 0))
        );
      }

      if (currentTab === "transactions") {
        promises.push(
          supabase
            .from("transactions")
            .select("*, profiles(name,email)")
            .order("created_at", { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
            .then(r => {
              setTransactions((r.data || []) as unknown as TransactionRow[]);
              return r;
            })
        );
        promises.push(
          supabase
            .from("transactions")
            .select("*", { count: "exact", head: true })
            .then(r => setTotalItems(r.count ?? 0))
        );
      }

      const [
        totalUsers, totalAds, activeAds, pendingReports,
        totalTransactions, totalRevenue,
      ] = await Promise.all(promises.slice(0, 6));

      const premiumCount = await count("profiles", "has_paid", true);

      setStats({
        totalUsers, totalAds, activeAds, pendingReports,
        totalTransactions, totalRevenue, premiumUsers: premiumCount,
      });
    } catch (e: any) {
      setError(e.message || "Errore caricamento dati admin");
      toast.error(e.message || "Errore caricamento dati admin");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, activeTab, page]);

  useEffect(() => {
    if (isAdmin) {
      setPage(0);
      loadData();
    }
  }, [searchQuery]);

  const showConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmDialog({ open: true, title, message, action });
  };

  const addCredits = async () => {
    if (!supabase || !creditsDialog.userId) return;
    try {
      const { error: rpcErr } = await supabase.rpc("increment_credits", {
        p_user_id: creditsDialog.userId,
        p_credits: manualCredits,
      });
      if (rpcErr) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", creditsDialog.userId)
          .single();
        const newCredits = (profile?.credits ?? 0) + manualCredits;
        const { error: updErr } = await supabase
          .from("profiles")
          .update({ credits: newCredits, has_paid: true })
          .eq("id", creditsDialog.userId);
        if (updErr) throw updErr;
      }
      toast.success(`${manualCredits} crediti aggiunti a ${creditsDialog.userName}`);
      setCreditsDialog({ open: false, userId: "", userName: "" });
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiunta crediti");
    }
  };

  const toggleAdmin = async (userId: string, isAdminUser: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("profiles").update({ is_admin: !isAdminUser }).eq("id", userId);
      if (error) throw error;
      toast.success(`Ruolo aggiornato: ${!isAdminUser ? "Admin" : "User"}`);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiornamento ruolo");
    }
  };

  const deactivateUserAds = async (userId: string, userName: string) => {
    if (!supabase) return;
    showConfirm(
      "Disattiva annunci utente",
      `Disattivare tutti gli annunci di "${userName}"?`,
      async () => {
        const { error } = await supabase
          .from("ads")
          .update({ is_active: false })
          .eq("user_id", userId);
        if (error) throw error;
        toast.success(`Annunci di "${userName}" disattivati`);
        setConfirmDialog(d => ({ ...d, open: false }));
        loadData();
      },
    );
  };

  const toggleAdStatus = async (adId: string, isActive: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("ads").update({ is_active: !isActive }).eq("id", adId);
      if (error) throw error;
      toast.success(isActive ? "Annuncio disattivato" : "Annuncio riattivato");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiornamento annuncio");
    }
  };

  const toggleFeatured = async (adId: string, isSponsored: boolean) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("ads").update({ is_sponsored: !isSponsored }).eq("id", adId);
      if (error) throw error;
      toast.success(isSponsored ? "Sponsorizzazione rimossa" : "Annuncio sponsorizzato");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiornamento annuncio");
    }
  };

  const deleteAd = async (adId: string, adTitle: string) => {
    if (!supabase) return;
    showConfirm(
      "Elimina annuncio",
      `Sei sicuro di voler eliminare definitivamente "${adTitle}"? Questa azione non può essere annullata.`,
      async () => {
        const { error } = await supabase.from("ads").delete().eq("id", adId);
        if (error) throw error;
        toast.success("Annuncio eliminato");
        setConfirmDialog(d => ({ ...d, open: false }));
        loadData();
      },
    );
  };

  const handleReport = async (reportId: string, status: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("ad_reports").update({ status }).eq("id", reportId);
      if (error) throw error;
      toast.success(status === "dismissed" ? "Segnalazione ignorata" : "Segnalazione confermata");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiornamento segnalazione");
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Accesso negato</h2>
          <p className="text-muted-foreground mb-4">Solo gli amministratori possono accedere a questa pagina.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Dashboard", icon: PanelTop },
    { id: "users" as const, label: "Utenti", icon: Users },
    { id: "ads" as const, label: "Annunci", icon: Store },
    { id: "reports" as const, label: "Segnalazioni", icon: Flag },
    { id: "transactions" as const, label: "Transazioni", icon: DollarSign },
    { id: "categories" as const, label: "Categorie", icon: Tag },
  ];

  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline" size="sm"
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Pagina {page + 1} di {totalPages}
        </span>
        <Button
          variant="outline" size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna agli annunci
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Pannello Admin</span>
            <Button variant="outline" size="icon" className="ml-2" onClick={() => loadData()} title="Aggiorna">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(0);
                  setSearchQuery("");
                }}
              >
                <Icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <XCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
            <p className="text-destructive font-medium mb-4">{error}</p>
            <Button onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Riprova
            </Button>
          </Card>
        ) : (
          <>
            {activeTab === "overview" && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utenti totali</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><Store className="w-6 h-6 text-green-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annunci totali</p>
                      <p className="text-2xl font-bold">{stats.totalAds}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Eye className="w-6 h-6 text-purple-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annunci attivi</p>
                      <p className="text-2xl font-bold">{stats.activeAds}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg"><Eye className="w-6 h-6 text-orange-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utenti Premium</p>
                      <p className="text-2xl font-bold">{stats.premiumUsers}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"><Flag className="w-6 h-6 text-red-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Segnalazioni pending</p>
                      <p className="text-2xl font-bold">{stats.pendingReports}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><DollarSign className="w-6 h-6 text-yellow-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transazioni</p>
                      <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><DollarSign className="w-6 h-6 text-emerald-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fatturato totale</p>
                      <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            {activeTab === "overview" && stats && cityViews.length > 0 && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Eye className="w-4 h-4" />Visualizzazioni per città</h3>
                  <div className="space-y-3">
                    {cityViews.map(({ city, views }) => (
                      <div key={city} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{city}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(views / (totalViews || 1)) * 100}%` }} />
                          </div>
                          <span className="text-sm font-bold w-16 text-right">{views.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-semibold">Totale</span>
                      <span className="text-sm font-bold">{totalViews.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Star className="w-4 h-4" />Annunci più visti</h3>
                  <div className="space-y-3">
                    {topAds.map((ad, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate flex-1">{ad.title?.substring(0, 40)}...</span>
                        <span className="text-xs text-muted-foreground">{ad.phone}</span>
                        <span className="text-sm font-bold w-12 text-right">{ad.views}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "users" && (
              <>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Cerca utenti per nome o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                {users.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nessun utente trovato</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {users.map((u) => (
                      <Card key={u.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{u.name}</p>
                              {u.is_admin && <Badge variant="default" className="shrink-0">Admin</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <Badge variant={u.has_paid ? "default" : "secondary"} className={`text-xs ${u.has_paid ? "bg-amber-500 hover:bg-amber-600 border-0" : ""}`}>
                                {u.has_paid ? "Premium" : "Gratuito"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{u.credits} crediti</Badge>
                              <Badge variant="outline" className="text-xs">{u.ads_count || 0} annunci</Badge>
                              <Badge variant="outline" className="text-xs">{formatDate(u.created_at)}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Button
                              variant={u.is_admin ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleAdmin(u.id, u.is_admin)}
                              title={u.is_admin ? "Rimuovi admin" : "Rendi admin"}
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              {u.is_admin ? "Admin" : "User"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deactivateUserAds(u.id, u.name)}
                              title="Disattiva tutti gli annunci"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setManualCredits(10); setCreditsDialog({ open: true, userId: u.id, userName: u.name }); }}
                              title="Aggiungi crediti"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <Pagination />
              </>
            )}

            {activeTab === "ads" && (
              <>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Cerca annunci per titolo o città..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                  <Select value="all" onValueChange={() => {}}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="active">Attivi</SelectItem>
                      <SelectItem value="inactive">Disattivati</SelectItem>
                      <SelectItem value="sponsored">Sponsorizzati</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {ads.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Store className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nessun annuncio trovato</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {ads.map((ad) => (
                      <Card key={ad.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{ad.title}</p>
                              {ad.is_sponsored && <Badge variant="default" className="shrink-0 bg-amber-500 hover:bg-amber-600">Sponsor</Badge>}
                              {(ad.is_premium || ad.has_paid) && <Badge variant="secondary" className="shrink-0">Premium</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {ad.city} · {ad.category} · {ad.views} views
                              {ad.profiles?.name ? ` · ${ad.profiles.name}` : ""}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <Badge variant={ad.is_active ? "default" : "destructive"} className="text-xs">
                                {ad.is_active ? "Attivo" : "Disattivato"}
                              </Badge>
                              {ad.is_verified && <Badge variant="outline" className="text-xs">Verificato</Badge>}
                              <Badge variant="outline" className="text-xs">{formatDate(ad.created_at)}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/ad/${ad.title?.toLowerCase().replace(/\s+/g, "-")}-${ad.id}`)}
                              title="Vedi annuncio"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={ad.is_sponsored ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleFeatured(ad.id, ad.is_sponsored)}
                              title={ad.is_sponsored ? "Rimuovi sponsor" : "Sponsorizza"}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={ad.is_active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                              title={ad.is_active ? "Disattiva" : "Attiva"}
                            >
                              {ad.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteAd(ad.id, ad.title)}
                              title="Elimina annuncio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <Pagination />
              </>
            )}

            {activeTab === "reports" && (
              <>
                {reports.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <p className="text-muted-foreground">Nessuna segnalazione pending</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <Card key={report.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">
                              Annuncio: {report.ads?.title || <span className="text-muted-foreground">Sconosciuto</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Segnalato da: {report.profiles?.name || "Anonimo"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Pending</Badge>
                            <Badge variant="outline">{formatDate(report.created_at)}</Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-4 bg-muted p-2 rounded whitespace-pre-wrap">{report.reason}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleReport(report.id, "dismissed")}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Ignora
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReport(report.id, "reviewed")}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Conferma
                          </Button>
                          {report.ads?.title && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const ad = ads.find(a => a.id === report.ad_id);
                                if (ad) toggleAdStatus(ad.id, ad.is_active);
                              }}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Disattiva annuncio
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <Pagination />
              </>
            )}

            {activeTab === "transactions" && (
              <>
                {transactions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nessuna transazione trovata</p>
                  </Card>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Utente</TableHead>
                          <TableHead>Importo</TableHead>
                          <TableHead>Crediti</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>ID Sessione Stripe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="whitespace-nowrap">{formatDate(tx.created_at)}</TableCell>
                            <TableCell>{tx.profiles?.name || tx.user_id?.slice(0, 8) || "—"}</TableCell>
                            <TableCell>€{Number(tx.amount).toFixed(2)}</TableCell>
                            <TableCell>{tx.credits}</TableCell>
                            <TableCell>
                              <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                                {tx.status === "completed" ? "Completato" : tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[120px] truncate" title={tx.stripe_session_id}>
                              {tx.stripe_session_id?.slice(0, 16) || "—"}...
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <Pagination />
              </>
            )}

            {activeTab === "categories" && (
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Tag className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nessuna categoria</p>
                  </Card>
                ) : (
                  categories.map((cat) => {
                    const adCount = ads.filter(a => a.category === cat.id).length;
                    return (
                      <Card key={cat.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{cat.icon}</span>
                            <div>
                              <p className="font-medium">{cat.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {cat.id} · {adCount} annunci
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{cat.id}</Badge>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(d => ({ ...d, open: false }))}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmDialog.action}>
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creditsDialog.open} onOpenChange={(open) => setCreditsDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi crediti</DialogTitle>
            <DialogDescription>Quanti crediti aggiungere a {creditsDialog.userName}?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              min={1}
              value={manualCredits}
              onChange={(e) => setManualCredits(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreditsDialog({ open: false, userId: "", userName: "" })}>
              Annulla
            </Button>
            <Button onClick={addCredits}>
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi {manualCredits} crediti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
