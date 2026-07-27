import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { AppError, ERROR_STATUS, type ErrorCode, type ErrorDetail } from "./errors";
import { logger } from "./logger";
import { isProduction } from "./env";

const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(req: Request): string {
  return req.headers.get(REQUEST_ID_HEADER) ?? `req_${randomUUID()}`;
}

/** Extracts client IP and user-agent (behind Nginx: X-Forwarded-For). */
export function getClientMeta(req: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const fwd = req.headers.get("x-forwarded-for");
  const ipAddress =
    fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
  return { ipAddress, userAgent: req.headers.get("user-agent") };
}

/** Parses a JSON request body, mapping malformed input to BAD_REQUEST. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("BAD_REQUEST", "Invalid or malformed JSON body.");
  }
}

interface SuccessOptions {
  meta?: unknown;
  status?: number;
  requestId?: string;
}

export function success<T>(data: T, opts: SuccessOptions = {}): NextResponse {
  const res = NextResponse.json(
    { success: true, data, meta: opts.meta ?? {} },
    { status: opts.status ?? 200 },
  );
  if (opts.requestId) res.headers.set(REQUEST_ID_HEADER, opts.requestId);
  return res;
}

interface FailureOptions {
  details?: ErrorDetail[];
  requestId?: string;
  status?: number;
}

export function failure(
  code: ErrorCode,
  message: string,
  opts: FailureOptions = {},
): NextResponse {
  const res = NextResponse.json(
    {
      success: false,
      error: { code, message, details: opts.details ?? [] },
      requestId: opts.requestId,
    },
    { status: opts.status ?? ERROR_STATUS[code] },
  );
  if (opts.requestId) res.headers.set(REQUEST_ID_HEADER, opts.requestId);
  return res;
}

type RouteContext = { params?: Promise<Record<string, string>> };
type RouteHandler<C extends RouteContext> = (
  req: Request,
  requestId: string,
  ctx: C,
) => Promise<Response> | Response;

/**
 * Wraps a route handler with request-id propagation and safe error mapping.
 * AppError -> its coded response, ZodError -> VALIDATION_ERROR, anything else
 * -> generic INTERNAL_SERVER_ERROR (never leaks stack traces to the client).
 */
export function route<C extends RouteContext = RouteContext>(
  handler: RouteHandler<C>,
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    const requestId = getRequestId(req);
    try {
      const res = await handler(req, requestId, ctx);
      res.headers.set(REQUEST_ID_HEADER, requestId);
      return res;
    } catch (err) {
      if (err instanceof AppError) {
        logger.warn("app_error", { requestId, code: err.code });
        return failure(err.code, err.message, {
          details: err.details,
          requestId,
        });
      }
      if (err instanceof ZodError) {
        const details: ErrorDetail[] = err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        return failure("VALIDATION_ERROR", "Request validation failed.", {
          details,
          requestId,
        });
      }
      logger.error("unhandled_error", {
        requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      return failure("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", {
        requestId,
        // Never expose internals in production.
        details: isProduction
          ? []
          : [{ message: err instanceof Error ? err.message : String(err) }],
      });
    }
  };
}
