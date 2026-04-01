import type { NextRequest } from "next/server";

const TRUST_PROXY_HEADERS = process.env.TRUST_PROXY_HEADERS === "true";

function normalizeIp(candidate: string | null | undefined): string | null {
  if (!candidate) return null;

  let value = candidate.trim();
  if (!value) return null;

  if (value.includes(",")) {
    value = value.split(",")[0].trim();
  }

  const forwardedMatch = value.match(/for=([^;,\s]+)/i);
  if (forwardedMatch?.[1]) {
    value = forwardedMatch[1].trim();
  }

  value = value.replace(/^"+|"+$/g, "");
  value = value.replace(/^\[|\]$/g, "");

  if (value.startsWith("::ffff:")) {
    value = value.slice(7);
  }

  if (value.includes(":") && value.includes(".")) {
    const lastColon = value.lastIndexOf(":");
    const maybePort = value.slice(lastColon + 1);
    if (/^\d+$/.test(maybePort)) {
      value = value.slice(0, lastColon);
    }
  }

  return value.slice(0, 45) || null;
}

export function getClientIp(req: NextRequest): string {
  const trustedCandidates = [
    req.headers.get("x-forwarded-for"),
    req.headers.get("forwarded"),
    req.headers.get("x-real-ip"),
  ];

  const directCandidates = [req.headers.get("x-real-ip")];
  const candidates = TRUST_PROXY_HEADERS ? trustedCandidates : directCandidates;

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip) return ip;
  }

  return "unknown";
}
