import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/hooks/useRouter";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  Eye,
  Crown,
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  Loader2,
  Heart,
  Share2,
  Flag,
} from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  age: number | null;
  category: string;
  image: string | null;
  images: string[] | null;
  price: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_active: boolean;
  is_premium: boolean;
  is_sponsored: boolean;
  is_verified: boolean;
  rating: number;
  review_count: number;
  views: number;
  hair_color: string | null;
  body_type: string | null;
  ethnicity: string | null;
  services: string | null;
  availability_hours: string | null;
  height: number | null;
  weight: number | null;
  created_at: string;
  user_id: string;
}

export default function AdDetail() {
  const { user } = useAuth();
  const { navigate, params } = useRouter();
  const { get, post } = useApi();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [liked, setLiked] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const adId = params?.id || "";

  const loadAd = useCallback(async () => {
    if (!adId) return;
    try {
      setLoading(true);
      const data = await get(`/api/ads/${adId}`);
      setAd(data.ad);
    } catch (e: any) {
      toast.error(e.message || "Annuncio non trovato");
    } finally {
      setLoading(false);
    }
  }, [adId, get]);

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Inserisci un motivo per la segnalazione");
      return;
    }
    try {
      await post(`/api/ads/${adId}/report`, { reason: reportReason });
      toast.success("Segnalazione inviata. Grazie per la collaborazione!");
      setReporting(false);
      setReportReason("");
    } catch (e: any) {
      toast.error(e.message || "Errore invio segnalazione");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiato negli appunti!");
    } catch {
      toast.error("Errore copia link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Annuncio non trovato</h2>
          <p className="text-muted-foreground mb-4">L'annuncio che stai cercando non esiste o è stato rimosso.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna agli annunci
          </Button>
        </Card>
      </div>
    );
  }

  const allImages = ad.images?.length ? ad.images : ad.image ? [ad.image] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Torna agli annunci
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-4">
              {allImages.length > 0 ? (
                <img
                  src={allImages[currentImage]}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Nessuna immagine
                </div>
              )}
              {ad.is_premium && (
                <Badge className="absolute top-3 left-3 bg-yellow-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {ad.is_sponsored && (
                <Badge className="absolute top-3 right-3 bg-purple-500">
                  <Zap className="w-3 h-3 mr-1" />
                  Sponsored
                </Badge>
              )}
              {ad.is_verified && (
                <Badge className="absolute bottom-3 left-3 bg-green-500">
                  <Shield className="w-3 h-3 mr-1" />
                  Verificato
                </Badge>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      idx === currentImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{ad.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {ad.city}, {ad.country}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setLiked(!liked)}>
                  <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{ad.rating}</span>
                <span className="text-muted-foreground">({ad.review_count} recensioni)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-4 h-4" />
                {ad.views} visualizzazioni
              </div>
            </div>

            {ad.price && (
              <div className="text-xl font-bold text-primary mb-4">{ad.price}</div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Descrizione</h3>
                <p className="text-muted-foreground whitespace-pre-line">{ad.description}</p>
              </div>

              {ad.age && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Età:</span>
                  <span>{ad.age} anni</span>
                </div>
              )}

              {ad.height && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Altezza:</span>
                  <span>{ad.height} cm</span>
                </div>
              )}

              {ad.weight && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Peso:</span>
                  <span>{ad.weight} kg</span>
                </div>
              )}

              {ad.hair_color && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Capelli:</span>
                  <span>{ad.hair_color}</span>
                </div>
              )}

              {ad.body_type && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Fisico:</span>
                  <span>{ad.body_type}</span>
                </div>
              )}

              {ad.ethnicity && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Etnia:</span>
                  <span>{ad.ethnicity}</span>
                </div>
              )}

              {ad.services && (
                <div>
                  <span className="font-medium">Servizi:</span>
                  <p className="text-muted-foreground">{ad.services}</p>
                </div>
              )}

              {ad.availability_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{ad.availability_hours}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mb-6">
              {ad.phone && (
                <Button className="flex-1 gap-2" asChild>
                  <a href={`tel:${ad.phone}`}>
                    <Phone className="w-4 h-4" />
                    Chiama
                  </a>
                </Button>
              )}
              {ad.whatsapp && (
                <Button variant="outline" className="flex-1 gap-2" asChild>
                  <a href={`https://wa.me/${ad.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setReporting(!reporting)}
              >
                <Flag className="w-4 h-4 mr-2" />
                Segnala annuncio
              </Button>

              {reporting && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <textarea
                    className="w-full p-2 rounded border bg-background mb-2"
                    rows={3}
                    placeholder="Descrivi il problema con questo annuncio..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReporting(false)}>Annulla</Button>
                    <Button size="sm" onClick={handleReport}>Invia segnalazione</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
