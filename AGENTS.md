# Regole principali per agenti AI

Queste regole hanno priorità per qualsiasi agente AI che lavori in questo repository.

## Secret e credenziali

- Usa secret, token, password e chiavi API solo quando sono necessari per un'attività autorizzata.
- Non mostrare mai il valore di un secret in risposte, log, screenshot, errori, file generati o output dei comandi.
- Non inserire mai secret nel codice sorgente, nei commit, nelle pull request, nella documentazione o nei file `.env` versionati.
- Non leggere o recuperare il valore completo di un secret quando è sufficiente verificarne la presenza o usare il servizio che lo contiene.
- Non modificare, ruotare, eliminare o sostituire secret senza autorizzazione esplicita del proprietario.
- Usa GitHub Secrets per GitHub Actions e Supabase Secrets per Edge Functions e backend Supabase.
- Nel frontend usa esclusivamente valori pubblicabili, come la chiave Supabase anon/publishable e la chiave Stripe publishable. Non esporre mai chiavi `service_role` o Stripe secret.
- Quando un test richiede credenziali, evita di stamparle e redigi qualsiasi output prima di mostrarlo.
- Se un secret compare accidentalmente in un file o in un log, interrompi la pubblicazione, avvisa il proprietario e suggerisci la rotazione immediata.

## Verifiche consentite

- Puoi controllare che i secret richiesti esistano e che i servizi rispondano correttamente.
- Puoi usare i secret tramite i secret manager già configurati, senza estrarne o divulgarne il valore.
- Nei report indica soltanto il nome della variabile e lo stato, ad esempio `STRIPE_SECRET_KEY: configurato`.

## Pubblicazione

- Prima di ogni commit controlla che la modifica non contenga credenziali o dati personali.
- Mantieni i file `.env*` locali esclusi da Git, salvo template senza valori come `.env.example`.
- Non includere account di prova, password o token nelle descrizioni delle pull request.
