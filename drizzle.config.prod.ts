/**
 * Configuration Drizzle pour la base de données HÉBERGÉE (production).
 *
 * Le fichier `drizzle.config.json` reste réservé à l'environnement de
 * développement local. Pour créer ou mettre à jour les tables sur la base
 * de production, définir DATABASE_URL (fichier .env ou variable d'environnement)
 * puis lancer :
 *
 *   npx drizzle-kit push --config=drizzle.config.prod.ts
 *
 * Voir GUIDE_DEPLOIEMENT.md, étape 5.
 */
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL manquante. Renseignez l'adresse de connexion PostgreSQL de production avant de lancer drizzle-kit.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
