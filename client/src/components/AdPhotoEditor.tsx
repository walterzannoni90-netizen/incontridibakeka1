import { ImagePlus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  existingPhotos: string[];
  newPhotos: File[];
  newPreviews: string[];
  maxPhotos: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
}

export default function AdPhotoEditor({
  existingPhotos, newPhotos, newPreviews, maxPhotos, inputRef,
  onFiles, onRemoveExisting, onRemoveNew,
}: Props) {
  const total = existingPhotos.length + newPhotos.length;

  return (
    <section className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 to-pink-50/60 p-4 dark:border-violet-900 dark:from-violet-950/30 dark:to-pink-950/20">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={maxPhotos > 1}
        className="hidden"
        onChange={(event) => {
          onFiles(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">Foto dell’annuncio</h3>
          <p className="text-xs text-muted-foreground">La prima foto sarà la copertina. Tocca la X per rimuovere un errore.</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700 shadow-sm dark:bg-background dark:text-violet-300">
          {total}/{maxPhotos}
        </span>
      </div>

      {total > 0 ? (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {existingPhotos.map((url, index) => (
            <div key={`existing-${url}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-white bg-muted shadow-sm dark:border-slate-800">
              <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Copertina
                </span>
              )}
              <button type="button" onClick={() => onRemoveExisting(index)} aria-label={`Rimuovi foto ${index + 1}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-110 hover:bg-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {newPreviews.map((url, index) => {
            const absoluteIndex = existingPhotos.length + index;
            return (
              <div key={`new-${url}`} className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-violet-400 bg-muted shadow-sm">
                <img src={url} alt={`Nuova foto ${index + 1}`} className="h-full w-full object-cover" />
                {absoluteIndex === 0 && (
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Copertina
                  </span>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2 py-1 text-[9px] font-bold text-white">NUOVA</span>
                <button type="button" onClick={() => onRemoveNew(index)} aria-label={`Rimuovi nuova foto ${index + 1}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-110 hover:bg-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="mb-3 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-300 bg-white/70 px-4 py-8 text-center transition hover:border-violet-500 hover:bg-white dark:bg-background/60">
          <ImagePlus className="mb-2 h-8 w-8 text-violet-500" />
          <span className="font-bold">Aggiungi la prima foto</span>
          <span className="text-xs text-muted-foreground">JPG, PNG o WEBP</span>
        </button>
      )}

      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={total >= maxPhotos} className="w-full gap-2 border-violet-300 bg-white/80 hover:bg-white dark:bg-background">
        <ImagePlus className="h-4 w-4" /> {total ? "Aggiungi altre foto" : "Scegli foto"}
      </Button>
    </section>
  );
}
