import type { Request } from "express";

type Severity = "info" | "warn";

/**
 * Lightweight security auditing for suspicious/sensitive auth/account actions.
 * Logs are structured so they can be forwarded to external monitoring later.
 */
export function auditSecurityEvent(
  severity: Severity,
  event: string,
  req: Request,
  details: Record<string, unknown> = {},
) {
  const payload = {
    event,
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get("user-agent") ?? "",
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (severity === "warn") {
    console.warn("[security]", JSON.stringify(payload));
    return;
  }

  console.info("[security]", JSON.stringify(payload));
}

