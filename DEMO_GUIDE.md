# Smart Finance Demo Guide

Questa guida serve per provare l'app in locale senza pubblicare nulla online e senza usare dati reali.

## Modalita consigliate

### Profilo privato locale

Usalo solo sul tuo computer.

- Inserisci dati reali manualmente.
- Esporta un backup JSON prima di fare prove invasive.
- Non condividere screenshot con importi reali.
- Non condividere il file `.env`.

### Demo sicura

Usala per far vedere l'app ad amici o collaboratori.

- Vai in `Impostazioni`.
- Apri `Dati & Backup`.
- Clicca `Carica Demo`.
- L'app carica dati realistici ma inventati.
- In alto vedrai il badge `Demo sicura`.

## Avvio locale

```bash
npm install
npm run dev
```

Poi apri:

```txt
http://127.0.0.1:5174/
```

## AI

La chiave Groq resta locale nel file `.env`.

Non pubblicare `.env` e non fare deploy pubblico con una chiave frontend. Per una demo ad amici, meglio usare screen share oppure far usare una chiave personale a chi prova l'app.

## Cosa mostrare nella demo

1. Dashboard con badge `Demo sicura`.
2. Entrate e spese caricate dal dataset demo.
3. Investimenti e PAC.
4. Tab `Investimenti > Simulatore`.
5. Proiezione deterministica, Monte Carlo e stress test.
6. Pulsante `Analizza scenario con AI`.
7. Impostazioni: export/import/reset.

## Nota sicurezza

L'app salva i dati in `localStorage`, quindi i dati restano nel browser usato. Non e' ancora una soluzione multiutente o production-ready.

