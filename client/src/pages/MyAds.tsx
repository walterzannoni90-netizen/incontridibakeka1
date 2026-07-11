import { useState, useEffect, useCallback, useRef } from "react";
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
import { purchaseBoost } from "@/lib/boost";
import {
  ArrowLeft, Eye, Crown, Store, Pencil, Trash2, Plus, Loader2, Zap, Coins, Clock, Sparkles, Rocket, CheckCircle2, ImagePlus
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
  has_paid?: boolean;
  views: number;
  created_at: string;
  boosted_until?: string | null;
}

const BOOST_OPTIONS = [
  { days: 1, credits: 10, label: "Vetrina 1g", icon: Store, desc: "1 giorno in evidenza", color: "from-violet-500 to-purple-600" },
  { days: 3, credits: 25, label: "Vetrina 3g", icon: Store, desc: "3 giorni in evidenza", color: "from-purple-500 to-pink-600" },
  { days: 7, credits: 50, label: "Vetrina 7g", icon: Store, desc: "1 settimana in evidenza", color: "from-pink-500 to-rose-600" },
  { days: 30, credits: 10, label: "Premium", icon: Crown, desc: "Sblocca foto + badge", color: "from-amber-500 to-orange-600" },
];

async function getToken() {
  const session = (await supabase!.auth.getSession()).data.session;
  return session?.access_token || "";
}

