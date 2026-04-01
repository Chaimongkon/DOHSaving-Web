import prisma from "@/lib/prisma";

const TABLE_NAME = "rate_limit_buckets";

type RateLimitRow = {
  hits: number;
  resetAt: Date;
};

export type RateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: Date;
};

let initTablePromise: Promise<void> | null = null;

async function ensureRateLimitTable() {
  if (!initTablePromise) {
    initTablePromise = prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id BIGINT NOT NULL AUTO_INCREMENT,
        scopeKey VARCHAR(255) NOT NULL,
        scopeName VARCHAR(100) NOT NULL,
        identifier VARCHAR(191) NOT NULL,
        hits INT NOT NULL DEFAULT 0,
        limitValue INT NOT NULL,
        windowSeconds INT NOT NULL,
        resetAt DATETIME(3) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY rate_limit_scope_key_unique (scopeKey),
        KEY rate_limit_reset_at_idx (resetAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `).then(() => undefined).catch((error) => {
      initTablePromise = null;
      throw error;
    });
  }

  await initTablePromise;
}

export async function consumeRateLimit({
  scope,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  await ensureRateLimitTable();

  const scopeKey = `${scope}:${identifier}`;

  await prisma.$executeRaw`
    INSERT INTO rate_limit_buckets (
      scopeKey,
      scopeName,
      identifier,
      hits,
      limitValue,
      windowSeconds,
      resetAt,
      createdAt,
      updatedAt
    )
    VALUES (
      ${scopeKey},
      ${scope},
      ${identifier},
      1,
      ${limit},
      ${windowSeconds},
      TIMESTAMPADD(SECOND, ${windowSeconds}, UTC_TIMESTAMP(3)),
      UTC_TIMESTAMP(3),
      UTC_TIMESTAMP(3)
    )
    ON DUPLICATE KEY UPDATE
      hits = IF(resetAt <= UTC_TIMESTAMP(3), 1, hits + 1),
      limitValue = VALUES(limitValue),
      windowSeconds = VALUES(windowSeconds),
      resetAt = IF(
        resetAt <= UTC_TIMESTAMP(3),
        TIMESTAMPADD(SECOND, ${windowSeconds}, UTC_TIMESTAMP(3)),
        resetAt
      ),
      updatedAt = UTC_TIMESTAMP(3)
  `;

  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    SELECT hits, resetAt
    FROM rate_limit_buckets
    WHERE scopeKey = ${scopeKey}
    LIMIT 1
  `;

  const row = rows[0];

  if (!row) {
    throw new Error(`Rate limit bucket not found for scope ${scope}`);
  }

  const resetAtMs = new Date(row.resetAt).getTime();
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((resetAtMs - Date.now()) / 1000)
  );

  return {
    limited: row.hits > limit,
    remaining: Math.max(limit - row.hits, 0),
    retryAfterSeconds,
    resetAt: new Date(row.resetAt),
  };
}
