# Famille Gros-Stoltz

App web mobile (PWA, à installer sur l'iPhone) pour que Thomas et Julia préparent ensemble l'arrivée du bébé : suivi de la grossesse semaine par semaine, jalons et rendez-vous, to-do, achats, comparatifs, chat sur les aliments et substances.

## Avancement

- [x] Étape 1 : squelette, navigation, calcul des SA, page Grossesse
- [x] Étape 2 : Supabase (connexion par lien magique, foyer partagé, temps réel)
- [x] Étape 3 : To-do et Achats
- [x] Étape 4 : Calendrier et rendez-vous
- [ ] Étape 5 : Comparatifs
- [ ] Étape 6 : Chat
- [x] Étape 7 : Mise en ligne (https://famille-gros-stoltz.vercel.app)

## Lancer en local

```sh
npm install
cp .env.example .env.local   # puis renseigner la clé anon Supabase
npm run dev
```

Sans fichier `.env.local`, l'app tourne en mode local : les données restent sur l'appareil.

## Mettre en place Supabase

1. Supabase > SQL Editor > New query : coller `supabase/migrations/001_init.sql`, puis Run.
2. Authentication > URL Configuration : mettre l'adresse de l'app en ligne dans « Site URL » et « Redirect URLs ».
3. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (dans `.env.local` ou dans Vercel).

## Organisation

- `src/pages` : écrans
- `src/lib` : dates (SA, SG, trimestre), Supabase, synchronisation
- `src/data/fetus.ts` : repères de développement par semaine
- `seed/` : données initiales du projet, chargées à la création du foyer
- `supabase/migrations` : schéma de la base et règles d'accès
