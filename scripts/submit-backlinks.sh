#!/bin/bash
# =============================================================
# BACKLINK SUBMISSION — Incontri di Bakeka
# =============================================================
# Apri i link seguenti e registra il sito su ogni directory.
# Alcune richiedono registrazione gratuita, altre sono dirette.
# =============================================================

SITE="https://incontridibakeka.com"
TITLE="Incontri di Bakeka"
DESC="Marketplace per incontri e amicizie in Italia. Profili verificati, connessioni reali. Annunci di incontri a Roma, Milano, Napoli e tutte le città italiane."
EMAIL="walterzannoni90@gmail.com"
CATEGORY="Incontri, Annunci, Dating"

echo "=================================="
echo "  BACKLINK SUBMISSION TOOL"
echo "  $TITLE"
echo "=================================="
echo ""

# Directory che accettano submission via web
echo "Apri questi link nel browser e compila i form:"
echo ""

declare -A DIRS
DIRS["Elinko.it"]="https://www.elinko.it/inserisci-sito/"
DIRS["MrLink.it"]="https://www.mrlink.it/contatti/"
DIRS["Hotfrog.it"]="https://www.hotfrog.it/aggiungere-azienda"
DIRS["NuovoSito.com"]="https://www.nuovosito.com/inserisci-sito.asp"
DIRS["FreeOnline.org"]="https://www.freeonline.org/submit.php"
DIRS["Gratis.it"]="https://www.gratis.it/aj/aggiungi.php"
DIRS["Segnala.it"]="https://www.segnala.it/aggiungi-sito/"
DIRS["Aziende-Italiane"]="https://www.aziende-italiane-siti.it/inserisci-sito/"
DIRS["PagineBianche"]="https://www.paginebianche.it/inserisci-attivita"
DIRS["Tuttitalia"]="https://www.tuttitalia.it/segnala-sito/"
DIRS["InItalia"]="https://www.initalia.it/inserisci-sito/"
DIRS["SitiWebItalia"]="https://www.sitiwebitalia.net/aggiungi-sito/"
DIRS["WebItalia"]="https://www.webitalia.net/segnala/"
DIRS["ItaliaIndice"]="https://www.italiaindice.it/inserisci-sito/"

for name in "${!DIRS[@]}"; do
  echo "  ➤ $name"
  echo "    ${DIRS[$name]}"
  echo ""
done

echo "=================================="
echo "  PROFILI SOCIAL DA CREARE"
echo "=================================="
echo "  ➤ Instagram: https://instagram.com"
echo "    Usa email: $EMAIL"
echo "    Nome profilo: incontri_di_bakeka"
echo "    Bio: Marketplace incontri Italia 🇮🇹 Profili verificati"
echo "    Link in bio: $SITE"
echo ""
echo "  ➤ TikTok: https://tiktok.com"
echo "    Usa email: $EMAIL"
echo "    Nome profilo: incontridibakeka"
echo "    Bio: Il marketplace per incontri piu affidabile d'Italia"
echo "    Link in bio: $SITE"
echo ""
echo "  ➤ Facebook: https://facebook.com"
echo "    Crea pagina: Incontri di Bakeka"
echo "    Categoria: Incontri/Amicizie"
echo "    Link: $SITE"
echo ""
echo "  ➤ Twitter/X: https://x.com"
echo "    Handle: @IncontriBakeka"
echo "    Bio: Annunci incontri Italia | Profili verificati"
echo "    Link: $SITE"
echo ""

echo "=================================="
echo "  GOOGLE SEARCH CONSOLE"
echo "=================================="
echo "  1. Vai a: https://search.google.com/search-console"
echo "  2. Accedi con l'account Google dell'azienda"
echo "  3. Aggiungi proprieta: $SITE"
echo "  4. Verifica: DNS (aggiungi record TXT) o file HTML"
echo "  5. Invia sitemap: $SITE/sitemap.xml"
echo ""

echo "=================================="
echo "  GOOGLE BUSINESS PROFILE"
echo "=================================="
echo "  1. Vai a: https://business.google.com/"
echo "  2. Crea profilo con nome attivita: Incontri di Bakeka"
echo "  3. Categoria: Sito di incontri / Servizi online"
echo "  4. Aggiungi sito web: $SITE"
echo ""

echo "=================================="
echo "  ALTRE STRATEGIE"
echo "=================================="
echo "  ➤ Forum Italiani:"
echo "    - https://forumfree.net (firma con link)"
echo "    - https://forumcommunity.net (firma con link)"
echo "    - https://incontri.forumfree.it"
echo ""
echo "  ➤ Commenti blog:"
echo "    - Cerca \"incontri blog Italia\" su Google"
echo "    - Lascia commenti pertinenti con link al sito"
echo ""
echo "  ➤ Guest Post:"
echo "    - Contatta blog di settore"
echo "    - Offri articoli con link al sito"
echo ""

echo "FATTO! Buona indicizzazione! 🚀"
