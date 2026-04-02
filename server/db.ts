import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import * as authModels from "@shared/models/auth";
import * as projectModels from "@shared/models/projects";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema: { ...schema, ...authModels, ...projectModels } });
