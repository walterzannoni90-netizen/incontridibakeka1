import { useRouter } from "@/hooks/useRouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, ChevronRight } from "lucide-react";

const CITIES = [
  "Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna",
  "Firenze", "Catania", "Bari", "Venezia", "Verona", "Messina", "Padova",
  "Trieste", "Brescia", "Parma", "Taranto", "Modena", "Reggio Calabria",
  "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini",
  "Salerno", "Ferrara", "Sassari", "Siracusa", "Pescara", "Monza",
  "Latina", "Bergamo", "Trento", "Vicenza", "Terni", "Novara",
  "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena",
  "Lecce", "Bolzano", "Cosenza", "Pisa", "Siena", "Aosta",
  "Crotone", "Como", "Lucca", "Mantova", "Varese",
];

const ARTICLES = [
  {
    title: "Guida agli incontri a Roma",
    slug: "incontri-roma",
    city: "Roma",
    excerpt: "Scopri i migliori luoghi e consigli per incontri a Roma. Dalla movida di Trastevere agli appuntamenti al Pincio, la Capitale offre infinite possibilità per conoscere persone affini.",
    content: `Roma è una città magica per gli incontri. Con i suoi scorci romantici, i locali alla moda di Trastevere e il fascino senza tempo dei suoi monumenti, offre lo scenario perfetto per ogni tipo di conoscenza.

I quartieri più frequentati per incontri sono Trastevere con i suoi pub e ristoranti tipici, San Lorenzo per l'atmosfera giovane e universitaria, e il centro storico con i suoi caffè eleganti.

Su Incontri di Bakeka trovi annunci verificati di persone reali a Roma. Dalle professioniste alle studentesse, ogni profilo è autentico e pronto a conoscerti.`,
  },
  {
    title: "Incontri a Milano: la guida completa",
    slug: "incontri-milano",
    city: "Milano",
    excerpt: "Milano è il cuore pulsante degli incontri in Lombardia. Scopri dove trovare annunci di qualità e come muoverti nella città più dinamica d'Italia.",
    content: `Milano offre un panorama variegato per chi cerca incontri. Dai Navigli al Brera, dal Duomo alla movida di Corso Como, ogni zona ha il suo pubblico e la sua atmosfera unica.

I momenti migliori per incontrare persone a Milano sono l'aperitivo (dalle 18:30 in poi) e il weekend, quando la città si anima con eventi, mostre e feste.

La community di Incontri di Bakeka a Milano è in costante crescita, con profili verificati e autentici. Che tu cerchi una serata leggera o una conoscenza più profonda, troverai la persona giusta.`,
  },
  {
    title: "Annunci incontri a Napoli",
    slug: "incontri-napoli",
    city: "Napoli",
    excerpt: "Napoli, con la sua passione e autenticità, è una delle città migliori per incontri. Scopri i segreti della movida partenopea.",
    content: `Napoli è passione, calore e autenticità. La città partenopea offre un contesto unico per gli incontri, grazie alla sua gente aperta e socievole. I quartieri di Chiaia, Vomero e il centro storico sono i punti caldi.

La movida napoletana inizia tardi: gli aperitivi prendono vita intorno alle 19, ma la vera azione comincia dopo le 22. I locali sul lungomare sono tra i più gettonati.

Registrati su Incontri di Bakeka per scoprire annunci verificati a Napoli e provincia. Persone reali, profili autentici, connessioni genuine.`,
  },
  {
    title: "Consigli per incontri sicuri in Italia",
    slug: "incontri-sicuri-italia",
    city: null,
    excerpt: "La sicurezza prima di tutto. Ecco una guida completa per incontri online sicuri in Italia, con consigli pratici per proteggere te stesso e i tuoi dati.",
    content: `La sicurezza negli incontri online è fondamentale. Ecco le nostre raccomandazioni per incontri sicuri:

1. Verifica sempre il profilo della persona prima di incontrarla
2. Fissa il primo appuntamento in un luogo pubblico e affollato
3. Comunica a un amico o familiare dove vai
4. Non condividere mai dati bancari o informazioni sensibili
5. Fidati del tuo istinto: se qualcosa non ti convince, non proseguire

Su Incontri di Bakeka tutti i profili sono verificati manualmente. La tua sicurezza è la nostra priorità assoluta.

Ricorda: un incontro consensuale tra adulti è un'esperienza bellissima se vissuta con rispetto e responsabilità.`,
  },
  {
    title: "Come scegliere il tuo profilo perfetto",
    slug: "profilo-perfetto-incontri",
    city: null,
    excerpt: "Una guida passo-passo per creare un profilo di successo su Incontri di Bakeka. Dalla foto alla descrizione, tutto quello che devi sapere.",
    content: `Un profilo curato è la chiave per incontri di successo. Ecco come creare il profilo perfetto su Incontri di Bakeka:

LA FOTO: Scegli una foto chiara, recente e che ti rappresenti. Evita selfie scuri o foto di gruppo. Una buona prima impressione inizia dall'immagine principale.

LA DESCRIZIONE: Sii autentico e sincero. Descrivi chi sei, cosa cerchi e cosa offri. Un testo ben scritto attira persone genuine.

I DETTAGLI: Compila tutti i campi opzionali: altezza, corporatura, orari. Più informazioni dai, più facile sarà trovare la persona giusta.

IL CONTATTO: Indica le tue preferenze di contatto. WhatsApp o chiamate? Scegli ciò che ti fa sentire più a tuo agio.

Registrati ora e crea il tuo profilo su Incontri di Bakeka. È gratuito e richiede solo un minuto.`,
  },
  {
    title: "Incontri a Torino e Piemonte",
    slug: "incontri-torino",
    city: "Torino",
    excerpt: "Torino, città elegante e raffinata, offre un panorama incontri di qualità. Scopri i migliori quartieri e locali per conoscere persone.",
    content: `Torino è una città dal fascino sobrio ed elegante, perfetta per incontri di qualità. I quartieri di San Salvario, il Centro e la Crocetta sono i più vivaci per la movida.

La scena degli incontri a Torino è variegata: dai locali chic di Piazza Vittorio ai pub alternativi di San Salvario, c'è spazio per tutti i gusti.

I momenti migliori? Il giovedì sera per l'aperitivo universitario e il weekend per serate più organizzate. Su Incontri di Bakeka trovi annunci verificati a Torino e in tutto il Piemonte.`,
  },
  {
    title: "Bakeca Incontri: l'alternativa moderna e verificata",
    slug: "bakeca-incontri-alternativa",
    city: null,
    excerpt: "Scopri Incontri di Bakeka, la migliore alternativa a Bakeca Incontri. Profili verificati, annunci reali e connessioni autentiche in tutta Italia. Più sicuro e affidabile.",
    content: `Bakeca Incontri è stato per anni un punto di riferimento per gli annunci di incontri in Italia. Tuttavia, molti utenti cercano oggi un'alternativa più moderna, sicura e con profili realmente verificati.

## Perché scegliere Incontri di Bakeka?

Incontri di Bakeka nasce proprio per rispondere alle esigenze di chi cerca annunci di incontri verificati in Italia. A differenza di Bakeca Incontri, dove i profili non sono controllati, qui ogni annuncio viene verificato manualmente dal nostro team.

### Vantaggi rispetto a Bakeca Incontri:

1. **Profili Verificati** — Ogni annuncio è controllato manualmente. Niente fake, niente robot.
2. **Annunci su Tutta Italia** — Roma, Milano, Napoli, Torino, Firenze, Bologna e tutte le città italiane.
3. **Sicurezza** — Sistema di messaggistica integrato, chat in tempo reale, segnalazione utenti.
4. **Premium Conveniente** — Crediti flessibili, boost annunci, vetrina premium.
5. **Assistenza Reale** — Team di supporto italiano, risposta in poche ore.

### Cosa cerchi?

Su Incontri di Bakeka trovi annunci per: donna cerca uomo, uomo cerca donna, incontri gay, trans, coppie, massaggi, accompagnatrici, eventi e amicizia.

Registrati gratis su Incontri di Bakeka e scopri la differenza. Non accontentarti di profili non verificati: scegli la qualità, scegli la sicurezza.`,
  },
  {
    title: "Bakeca Incontri: l'alternativa moderna e verificata",
    slug: "bakeca-incontri-alternativa",
    city: null,
    excerpt: "Scopri Incontri di Bakeka, la migliore alternativa a Bakeca Incontri. Profili verificati, annunci reali e connessioni autentiche in tutta Italia. Più sicuro e affidabile di bakecaincontrii.com.",
    content: `Bakeca Incontri è stato per anni un punto di riferimento per gli annunci di incontri in Italia. Oggi Incontri di Bakeka è la migliore alternativa moderna con profili verificati manualmente.

## Perché scegliere Incontri di Bakeka?

A differenza di bakecaincontrii.com, dove i profili non sono controllati, qui ogni annuncio viene verificato manualmente dal nostro team. Questo significa niente fake, niente robot, solo persone reali.

### Vantaggi rispetto a bakecaincontrii.com:

1. **Profili Verificati** — Ogni annuncio è controllato manualmente.
2. **Annunci su Tutta Italia** — Roma, Milano, Napoli, Torino e tutte le città.
3. **Sicurezza** — Sistema di messaggistica integrato, chat in tempo reale.
4. **Premium Conveniente** — Crediti flessibili, boost annunci, vetrina premium.
5. **Assistenza Reale** — Team di supporto italiano.

### Cosa cerchi?

Su Incontri di Bakeka trovi: donna cerca uomo, uomo cerca donna, incontri gay, trans, coppie, massaggi, accompagnatrici, eventi e amicizia.

Registrati gratis e scopri la differenza. Non accontentarti di profili non verificati: scegli qualità e sicurezza.`,
  },
  {
    title: "Premium vs Gratuito: cosa cambia",
    slug: "premium-vs-gratuito",
    city: null,
    excerpt: "Tutte le differenze tra account Premium e gratuito su Incontri di Bakeka. Scopri i vantaggi esclusivi del profilo verificato.",
    content: `Su Incontri di Bakeka offriamo due livelli di esperienza: Gratuito e Premium.

ACCOUNT GRATUITO:
- Pubblicazione annuncio base
- 1 foto visibile
- Messaggistica di base
- Visibilità standard

ACCOUNT PREMIUM:
- Fino a 5 foto
- Badge Premium verificato
- Annuncio in evidenza
- Foto sempre visibili (non sfocate)
- Crediti per potenziamenti

Passare a Premium è semplice: acquista crediti e sblocca tutte le funzionalità. I profili Premium hanno il 70% in più di visualizzazioni e ricevono molti più contatti.

Scegli Premium e trasforma la tua esperienza su Incontri di Bakeka.`,
  },
];

