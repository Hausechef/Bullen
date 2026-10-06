// Raw request body helpers. The TRAPAY webhook handler needs the raw string so
// a future signature scheme (TRAPAY_DOCUMENTATION_REQUIRED) can verify bytes,
// not re-serialized JSON.

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

export function readRawBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof req.body === "string") {
      resolve(req.body);
      return;
    }
    if (req.body && typeof req.body === "object") {
      // The platform already parsed the JSON body; re-serialize (signature-relevant
      // byte fidelity is only guaranteed with the raw stream below).
      resolve(JSON.stringify(req.body));
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", (err: Error) => reject(err));
  });
}

export function tryParseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

export function clientIp(req: any): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return (req.socket?.remoteAddress as string) || "unknown";
}

