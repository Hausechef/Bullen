import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Webhooks need the raw stream. All other /api routes use JSON body parsing.
app.use("/api/webhooks", express.raw({ type: "*/*", limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// Catch-all for truly unknown /api paths (returns JSON, not SPA HTML).
app.use("/api", (_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
