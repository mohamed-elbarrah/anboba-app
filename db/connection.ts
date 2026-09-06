import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./schema";

type RequiredEnvName = "DB_HOST" | "DB_NAME" | "DB_USER" | "DB_PASSWORD";

function requiredEnv(name: RequiredEnvName) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to connect to MySQL`);
  }
  return value;
}

function databasePort() {
  const rawPort = process.env.DB_PORT ?? "3306";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535");
  }

  return port;
}

let pool: mysql.Pool | undefined;
let database: MySql2Database<typeof schema> | undefined;

/**
 * CLI/server-only connection primitive. Keep this module out of UI imports:
 * database credentials must never be part of a browser module graph.
 * The pool and Drizzle client are created only when first used.
 */
export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requiredEnv("DB_HOST"),
      port: databasePort(),
      database: requiredEnv("DB_NAME"),
      user: requiredEnv("DB_USER"),
      password: requiredEnv("DB_PASSWORD"),
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true,
    });
  }

  return pool;
}

/** Returns the memoized Drizzle client without reading credentials at import time. */
export function getDb() {
  if (!database) {
    database = drizzle(getPool(), { schema, mode: "default" });
  }

  return database;
}

/** Allows short-lived CLI processes to release their MySQL resources cleanly. */
export async function closePool() {
  if (pool) {
    const activePool = pool;
    pool = undefined;
    database = undefined;
    await activePool.end();
  }
}
