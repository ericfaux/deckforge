import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import designsRouter from "./routes/designs";
import authRouter from "./routes/auth";
import assetsRouter from "./routes/assets";
import fontsRouter from "./routes/fonts";
import shareRouter from "./routes/share";
import galleryRouter from "./routes/gallery";
import commentsRouter from "./routes/comments";
import foldersRouter from "./routes/folders";
import tagsRouter from "./routes/tags";
import brandKitsRouter from "./routes/brand-kits";
import { logger } from "hono/logger";

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/.*\.vercel\.app$/,  // Vercel deployments
  /^https:\/\/deckforge\..*$/,    // Custom domains
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests without origin (e.g., Postman, curl)
      if (!origin) return "*";
      // Check if origin matches allowed patterns
      const isAllowed = allowed.some((re) => re.test(origin));
      return isAllowed ? origin : null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600, // Cache preflight for 10 minutes
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/auth", authRouter);
app.route("/api/designs", designsRouter);
app.route("/api/assets", assetsRouter);
app.route("/api/fonts", fontsRouter);
app.route("/api/share", shareRouter);
app.route("/api/gallery", galleryRouter);
app.route("/api/comments", commentsRouter);
app.route("/api/folders", foldersRouter);
app.route("/api/tags", tagsRouter);
app.route("/api/brand-kits", brandKitsRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
