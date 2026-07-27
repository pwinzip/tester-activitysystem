import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 config: connection URLs live here (used by Prisma Migrate / CLI),
// not in schema.prisma. The runtime client uses a driver adapter instead
// (see src/server/lib/prisma.ts).
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