export default function Blog() {
  const { navigate } = useRouter();

  const cityArticles = ARTICLES.filter(a => a.city);
  const guideArticles = ARTICLES.filter(a => !a.city);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 relative">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white mb-6 gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" /> Torna agli annunci
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">Blog — Guide e Consigli</h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Scopri le guide per incontri in tutte le città italiane, consigli di sicurezza e come ottenere il massimo da Incontri di Bakeka.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* GUIDE ARTICLES */}
        {guideArticles.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold font-poppins mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Guide e Consigli
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guideArticles.map((article) => (
                <Card key={article.slug} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.excerpt}</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-line line-clamp-4 mb-4">
                      {article.content}
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => navigate(`/blog/${article.slug}`)}>
                      Leggi tutto <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CITY ARTICLES */}
        <section>
          <h2 className="text-2xl font-bold font-poppins mb-6 flex items-center gap-3">
            <span className="w-1 h-6 bg-primary rounded-full" />
            Guide per Città
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CITIES.map((city) => {
              const article = cityArticles.find(a => a.city === city);
              return (
                <Card
                  key={city}
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/incontri/${city.toLowerCase()}`)}
                >
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{city}</h3>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {article ? "Guida disponibile" : "Annunci nella città"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FOOTER SEO */}
        <section className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30">
          <h2 className="text-xl font-bold font-poppins mb-4">Perché scegliere Incontri di Bakeka</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">✅ Profili verificati</h3>
              <p>Tutti i profili sono controllati manualmente. Niente fake, solo persone reali che cercano incontri autentici.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">🛡️ Privacy garantita</h3>
              <p>I tuoi dati sono al sicuro. Rispettiamo il GDPR e non condividiamo informazioni con terzi.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">🇮🇹 Made in Italy</h3>
              <p>La più grande community italiana per incontri. Da Nord a Sud, copriamo tutte le città con annunci di qualità.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
