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
import PageIntro from "@/components/PageIntro";
import AdPhotoEditor from "@/components/AdPhotoEditor";
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
  images?: string[] | null;
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
  const [existingEditPhotos, setExistingEditPhotos] = useState<string[]>([]);
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
      setBoostStep("Aggiornamento annuncio...");
      const result = await purchaseBoost({ adId, days, type });
      setEditingAd(prev => prev?.id === adId ? {
        ...prev,
        is_premium: type === "premium" ? true : prev.is_premium,
        is_sponsored: type === "vetrina" ? true : prev.is_sponsored,
        boosted_until: result.ends_at,
      } : prev);
      setBoostStep("Aggiornamento crediti...");
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
    setExistingEditPhotos(ad.images?.length ? ad.images : ad.image ? [ad.image] : []);
  };

  const editHasActiveSponsorship = !!editingAd?.boosted_until
    && new Date(editingAd.boosted_until).getTime() > Date.now()
    && (editingAd.is_premium || editingAd.is_sponsored);
  const maxEditPhotos = editHasActiveSponsorship ? 5 : Math.max(1, existingEditPhotos.length);

  const saveEdit = async () => {
    if (!editingAd) return;
    try {
      setSavingEdit(true);
      const token = await getToken();
      const payload: Record<string, any> = { ...editForm };
      const uploadedUrls: string[] = [];
      if (editPhotos.length > 0) {
        setEditUploading(true);
        for (const file of editPhotos) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${user?.id}/edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/ads/${path}`, {
            method: "POST",
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": file.type || "image/jpeg" },
            body: file,
          });
          if (!uploadRes.ok) throw new Error("Upload foto fallito");
          uploadedUrls.push(`${SUPABASE_URL}/storage/v1/object/public/ads/${path}`);
        }
        setEditUploading(false);
      }
      const finalImages = [...existingEditPhotos, ...uploadedUrls];
      payload.image = finalImages[0] || null;
      payload.images = finalImages;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ads?id=eq.${editingAd.id}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.message || errorBody?.error || "Errore salvataggio");
      }
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
        <div className="flex items-center justify-between mb-5">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Torna agli annunci
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{user.credits || 0} crediti</span>
          </div>
        </div>

        <PageIntro
          eyebrow="Il tuo spazio"
          title="I miei annunci"
          description="Controlla risultati, aggiorna i contenuti e aumenta la visibilità dei tuoi annunci da un'unica schermata."
          icon={Rocket}
        >
          <div className="flex flex-wrap gap-2">
            <Badge className="border-white/20 bg-white/10 px-3 py-2 text-white">{ads.length} annunci</Badge>
            {user.has_paid && <Badge className="border-0 bg-emerald-400 px-3 py-2 text-emerald-950"><CheckCircle2 className="mr-1 h-3 w-3" /> Cliente</Badge>}
          </div>
        </PageIntro>

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
              const isBoosted = !!boostActive;
              return (
                <Card key={ad.id} className="group overflow-hidden rounded-2xl border-border/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/10">
                  <div className="relative aspect-video bg-muted">
                    {ad.image ? (
                      <img src={ad.image} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        Nessuna immagine
                      </div>
                    )}
                    {boostActive && ad.is_premium && <Badge className="absolute top-2 left-2 bg-yellow-500"><Crown className="w-3 h-3 mr-1" />Premium</Badge>}
                    {boostActive && ad.is_sponsored && <Badge className="absolute top-2 right-2 bg-purple-500"><Zap className="w-3 h-3 mr-1" />In Vetrina</Badge>}
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
                          const type = opt.label.includes("Premium") ? "premium" : "vetrina";
                          const isBusy = busyBoost === ad.id + type + opt.days;
                          const canAfford = (user.credits || 0) >= opt.credits;
                          return (
                            <button
                              key={opt.label}
                              onClick={() => handleBoost(ad.id, opt.credits, opt.days, type)}
                              disabled={!!busyBoost || !canAfford}
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
            <div className="mb-4">
              {!editHasActiveSponsorship && (
                <div className="mb-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/20">
                  <div className="mb-3 flex items-start gap-3">
                    <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div><p className="font-bold text-amber-900 dark:text-amber-200">Vuoi aggiungere fino a 5 foto?</p><p className="text-xs text-amber-800/80 dark:text-amber-300/80">Sponsorizza questo annuncio: verranno scalati 10 crediti e potrai aggiungere subito altre immagini.</p></div>
                  </div>
                  <Button type="button" onClick={() => handleBoost(editingAd.id, 10, 30, "premium")} disabled={!!busyBoost || (user.credits || 0) < 10} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700">
                    <Crown className="h-4 w-4" /> Sponsorizza annuncio · 10 crediti
                  </Button>
                  {(user.credits || 0) < 10 && <p className="mt-2 text-center text-xs font-semibold text-red-600">Crediti insufficienti</p>}
                </div>
              )}
              <AdPhotoEditor
                existingPhotos={existingEditPhotos}
                newPhotos={editPhotos}
                newPreviews={editPhotoPreviews}
                maxPhotos={maxEditPhotos}
                inputRef={editFileRef}
                onFiles={(files) => {
                  const room = maxEditPhotos - existingEditPhotos.length - editPhotos.length;
                  const allowed = files.slice(0, Math.max(0, room));
                  if (allowed.length < files.length) toast.info(`Puoi caricare massimo ${maxEditPhotos} foto`);
                  setEditPhotos(prev => [...prev, ...allowed]);
                  setEditPhotoPreviews(prev => [...prev, ...allowed.map(file => URL.createObjectURL(file))]);
                }}
                onRemoveExisting={(index) => setExistingEditPhotos(prev => prev.filter((_, i) => i !== index))}
                onRemoveNew={(index) => {
                  URL.revokeObjectURL(editPhotoPreviews[index]);
                  setEditPhotos(prev => prev.filter((_, i) => i !== index));
                  setEditPhotoPreviews(prev => prev.filter((_, i) => i !== index));
                }}
              />
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
            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="font-bold">Informazioni dell’annuncio</h3>
                  <p className="text-xs text-muted-foreground">Controlla e aggiorna i dati prima di salvare.</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-rose-500" /> obbligatorio</span>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-rose-500" /> Titolo</label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-rose-500" /> Descrizione</label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-rose-500" /> Prezzo / informazioni</label>
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
