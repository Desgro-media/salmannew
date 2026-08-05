import { config } from "dotenv";
// Next.js convention: .env.local holds real local secrets and isn't loaded
// by dotenv's default `dotenv/config` (which only reads .env).
config({ path: ".env.local" });
config();
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` (run on every `npm install`, including CI/build
    // steps that never touch the DB) must not throw when DATABASE_URL is
    // unset — use process.env directly instead of the `env()` helper, which
    // throws on a missing var. Commands that actually connect (migrate,
    // db seed, studio) still need it set for real.
    url: process.env.DATABASE_URL ?? "",
  },
});
