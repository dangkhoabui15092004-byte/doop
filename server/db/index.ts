import { env } from '../env.ts'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'

/**
 * DATABASE_URL set   -> real Postgres (production: Railway/Fly managed PG)
 * DATABASE_URL unset -> PGlite, an embedded Postgres persisted to ./data/pg
 * Same dialect, same schema, same queries either way.
 *
 * Schema changes: edit schema.ts / auth-schema.ts, then `npx drizzle-kit
 * generate` — the SQL lands in ./migrations and is applied here at boot.
 * Migration 0000 doubles as a baseline: fully idempotent, so databases
 * created by the pre-migration boot DDL adopt the journal cleanly.
 */

export type Db = NodePgDatabase<typeof schema>

export let db: Db

/* resolved from this file, not process.cwd() — the server may be launched
   from anywhere (tests spawn it from a temp working directory) */
const MIGRATIONS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

export async function initDb(): Promise<void> {
  const url = env.DATABASE_URL
  if (url) {
    const pg = await import('pg')
    const { drizzle } = await import('drizzle-orm/node-postgres')
    const needsSsl = /[?&]sslmode=(require|verify-ca|verify-full)/i.test(url)
    /* Strip sslmode from connectionString when supplying explicit ssl options so
       managed hosts with custom CAs (e.g. Aiven) connect cleanly without cert errors. */
    const cleanUrl = needsSsl ? url.replace(/([?&])sslmode=[^&]*&?/i, '$1').replace(/[?&]$/, '') : url
    const pool = new pg.Pool({
      connectionString: cleanUrl,
      max: 4,
      idleTimeoutMillis: 15_000,
      connectionTimeoutMillis: 15_000,
      keepAlive: true,
      ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    })
    pool.on('error', (err) => {
      console.error('[db] idle postgres pool error (auto-recovered):', err.message)
    })
    db = drizzle(pool, { schema })
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    await migrate(db, { migrationsFolder: MIGRATIONS })
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle } = await import('drizzle-orm/pglite')
    const dir = path.join(process.cwd(), 'data', 'pg')
    fs.mkdirSync(dir, { recursive: true }) // PGlite's own mkdir isn't recursive
    const client = new PGlite(dir)
    const pgliteDb = drizzle(client, { schema })
    const { migrate } = await import('drizzle-orm/pglite/migrator')
    await migrate(pgliteDb, { migrationsFolder: MIGRATIONS })
    db = pgliteDb as unknown as Db
  }
}
