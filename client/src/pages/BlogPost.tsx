import { useRouter } from "@/hooks/useRouter";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useEffect } from "react";

const ARTICLES: Record<string, {
  title: string;
  slug: string;
  city?: string | null;
  excerpt: string;
  content: string;
  date: string;
}> = {
  "incontri-roma": {
    title: "Guida agli incontri a Roma",
    slug: "incontri-roma",
    city: "Roma",
    excerpt: "Scopri i migliori luoghi e consigli per incontri a Roma.",
    date: "Luglio 2026",
    content: `Roma è una città magica per gli incontri. Con i suoi scorci romantici, i locali alla moda di Trastevere e il fascino senza tempo dei suoi monumenti, offre lo scenario perfetto per ogni tipo di conoscenza.

I quartieri più frequentati per incontri sono Trastevere con i suoi pub e ristoranti tipici, San Lorenzo per l'atmosfera giovane e universitaria, e il centro storico con i suoi caffè eleganti.

## I migliori locali per incontri a Roma

- **Trastevere**: Pub, wine bar e ristoranti. Ideale per aperitivi e serate informali.
- **San Lorenzo**: Atmosfera universitaria, prezzi modici, locali alternativi.
- **Centro Storico**: Caffè storici, enoteche, locali chic.
- **Testaccio**: Movida autentica, cucina romana, pub alla mano.
- **Eur**: Locali più eleganti, discoteche, serate esclusive.

## Consigli per incontri a Roma

Il momento migliore per incontri a Roma è l'aperitivo (18:30-21:00) o la sera dopo cena. Il weekend il centro è più affollato ma anche più divertente.

Su Incontri di Bakeka trovi annunci verificati di persone reali a Roma. Dalle professioniste alle studentesse, ogni profilo è autentico e pronto a conoscerti.

## Perché scegliere Incontri di Bakeka a Roma

La community di Roma su Incontri di Bakeka è la più grande d'Italia, con centinaia di annunci attivi ogni giorno. Tutti i profili sono verificati manualmente dal nostro team.

Registrati ora e scopri gli annunci nella tua città.`,
  },
  "incontri-milano": {
    title: "Incontri a Milano: la guida completa",
    slug: "incontri-milano",
    city: "Milano",
    excerpt: "Milano è il cuore pulsante degli incontri in Lombardia.",
    date: "Luglio 2026",
    content: `Milano offre un panorama variegato per chi cerca incontri. Dai Navigli al Brera, dal Duomo alla movida di Corso Como, ogni zona ha il suo pubblico e la sua atmosfera unica.

I momenti migliori per incontrare persone a Milano sono l'aperitivo (dalle 18:30 in poi) e il weekend, quando la città si anima con eventi, mostre e feste.

## I quartieri migliori

- **Navigli**: Aperitivi sul canale, locali trendy, atmosfera giovane.
- **Brera**: Elegante, raffinato, ideale per incontri di classe.
- **Corso Como**: Movida internazionale, locali esclusivi.
- **Porta Romana**: Zona residenziale ma con ottimi locali.

La community di Incontri di Bakeka a Milano è in costante crescita, con profili verificati e autentici.`,
  },
  "incontri-napoli": {
    title: "Annunci incontri a Napoli",
    slug: "incontri-napoli",
    city: "Napoli",
    excerpt: "Napoli, con la sua passione e autenticità.",
    date: "Luglio 2026",
    content: `Napoli è passione, calore e autenticità. La città partenopea offre un contesto unico per gli incontri, grazie alla sua gente aperta e socievole.

I quartieri di Chiaia, Vomero e il centro storico sono i punti caldi della movida napoletana. La sera il lungomare si anima di locali e persone.

Registrati su Incontri di Bakeka per scoprire annunci verificati a Napoli e provincia.`,
  },
  "incontri-torino": {
    title: "Incontri a Torino e Piemonte",
    slug: "incontri-torino",
    city: "Torino",
    excerpt: "Torino, città elegante e raffinata.",
    date: "Luglio 2026",
    content: `Torino è una città dal fascino sobrio ed elegante, perfetta per incontri di qualità. I quartieri di San Salvario, il Centro e la Crocetta sono i più vivaci.

La scena degli incontri a Torino è variegata: dai locali chic di Piazza Vittorio ai pub alternativi di San Salvario.

Su Incontri di Bakeka trovi annunci verificati a Torino e in tutto il Piemonte.`,
  },
  "incontri-sicuri-italia": {
    title: "Consigli per incontri sicuri in Italia",
    slug: "incontri-sicuri-italia",
    city: null,
    excerpt: "La sicurezza prima di tutto.",
    date: "Luglio 2026",
    content: `La sicurezza negli incontri online è fondamentale. Ecco le nostre raccomandazioni:

1. Verifica sempre il profilo della persona prima di incontrarla
2. Fissa il primo appuntamento in un luogo pubblico e affollato
3. Comunica a un amico o familiare dove vai
4. Non condividere mai dati bancari o informazioni sensibili
5. Fidati del tuo istinto

Su Incontri di Bakeka tutti i profili sono verificati manualmente. La tua sicurezza è la nostra priorità.`,
  },
  "profilo-perfetto-incontri": {
    title: "Come scegliere il tuo profilo perfetto",
    slug: "profilo-perfetto-incontri",
    city: null,
    excerpt: "Guida al profilo di successo.",
    date: "Luglio 2026",
    content: `Un profilo curato è la chiave per incontri di successo.

LA FOTO: Scegli una foto chiara, recente e che ti rappresenti. Evita selfie scuri o foto di gruppo.

LA DESCRIZIONE: Sii autentico e sincero. Descrivi chi sei, cosa cerchi e cosa offri.

I DETTAGLI: Compila tutti i campi opzionali: altezza, corporatura, orari.

IL CONTATTO: Indica le tue preferenze di contatto.

Registrati ora e crea il tuo profilo su Incontri di Bakeka. È gratuito.`,
  },
  "premium-vs-gratuito": {
    title: "Premium vs Gratuito: cosa cambia",
    slug: "premium-vs-gratuito",
    city: null,
    excerpt: "Tutte le differenze tra account Premium e gratuito.",
    date: "Luglio 2026",
    content: `Su Incontri di Bakeka offriamo due livelli: Gratuito e Premium.

GRATUITO: Pubblicazione annuncio base, 1 foto, messaggistica base.

PREMIUM: Fino a 5 foto, badge Premium, annuncio in evidenza, foto sempre visibili, crediti per potenziamenti.

I profili Premium hanno il 70% in più di visualizzazioni. Passa a Premium oggi!`,
  },
};

