import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/hooks/useRouter";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft, Eye, Crown, Store, Pencil, Trash2, Plus, Loader2, Zap, Coins, Clock, User, Phone, Mail, Save, X, LogOut, Sparkles, Package
} from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string;
  city: string;
  age: number | null;
  image: string | null;
  category: string;
  price?: string | null;
  is_active: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  views: number;
  created_at: string;
  boosted_until?: string | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function getToken() {
  if (!supabase) return "";
  const session = (await supabase.auth.getSession()).data.session;
  return session?.access_token || "";
}

const BOOST_OPTIONS = [
  { days: 1, credits: 10, label: "Vetrina 1g", icon: Store, type: "vetrina" as const },
  { days: 3, credits: 25, label: "Vetrina 3g", icon: Store, type: "vetrina" as const },
  { days: 7, credits: 50, label: "Vetrina 7g", icon: Store, type: "vetrina" as const },
  { days: 30, credits: 10, label: "Premium", icon: Crown, type: "premium" as const },
];

export default function Profile() {
  const { user, loading: authLoading, logout, updateUser } = useAuth();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<"ads" | "info">("info");
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [busyBoost, setBusyBoost] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", city: "", price: "", image: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || "", phone: (user as any).phone || "" });
    }
  }, [user]);

  const loadAds = useCallback(async () => {
    if (!user) { setLoadingAds(false); return; }
    try {
      setLoadingAds(true);
      const token = await getToken();
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/ads?select=*&user_id=eq.${user.id}&order=created_at.desc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Errore caricamento");
      const data = await res.json();
      setAds(data || []);
    } catch {
      toast.error("Errore caricamento annunci");
    } finally {
      setLoadingAds(false);
    }
  }, [user]);

  useEffect(() => { if (activeTab === "ads") loadAds(); }, [activeTab, loadAds]);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      if (!supabase) throw new Error("Supabase non configurato");
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Non autenticato");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${user!.id}`, {
        method: "PATCH",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone || null,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Errore aggiornamento");
      updateUser({ name: profileForm.name });
      (user as any).phone = profileForm.phone;
      toast.success("Profilo aggiornato!");
      setEditingProfile(false);
    } catch {
      toast.error("Errore aggiornamento profilo");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBoost = async (adId: string, credits: number, days: number, type: "vetrina" | "premium") => {
    try {
      setBusyBoost(adId + type + days);
      if (!user || (user.credits || 0) < credits) {
        toast.error("Crediti insufficienti");
        return;
      }
      const token = await getToken();
      const boostedUntil = new Date(Date.now() + days * 86400000).toISOString();
      const updates: Record<string, any> = { boosted_until: boostedUntil };
      if (type === "premium") updates.is_premium = true;
      else updates.is_sponsored = true;
      const adRes = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${adId}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(updates),
      });
      if (!adRes.ok) throw new Error("Errore aggiornamento");
      const newCredits = (user.credits || 0) - credits;
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ credits: newCredits }),
      });
      updateUser({ credits: newCredits });
      toast.success(`Annuncio potenziato! ${days} giorni`);
      loadAds();
    } catch (e: any) {
      toast.error(e?.message || "Errore boost");
    } finally {
      setBusyBoost(null);
    }
  };

  const startEdit = (ad: Ad) => {
    setEditingAd(ad);
    setEditForm({
      title: ad.title, description: ad.description, city: ad.city,
      price: ad.price || "", image: ad.image || "",
    });
  };

  const saveEdit = async () => {
    if (!editingAd) return;
    try {
      setSavingEdit(true);
      const token = await getToken();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${editingAd.id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Errore salvataggio");
      toast.success("Annuncio aggiornato!");
      setEditingAd(null);
      loadAds();
    } catch (e: any) {
      toast.error(e?.message || "Errore salvataggio");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const token = await getToken();
      await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${deleteTarget.id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      });
      toast.success("Annuncio eliminato");
      setDeleteTarget(null);
      loadAds();
    } catch {
      toast.error("Errore eliminazione");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <p className="mb-4 text-muted-foreground">Accedi per vedere il tuo profilo</p>
          <Button onClick={() => navigate("/")}>Torna alla Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
          <Button variant="ghost" onClick={logout} className="gap-2 text-destructive">
            <LogOut className="w-4 h-4" />
            Esci
          </Button>
        </div>

        {/* Profilo Card */}
        <Card className="p-6 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold font-poppins">{user.name}</h1>
                {user.is_admin && <Badge className="bg-purple-500">Admin</Badge>}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
              {(user as any).phone && (
                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {(user as any).phone}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center px-4 py-2 bg-primary/10 rounded-xl">
                <p className="text-2xl font-bold text-primary">{user.credits || 0}</p>
                <p className="text-xs text-muted-foreground">crediti</p>
              </div>
            </div>
          </div>

          {editingProfile ? (
            <div className="mt-6 pt-6 border-t space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome</label>
                <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Telefono</label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+39 333 1234567" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingProfile(false)} className="gap-2">
                  <X className="w-4 h-4" /> Annulla
                </Button>
                <Button onClick={saveProfile} disabled={savingProfile} className="gap-2">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salva
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="gap-2">
                <Pencil className="w-4 h-4" /> Modifica Profilo
              </Button>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "info" ? "default" : "outline"}
            onClick={() => setActiveTab("info")}
            className="gap-2"
          >
            <User className="w-4 h-4" /> Profilo
          </Button>
          <Button
            variant={activeTab === "ads" ? "default" : "outline"}
            onClick={() => setActiveTab("ads")}
            className="gap-2"
          >
            <Package className="w-4 h-4" /> I miei annunci {ads.length > 0 && `(${ads.length})`}
          </Button>
        </div>

        {/* Ads Tab */}
        {activeTab === "ads" && (
          <>
            {loadingAds ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : ads.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Non hai ancora pubblicato annunci</p>
                <Button onClick={() => navigate("/")} className="gap-2">
                  <Plus className="w-4 h-4" /> Pubblica il primo annuncio
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map((ad) => (
                  <Card key={ad.id} className="overflow-hidden">
                    <div className="relative aspect-video bg-muted">
                      {ad.image ? (
                        <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          Nessuna immagine
                        </div>
                      )}
                      {ad.is_premium && <Badge className="absolute top-2 left-2 bg-yellow-500"><Crown className="w-3 h-3 mr-1" />Premium</Badge>}
                      {ad.is_sponsored && <Badge className="absolute top-2 right-2 bg-purple-500"><Zap className="w-3 h-3 mr-1" />Sponsorizzato</Badge>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground">{ad.city}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 mb-3">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{ad.views}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(ad.created_at).toLocaleDateString("it-IT")}</span>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => startEdit(ad)}>
                          <Pencil className="w-3 h-3" /> Modifica
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-destructive" onClick={() => setDeleteTarget(ad)}>
                          <Trash2 className="w-3 h-3" /> Elimina
                        </Button>
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium mb-2">Potenzia:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {BOOST_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isBusy = busyBoost === ad.id + opt.type + opt.days;
                            return (
                              <Button key={opt.type + opt.days} variant="outline" size="sm"
                                className="gap-1 text-xs" onClick={() => handleBoost(ad.id, opt.credits, opt.days, opt.type)}
                                disabled={isBusy || (user.credits || 0) < opt.credits}>
                                {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                                {opt.label} ({opt.credits}c)
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Tab */}
        {activeTab === "info" && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Riepilogo Account
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Telefono</span>
                <span>{(user as any).phone || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Crediti</span>
                <span className="font-bold text-primary">{user.credits || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Tipo account</span>
                <span>{user.has_paid ? <Badge className="bg-amber-500">Premium</Badge> : "Gratuito"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Annunci pubblicati</span>
                <span>{user.ads_count || 0}</span>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/shop")}>
                <Coins className="w-4 h-4" /> Acquista crediti
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Ad Dialog */}
      {editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Modifica annuncio</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titolo</label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descrizione</label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Città</label>
                <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Prezzo</label>
                <Input value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Immagine URL</label>
                <Input value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingAd(null)}>Annulla</Button>
              <Button onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salva"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo annuncio?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione è permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