export default function MyAds() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { navigate } = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [busyBoost, setBusyBoost] = useState<string | null>(null);
  const [boostStep, setBoostStep] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", city: "", price: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editPhotos, setEditPhotos] = useState<File[]>([]);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => { loadAds(); }, [loadAds]);

  const handleBoost = async (adId: string, credits: number, days: number, type: "vetrina" | "premium") => {
    try {
      const boostId = adId + type + days;
      setBusyBoost(boostId);
      if (!user || (user.credits || 0) < credits) {
        toast.error("Crediti insufficienti");
        return;
      }
      setBoostStep("Preparazione...");
      await new Promise(r => setTimeout(r, 400));
      setBoostStep("Aggiornamento annuncio...");
      await new Promise(r => setTimeout(r, 500));
      const result = await purchaseBoost({ adId, days, type });
      setBoostStep("Aggiornamento crediti...");
      await new Promise(r => setTimeout(r, 400));
      updateUser({ credits: result.remaining_credits });
      setBoostStep("Completato! 🎉");
      setShowConfetti(true);
      setConfettiKey(k => k + 1);
      setTimeout(() => setShowConfetti(false), 3000);
      toast.success(`Annuncio potenziato! ${days} giorni di visibilità`);
      loadAds();
    } catch (e: any) {
      toast.error(e?.message || "Errore boost");
    } finally {
      setBusyBoost(null);
      setBoostStep("");
    }
  };

  const startEdit = (ad: Ad) => {
    setEditingAd(ad);
    setEditForm({
      title: ad.title, description: ad.description, city: ad.city,
      price: ad.price || "",
    });
    setEditPhotos([]);
    setEditPhotoPreviews([]);
  };

  const maxEditPhotos = (user?.has_paid || (user?.credits || 0) > 0) ? 5 : 1;

  const saveEdit = async () => {
    if (!editingAd) return;
    try {
      setSavingEdit(true);
      const token = await getToken();
      const payload: Record<string, any> = { ...editForm };
      if (editPhotos.length > 0) {
        setEditUploading(true);
        const urls: string[] = [];
        for (const file of editPhotos) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${user?.id}/edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/ads/${path}`, {
            method: "POST",
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": file.type || "image/jpeg" },
            body: file,
          });
          if (!uploadRes.ok) throw new Error("Upload foto fallito");
          urls.push(`${SUPABASE_URL}/storage/v1/object/public/ads/${path}`);
        }
        payload.image = urls[0];
        payload.images = urls;
        setEditUploading(false);
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${editingAd.id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Errore salvataggio");
      toast.success("Annuncio aggiornato!");
      setEditingAd(null);
      setEditPhotos([]);
      setEditPhotoPreviews([]);
      loadAds();
    } catch (e: any) {
      toast.error(e?.message || "Errore salvataggio");
    } finally {
      setSavingEdit(false);
      setEditUploading(false);
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
            <ArrowLeft className="w-4 h-4" /> Torna agli annunci
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{user.credits || 0} crediti</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <h1 className="text-3xl font-bold">I miei annunci</h1>
          <Badge variant="outline" className="text-sm">{ads.length} totali</Badge>
          {user.has_paid && (
            <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 gap-1">
              <CheckCircle2 className="w-3 h-3" /> Pagante
            </Badge>
          )}
        </div>

        {loadingAds ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-muted-foreground mb-4">Non hai ancora pubblicato annunci</p>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Plus className="w-4 h-4" /> Pubblica il primo annuncio
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => {
              const boostActive = ad.boosted_until && new Date(ad.boosted_until).getTime() > Date.now();
              const isBoosted = boostActive || ad.is_premium || ad.is_sponsored || ad.has_paid;
              return (
                <Card key={ad.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {ad.image ? (
                      <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Nessuna immagine
                      </div>
                    )}
                    {(ad.is_premium || ad.has_paid) && <Badge className="absolute top-2 left-2 bg-yellow-500"><Crown className="w-3 h-3 mr-1" />Premium</Badge>}
                    {ad.is_sponsored && <Badge className="absolute top-2 right-2 bg-purple-500"><Zap className="w-3 h-3 mr-1" />In Vetrina</Badge>}
                    {!isBoosted && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge className="bg-gray-800/80 text-white text-xs px-3 py-1.5">
                          <Sparkles className="w-3 h-3 mr-1 inline" /> Promuovi per sbloccare
                        </Badge>
                      </div>
                    )}
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

                    {/* STATO BOOST ATTUALE */}
                    {isBoosted && ad.boosted_until && boostActive && (
                      <div className="flex items-center gap-2 p-2 mb-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <div className="text-[10px]">
                          <p className="font-semibold text-green-700 dark:text-green-400">
                            {ad.is_premium ? "Premium" : "In Vetrina"} — Attivo
                          </p>
                          <p className="text-green-600/70">
                            Scade tra {Math.ceil((new Date(ad.boosted_until).getTime() - Date.now()) / 86400000)} giorni
                          </p>
                        </div>
                      </div>
                    )}
                    {/* RICCA SEZIONE PROMOZIONE */}
                    <div className="border-t pt-3 mt-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Rocket className="w-3.5 h-3.5 text-purple-500" />
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {isBoosted ? "Prolunga promozione:" : "Promuovi annuncio:"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {BOOST_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const isBusy = busyBoost === ad.id + opt.label;
                          const canAfford = (user.credits || 0) >= opt.credits;
                          return (
                            <button
                              key={opt.label}
                              onClick={() => handleBoost(ad.id, opt.credits, opt.days, opt.label.includes("Premium") ? "premium" : "vetrina")}
                              disabled={!!isBusy}
                              className={`relative group rounded-xl p-2.5 text-left transition-all duration-300 border ${
                                canAfford
                                  ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-800 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
                                  : "bg-muted/30 border-border opacity-60"
                              } ${isBusy ? "pointer-events-none" : "cursor-pointer"}`}
                            >
                              {isBusy && (
                                <div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                  <div className="w-full max-w-[80%] bg-muted rounded-full h-1.5 mb-2 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-boost-progress rounded-full" />
                                  </div>
                                  <span className="text-[10px] font-medium text-foreground">{boostStep || "Elaborazione..."}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                  opt.label.includes("Premium")
                                    ? "bg-amber-100 dark:bg-amber-900/40"
                                    : "bg-purple-100 dark:bg-purple-900/40"
                                }`}>
                                  <Icon className={`w-3.5 h-3.5 ${
                                    opt.label.includes("Premium") ? "text-amber-600" : "text-purple-600"
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{opt.label}</p>
                                  <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className={`font-bold ${canAfford ? "text-primary" : "text-destructive"}`}>
                                  {opt.credits} crediti
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                                  canAfford
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                }`}>
                                  {canAfford ? "Disponibile" : "Insuff."}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {showConfetti && (
                        <div key={confettiKey} className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                          {[...Array(30)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-2 h-2 rounded-sm animate-confetti"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: "-5%",
                                background: ["#8b5cf6","#f59e0b","#06b6d4","#ec4899","#22c55e","#ef4444"][i % 6],
                                animationDelay: `${Math.random() * 0.8}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                                transform: `rotate(${Math.random() * 360}deg)`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog con foto */}
      {editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">Modifica annuncio</h2>
            <p className="text-xs text-muted-foreground mb-4">Puoi modificare testo e foto. Città ed età rimangono invariati.</p>
            <input
              ref={editFileRef}
              type="file"
              accept="image/*"
              multiple={maxEditPhotos > 1}
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                const allowed = files.slice(0, maxEditPhotos);
                setEditPhotos(allowed);
                setEditPhotoPreviews(allowed.map(f => URL.createObjectURL(f)));
                if (editFileRef.current) editFileRef.current.value = "";
              }}
            />
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">
                Foto annuncio {maxEditPhotos > 1 ? `(max ${maxEditPhotos})` : "(max 1)"}
              </label>
              {editingAd.image && editPhotos.length === 0 && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2 max-w-[200px] border border-border">
                  <img src={editingAd.image} alt="corrente" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">Corrente</span>
                </div>
              )}
              {editPhotoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {editPhotoPreviews.map((url, i) => (
                    <div key={i} className="aspect-video rounded-lg overflow-hidden bg-muted border border-primary">
                      <img src={url} alt="nuova" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => editFileRef.current?.click()} className="gap-1.5" disabled={editPhotos.length >= maxEditPhotos}>
                <ImagePlus className="w-4 h-4" /> {editPhotos.length > 0 ? `Cambia foto (${editPhotos.length}/${maxEditPhotos})` : `Scegli foto (max ${maxEditPhotos})`}
              </Button>
              {editPhotos.length > 0 && (
                <p className="text-[10px] text-green-600 mt-1">{editPhotos.length} foto pronte per l'upload</p>
              )}
            </div>
            {/* Info città/età non modificabili */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-xs">
                <span className="text-muted-foreground">Città:</span>
                <span className="font-medium ml-1">{editingAd.city}</span>
              </div>
              {editingAd.age && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Età:</span>
                  <span className="font-medium ml-1">{editingAd.age} anni</span>
                </div>
              )}
            </div>
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
                <label className="text-sm font-medium mb-1 block">Prezzo</label>
                <Input value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setEditingAd(null);
                setEditPhotos([]);
                editPhotoPreviews.forEach(u => URL.revokeObjectURL(u));
                setEditPhotoPreviews([]);
              }}>Annulla</Button>
              <Button onClick={saveEdit} disabled={savingEdit} className="gap-1.5">
                {savingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> {editUploading ? "Caricamento foto..." : "Salvataggio..."}</> : "Salva modifiche"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione è permanente e non può essere annullata.</AlertDialogDescription>
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
