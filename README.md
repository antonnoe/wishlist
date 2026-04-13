# Wishlist

Wishlist & upvote tool voor Communities Abroad.

## Wat is dit?

Een web-app waarmee abonnees van Infofrankrijk ideeën en wensen kunnen indienen en upvoten. Anton beheert daarnaast een privé-backlog voor ontwikkelprioriteiten.

## Architectuur

- **Frontend:** Next.js (App Router) op Vercel
- **Backend:** Supabase (`communities-tools` project)
- **Auth publiek:** HMAC SSO vanuit Infofrankrijk
- **Auth admin:** extra check op admin-vlag

## Features

### Publiek (IF-abonnees)
- Ideeën indienen
- Upvoten op bestaande ideeën
- Status volgen (idee → gepland → bezig → live)

### Privé (admin)
- Ontwikkel-backlog beheren
- Status wijzigen, archiveren, samenvoegen
- Overzicht publieke + privé items

### API
- `/api/wishlist` — leesbaar door Claude aan het begin van een sessie

### Embed
- `/embed` — standalone widget zonder navigatie, te gebruiken in PresentBoard of als iframe

## Platforms

Items kunnen gekoppeld worden aan: `IF`, `CC`, `DF`, `FK`, `BH`, `NLFR`, `EP`, `overig`

## Status-opties

`idee` · `gepland` · `bezig` · `live` · `verworpen`

## Supabase

Project: `communities-tools`  
Tabellen: `wishlist`, `wishlist_votes`  
RLS: enabled met policies voor public read en service_role full access
