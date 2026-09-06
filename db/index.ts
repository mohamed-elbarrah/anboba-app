import "server-only";

// The application boundary stays server-only. CLI code must import
// `db/connection` directly rather than bypassing this protection.
export { closePool, getDb, getPool } from "./connection";
