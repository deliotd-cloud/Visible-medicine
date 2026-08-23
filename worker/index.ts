/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  FILES: R2Bucket;
  TEACHING_LIVE: DurableObjectNamespace;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

type TeachingLiveAttachment = { workbookId: string; userId: string };

/**
 * Session-scoped notification fan-out only. D1 remains authoritative and no
 * answers, poll selections, notes or viewer content are stored in this object.
 */
export class TeachingLiveRoom {
  private readonly ctx: DurableObjectState;

  constructor(ctx: DurableObjectState, env: Env) {
    void env;
    this.ctx = ctx;
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS room_revision (singleton INTEGER PRIMARY KEY CHECK (singleton = 1), revision INTEGER NOT NULL)`,
    );
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO room_revision (singleton, revision) VALUES (1, 0)`,
    );
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/connect") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
        return new Response("WebSocket upgrade required", { status: 426 });
      const workbookId = request.headers.get("X-Didanix-Workbook") ?? "";
      const userId = request.headers.get("X-Didanix-User") ?? "";
      if (!workbookId || !userId)
        return new Response("Authorized education context required", { status: 403 });
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      server.serializeAttachment({ workbookId, userId } satisfies TeachingLiveAttachment);
      this.ctx.acceptWebSocket(server, [`workbook:${workbookId}`]);
      const revision = this.ctx.storage.sql.exec<{ revision: number }>(
        `SELECT revision FROM room_revision WHERE singleton = 1`,
      ).one().revision;
      server.send(JSON.stringify({ type: "ready", workbookId, revision }));
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === "/notify" && request.method === "POST") {
      this.ctx.storage.sql.exec(
        `UPDATE room_revision SET revision = revision + 1 WHERE singleton = 1`,
      );
      const revision = this.ctx.storage.sql.exec<{ revision: number }>(
        `SELECT revision FROM room_revision WHERE singleton = 1`,
      ).one().revision;
      for (const socket of this.ctx.getWebSockets()) {
        if (socket.readyState !== WebSocket.OPEN) continue;
        const attachment = socket.deserializeAttachment() as TeachingLiveAttachment | null;
        socket.send(JSON.stringify({
          type: "refresh",
          workbookId: attachment?.workbookId ?? "",
          revision,
        }));
      }
      return Response.json({ revision });
    }
    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") {
      socket.close(1003, "Text messages only");
      return;
    }
    try {
      const payload = JSON.parse(message) as { type?: unknown };
      if (payload.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
        return;
      }
    } catch {
      // Closed below using a policy code.
    }
    socket.close(1008, "Unsupported client message");
  }

  async webSocketClose(socket: WebSocket, code: number, reason: string) {
    socket.close(code, reason);
  }
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

async function teachingLiveSocket(request: Request, env: Env) {
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
    return Response.json({ error: "WebSocket upgrade required." }, { status: 426 });
  const workbookId = new URL(request.url).searchParams.get("workbookId") ?? "";
  if (!workbookId || workbookId.length > 100)
    return Response.json({ error: "A bounded workbookId is required." }, { status: 422 });
  const hostedUserId = request.headers.get("oai-authenticated-user-id");
  const userId = hostedUserId
    ? `edu:${hostedUserId}`
    : import.meta.env.DEV
      ? "edu:local-demo-user"
      : "";
  if (!userId)
    return Response.json({ error: "Education sign-in is required." }, { status: 401 });
  const user = await env.DB.prepare(`SELECT roles FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ roles: string }>();
  if (!user)
    return Response.json({ error: "Education account is unavailable." }, { status: 403 });
  const roles = user.roles.split(",").filter(Boolean);
  const staff = roles.some((role) => ["administrator", "instructor", "examiner"].includes(role));
  const now = new Date().toISOString();
  const authorized = staff
    ? await env.DB.prepare(
        `SELECT id FROM workbooks WHERE id = ? AND mode = 'teaching' AND status = 'published'`,
      ).bind(workbookId).first()
    : await env.DB.prepare(
        `SELECT w.id
           FROM workbooks w
           JOIN modules m ON m.id = w.module_id
           JOIN enrolments e ON e.course_id = m.course_id AND e.user_id = ? AND e.status = 'active'
          WHERE w.id = ? AND w.mode = 'teaching' AND w.status = 'published'
            AND (
              EXISTS (
                SELECT 1 FROM workbook_assignments a
                LEFT JOIN workbook_assignment_rules r ON r.assignment_id = a.id
                LEFT JOIN workbook_progress p ON p.workbook_id = r.prerequisite_workbook_id AND p.learner_id = a.learner_id
                WHERE a.workbook_id = w.id AND a.learner_id = ? AND a.status = 'active'
                  AND (r.available_from IS NULL OR r.available_from <= ?)
                  AND (r.expires_at IS NULL OR r.expires_at > ?)
                  AND (r.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= r.prerequisite_min_percent)
              ) OR EXISTS (
                SELECT 1 FROM cohort_workbook_assignments ca
                JOIN cohorts c ON c.id = ca.cohort_id AND c.status = 'active'
                JOIN cohort_members cm ON cm.cohort_id = ca.cohort_id AND cm.learner_id = ? AND cm.status = 'active'
                LEFT JOIN workbook_progress p ON p.workbook_id = ca.prerequisite_workbook_id AND p.learner_id = cm.learner_id
                WHERE ca.workbook_id = w.id AND ca.status = 'active'
                  AND (ca.available_from IS NULL OR ca.available_from <= ?)
                  AND (ca.expires_at IS NULL OR ca.expires_at > ?)
                  AND (ca.prerequisite_workbook_id IS NULL OR COALESCE(p.percent_complete, 0) >= ca.prerequisite_min_percent)
              )
            )`,
      ).bind(userId, workbookId, userId, now, now, userId, now, now).first();
  if (!authorized)
    return Response.json({ error: "This teaching workbook is not allocated to the education account." }, { status: 403 });
  const stub = env.TEACHING_LIVE.get(env.TEACHING_LIVE.idFromName(workbookId));
  return stub.fetch("https://didanix-education.internal/connect", {
    headers: {
      Upgrade: "websocket",
      "X-Didanix-Workbook": workbookId,
      "X-Didanix-User": userId,
    },
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/education/teaching-live" && request.method === "GET")
      return teachingLiveSocket(request, env);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    // A WebSocket response carries a runtime-only socket handle. Cloning it
    // into a normal Response would detach that handle and break the upgrade.
    if (response.status === 101) return response;
    const headers = new Headers(response.headers);
    headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; worker-src 'self' blob:");
    headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), display-capture=(), window-management=(self), fullscreen=(self)");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "SAMEORIGIN");
    if (url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    if ((headers.get("content-type") ?? "").startsWith("text/html")) headers.set("Cache-Control", "private, no-store, max-age=0");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

export default worker;
