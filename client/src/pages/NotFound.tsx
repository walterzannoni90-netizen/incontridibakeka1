import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useRouter } from "@/hooks/useRouter";
import { useEffect } from "react";
import { setPageMetadata } from "@/lib/seo";

export default function NotFound() {
  const { navigate, currentPath } = useRouter();

  useEffect(() => {
    setPageMetadata({
      title: "Pagina non trovata | Incontri di Bakeka",
      description: "La pagina richiesta non esiste o non è più disponibile.",
      path: currentPath,
      robots: "noindex,nofollow",
    });
  }, [currentPath]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-lg mx-4 shadow-xl border-0 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-foreground mb-2 font-poppins">404</h1>

          <h2 className="text-xl font-semibold text-muted-foreground mb-4">
            Pagina non trovata
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            La pagina che cerchi non esiste o e stata spostata.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/")}
              className="gap-2 px-6 py-2.5"
            >
              <Home className="w-4 h-4" />
              Torna alla Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
