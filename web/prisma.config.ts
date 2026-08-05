import { config } from "dotenv";
// Next.js convention: .env.local holds real local secrets and isn't loaded
// by dotenv's default `dotenv/config` (which only reads .env).
config({ path: ".env.local" });
config();
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
