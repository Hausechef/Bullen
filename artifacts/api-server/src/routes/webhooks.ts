import { Router, type Request, type Response } from "express";
import { readRawBody } from "../../../../api/_lib/http";
import trapayWebhookHandler from "../../../../api/webhooks/trapay";
import { adaptHandler } from "../lib/adapter";

const router = Router();

// TRAPAY webhook: provider may send raw bytes/signed payload.
// Express's json/urlencoded parsers must NOT run here; attach the raw body
// as req.body (string) so the existing handler's readRawBody helper can use it.
router.post(
  "/webhooks/trapay",
  async (req: Request, res: Response, next: () => void) => {
    try {
      req.body = await readRawBody(req);
      next();
    } catch (err: any) {
      res.status(413).json({ error: "payload_too_large" });
    }
  },
  adaptHandler(trapayWebhookHandler),
);

export default router;
