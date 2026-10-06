/**
 * Thin Vercel-style handler adapter for Express.
 *
 * Existing /api handlers export `default async function handler(req, res)` and
 * expect Node-like request/response objects with:
 *   - req.method
 *   - req.query (object)
 *   - req.body (already parsed JSON object or string for webhooks)
 *   - req.headers
 *   - res.status(code).json(body)
 *   - res.status(code).send(body)
 *
 * Express provides these natively once we configure body parsing per route.
 * This wrapper only normalizes edge cases and catches unhandled errors.
 */
import type { Request, Response } from "express";

export type VercelLikeHandler = (req: any, res: any) => Promise<void> | void;

export function adaptHandler(handler: VercelLikeHandler) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("[api-server] handler error", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message || "Internal server error" });
      }
    }
  };
}
