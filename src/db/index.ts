import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

let client: Client | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (!database) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      if (process.env.NEXT_PHASE === "phase-production-build") {
        // During build/prerender, use in-memory SQLite (no real DB needed)
        client = createClient({ url: "file::memory:" });
      } else {
        throw new Error("TURSO_DATABASE_URL is required — set it in your environment variables");
      }
    } else {
      client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
    }
    database = drizzle(client, { schema });
  }
  return database;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
