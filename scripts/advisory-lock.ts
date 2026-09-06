import type { PoolConnection } from "mysql2/promise";

/** One connection-scoped lock for every form/content seed and normalization job. */
export const ANBOBA_DATA_LOCK = "anboba:data-seed-normalization";
export async function acquireDataLock(connection: PoolConnection) {
  const [rows] = await connection.query("SELECT GET_LOCK(?, 30) AS acquired", [ANBOBA_DATA_LOCK]);
  if (Number((rows as Array<{ acquired: number }>)[0]?.acquired) !== 1) throw new Error(`Could not acquire advisory lock ${ANBOBA_DATA_LOCK}`);
}
export async function releaseDataLock(connection: PoolConnection) {
  await connection.query("SELECT RELEASE_LOCK(?)", [ANBOBA_DATA_LOCK]);
}
