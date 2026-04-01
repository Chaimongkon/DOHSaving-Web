import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/requestIp";

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 20;
const MAX_OBJECT_KEYS = 40;
const MAX_DEPTH = 4;

const SENSITIVE_KEYS = new Set([
  "password",
  "tempPassword",
  "twoFactorSecret",
  "sessionToken",
  "token",
  "authorization",
  "cookie",
]);

type AuditValue =
  | string
  | number
  | boolean
  | null
  | AuditValue[]
  | { [key: string]: AuditValue };

type AuditLogInput = {
  userId?: number | null;
  action: string;
  tableName: string;
  recordId?: number | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
};

function sanitizeAuditValue(value: unknown, depth = 0): AuditValue {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…`
      : value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (depth >= MAX_DEPTH) {
    return "[truncated]";
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeAuditValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .slice(0, MAX_OBJECT_KEYS)
      .map(([key, entryValue]) => [
        key,
        SENSITIVE_KEYS.has(key)
          ? "[redacted]"
          : sanitizeAuditValue(entryValue, depth + 1),
      ]);

    return Object.fromEntries(entries);
  }

  return String(value);
}

export function getAuditIpAddress(req: NextRequest): string {
  return getClientIp(req);
}

export async function writeAuditLog({
  userId = null,
  action,
  tableName,
  recordId = null,
  oldValues,
  newValues,
  ipAddress = null,
}: AuditLogInput): Promise<void> {
  try {
    const normalizedOldValues =
      oldValues === undefined
        ? undefined
        : sanitizeAuditValue(oldValues) ?? Prisma.JsonNull;
    const normalizedNewValues =
      newValues === undefined
        ? undefined
        : sanitizeAuditValue(newValues) ?? Prisma.JsonNull;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        oldValues: normalizedOldValues,
        newValues: normalizedNewValues,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
