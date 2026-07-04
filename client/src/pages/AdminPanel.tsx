import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/hooks/useRouter";
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
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingReports: number;
  totalTransactions: number;
  totalRevenue: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  credits: number;
  has_paid: boolean;
  ads_count: number;
  created_at: string;
}

interface Ad {
  id: string;
  title: string;
  city: string;
  user_id: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  views: number;
}

interface Report {
  id: string;
  ad_id: string;
  reason: string;
  status: string;
  created_at: string;
  ads?: { title: string };
  profiles?: { name: string; email: string };
}

export default function AdminPanel() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const { get, patch } = useApi();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "ads" | "reports">("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, usersData, adsData, reportsData] = await Promise.all([
        get("/api/admin/stats"),
        get("/api/admin/users"),
        get("/api/admin/ads"),
        get("/api/admin/reports"),
      ]);
      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setAds(adsData.ads || []);
      setReports(reportsData.reports || []);
    } catch (e: any) {
      toast.error(e.message || "Errore caricamento dati admin");
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await patch(`/api/admin/users/${userId}/admin`, { is_admin: !isAdmin });
      toast.success("Ruolo aggiornato");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiornamento ruolo");
    }
  };

  const toggleAdStatus = async (adId: string, isActive: boolean) => {
    try {
      await patch(`/api/admin/ads/${adId}/status`, { is_active: !isActive });
      toast.success("Stato annuncio aggiornato");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiornamento annuncio");
    }
  };

  const handleReport = async (reportId: string, status: string) => {
    try {
      await patch(`/api/admin/reports/${reportId}`, { status });
      toast.success("Segnalazione aggiornata");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Errore aggiornamento segnalazione");
    }
  };

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

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAds = ads.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(["overview", "users", "ads", "reports"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab === "overview" && <DollarSign className="w-4 h-4 mr-1" />}
              {tab === "users" && <Users className="w-4 h-4 mr-1" />}
              {tab === "ads" && <Store className="w-4 h-4 mr-1" />}
              {tab === "reports" && <Flag className="w-4 h-4 mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utenti totali</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg"><Store className="w-6 h-6 text-green-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annunci totali</p>
                      <p className="text-2xl font-bold">{stats.totalAds}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg"><Eye className="w-6 h-6 text-purple-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annunci attivi</p>
                      <p className="text-2xl font-bold">{stats.activeAds}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-lg"><Flag className="w-6 h-6 text-red-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Segnalazioni pending</p>
                      <p className="text-2xl font-bold">{stats.pendingReports}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-lg"><DollarSign className="w-6 h-6 text-yellow-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transazioni</p>
                      <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg"><DollarSign className="w-6 h-6 text-emerald-600" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fatturato totale</p>
                      <p className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "users" && (
              <>
                <div className="mb-4">
                  <Input
                    placeholder="Cerca utenti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <Card key={u.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={u.has_paid ? "default" : "secondary"}>
                            {u.has_paid ? "Pagante" : "Gratuito"}
                          </Badge>
                          <Badge variant="outline">{u.credits} crediti</Badge>
                        </div>
                      </div>
                      <Button
                        variant={u.is_admin ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        {u.is_admin ? "Admin" : "User"}
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {activeTab === "ads" && (
              <>
                <div className="mb-4">
                  <Input
                    placeholder="Cerca annunci..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  {filteredAds.map((ad) => (
                    <Card key={ad.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{ad.title}</p>
                        <p className="text-sm text-muted-foreground">{ad.city} · {ad.views} views</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={ad.is_active ? "default" : "destructive"}>
                            {ad.is_active ? "Attivo" : "Disattivato"}
                          </Badge>
                          {ad.is_verified && <Badge variant="outline">Verificato</Badge>}
                        </div>
                      </div>
                      <Button
                        variant={ad.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                      >
                        {ad.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {activeTab === "reports" && (
              <div className="space-y-2">
                {reports.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <p className="text-muted-foreground">Nessuna segnalazione pending</p>
                  </Card>
                ) : (
                  reports.map((report) => (
                    <Card key={report.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Annuncio: {report.ads?.title || "Sconosciuto"}</p>
                          <p className="text-sm text-muted-foreground">
                            Segnalato da: {report.profiles?.name || "Anonimo"}
                          </p>
                        </div>
                        <Badge variant="destructive">Pending</Badge>
                      </div>
                      <p className="text-sm mb-4 bg-muted p-2 rounded">{report.reason}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleReport(report.id, "dismissed")}>
                          <XCircle className="w-4 h-4 mr-1" />
                          Ignora
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReport(report.id, "reviewed")}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Conferma
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
