import { loadEnvConfig } from "@next/env";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { closePool, getDb } from "../db/connection";
import { admins } from "../db/schema";

loadEnvConfig(process.cwd());

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

async function main() {
  const name = required("ADMIN_NAME");
  const email = required("ADMIN_EMAIL").toLowerCase();
  const password = required("ADMIN_PASSWORD");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  const existing = await getDb().select({ id: admins.id }).from(admins).where(eq(admins.emailNormalized, email)).limit(1);
  if (existing.length) throw new Error("An admin with this email already exists");
  await getDb().insert(admins).values({ name, email, emailNormalized: email, passwordHash: await hash(password, 12), role: "admin", isActive: true });
  console.log(`Admin created: ${email}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => closePool());
