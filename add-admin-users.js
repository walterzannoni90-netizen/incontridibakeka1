/**
 * Crea utenti admin bypassando email confirmation
 * Usa SUPABASE_SERVICE_ROLE_KEY per admin.auth.admin.createUser()
 * Richiede: node add-admin-users.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rdqsmfgpbuswzilgbjyr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';

const adminUsers = [
  { email: 'walterzannoni90@outlook.it', password: 'Admin12345!', name: 'Walter', surname: 'Admin' },
  { email: 'walterzannoni90@gmail.com', password: 'Admin12345!', name: 'Walter', surname: 'Admin2' },
  { email: 'Lucianopoleselli@icloud.com', password: 'Admin12345!', name: 'Luciano', surname: 'Admin' }
];

async function main() {
  if (!SERVICE_KEY) {
    console.log('❌ SERVIREBBE SUPABASE_SERVICE_ROLE_KEY nel .env per creare admin');
    console.log('   → Alternativa: registrati manualmente con queste email su bakecaincontrii.com');
    console.log('   → Poi aggiorna il profilo nel DB via SQL:\n');
    console.log('   UPDATE profiles SET is_verified=true, role=\'admin\' WHERE email IN');
    console.log("   ('walterzannoni90@outlook.it','walterzannoni90@gmail.com','Lucianopoleselli@icloud.com');\n");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  for (const u of adminUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, surname: u.surname }
      });
      if (error) {
        console.log(`  ⚠️ ${u.email}: ${error.message}`);
      } else {
        console.log(`  ✅ ${u.email}: admin creato (${data.user.id})`);
      }
    } catch (e) {
      console.log(`  ❌ ${u.email}: ${e.message}`);
    }
  }
  console.log('\n✅ Admin creati!');
}

main().catch(console.error);
