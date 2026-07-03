const path = require('path');
const supabase = require(path.join(__dirname, 'supabase.js'));

const femaleNames = ['Sofia','Aurora','Giulia','Ginevra','Alice','Emma','Greta','Martina','Chiara','Sara','Beatrice','Anna','Noemi','Elena','Vittoria','Marta','Lucia','Alessia','Valentina','Camilla','Bianca','Francesca','Rebecca','Arianna','Diana','Stella','Ludovica','Melissa','Irene','Carolina','Luna','Viola','Maya','Gaia','Dafne','Nina','Eva','Cloe','Angelica','Margherita','Miriam','Morgana','Selene','Fiorella','Guendalina','Rachele','Celeste','Eleonora','Matilde','Gioia'];
const maleNames = ['Alessandro','Lorenzo','Mattia','Tommaso','Andrea','Marco','Giovanni','Leonardo','Francesco','Edoardo','Gabriele','Riccardo','Diego','Simone','Fabio','Luca','Alberto','Federico','Nicolò','Samuele','Daniele','Emanuele','Pietro','Davide','Claudio','Roberto','Antonio','Giuseppe','Stefano','Paolo','Michele','Luigi','Gianluca','Christian','Kevin','Alex','Ivan','Mirko','Dario','Raffaele'];
const transNames = ['Alexia','Luna','Maya','Stella','Selene','Diana','Asia','Mya','Bianca','Megan'];
const surnames = ['Rossi','Bianchi','Ferrari','Russo','Romano','Gallo','Costa','Fontana','Conti','Esposito','Ricci','Marino','Greco','Bruno','Rizzo','Barbieri','Moretti','Mancini','De Luca','Giordano','Rinaldi','Caruso','Grassi','Messina','Piras','Lombardi','Leone','Palmieri','Ferretti','Serra','Marchetti','Testa','Vitali','Sartori','Bellini'];
const cities = ['Napoli','Roma','Milano','Torino','Firenze','Bologna','Venezia','Palermo','Genova','Bari','Catania','Verona','Lecce','Salerno','Bergamo','Cagliari'];
const adTitles = [
  (n,c)=>`💎 ${n} - ${c}`, (n,c)=>`🌹 ${n} ti aspetta a ${c}`,
  (n,c)=>`🔥 ${n} - ${c}`, (n,c)=>`✨ ${n} - Elegante a ${c}`,
  (n,c)=>`❤️ ${n} - ${c}`, (n,c)=>`💋 ${n} chiamami a ${c}`,
  (n,c)=>`🌸 ${n} nuova/o a ${c}`, (n,c)=>`⭐ ${n} la migliore a ${c}`
];
const adDescs = [
  (n,a,c)=>`Ciao sono ${n}, ho ${a} anni. Sono una persona solare e socievole. Offro compagnia e momenti indimenticabili. Disponibile per cene, uscite e serate speciali.`,
  (n,a,c)=>`${n} - vera/o ${c} doc! Passionale e disponibile. Ricevo con discrezione in zona centrale. Massaggi e coccole assicurate!`,
  (n,a,c)=>`Sono ${n} e realizzo i tuoi desideri. Ti faro vivere emozioni uniche. Disponibile per incontri in hotel o a domicilio.`,
  (n,a,c)=>`Sono ${n}, ${a} anni. Fascinosa/o, educata/o. Amo l''arte e le cene eleganti. Cerco persone di classe per serate indimenticabili a ${c}.`,
  (n,a,c)=>`Mi chiamo ${n}, ${a} anni. Dolce, educata/o e molto disponibile. Ricevo in zona centrale o vengo io da te. Scrivi su WhatsApp!`,
  (n,a,c)=>`${n} - nuova/o in città! Cercasi compagnia per serate esclusive. Sono solare e divertente. Contattami!`,
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randAge() { return 1988 + Math.floor(Math.random() * 15); }
function randBirth() { const y = randAge(); const m = 1+Math.floor(Math.random()*12); const d = 1+Math.floor(Math.random()*28); return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

async function main() {
  console.log('🌱 Seed 100 utenti + 200 annunci...\n');
  let created = 0, errors = 0;

  for (let i = 1; i <= 100; i++) {
    const gender = i <= 65 ? 'female' : i <= 90 ? 'male' : 'trans';
    const names = gender === 'female' ? femaleNames : gender === 'male' ? maleNames : transNames;
    const name = names[i % names.length];
    const surname = rand(surnames);
    const city = rand(cities);
    const email = `utente${i}@bakeka.test`;
    const birthDate = randBirth();
    const cat = gender === 'female' ? 'donna-cerca-uomo' : gender === 'male' ? 'uomo-cerca-donna' : 'trans';

    process.stdout.write(`[${i}/100] ${name} ${surname} <${email}> (${gender}, ${city})... `);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password: 'Test12345!',
        options: { data: { name, surname } }
      });

      if (authError) {
        if (authError.message.includes('already')) { console.log('↪ già esistente'); errors++; continue; }
        console.log(`✗ ${authError.message}`); errors++; continue;
      }

      const uid = authData.user.id;

      await supabase.from('profiles').upsert({
        id: uid, name, surname, email, city, gender,
        birth_date: birthDate,
        is_verified: Math.random() < 0.3,
        is_premium: Math.random() < 0.2,
        credits: Math.floor(Math.random() * 200)
      });

      // Create 2 ads per user
      const isPremium = Math.random() < 0.2;
      for (let a = 0; a < 2; a++) {
        const t = adTitles[a % adTitles.length](name, city);
        const d = adDescs[(i + a) % adDescs.length](name, 2026 - parseInt(birthDate), city);
        await supabase.from('ads').insert({
          user_id: uid, profile_id: uid,
          title: t, category: cat, city, gender,
          age: 2026 - parseInt(birthDate),
          description: d,
          is_active: true,
          is_premium: isPremium,
          is_verified: Math.random() < 0.3,
          is_sponsored: Math.random() < 0.05,
          photo_classification: Math.random() < 0.6 ? 'safe' : Math.random() < 0.85 ? 'hot' : 'hard',
          views: Math.floor(Math.random() * 5000),
          image: ''
        });
      }

      created++;
      console.log('✅');
    } catch (e) {
      console.log(`💥 ${e.message}`);
      errors++;
    }

    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n✅ Fatto! ${created} utenti creati, ${errors} errori.`);
}

main().catch(console.error);
