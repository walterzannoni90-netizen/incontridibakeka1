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
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/hooks/useRouter";
import {
  ArrowLeft,
  Eye,
  Crown,
  Store,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Zap,
  Coins,
  Clock,
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
  boost_type?: string | null;
  boost_start_at?: string | null;
  boost_end_at?: string | null;
}

type BoostOption = {
  type: "premium" | "vetrina";
  days: number;
  credits: number;
  label: string;
  icon: typeof Crown;
};

const BOOST_OPTIONS: BoostOption[] = [
  { type: "premium", days: 30, credits: 10, label: "Rendi Premium", icon: Crown },
  { type: "vetrina", days: 1, credits: 10, label: "Metti in vetrina 1 giorno", icon: Store },
  { type: "vetrina", days: 3, credits: 25, label: "Metti in vetrina 3 giorni", icon: Store },
  { type: "vetrina", days: 7, credits: 50, label: "Metti in vetrina 7 giorni", icon: Store },
];

export default function MyAds() {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const { get, patch, delete: deleteAd } = useApi();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [busyBoost, setBusyBoost] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", city: "", price: "", image: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAds = useCallback(async () => {
    if (!user) {
      setLoadingAds(false);
      return;
    }
    try {
      setLoadingAds(true);
      const data = await get("/api/ads/my/ads");
      setAds(data.ads || []);
    } catch (e) {
      console.error("Errore caricamento annunci:", e);
      toast.error("Errore caricamento annunci");
    } finally {
      setLoadingAds(false);
    }
  }, [user, get]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleBoost = async (adId: string, option: BoostOption) => {
    try {
      setBusyBoost(adId + option.type + option.days);
      const result = await patch(`/api/ads/${adId}/boost`, {
        type: option.type,
        duration_days: option.days,
        credits: option.credits,
      });
      toast.success(result.message || "Boost applicato!");
      loadAds();
    } catch (e: any) {
      toast.error(e.message || "Errore durante il boost");
    } finally {
      setBusyBoost(null);
    }
  };

  const startEdit = (ad: Ad) => {
    setEditingAd(ad);
    setEditForm({
      title: ad.title,
      description: ad.description,
      city: ad.city,
      price: ad.price || "",
      image: ad.image || "",
    });
  };

  const saveEdit = async () => {
    if (!editingAd) return;
    try {
      setSavingEdit(true);
      await patch(`/api/ads/${editingAd.id}`, editForm);
      toast.success("Annuncio aggiornato!");
      setEditingAd(null);
      loadAds();
    } catch (e: any) {
      toast.error(e.message || "Errore salvataggio");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteAd(`/api/ads/${deleteTarget.id}`);
      toast.success("Annuncio eliminato");
      setDeleteTarget(null);
      loadAds();
    } catch (e: any) {
      toast.error(e.message || "Errore eliminazione");
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
          <div className="text-4xl mb-4">🔐</div>
          <p className="mb-4 text-muted-foreground">Accedi per gestire i tuoi annunci</p>
          <Button onClick={() => navigate("/")}>Torna alla Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna agli annunci
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{user.credits || 0} crediti</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">I miei annunci</h1>
        <p className="text-muted-foreground mb-8">Gestisci e potenzia i tuoi annunci</p>

        {loadingAds ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-muted-foreground mb-4">Non hai ancora pubblicato annunci</p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Plus className="w-4 h-4" />
              Pubblica il primo annuncio
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Card key={ad.id} className="p-4 overflow-hidden">
                <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-muted">
                  {ad.image ? (
                    <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Nessuna immagine
                    </div>
                  )}
                  {ad.is_premium && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {ad.is_sponsored && (
                    <Badge className="absolute top-2 right-2 bg-purple-500">
                      <Zap className="w-3 h-3 mr-1" />
                      Sponsored
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold mb-1 truncate">{ad.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{ad.city}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {ad.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(ad.created_at).toLocaleDateString("it-IT")}
                  </span>
                </div>

                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => startEdit(ad)}>
                    <Pencil className="w-3 h-3" />
                    Modifica
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1 text-destructive" onClick={() => setDeleteTarget(ad)}>
                    <Trash2 className="w-3 h-3" />
                    Elimina
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Potenzia:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BOOST_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isBusy = busyBoost === ad.id + opt.type + opt.days;
                      return (
                        <Button
                          key={opt.type + opt.days}
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => handleBoost(ad.id, opt)}
                          disabled={isBusy || (user.credits || 0) < opt.credits}
                        >
                          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                          {opt.label} ({opt.credits}c)
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
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
              <Button variant="outline" className="flex-1" onClick={() => setEditingAd(null)}>Annulla</Button>
              <Button className="flex-1" onClick={saveEdit} disabled={savingEdit}>
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
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà permanentemente l'annuncio "{deleteTarget?.title}". Non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
