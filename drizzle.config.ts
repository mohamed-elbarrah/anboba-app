import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

type DatabaseEnvName = "DB_HOST" | "DB_NAME" | "DB_USER" | "DB_PASSWORD";

const databaseCommand = process.argv.some((argument) =>
  ["migrate", "push", "introspect", "pull"].includes(argument),
);

function databaseEnv(name: DatabaseEnvName) {
  const value = process.env[name];
  if (!value && databaseCommand) {
    throw new Error(`${name} is required for Drizzle Kit database commands`);
  }
  // `generate` and `check` only read schema/migration files. Drizzle Kit still
  // requires a credentials object, so use inert values for those offline checks.
  return value ?? "schema-check-only";
}

function databasePort() {
  const rawPort = process.env.DB_PORT ?? "3306";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535");
  }

  return port;
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: databaseEnv("DB_HOST"),
    port: databasePort(),
    database: databaseEnv("DB_NAME"),
    user: databaseEnv("DB_USER"),
    password: databaseEnv("DB_PASSWORD"),
  },
});
