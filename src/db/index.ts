import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL!;

  if (process.env.NODE_ENV === "production" && !connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  clientInstance = postgres(connectionString || "postgres://localhost:5432/postgres", {
    prepare: false,
    // Don't block during build — connect lazily at first query
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  dbInstance = drizzle(clientInstance, { schema });
  return dbInstance;
}

// Proxy that lazily initializes the database connection.
// This prevents Next.js build from hanging when the database is unreachable.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as PostgresJsDatabase<typeof schema>;

export type Database = PostgresJsDatabase<typeof schema>;