export default function BlogPost() {
  const { navigate } = useRouter();
  const [, params] = useRoute<{ slug: string }>("/blog/:slug");
  const slug = params?.slug || "";
  const article = ARTICLES[slug];

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — Incontri di Bakeka`;
    }
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Articolo non trovato</h2>
          <p className="text-muted-foreground mb-4">L'articolo che cerchi non esiste o è stato rimosso.</p>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Torna al blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" size="sm" className="mb-8 gap-2" onClick={() => navigate("/blog")}>
          <ArrowLeft className="w-4 h-4" /> Torna al blog
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            {article.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {article.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {article.date}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-poppins mb-4">{article.title}</h1>
          <p className="text-lg text-muted-foreground">{article.excerpt}</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {article.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return <h2 key={i} className="text-xl font-bold mt-8 mb-4">{line.replace("## ", "")}</h2>;
            }
            if (line.startsWith("### ")) {
              return <h3 key={i} className="text-lg font-bold mt-6 mb-3">{line.replace("### ", "")}</h3>;
            }
            if (line.startsWith("- **")) {
              const parts = line.match(/- \*\*(.+?)\*\*: (.+)/);
              if (parts) {
                return <p key={i} className="mb-2"><strong>{parts[1]}</strong>: {parts[2]}</p>;
              }
            }
            if (line.startsWith("- ")) {
              return <p key={i} className="mb-1 ml-4">• {line.replace("- ", "")}</p>;
            }
            if (line.startsWith("1. ")) {
              return <p key={i} className="mb-1 ml-4">1. {line.replace(/^\d+\.\s*/, "")}</p>;
            }
            if (line.trim() === "") {
              return <div key={i} className="h-3" />;
            }
            return <p key={i} className="mb-3 leading-relaxed">{line}</p>;
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30 text-center">
          <h3 className="font-bold text-lg mb-2">Pronto a conoscere persone nuove?</h3>
          <p className="text-muted-foreground mb-4">Registrati su Incontri di Bakeka e scopri annunci verificati nella tua città.</p>
          <Button size="lg" onClick={() => navigate("/")}>
            Vedi gli annunci
          </Button>
        </div>
      </article>
    </div>
  );
}
