export interface BlogArticle {
  title: string;
  slug: string;
  city: string | null;
  category: "piattaforma" | "pubblicare" | "sicurezza" | "visibilita";
  categoryTitle: string;
  excerpt: string;
  content: string;
  date: string;
  publishedAt: string;
  updatedAt: string;
}

export const blogArticles: BlogArticle[] = [
  {
    title: "Come funziona Incontri di Bakeka",
    slug: "come-funziona-incontri-di-bakeka",
    city: null,
    category: "piattaforma",
    categoryTitle: "La piattaforma",
    date: "16 luglio 2026",
    publishedAt: "2026-07-16",
    updatedAt: "2026-07-16",
    excerpt:
      "Una guida ufficiale per cercare annunci, usare i filtri, aprire un profilo e scegliere come comunicare sulla piattaforma.",
    content: `Incontri di Bakeka è una piattaforma di annunci personali destinata esclusivamente a persone maggiorenni. Gli annunci visibili arrivano dal database della piattaforma: non mostriamo profili dimostrativi per riempire le pagine.

## Cercare un annuncio

Dalla pagina principale puoi scegliere una città e una categoria. I risultati mostrano soltanto gli annunci attivi che corrispondono ai filtri selezionati. Aprendo una scheda trovi la descrizione scritta dall'autore, le informazioni disponibili e gli eventuali metodi di contatto scelti per quell'annuncio.

## Creare un account

L'account serve per pubblicare, gestire i propri annunci e utilizzare le funzioni riservate. Dopo l'accesso puoi controllare i contenuti pubblicati, modificarli o disattivarli dall'area personale. Le credenziali non devono essere condivise con altre persone.

## Messaggi e contatti

Quando un annuncio mette a disposizione messaggi, telefono o WhatsApp, scegli il canale con cui ti senti più sicuro. Prima di condividere informazioni personali verifica che la conversazione sia coerente e non inviare documenti, codici di accesso o dati bancari.

## Segnalazioni

Ogni contenuto può essere segnalato agli amministratori indicando il motivo. La segnalazione è lo strumento corretto quando un annuncio sembra ingannevole, non consensuale, duplicato o contrario alle regole. Una segnalazione non garantisce la rimozione automatica: permette al team di svolgere una verifica.

## Pubblicazione e promozioni

La pubblicazione di base e le promozioni sono funzioni separate. Premium e Vetrina sono facoltativi e hanno durata e costo mostrati prima della conferma. Alla scadenza acquistata la promozione termina; l'annuncio resta gestibile dal proprietario secondo il suo stato reale.`,
  },
  {
    title: "Come creare un annuncio chiaro ed efficace",
    slug: "profilo-perfetto-incontri",
    city: null,
    category: "pubblicare",
    categoryTitle: "Pubblicare",
    date: "15 luglio 2026",
    publishedAt: "2026-07-15",
    updatedAt: "2026-07-16",
    excerpt:
      "Titolo, descrizione, città, categoria e foto: come preparare un annuncio utile senza promesse false o informazioni confuse.",
    content: `Un annuncio efficace non deve sembrare perfetto: deve essere comprensibile, aggiornato e coerente con ciò che cerchi. Le persone decidono se aprire un profilo in pochi secondi, quindi titolo e prima parte della descrizione devono spiegare subito l'intenzione.

## Scrivi un titolo specifico

Evita titoli composti soltanto da parole generiche o ripetute. Indica con semplicità il tipo di conoscenza che cerchi e, se utile, la zona. Non inserire numeri di telefono nel titolo: utilizza i campi dedicati, dove puoi gestirli più facilmente.

## Usa una descrizione originale

Racconta cosa cerchi, come preferisci essere contattato e quali limiti vuoi chiarire. Non copiare il testo di altri annunci e non dichiarare verifiche, servizi o caratteristiche che non puoi dimostrare. Una descrizione sincera riduce contatti fuori tema e segnalazioni.

## Seleziona città e categoria corrette

La città e la categoria determinano dove viene mostrato l'annuncio. Scegli la località effettivamente collegata alla tua disponibilità e la categoria più precisa. Pubblicare copie identiche in molte città rende la ricerca meno utile e può portare alla moderazione dei duplicati.

## Scegli immagini coerenti

Carica soltanto immagini che hai il diritto di utilizzare e che rispettano le regole della piattaforma. Non usare fotografie di altre persone, loghi ingannevoli o immagini che espongono documenti e dati sensibili. Controlla lo sfondo prima del caricamento.

## Aggiorna o disattiva l'annuncio

Se cambiano disponibilità, contatti o obiettivo, modifica il profilo. Quando non vuoi più ricevere richieste, disattivalo invece di lasciare informazioni non aggiornate. Un archivio composto da annunci realmente attivi è più utile sia per gli utenti sia per i motori di ricerca.`,
  },
  {
    title: "Incontri più sicuri: controlli prima di vedersi",
    slug: "incontri-sicuri-italia",
    city: null,
    category: "sicurezza",
    categoryTitle: "Sicurezza",
    date: "14 luglio 2026",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-16",
    excerpt:
      "Una lista concreta di controlli per proteggere dati, denaro e sicurezza personale prima di un incontro organizzato online.",
    content: `Nessuna piattaforma può eliminare ogni rischio. La sicurezza dipende anche dalle scelte fatte durante la conversazione e nell'organizzazione dell'incontro. Procedi con calma e interrompi il contatto quando una richiesta ti mette a disagio.

## Proteggi i dati personali

Non inviare fotografie di documenti, password, codici ricevuti via SMS, indirizzi completi o informazioni bancarie. Usa inizialmente i canali disponibili nella piattaforma e condividi altri recapiti solo quando lo ritieni opportuno.

## Diffida delle richieste di denaro

Non pagare anticipi, viaggi, ricariche, regali o presunte verifiche richieste durante una conversazione. Un'urgenza emotiva o economica non dimostra l'identità della persona. Se qualcuno insiste, interrompi il contatto e segnala il profilo.

## Controlla la coerenza

Confronta titolo, foto, città, età dichiarata e contenuto dei messaggi. Informazioni che cambiano continuamente, risposte automatiche o il rifiuto sistematico di chiarire dettagli semplici sono segnali da valutare con prudenza.

## Organizza il primo incontro

Scegli un luogo pubblico e facilmente raggiungibile. Comunica a una persona fidata dove andrai e stabilisci un orario di rientro. Mantieni autonomi trasporto, telefono e denaro, senza dipendere dall'altra persona.

## Consenso e limiti

Il consenso deve essere libero, informato e revocabile in qualsiasi momento. Un accordo precedente non obbliga nessuno a proseguire. Se una situazione non ti sembra sicura, allontanati e contatta i servizi di emergenza quando necessario.

## Usa la segnalazione

Indica un motivo chiaro e descrivi il comportamento osservato senza pubblicare dati personali. Gli amministratori potranno esaminare il contenuto e adottare le misure previste dalle regole della piattaforma.`,
  },
  {
    title: "Pubblicazione gratuita, Premium e Vetrina: le differenze",
    slug: "premium-vs-gratuito",
    city: null,
    category: "visibilita",
    categoryTitle: "Visibilità",
    date: "13 luglio 2026",
    publishedAt: "2026-07-13",
    updatedAt: "2026-07-16",
    excerpt:
      "Cosa cambia davvero tra annuncio di base e promozioni facoltative, come vengono mostrati costo, durata e scadenza.",
    content: `Su Incontri di Bakeka la pubblicazione di base e le promozioni sono separate. Questo permette di creare e gestire un annuncio senza confondere la sua esistenza con l'acquisto di maggiore visibilità.

## Annuncio di base

L'annuncio di base viene pubblicato secondo i limiti mostrati nell'interfaccia. Puoi inserire i dati richiesti, una prima immagine e i metodi di contatto che vuoi rendere disponibili. L'annuncio resta collegato al tuo account e può essere modificato o disattivato.

## Premium

Premium è una promozione facoltativa applicata a uno specifico annuncio. Durante il periodo acquistato può abilitare il badge e le caratteristiche visive indicate nella piattaforma. Non certifica l'identità dell'autore e non sostituisce i controlli di sicurezza.

## Vetrina

Vetrina aumenta temporaneamente la posizione e la visibilità dell'annuncio. Prima della conferma vengono mostrati durata, costo in crediti e saldo disponibile. Se è prevista una programmazione, vengono mostrati anche l'inizio scelto e il periodo risultante.

## Crediti e conferma

I crediti acquistati vengono aggiunti al profilo dopo la conferma del pagamento. L'utilizzo dei crediti per una promozione richiede una conferma separata. Controlla sempre annuncio selezionato, costo e durata prima di procedere.

## Scadenza reale

Premium e Vetrina terminano alla data calcolata sulla durata acquistata. Il badge o il posizionamento non devono continuare oltre quel momento. La scadenza della promozione non equivale necessariamente alla cancellazione dell'annuncio: sono due stati distinti e visibili nella gestione del profilo.`,
  },
  {
    title: "Come funzionano moderazione e segnalazioni",
    slug: "moderazione-segnalazioni-annunci",
    city: null,
    category: "piattaforma",
    categoryTitle: "La piattaforma",
    date: "12 luglio 2026",
    publishedAt: "2026-07-12",
    updatedAt: "2026-07-16",
    excerpt:
      "Quando segnalare un annuncio, quali informazioni fornire e cosa succede nel pannello di moderazione.",
    content: `La moderazione serve a mantenere la piattaforma utilizzabile e a intervenire sui contenuti che possono violare le regole. Gli utenti aiutano questo processo attraverso la funzione di segnalazione presente negli annunci.

## Quando inviare una segnalazione

Segnala un contenuto quando sospetti uso non autorizzato di immagini, informazioni ingannevoli, minori, minacce, contenuti non consensuali, duplicati ripetuti o attività vietate. Non usare la segnalazione per contestare semplicemente una mancata risposta.

## Scrivi un motivo utile

Descrivi in modo breve ciò che hai osservato. Non aggiungere dati sensibili non necessari e non pubblicare accuse in altre sezioni del sito. Un motivo preciso permette agli amministratori di capire più velocemente cosa controllare.

## Cosa vede l'amministratore

Il pannello raccoglie la segnalazione e il riferimento all'annuncio. L'amministratore può confrontare il contenuto con le regole e decidere l'azione appropriata. La decisione può richiedere tempo e non viene determinata automaticamente dal numero di segnalazioni.

## Verifica e badge

Un eventuale badge di verifica è uno stato specifico mostrato sul profilo. Non deve essere confuso con Premium o Vetrina, che sono promozioni di visibilità. Anche in presenza di un badge, mantieni le normali precauzioni prima di condividere dati o incontrare qualcuno.

## Situazioni urgenti

La segnalazione interna non sostituisce le autorità o i servizi di emergenza. Se esiste un pericolo immediato, conserva le informazioni necessarie senza diffonderle pubblicamente e contatta il servizio competente.`,
  },
  {
    title: "Privacy nei messaggi e nei contatti",
    slug: "privacy-messaggi-contatti",
    city: null,
    category: "sicurezza",
    categoryTitle: "Sicurezza",
    date: "11 luglio 2026",
    publishedAt: "2026-07-11",
    updatedAt: "2026-07-16",
    excerpt:
      "Come decidere quali recapiti mostrare, quali dati evitare e come gestire una conversazione con maggiore prudenza.",
    content: `Un annuncio può contenere diversi metodi di contatto. La scelta corretta dipende dal livello di esposizione che accetti e dal modo in cui vuoi gestire le conversazioni.

## Parti dalle informazioni necessarie

Titolo, città, categoria e descrizione sono sufficienti per presentare l'annuncio. Evita di inserire indirizzo di casa, luogo di lavoro, documenti, targhe o abitudini che permettono di ricostruire facilmente i tuoi spostamenti.

## Messaggi interni

I messaggi interni separano la prima conversazione dai recapiti personali. Usali per chiarire intenzioni e disponibilità. Non aprire file inattesi e non seguire istruzioni che chiedono codici di accesso o verifiche effettuate su siti sconosciuti.

## Telefono e WhatsApp

Se scegli di pubblicare un numero, considera l'uso di impostazioni privacy dedicate e controlla quali informazioni sono visibili nel profilo dell'app di messaggistica. Puoi rimuovere o modificare il recapito aggiornando l'annuncio.

## Foto e metadati

Prima del caricamento controlla che l'immagine non mostri documenti, indirizzi o persone che non hanno acconsentito. È utile conservare una copia originale e utilizzare soltanto contenuti di cui possiedi i diritti.

## Dopo una conversazione problematica

Interrompi il contatto, conserva soltanto gli elementi necessari per una segnalazione e non rilanciare pubblicamente dati personali. Cambia password se hai condiviso per errore credenziali o codici e contatta il servizio interessato in caso di dati finanziari esposti.`,
  },
  {
    title: "Come riconoscere un annuncio sospetto",
    slug: "riconoscere-annunci-sospetti",
    city: null,
    category: "sicurezza",
    categoryTitle: "Sicurezza",
    date: "10 luglio 2026",
    publishedAt: "2026-07-10",
    updatedAt: "2026-07-16",
    excerpt:
      "Segnali pratici da controllare in foto, descrizione e conversazione prima di fidarti di un profilo.",
    content: `Un singolo dettaglio insolito non dimostra che un annuncio sia falso. Più incoerenze insieme, però, richiedono prudenza e possono giustificare una segnalazione.

## Testo incoerente o copiato

Controlla se titolo, città e descrizione parlano della stessa situazione. Frasi generiche ripetute, località diverse nello stesso testo o risposte che ignorano completamente le domande possono indicare un contenuto riciclato.

## Pressione e urgenza

Diffida di chi prova a spostare immediatamente la conversazione, chiede denaro o crea un'emergenza per impedirti di riflettere. Una richiesta urgente non rende verificata l'identità della persona.

## Promesse eccessive

Nessun badge di visibilità garantisce affidabilità, disponibilità o risultato dell'incontro. Premium e Vetrina indicano una promozione temporanea dell'annuncio, non una garanzia sul comportamento dell'autore.

## Immagini non coerenti

Foto con stili completamente diversi, loghi di altri siti o dettagli geografici incompatibili meritano attenzione. Non condividere o ripubblicare le immagini: utilizza la segnalazione indicando il dubbio.

## Richieste tecniche insolite

Non installare applicazioni di controllo remoto e non comunicare codici ricevuti via SMS. La piattaforma non ha bisogno della password del tuo account o dei dati completi della carta per verificare un altro utente.

## Cosa fare

Interrompi la conversazione, non inviare pagamenti e segnala l'annuncio con una motivazione precisa. In presenza di minacce o rischio immediato, rivolgiti alle autorità competenti.`,
  },
  {
    title: "Gestire annunci, visibilità e scadenze",
    slug: "gestire-annuncio-scadenze-visibilita",
    city: null,
    category: "visibilita",
    categoryTitle: "Visibilità",
    date: "9 luglio 2026",
    publishedAt: "2026-07-09",
    updatedAt: "2026-07-16",
    excerpt:
      "Come controllare lo stato dell'annuncio e distinguere pubblicazione, Premium, Vetrina e relative scadenze.",
    content: `L'annuncio e le sue promozioni hanno stati separati. Comprendere questa distinzione evita di confondere la presenza del contenuto con la durata di Premium o Vetrina.

## Stato dell'annuncio

Un annuncio attivo può comparire nella ricerca e nelle pagine della città o categoria. Se viene disattivato, non deve essere incluso nelle pagine pubbliche generate per i motori di ricerca. Il proprietario può controllarne lo stato dall'area personale.

## Stato di Premium

Premium è attivo soltanto fino alla data calcolata dopo la conferma. Scaduto il periodo, il badge e le caratteristiche associate non devono essere considerate attive. L'eventuale rinnovo è una nuova scelta e non deve avvenire automaticamente senza conferma.

## Stato della Vetrina

La Vetrina può iniziare subito oppure alla data programmata, quando questa opzione è disponibile. La fine deriva dalla durata scelta. Prima dell'inizio programmato e dopo la scadenza, l'annuncio non deve ricevere i vantaggi di quella promozione.

## Modifiche durante una promozione

Aggiorna soltanto informazioni reali e coerenti. Cambiare titolo o fotografia non dovrebbe estendere la scadenza acquistata. Se disattivi l'annuncio, controlla lo stato della promozione prima di effettuare altri acquisti.

## Controllo delle visualizzazioni

Le visualizzazioni dell'annuncio e le visite generali del sito sono metriche diverse. Una visita alla homepage non incrementa automaticamente il contatore di ogni annuncio. Il conteggio dell'annuncio aumenta quando un visitatore reale apre quella specifica scheda secondo le regole anti-duplicazione della piattaforma.`,
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}

export function getArticlesByCity(city: string): BlogArticle[] {
  return blogArticles.filter((article) => article.city === city);
}

export function getArticlesByCategory(category: string): BlogArticle[] {
  return blogArticles.filter((article) => article.category === category);
}

export function getAllCities(): string[] {
  return [];
}

export function getAllCategories(): { slug: string; title: string }[] {
  const seen = new Set<string>();
  return blogArticles
    .filter((article) => {
      if (seen.has(article.category)) return false;
      seen.add(article.category);
      return true;
    })
    .map((article) => ({
      slug: article.category,
      title: article.categoryTitle,
    }));
}
