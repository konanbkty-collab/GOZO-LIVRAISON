# GOZO LIVRAISON — Guide de déploiement

> **À qui s'adresse ce guide ?** Au développeur ou prestataire chargé de mettre l'application en ligne pour GOZO LIVRAISON (Gagnoa, Côte d'Ivoire). Le gérant peut le lire pour suivre l'avancement : les étapes marquées **[Gérant]** le concernent directement.
>
> **Durée estimée :** 2 à 4 heures pour une première mise en ligne (hors souscription aux services SMS et paiement, qui dépendent des fournisseurs).
>
> **Résultat attendu :** une adresse web permanente et sécurisée (HTTPS) — par exemple `https://gozolivraison.ci` — que les clients et les livreurs ouvrent sur leur téléphone et ajoutent à leur écran d'accueil comme une application.

---

## Sommaire

0. [Ce que contient le projet](#0-ce-que-contient-le-projet)
1. [Prérequis](#1-prérequis)
2. [Variables d'environnement](#2-variables-denvironnement)
3. [Créer la base de données PostgreSQL](#3-créer-la-base-de-données-postgresql)
4. [Mettre le code sur GitHub](#4-mettre-le-code-sur-github)
5. [Déployer sur Vercel](#5-déployer-sur-vercel)
6. [Configurer l'envoi des SMS (codes de connexion)](#6-configurer-lenvoi-des-sms-codes-de-connexion)
7. [Paramétrage métier après la mise en ligne](#7-paramétrage-métier-après-la-mise-en-ligne)
8. [Nom de domaine personnalisé](#8-nom-de-domaine-personnalisé)
9. [Installation sur les téléphones](#9-installation-sur-les-téléphones)
10. [Paiements Mobile Money et carte bancaire](#10-paiements-mobile-money-et-carte-bancaire)
11. [Mises à jour, sauvegardes et supervision](#11-mises-à-jour-sauvegardes-et-supervision)
12. [Dépannage](#12-dépannage)
13. [Publication sur Play Store / App Store (optionnel)](#13-publication-sur-play-store--app-store-optionnel)
- [Annexe A — Commandes SQL utiles](#annexe-a--commandes-sql-utiles)
- [Annexe B — Fichiers à connaître](#annexe-b--fichiers-à-connaître)
- [Annexe C — Liste de contrôle avant ouverture au public](#annexe-c--liste-de-contrôle-avant-ouverture-au-public)

---

## 0. Ce que contient le projet

GOZO LIVRAISON est une **application web progressive (PWA)** : un seul site, trois interfaces, installable sur Android et iPhone depuis le navigateur, sans passer par les boutiques d'applications.

| Interface | Adresse | Usage |
|---|---|---|
| Page d'accueil | `/` | Présentation publique, tarif, boutons d'appel et WhatsApp |
| Client | `/app` | Commander une livraison, voir le tarif, suivre le livreur en direct |
| Livreur | `/livreur` | Recevoir les courses, naviguer (Google Maps / Waze), confirmer la remise (signature / photo) |
| Administration | `/admin` | Attribuer les courses, gérer la flotte, la grille tarifaire, les paiements |
| API | `/api/*` | Utilisée par les interfaces (authentification OTP, commandes, GPS…) |
| Santé | `/api/health` | Vérifie la base de données **et initialise les données de départ** |

**Technologies :** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL · Leaflet / OpenStreetMap (fonds de carte CARTO).

**Règle tarifaire codée par défaut :** 500 FCFA pour les 4 premiers kilomètres, puis 200 FCFA par kilomètre supplémentaire — modifiable sans toucher au code depuis `/admin/tarifs`.

---

## 1. Prérequis

### Comptes à créer (gratuits au départ)

| Service | Rôle | Adresse |
|---|---|---|
| **GitHub** | Héberge le code source et déclenche les mises à jour | https://github.com |
| **Vercel** | Héberge et exécute l'application Next.js | https://vercel.com |
| **Neon** (ou Supabase) | Base de données PostgreSQL hébergée | https://neon.tech · https://supabase.com |

> ⚠️ **Usage commercial :** le plan gratuit « Hobby » de Vercel est réservé à un usage **non commercial**. GOZO étant une activité commerciale, prévoyez le plan **Pro** (environ 20 $/mois) ou un autre hébergeur (voir § 5.5). Le plan gratuit peut servir pour les tests.

### Sur l'ordinateur du développeur

- **Node.js 20 LTS ou plus récent** (https://nodejs.org) et `npm`.
- **Git** (https://git-scm.com).
- Le **fichier ZIP** du projet, décompressé dans un dossier (ex. `gozo-livraison/`).

### Informations à obtenir du gérant **[Gérant]**

- Le ou les **numéros de téléphone des administrateurs** (gérant, responsable des opérations).
- Les **numéros d'appel / WhatsApp** à afficher (actuellement ceux de l'affiche : 05 64 66 11 09 et 07 57 31 52 68).
- Le **nom de domaine** souhaité (ex. `gozolivraison.ci`), si vous en voulez un.
- L'accès à un **fournisseur de SMS** (étape 6).

---

## 2. Variables d'environnement

L'application se configure entièrement par **variables d'environnement**. Elles se saisissent dans l'interface de Vercel (*Settings → Environment Variables*) et, pour les tests locaux, dans un fichier `.env` à la racine du projet (modèle : `.env.example`).

| Variable | Obligatoire | Rôle | Exemple |
|---|---|---|---|
| `DATABASE_URL` | **Oui** | Adresse de connexion PostgreSQL | `postgresql://user:motdepasse@hote/base?sslmode=require` |
| `GOZO_ADMIN_PHONES` | **Oui en production** | Numéro(s) autorisé(s) à ouvrir `/admin`, séparés par des virgules | `0707070707,0505050505` |
| `SMS_GATEWAY_URL` | **Oui en production** | URL de la passerelle qui envoie les SMS de connexion | `https://api.fournisseur.com/send` |
| `SMS_GATEWAY_KEY` | **Oui en production** | Clé secrète transmise à la passerelle (`Authorization: Bearer …`) | `sk_live_…` |
| `NEXT_PUBLIC_GOZO_DEMO` | Non | `true` = **mode démonstration** (voir ci-dessous). **Ne jamais mettre `true` sur un site public.** | *(ne pas définir en production)* |

### Le mode démonstration, à comprendre absolument

Quand `NEXT_PUBLIC_GOZO_DEMO=true` :
- les **codes OTP s'affichent à l'écran** au lieu d'être envoyés par SMS — **n'importe qui peut donc se connecter avec n'importe quel numéro, y compris celui de l'administrateur** ;
- cinq **livreurs fictifs** sont créés dans la base ;
- des **raccourcis « numéros de démonstration »** apparaissent sur les écrans de connexion.

C'est parfait pour tester, **inacceptable pour un site ouvert au public**. En production, ne définissez pas cette variable : sans passerelle SMS configurée, la connexion affichera alors « L'envoi de SMS n'est pas encore configuré » — c'est voulu, le site reste fermé tant que les SMS ne fonctionnent pas.

> 💡 Les variables commençant par `NEXT_PUBLIC_` sont intégrées **au moment du build**. Après toute modification de `NEXT_PUBLIC_GOZO_DEMO`, il faut **redéployer** (Vercel : *Deployments → ⋯ → Redeploy*).

---

## 3. Créer la base de données PostgreSQL

### Option A — Neon (recommandé)

1. Créez un compte sur https://neon.tech et cliquez **New Project**.
2. Nom : `gozo-livraison`. Région : **Europe (Frankfurt)** — la plus proche de la Côte d'Ivoire parmi celles proposées. Version PostgreSQL : la dernière proposée.
3. Une fois le projet créé, ouvrez **Connection Details** (ou le bouton *Connect*).
4. Récupérez **deux** adresses de connexion :
   - l'adresse **pooled** (le nom d'hôte contient `-pooler`) → à utiliser comme `DATABASE_URL` de l'application ;
   - l'adresse **directe** (sans `-pooler`) → à utiliser une seule fois pour créer les tables (étape 5.3).

   Elles ressemblent à :
   `postgresql://gozo_owner:AbCd1234@ep-xxxx-pooler.eu-central-1.aws.neon.tech/gozo?sslmode=require`
5. Conservez ces adresses dans un endroit sûr (gestionnaire de mots de passe). **Ne les partagez jamais par WhatsApp ou e-mail en clair.**

### Option B — Supabase

1. Créez un projet sur https://supabase.com, région **Europe (Frankfurt)** ou **West EU**.
2. *Project Settings → Database → Connection string*.
3. Prenez l'URL **Session pooler (port 5432)** pour créer les tables, et l'URL **Transaction pooler (port 6543)** pour `DATABASE_URL` de l'application. Remplacez `[YOUR-PASSWORD]` par le mot de passe choisi à la création.

---

## 4. Mettre le code sur GitHub

Le code doit être dans un dépôt GitHub pour que Vercel puisse le déployer (et se redéployer à chaque mise à jour).

```bash
# 1. Décompresser le ZIP puis se placer dans le dossier
cd gozo-livraison

# 2. Vérifier que les secrets ne partiront pas sur GitHub
cat .gitignore        # doit contenir : node_modules/, .next/, .env

# 3. Initialiser le dépôt
git init
git add .
git commit -m "GOZO LIVRAISON — version initiale"
```

4. Sur GitHub, créez un dépôt **privé** nommé `gozo-livraison` (*New repository*, sans README ni .gitignore).
5. Reliez et envoyez le code (remplacez `VOTRE-COMPTE`) :

```bash
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/gozo-livraison.git
git push -u origin main
```

> ✅ Vérifiez sur GitHub que le fichier **`.env` n'apparaît pas** dans le dépôt. S'il y est, supprimez-le immédiatement du dépôt et changez le mot de passe de la base de données.

---

## 5. Déployer sur Vercel

### 5.1 Importer le projet

1. Connectez-vous sur https://vercel.com avec votre compte GitHub.
2. **Add New → Project → Import** le dépôt `gozo-livraison`.
3. Vercel détecte automatiquement **Next.js**. Laissez les réglages par défaut (*Build Command* : `npm run build`, *Output* : par défaut).

### 5.2 Saisir les variables d'environnement **avant** le premier déploiement

Dans la section **Environment Variables** de l'écran d'import (ou plus tard dans *Settings → Environment Variables*), ajoutez, pour les environnements **Production** et **Preview** :

| Nom | Valeur |
|---|---|
| `DATABASE_URL` | l'adresse **pooled** de Neon (étape 3) |
| `GOZO_ADMIN_PHONES` | les numéros administrateurs, ex. `0707070707,0505050505` |
| `SMS_GATEWAY_URL` | *(à renseigner à l'étape 6 — peut attendre)* |
| `SMS_GATEWAY_KEY` | *(idem)* |

> ⚠️ `DATABASE_URL` doit être présente **au moment du build**, sinon le build échoue avec le message `DATABASE_URL is required`.

Cliquez **Deploy**. Le premier déploiement dure 1 à 3 minutes. Vous obtenez une adresse du type `https://gozo-livraison.vercel.app`.

### 5.3 Créer les tables dans la base de production

Les tables ne sont pas créées automatiquement. Depuis l'ordinateur du développeur, dans le dossier du projet :

```bash
# 1. Installer les dépendances (une seule fois)
npm install

# 2. Créer un fichier .env LOCAL contenant l'adresse DIRECTE (non pooled) de Neon
#    (ce fichier reste sur votre ordinateur ; il est ignoré par Git)
echo 'DATABASE_URL=postgresql://...adresse-directe...?sslmode=require' > .env

# 3. Créer / mettre à jour les tables
npx drizzle-kit push --config=drizzle.config.prod.ts
```

Répondez **Yes** aux confirmations. Les 9 tables (`users`, `sessions`, `otp_codes`, `drivers`, `quartiers`, `pricing_config`, `orders`, `order_events`, `payments`) sont créées.

> Cette commande est **à relancer à chaque fois que le fichier `src/db/schema.ts` change** lors d'une mise à jour de l'application.

### 5.4 Initialiser les données de départ

Ouvrez dans un navigateur : `https://VOTRE-ADRESSE.vercel.app/api/health`

Réponse attendue : `{"status":"ok","service":"gozo-livraison"}`. Ce premier appel insère automatiquement :
- les **quartiers et lieux de Gagnoa** avec leurs coordonnées GPS ;
- la **grille tarifaire** par défaut (500 FCFA / 4 km, +200 FCFA/km, majorations nuit et pluie, commission 15 %) ;
- les **comptes administrateurs** correspondant à `GOZO_ADMIN_PHONES`.

Puis ouvrez `https://VOTRE-ADRESSE.vercel.app/` : la page d'accueil GOZO doit s'afficher.

### 5.5 Alternatives à Vercel

L'application est un projet Next.js standard. Elle tourne sur n'importe quel hébergeur Node.js :

- **Railway, Render, Fly.io** : connectez le dépôt GitHub, définissez les mêmes variables d'environnement, commande de build `npm run build`, commande de démarrage `npm run start`, port `3000`.
- **Serveur dédié / VPS (Ubuntu)** : installez Node.js 20+, puis `npm ci && npm run build && npm run start` (gardé en vie par `pm2`), derrière un reverse proxy **Caddy** ou **Nginx** qui fournit le **HTTPS** (obligatoire : sans HTTPS, ni le GPS ni l'installation sur l'écran d'accueil ne fonctionnent). Réglez le fuseau horaire du serveur sur `UTC` ou `Africa/Abidjan` (identiques) pour que la majoration de nuit s'applique aux bonnes heures.

---

## 6. Configurer l'envoi des SMS (codes de connexion)

La connexion des clients, livreurs et administrateurs se fait par **code à 6 chiffres envoyé par SMS** (OTP). Sans cela, personne ne peut se connecter en production.

### 6.1 Ce que l'application envoie

À chaque demande de code, l'application effectue la requête suivante vers `SMS_GATEWAY_URL` :

```http
POST {SMS_GATEWAY_URL}
Content-Type: application/json
Authorization: Bearer {SMS_GATEWAY_KEY}

{
  "to": "+2250707070707",
  "message": "GOZO LIVRAISON — Votre code de vérification est : 123456"
}
```

Toute réponse HTTP **2xx** est considérée comme un envoi réussi. En cas d'échec, l'utilisateur voit « Impossible d'envoyer le SMS pour le moment ».

### 6.2 Choisir un fournisseur

Deux possibilités :

1. **Fournisseur compatible avec ce format** (ou petite passerelle intermédiaire que vous hébergez) : il suffit de renseigner `SMS_GATEWAY_URL` et `SMS_GATEWAY_KEY`.
2. **Fournisseur avec son propre format d'API** (cas le plus fréquent) : adaptez la fonction `sendSms()` dans le fichier `src/app/api/auth/otp/route.ts` (une vingtaine de lignes) selon la documentation du fournisseur — en général, changer le nom des champs (`to`, `message`), l'en-tête d'authentification et l'URL suffit.

Fournisseurs couramment utilisés en Afrique de l'Ouest, **à comparer** (couverture des opérateurs ivoiriens Orange / MTN / Moov, prix par SMS, identifiant d'expéditeur « GOZO ») : les API SMS des opérateurs, **Africa's Talking**, **Twilio**, **LeTexto** (acteur ivoirien), entre autres. Vérifiez leurs conditions avant de souscrire.

### 6.3 Tester

1. Renseignez `SMS_GATEWAY_URL` et `SMS_GATEWAY_KEY` dans Vercel, puis **Redeploy**.
2. Sur `/app`, saisissez un vrai numéro : le SMS doit arriver en quelques secondes.
3. Le code est valable **10 minutes** et à usage unique.

> **Budget :** comptez un SMS par connexion (les sessions durent 30 jours, un client ne se reconnecte donc pas à chaque commande).

---

## 7. Paramétrage métier après la mise en ligne

### 7.1 Première connexion administrateur **[Gérant]**

1. Ouvrez `https://VOTRE-ADRESSE/admin` sur votre téléphone.
2. Saisissez votre numéro (celui déclaré dans `GOZO_ADMIN_PHONES`) et le code reçu par SMS.
3. Vous arrivez sur le **tableau de bord**.

### 7.2 Vérifier la grille tarifaire (`/admin → Tarification`) **[Gérant]**

Valeurs installées par défaut — **à confirmer ou modifier** :

| Paramètre | Défaut | Commentaire |
|---|---|---|
| Tarif de base | 500 FCFA | pour la distance incluse |
| Distance incluse | 4 km | |
| Prix par km supplémentaire | 200 FCFA | |
| Tarif minimum | 500 FCFA | |
| **Majoration de nuit** | **200 FCFA** de 22 h à 6 h | mettez **0** si vous ne souhaitez pas de majoration |
| **Majoration intempéries** | **100 FCFA** | non appliquée automatiquement ; mettez 0 si inutile |
| **Commission GOZO** | **15 %** | part retenue sur chaque course ; le reste est le revenu du livreur |

Enregistrez. Les nouveaux tarifs s'appliquent immédiatement aux prochaines commandes.

### 7.3 Enregistrer les vrais livreurs (`/admin → Livreurs`) **[Gérant]**

1. **+ Ajouter un livreur** : nom, numéro de téléphone (c'est avec ce numéro qu'il se connectera sur `/livreur`), véhicule, plaque.
2. Le livreur ouvre `/livreur`, se connecte par SMS, puis bascule **En ligne** pour recevoir des courses.
3. **Attribution automatique** : chaque nouvelle commande est proposée au livreur *en ligne* le plus proche du point de départ ; s'il refuse, elle passe au suivant. Vous pouvez aussi **attribuer manuellement** depuis `/admin → Commandes`.

### 7.4 Nettoyer les données de test

Si l'application a été testée en mode démonstration sur la base de production, supprimez les livreurs fictifs et les commandes de test (voir **Annexe A**). Si vous avez testé sur une base séparée, rien à faire.

### 7.5 Vérifier les quartiers de Gagnoa

Les **34 quartiers, lieux et villages** préenregistrés ont des coordonnées GPS **indicatives** (centre approximatif). Sur le terrain, affinez-les ou ajoutez-en (Annexe A, requêtes `UPDATE quartiers…` / `INSERT INTO quartiers…`). Les clients peuvent de toute façon **pointer leur position exacte sur la carte** ou utiliser la géolocalisation du téléphone.

### 7.6 Numéros affichés sur le site

Les numéros d'appel et WhatsApp de la page d'accueil sont définis dans `src/lib/constants.ts` (`GOZO_PHONES`). Modifiez-les si besoin, puis envoyez la mise à jour (étape 11).

---

## 8. Nom de domaine personnalisé

Une adresse comme `gozolivraison.ci` ou `gozolivraison.com` est plus facile à retenir et à imprimer sur vos affiches.

1. Achetez le domaine chez un bureau d'enregistrement (pour `.ci` : un registrar accrédité par le NIC.CI ; pour `.com` : n'importe quel registrar).
2. Dans Vercel : *Project → Settings → Domains → Add* → saisissez le domaine.
3. Chez le registrar, créez les enregistrements DNS indiqués par Vercel, généralement :
   - **A** `@` → `76.76.21.21`
   - **CNAME** `www` → `cname.vercel-dns.com`
4. Attendez la propagation (quelques minutes à quelques heures). Vercel active le **HTTPS automatiquement**.

> Le HTTPS est indispensable : la géolocalisation du livreur, l'appareil photo et l'installation sur l'écran d'accueil ne fonctionnent que sur un site sécurisé.

---

## 9. Installation sur les téléphones

Il n'y a **rien à télécharger** : on ouvre l'adresse dans le navigateur et on l'ajoute à l'écran d'accueil. L'icône GOZO apparaît comme une application et s'ouvre en plein écran.

### Android (Chrome)
1. Ouvrir `https://VOTRE-DOMAINE`.
2. Toucher **Installer** dans le bandeau jaune « GOZO sur votre écran d'accueil » — ou menu **⋮ → Installer l'application** / **Ajouter à l'écran d'accueil**.

### iPhone / iPad (Safari obligatoire)
1. Ouvrir `https://VOTRE-DOMAINE` dans **Safari**.
2. Toucher **Partager** (carré avec flèche) → **Sur l'écran d'accueil** → **Ajouter**.

### Conseils aux livreurs **[Gérant]**
- **Autoriser la localisation** lorsque le téléphone le demande (sinon le client ne voit pas la moto sur la carte).
- **Garder GOZO ouvert à l'écran pendant la course** : la position est envoyée toutes les 2,5 secondes tant que l'application est au premier plan.
- Toucher **🔔 Activer les alertes de nouvelles courses** pour être prévenu (vibration + notification) quand une course est proposée.
- Les boutons **Google Maps** et **Waze** ouvrent la navigation vers le point de retrait, puis vers la destination.

### Diffusion aux clients **[Gérant]**
- Partagez l'adresse sur WhatsApp (statut, groupes), Facebook et vos affiches (un **QR code** vers l'adresse fonctionne très bien — générateurs gratuits en ligne).
- Les clients peuvent aussi continuer à commander par téléphone : l'administrateur peut créer une commande pour eux depuis son propre compte client, ou attribuer directement une course.

---

## 10. Paiements Mobile Money et carte bancaire

**État actuel :** le client choisit son mode de paiement (Espèces, Orange Money, MTN MoMo, Moov Money, Wave, Carte). Le montant est enregistré et marqué **« payé » lorsque le livreur confirme la livraison**. Le paiement en **espèces à la livraison fonctionne donc entièrement**. Les paiements électroniques sont **enregistrés mais pas encaissés automatiquement** : le client paie le livreur (transfert Mobile Money vers le numéro GOZO, par exemple) et le livreur confirme.

**Pour encaisser automatiquement en ligne**, il faudra intégrer un **agrégateur de paiement** couvrant les opérateurs ivoiriens (par exemple **CinetPay**, acteur ivoirien, ou équivalents — à comparer : frais, délais de reversement, contrat). Côté code, les points d'intégration sont :
- `src/components/client/OrderForm.tsx` : choix du mode de paiement et confirmation de la commande ;
- `src/lib/orders.ts` : fonction `updateOrderStatus()` qui crée l'enregistrement dans la table `payments` à la livraison ;
- une nouvelle route `src/app/api/payments/webhook/route.ts` à créer pour recevoir la confirmation de l'agrégateur.

Cette intégration est un **petit chantier séparé** (environ une journée de développement, plus la souscription au service).

---

## 11. Mises à jour, sauvegardes et supervision

### Mettre à jour l'application
```bash
git add .
git commit -m "Description de la modification"
git push
```
Vercel reconstruit et met en ligne automatiquement en 1 à 3 minutes. Si `src/db/schema.ts` a changé, relancez aussi `npx drizzle-kit push --config=drizzle.config.prod.ts` (étape 5.3).

### Sauvegardes de la base de données
- Neon et Supabase proposent une restauration à un instant donné **selon le plan souscrit** — vérifiez la durée conservée.
- Pour une sauvegarde manuelle (à faire régulièrement, par exemple chaque semaine) :
  ```bash
  pg_dump "postgresql://...adresse-directe..." > sauvegarde-gozo-$(date +%F).sql
  ```

### Supervision
- `https://VOTRE-DOMAINE/api/health` doit répondre `{"status":"ok"}` : vous pouvez le faire surveiller par un service gratuit de type *uptime monitor* qui vous alerte par e-mail en cas de panne.
- Les journaux d'erreurs sont dans Vercel : *Project → Logs*.
- Les limites du plan gratuit Neon (stockage, heures de calcul) se consultent dans son tableau de bord ; passez au plan supérieur si l'activité grandit.

---

## 12. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Le build Vercel échoue : `DATABASE_URL is required` | Variable absente au moment du build | Ajoutez `DATABASE_URL` (Production **et** Preview), puis *Redeploy* |
| `/api/health` renvoie une erreur `relation "…" does not exist` | Tables non créées | Lancez `npx drizzle-kit push --config=drizzle.config.prod.ts` (étape 5.3) |
| « Numéro non autorisé pour l'administration GOZO » | Le numéro n'est pas dans `GOZO_ADMIN_PHONES` | Ajoutez-le (format `07XXXXXXXX`, séparateur virgule), *Redeploy* |
| « L'envoi de SMS n'est pas encore configuré » | `SMS_GATEWAY_URL` absente et mode démo désactivé | Configurez la passerelle SMS (étape 6) |
| « Impossible d'envoyer le SMS pour le moment » | La passerelle a répondu en erreur ou ne répond pas | Vérifiez la clé, le crédit SMS et le format attendu par le fournisseur |
| Les codes OTP s'affichent à l'écran sur le site public | `NEXT_PUBLIC_GOZO_DEMO=true` en production | **Supprimez la variable** dans Vercel et redéployez immédiatement |
| Le livreur voit « GPS à autoriser » | Permission refusée, ou site sans HTTPS | Autoriser la localisation dans les réglages du navigateur ; vérifier l'adresse en `https://` |
| Le livreur ne reçoit aucune course | Il n'est pas **En ligne**, ou aucun livreur n'est en ligne | Basculer l'interrupteur « En ligne » en haut de `/livreur` ; l'écran se rafraîchit toutes les 5 s |
| La carte reste grise | Fonds de carte (CARTO/OpenStreetMap) bloqués ou pas de réseau | Vérifier la connexion Internet du téléphone |
| Une modification de `NEXT_PUBLIC_…` n'a aucun effet | Variable intégrée au build | *Deployments → Redeploy* |
| Les livreurs fictifs (Konan Yao, Traoré Ibrahim…) apparaissent | Base initialisée en mode démo | Supprimez-les (Annexe A) et retirez `NEXT_PUBLIC_GOZO_DEMO` |

---

## 13. Publication sur Play Store / App Store (optionnel)

Ce n'est **pas nécessaire** pour démarrer : l'installation depuis le navigateur (étape 9) suffit à la plupart des services de livraison et évite les frais et délais des boutiques.

Si vous le souhaitez plus tard :
- **Android (Google Play)** : une PWA peut être « emballée » en application Android (*Trusted Web Activity*) avec des outils comme **PWABuilder** (https://www.pwabuilder.com) ou **Bubblewrap**. Compte développeur Google Play requis (frais uniques).
- **iPhone (App Store)** : Apple n'accepte pas les simples PWA emballées ; il faut une application native ou hybride (Capacitor, etc.) — un projet à part entière, à envisager seulement si le besoin se confirme.

---

## Annexe A — Commandes SQL utiles

À exécuter dans l'éditeur SQL de Neon / Supabase, ou avec `psql "DATABASE_URL"`.

```sql
-- Voir les livreurs
SELECT id, name, phone, status, total_deliveries, total_earnings FROM drivers ORDER BY id;

-- Supprimer les cinq livreurs fictifs du mode démonstration
DELETE FROM drivers
WHERE phone IN ('+2250757315268', '+2250564661109', '+2250102030405', '+2250506070809', '+2250708091011');

-- Supprimer toutes les commandes et paiements de test (⚠️ irréversible)
DELETE FROM order_events; DELETE FROM payments; DELETE FROM orders;
UPDATE drivers SET total_deliveries = 0, total_earnings = 0;

-- Corriger la position GPS d'un quartier
UPDATE quartiers SET lat = 6.1348, lng = -5.9428 WHERE name = 'Dioulabougou';

-- Ajouter un quartier ou un lieu (type : 'quartier', 'lieu' ou 'village')
INSERT INTO quartiers (name, type, lat, lng, description)
VALUES ('Nouveau quartier', 'quartier', 6.1300, -5.9500, 'Description courte');

-- Lister les quartiers enregistrés
SELECT id, name, type, lat, lng FROM quartiers ORDER BY name;

-- Remettre la grille tarifaire d'origine
UPDATE pricing_config SET base_fare = 500, base_km = 4, per_km = 200,
  night_surcharge = 0, rain_surcharge = 0, commission_percent = 15, minimum_fare = 500;

-- Historique des paiements et commissions
SELECT reference, driver_name, method, amount_fcfa, commission_fcfa, driver_earnings_fcfa, created_at
FROM payments ORDER BY created_at DESC LIMIT 50;
```

Les numéros sont stockés au format international `+225XXXXXXXXXX` (10 chiffres après l'indicatif).

---

## Annexe B — Fichiers à connaître

| Fichier | Contenu |
|---|---|
| `.env.example` | Modèle des variables d'environnement |
| `drizzle.config.prod.ts` | Configuration Drizzle pour la base de production (`drizzle-kit push`) |
| `src/db/schema.ts` | Structure des 9 tables |
| `src/db/seed.ts` | Données de départ (quartiers, tarifs, administrateurs, démo) |
| `src/lib/geo.ts` | Liste des quartiers de Gagnoa et calcul des distances |
| `src/lib/pricing.ts` | Calcul du tarif (base, km supplémentaires, majorations, commission) |
| `src/lib/orders.ts` | Logique des commandes : attribution automatique, statuts, paiements |
| `src/lib/constants.ts` | Numéros GOZO affichés, modes de paiement, libellés des statuts |
| `src/app/api/auth/otp/route.ts` | Envoi des codes SMS — fonction `sendSms()` à adapter au fournisseur |
| `src/app/page.tsx` | Page d'accueil publique |
| `src/app/app/` | Interface client |
| `src/app/livreur/page.tsx` | Interface livreur |
| `src/app/admin/` | Panneau d'administration |
| `public/manifest.json`, `public/sw.js` | Installation sur téléphone (PWA) et mode hors-ligne |
| `public/icons/`, `public/logo.svg` | Icônes et logo |

---

## Annexe C — Liste de contrôle avant ouverture au public

- [ ] `DATABASE_URL` pointe vers la base de production (Neon/Supabase), tables créées, `/api/health` répond `ok`.
- [ ] `GOZO_ADMIN_PHONES` contient uniquement les numéros des vrais administrateurs.
- [ ] `NEXT_PUBLIC_GOZO_DEMO` **n'est pas définie** en production (aucun code OTP visible à l'écran).
- [ ] Passerelle SMS configurée et testée avec un vrai numéro.
- [ ] Livreurs fictifs et commandes de test supprimés.
- [ ] Grille tarifaire vérifiée par le gérant (majorations nuit/pluie, commission).
- [ ] Vrais livreurs enregistrés ; chacun a réussi à se connecter et à passer « En ligne ».
- [ ] Nom de domaine actif en HTTPS.
- [ ] Test complet avec deux téléphones : commande client → proposition au livreur → acceptation → suivi GPS → signature/photo → paiement enregistré dans `/admin → Paiements`.
- [ ] Application ajoutée à l'écran d'accueil sur un Android et un iPhone.
- [ ] Plan d'hébergement adapté à un usage commercial (Vercel Pro ou équivalent).
- [ ] Première sauvegarde de la base effectuée.

---

*GOZO LIVRAISON · Gagnoa, vos colis arrivent.*
