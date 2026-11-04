# GOZO LIVRAISON — Livraison à moto à Gagnoa

Application web progressive (PWA) de livraison à moto : interface **client** (`/app`), interface **livreur** (`/livreur`) et **panneau d'administration** (`/admin`), avec suivi GPS en temps réel et tarification automatique (500 FCFA les 4 premiers km, puis 200 FCFA/km).

## 📘 Mise en ligne

**Lisez [GUIDE_DEPLOIEMENT.md](./GUIDE_DEPLOIEMENT.md)** : il explique étape par étape l'hébergement (Vercel + PostgreSQL), les variables d'environnement, l'envoi des SMS de connexion, le paramétrage métier et l'installation sur les téléphones.

## Démarrage local (développeur)

```bash
npm install
cp .env.example .env            # puis renseigner DATABASE_URL (PostgreSQL local ou hébergé)
npx drizzle-kit push --config=drizzle.config.prod.ts   # crée les tables
npm run dev                     # http://localhost:3000
```

Ouvrir `http://localhost:3000/api/health` une première fois pour insérer les données de départ (quartiers de Gagnoa, grille tarifaire, administrateurs).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm run start` | Build et serveur de production |
| `npm run typecheck` | Vérification TypeScript |
| `npx drizzle-kit push --config=drizzle.config.prod.ts` | Création / mise à jour des tables sur la base indiquée par `DATABASE_URL` |

## Variables d'environnement

Voir `.env.example`. En production : `DATABASE_URL`, `GOZO_ADMIN_PHONES`, `SMS_GATEWAY_URL`, `SMS_GATEWAY_KEY`. Ne jamais activer `NEXT_PUBLIC_GOZO_DEMO=true` sur un site public.

## Technologies

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL · Leaflet / OpenStreetMap
