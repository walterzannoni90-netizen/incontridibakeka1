export const ITALIAN_CITIES = [
  "Roma", "Milano", "Napoli", "Torino", "Firenze", "Bologna", "Genova",
  "Palermo", "Bari", "Catania", "Venezia", "Verona", "Brescia", "Padova",
  "Prato", "Parma", "Taranto", "Modena", "Reggio Emilia", "Reggio Calabria",
  "Perugia", "Livorno", "Ravenna", "Cagliari", "Foggia", "Rimini", "Salerno",
  "Ferrara", "Sassari", "Latina", "Giugliano in Campania", "Monza", "Siracusa",
  "Pescara", "Bergamo", "Forlì", "Trento", "Vicenza", "Terni", "Bolzano",
  "Novara", "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena",
  "Lecce", "Pesaro", "Lucca", "Pisa", "Catanzaro", "Como", "Busto Arsizio",
  "Grosseto", "Siena", "Matera", "Pistoia", "Varese", "La Spezia",
  "Pordenone", "Gallarate", "Lodi", "Cremona", "Lecco", "Frosinone",
  "Brindisi", "Massa", "Alessandria", "Asti", "L'Aquila",
  "Campobasso", "Potenza", "Cosenza", "Trani", "Bisceglie", "Caserta",
  "Crotone", "Vibo Valentia", "Enna", "Nuoro", "Olbia", "Oristano",
  "Aosta", "Belluno", "Rovigo", "Treviso", "Gorizia", "Isernia",
  "Teramo", "Chieti", "Ascoli Piceno", "Macerata", "Fermo",
  "Viterbo", "Rieti", "Avellino", "Benevento",
];

export const COUNTRIES = [
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "DE", name: "Germania", flag: "🇩🇪" },
  { code: "ES", name: "Spagna", flag: "🇪🇸" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "GB", name: "Regno Unito", flag: "🇬🇧" },
  { code: "CH", name: "Svizzera", flag: "🇨🇭" },
  { code: "NL", name: "Paesi Bassi", flag: "🇳🇱" },
  { code: "BE", name: "Belgio", flag: "🇧🇪" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "PT", name: "Portogallo", flag: "🇵🇹" },
  { code: "GR", name: "Grecia", flag: "🇬🇷" },
  { code: "IE", name: "Irlanda", flag: "🇮🇪" },
  { code: "US", name: "Stati Uniti", flag: "🇺🇸" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "BR", name: "Brasile", flag: "🇧🇷" },
  { code: "CL", name: "Cile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "MX", name: "Messico", flag: "🇲🇽" },
  { code: "PE", name: "Perù", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "NZ", name: "Nuova Zelanda", flag: "🇳🇿" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "DO", name: "Repubblica Dominicana", flag: "🇩🇴" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "CY", name: "Cipro", flag: "🇨🇾" },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
