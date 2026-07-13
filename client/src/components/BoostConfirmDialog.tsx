import { Loader2, Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type PendingBoost = {
  adId?: string;
  adTitle: string;
  credits: number;
  days: number;
  type: "vetrina" | "premium";
};

type Props = {
  boost: PendingBoost | null;
  balance: number;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function BoostConfirmDialog({ boost, balance, loading = false, onCancel, onConfirm }: Props) {
  const remaining = boost ? balance - boost.credits : balance;
  const isPremium = boost?.type === "premium";

  return (
    <AlertDialog open={!!boost} onOpenChange={(open) => !open && !loading && onCancel()}>
      <AlertDialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 p-6 text-white">
          <Sparkles className="mb-3 h-8 w-8" />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">
              {isPremium ? "Vuoi sponsorizzare l’annuncio?" : "Vuoi promuovere l’annuncio?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/85">
              Conferma una seconda volta prima di usare i crediti.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="mb-2 font-bold text-foreground">{boost?.adTitle || "Nuovo annuncio"}</p>
            <p className="text-muted-foreground">
              {isPremium
                ? `Premium per ${boost?.days} giorni: badge e possibilità di aggiungere fino a 5 foto.`
                : `Vetrina per ${boost?.days} ${boost?.days === 1 ? "giorno" : "giorni"}: maggiore visibilità nell’elenco.`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border p-2"><span className="block text-muted-foreground">Saldo</span><strong>{balance}</strong></div>
            <div className="rounded-lg border p-2"><span className="block text-muted-foreground">Costo</span><strong>-{boost?.credits || 0}</strong></div>
            <div className="rounded-lg border p-2"><span className="block text-muted-foreground">Rimane</span><strong className={remaining < 0 ? "text-destructive" : "text-emerald-600"}>{remaining}</strong></div>
          </div>
          <p className="text-xs text-muted-foreground">I crediti vengono scalati solo dopo questa conferma e l’operazione non è rimborsabile automaticamente.</p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annulla</AlertDialogCancel>
            <Button onClick={onConfirm} disabled={loading || remaining < 0} className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Conferma e usa {boost?.credits || 0} crediti
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
