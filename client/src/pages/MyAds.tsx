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
import { useSupabase } from "@/hooks/useSupabase";
import { useRouter } from "@/hooks/useRouter";
import { slugify } from "@shared/data";
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_CONFIGURED =
  SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project");

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
  const { user, token, loading } = useAuth();
  const { navigate } = useRouter();
  const { get, patch, delete: deleteAd } = useSupabase();

  const [ads, setAds] = useState<Ad[]>([]);
  const [credits, setCredits] = useState<number>(user?.credits || 0);
  const [loadingAds, setLoadingAds] = useState(true);
  const [busyBoost, setBusyBoost] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", city: "", price: "", image: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAds = useCallback(async () => {
    if (!user || !token || !SUPABASE_CONFIGURED) {
      setLoadingAds(false);
      return;
    }
    try {
      const data = await get(
        "ads",
        `select=*&user_id=eq.${user.id}&order=created_at.desc`,
        token
      );
      setAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Errore caricamento annunci:", error);
      toast.error("Impossibile caricare i tuoi annunci", {
        description: error instanceof Error ? error.message : undefined,
      });
      setAds([]);
    } finally {
      setLoadingAds(false);
    }
  }, [user, token, get]);

  const refreshCredits = useCallback(async () => {
    if (!user || !token || !SUPABASE_CONFIGURED) return;
    try {
      const data = await get("profiles", `select=credits&id=eq.${user.id}`, token);
      if (Array.isArray(data) && data[0]?.credits != null) {
        setCredits(data[0].credits);
      }
    } catch (error) {
      console.error("Errore lettura crediti:", error);
    }
  }, [user, token, get]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/");
      return;
    }
    loadAds();
    refreshCredits();
  }, [user, loading, loadAds, refreshCredits, navigate]);

  // Redirect non autenticati
  if (loading || (!user && !loading)) {
    if (!loading && !user) {
      // navigate gia chiamato nell'effetto, mostra un loader nel frattempo
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-muted-foreground">Caricamento…</p>
        </Card>
      </div>
    );
  }

  const isBoostActive = (ad: Ad) => {
    if (!ad.boost_end_at) return false;
    return new Date(ad.boost_end_at).getTime() > Date.now();
  };

  const boostBadge = (ad: Ad) => {
    if (!isBoostActive(ad)) return null;
    if (ad.boost_type === "premium") {
      return (
        <Badge className="bg-primary text-primary-foreground gap-1">
          <Crown className="w-3 h-3" /> Premium
        </Badge>
      );
    }
    if (ad.boost_type === "vetrina") {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(ad.boost_end_at!).getTime() - Date.now()) / 86400000)
      );
      return (
        <Badge className="bg-accent text-accent-foreground gap-1">
          <Store className="w-3 h-3" /> Vetrina {remaining}g
        </Badge>
      );
    }
    return null;
  };

  const handleBoost = async (ad: Ad, option: BoostOption) => {
    if (!user || !token) {
      toast.error("Devi essere autenticato.");
      return;
    }
    if (!SUPABASE_CONFIGURED) {
      toast.error("Database non configurato.");
      return;
    }

    // Leggi i crediti piu aggiornati per evitare discrepanze
    let currentCredits = credits;
    try {
      const data = await get("profiles", `select=credits&id=eq.${user.id}`, token);
      if (Array.isArray(data) && data[0]?.credits != null) {
        currentCredits = data[0].credits;
      }
    } catch (error) {
      console.error("Errore lettura crediti:", error);
    }

    if (currentCredits < option.credits) {
      toast.error("Crediti insufficienti", {
        description: `Servono ${option.credits} crediti, ne hai ${currentCredits}.`,
        action: {
          label: "Vai allo Shop",
          onClick: () => navigate("/shop"),
        },
      });
      return;
    }

    setBusyBoost(`${ad.id}-${option.label}`);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + option.days * 86400000);

      const patchData: Record<string, unknown> = {
        boost_type: option.type,
        boost_start_at: now.toISOString(),
        boost_end_at: end.toISOString(),
      };
      // Aggiorna anche i flag gia presenti nello schema per renderli visibili subito
      if (option.type === "premium") patchData.is_premium = true;
      if (option.type === "vetrina") patchData.is_sponsored = true;

      const [updatedAd] = await patch("ads", patchData, { id: ad.id }, token);

      // Scala i crediti
      const newCredits = currentCredits - option.credits;
      await patch("profiles", { credits: newCredits }, { id: user.id }, token);

      setCredits(newCredits);
      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, ...(updatedAd || patchData) } : a))
      );

      toast.success(`${option.label} attivato!`, {
        description: `Spesi ${option.credits} crediti. Crediti rimasti: ${newCredits}.`,
      });
    } catch (error) {
      console.error("Errore boost:", error);
      toast.error("Impossibile attivare il boost", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusyBoost(null);
    }
  };

  const openEdit = (ad: Ad) => {
    setEditingAd(ad);
    setEditForm({
      title: ad.title || "",
      description: ad.description || "",
      city: ad.city || "",
      price: ad.price || "",
      image: ad.image || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAd || !token) return;
    if (!editForm.title.trim()) {
      toast.error("Il titolo e obbligatorio.");
      return;
    }
    setSavingEdit(true);
    try {
      const [updated] = await patch(
        "ads",
        {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          city: editForm.city.trim() || "Roma",
          price: editForm.price.trim() || null,
          image: editForm.image.trim() || null,
        },
        { id: editingAd.id },
        token
      );
      setAds((prev) =>
        prev.map((a) => (a.id === editingAd.id ? { ...a, ...(updated || {}) } : a))
      );
      setEditingAd(null);
      toast.success("Annuncio aggiornato.");
    } catch (error) {
      console.error("Errore salvataggio:", error);
      toast.error("Salvataggio non riuscito", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      await deleteAd("ads", { id: deleteTarget.id }, token);
      setAds((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success("Annuncio eliminato.");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Errore eliminazione:", error);
      toast.error("Eliminazione non riuscita", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/shop")}
              className="gap-1.5"
            >
              <Coins className="w-4 h-4 text-accent" />
              <span className="font-semibold">{credits}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">crediti</span>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/")}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Pubblica nuovo annuncio</span>
              <span className="sm:hidden">Nuovo</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold font-poppins mb-2">I miei annunci</h1>
            <p className="text-muted-foreground">
              Gestisci, potenzia e monitora i tuoi annunci pubblicati.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-accent/10 text-accent font-bold px-4 py-2 rounded-full">
              <Zap className="w-5 h-5" />
              Crediti attuali: {credits}
            </div>
          </div>

          {!SUPABASE_CONFIGURED && (
            <Card className="p-6 mb-8 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Database non configurato
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    Configura le credenziali Supabase nel file <code>.env</code> per visualizzare e gestire i tuoi annunci.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Ads list */}
          {loadingAds ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-28 h-28 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2 py-2">
                      <div className="h-5 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : ads.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-bold mb-2">Nessun annuncio pubblicato</h3>
              <p className="text-muted-foreground mb-6">
                Non hai ancora pubblicato nessun annuncio. Inizia ora!
              </p>
              <Button className="gap-2" onClick={() => navigate("/")}>
                <Plus className="w-4 h-4" /> Pubblica nuovo annuncio
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <Card key={ad.id} className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    <div
                      className="w-full sm:w-28 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-purple-300/20 flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/ad/${slugify(ad.title)}-${ad.id}`)}
                    >
                      {ad.image ? (
                        <img
                          src={ad.image}
                          alt={ad.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {ad.category === "uomo-cerca-donna" ? "👨" : ad.category === "trans" ? "⚧️" : "👤"}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <h3
                          className="font-bold text-base md:text-lg line-clamp-1 cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/ad/${slugify(ad.title)}-${ad.id}`)}
                        >
                          {ad.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ad.is_active ? (
                            <Badge className="bg-green-500 text-white">Attivo</Badge>
                          ) : (
                            <Badge variant="secondary">Scaduto</Badge>
                          )}
                          {boostBadge(ad)}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {ad.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {ad.views || 0} visualizzazioni
                        </span>
                        {ad.price && (
                          <span className="font-semibold text-accent">{ad.price}</span>
                        )}
                        {ad.boost_end_at && isBoostActive(ad) && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            fino al {new Date(ad.boost_end_at).toLocaleDateString("it-IT")}
                          </span>
                        )}
                      </div>

                      {/* Boost buttons */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {BOOST_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const isBusy = busyBoost === `${ad.id}-${opt.label}`;
                          const affordable = credits >= opt.credits;
                          return (
                            <Button
                              key={opt.label}
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={isBusy || busyBoost !== null}
                              onClick={() => handleBoost(ad, opt)}
                              title={affordable ? `Costa ${opt.credits} crediti` : `Crediti insufficienti (${opt.credits})`}
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Icon className="w-3.5 h-3.5" />
                              )}
                              {opt.label}
                              <span className="text-[10px] text-accent font-bold ml-0.5">
                                {opt.credits}💰
                              </span>
                            </Button>
                          );
                        })}
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5"
                          onClick={() => openEdit(ad)}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Modifica
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive hover:bg-destructive/5"
                          onClick={() => setDeleteTarget(ad)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Elimina
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingAd && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingAd(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-poppins">Modifica annuncio</h2>
              <button
                onClick={() => setEditingAd(null)}
                className="text-2xl text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                className="md:col-span-2"
                placeholder="Titolo annuncio"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
              <Input
                placeholder="Citta"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
              <Input
                placeholder="Prezzo o info"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              />
              <Input
                className="md:col-span-2"
                placeholder="URL foto"
                value={editForm.image}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
              />
              <Textarea
                className="md:col-span-2"
                rows={5}
                placeholder="Descrizione"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button className="flex-1" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Salvataggio…
                  </>
                ) : (
                  "Salva modifiche"
                )}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditingAd(null)}>
                Annulla
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo annuncio?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title
                ? `"${deleteTarget.title}" verra eliminato definitivamente. Questa azione non puo essere annullata.`
                : "L'annuncio verra eliminato definitivamente. Questa azione non puo essere annullata."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Eliminazione…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Elimina
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
