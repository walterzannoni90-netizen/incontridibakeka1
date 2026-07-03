import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { useRouter } from "@/hooks/useRouter";
import { ArrowLeft, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  user_id: string;
  city: string;
  is_active: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  is_verified: boolean;
  credits: number;
}

export default function AdminPanel() {
  const { isAdmin, logout } = useAuth();
  const { get, patch, delete: deleteRecord } = useSupabase();
  const { navigate } = useRouter();
  const { token: authToken } = useAuth();

  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAds, setSearchAds] = useState("");
  const [searchUsers, setSearchUsers] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [adsData, usersData] = await Promise.all([
        get("ads", "select=*&order=created_at.desc"),
        get("profiles", "select=*&order=created_at.desc"),
      ]);
      setAds(adsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Errore caricamento dati admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdActive = async (adId: string, currentActive: boolean) => {
    try {
      await patch(
        "ads",
        { is_active: !currentActive },
        { id: adId },
        authToken || undefined
      );
      loadData();
    } catch (error) {
      console.error("Errore toggle ad:", error);
    }
  };

  const handleTogglePremium = async (adId: string, currentPremium: boolean) => {
    try {
      await patch(
        "ads",
        { is_premium: !currentPremium },
        { id: adId },
        authToken || undefined
      );
      loadData();
    } catch (error) {
      console.error("Errore toggle premium:", error);
    }
  };

  const handleToggleSponsored = async (
    adId: string,
    currentSponsored: boolean
  ) => {
    try {
      await patch(
        "ads",
        { is_sponsored: !currentSponsored },
        { id: adId },
        authToken || undefined
      );
      loadData();
    } catch (error) {
      console.error("Errore toggle sponsored:", error);
    }
  };

  const handleDeleteAd = async (adId: string, title: string) => {
    if (!confirm(`Eliminare l'annuncio "${title}"?`)) return;
    try {
      await deleteRecord("ads", { id: adId }, authToken || undefined);
      loadData();
    } catch (error) {
      console.error("Errore eliminazione ad:", error);
    }
  };

  const handleVerifyUser = async (userId: string, currentVerified: boolean) => {
    try {
      await patch(
        "profiles",
        { is_verified: !currentVerified },
        { id: userId },
        authToken || undefined
      );
      loadData();
    } catch (error) {
      console.error("Errore toggle verified:", error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Eliminare l'utente "${userName}"?`)) return;
    try {
      await deleteRecord("profiles", { id: userId }, authToken || undefined);
      loadData();
    } catch (error) {
      console.error("Errore eliminazione user:", error);
    }
  };

  const filteredAds = ads.filter((ad) =>
    ad.title.toLowerCase().includes(searchAds.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p>Caricamento panel admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Button>
            <h1 className="text-2xl font-bold font-poppins">Panel Admin</h1>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="gap-2"
          >
            Esci
          </Button>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Annunci Totali</p>
            <p className="text-3xl font-bold text-primary">{ads.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Annunci Attivi</p>
            <p className="text-3xl font-bold text-green-600">
              {ads.filter((a) => a.is_active).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Premium</p>
            <p className="text-3xl font-bold text-accent">
              {ads.filter((a) => a.is_premium).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Utenti Totali</p>
            <p className="text-3xl font-bold text-secondary">
              {users.length}
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ads" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ads">Annunci ({ads.length})</TabsTrigger>
            <TabsTrigger value="users">Utenti ({users.length})</TabsTrigger>
          </TabsList>

          {/* ADS TAB */}
          <TabsContent value="ads" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Cerca annuncio..."
                value={searchAds}
                onChange={(e) => setSearchAds(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Titolo</th>
                    <th className="px-4 py-2 text-left">Città</th>
                    <th className="px-4 py-2 text-center">Stato</th>
                    <th className="px-4 py-2 text-center">Premium</th>
                    <th className="px-4 py-2 text-center">Sponsor</th>
                    <th className="px-4 py-2 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad) => (
                    <tr key={ad.id} className="border-b border-border">
                      <td className="px-4 py-3">
                        <span className="font-medium">{ad.title}</span>
                      </td>
                      <td className="px-4 py-3">{ad.city}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleAdActive(ad.id, ad.is_active)
                          }
                          className="inline-flex items-center justify-center"
                        >
                          {ad.is_active ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleTogglePremium(ad.id, ad.is_premium)
                          }
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            ad.is_premium
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          👑
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleSponsored(ad.id, ad.is_sponsored)
                          }
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            ad.is_sponsored
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          ⭐
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAd(ad.id, ad.title)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Cerca utente..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-center">Verificato</th>
                    <th className="px-4 py-2 text-right">Crediti</th>
                    <th className="px-4 py-2 text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border">
                      <td className="px-4 py-3">
                        <span className="font-medium">{user.email}</span>
                      </td>
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleVerifyUser(user.id, user.is_verified)
                          }
                          className="inline-flex items-center justify-center"
                        >
                          {user.is_verified ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {user.credits}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
