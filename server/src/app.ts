import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
// import rateLimit from "express-rate-limit";

import authRoutes from "./modules/auth/auth.route.js";
import rfpsRoutes from "./modules/rfps/rfps.route.js";
import bidRoutes from "./modules/bid/bid.route.js";
import supplierRoutes from "./modules/supplier/supplier.route.js";
import adminRoutes from "./modules/admin/admin.route.js";
import buyerRoutes from "./modules/buyer/buyer.route.js";
import chatRouter from "./modules/chat/chat.route.js";
import notificationRoutes from "./modules/notification/notification.route.js";
import statsRoute from "./modules/status/stats.route.js";
import userRoutes from "./modules/user/user.route.js";

import { initSocket } from "./config/socket.js";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import handleError from "./shared/utils/error.js";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || "v1";
const API_PREFIX = `/api/${API_VERSION}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "PRODUCTION";
const vpsURL = process.env.CLIENT_URL;

initSocket(server);

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const allowedOrigins = [
  "http://localhost:5173",
  "https://bidsync-app.ezedin.me",
  "https://bid-sync-blush.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: {
//     status: 429,
//     message:
//       "Too many requests from this IP, please try again after 15 minutes",
//   },
// });

// app.use(limiter)/;
app.use(cookieParser());

// Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/rfps`, rfpsRoutes);
app.use(`${API_PREFIX}/bids`, bidRoutes);
app.use(`${API_PREFIX}/supplier`, supplierRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/buyer`, buyerRoutes);
app.use(`${API_PREFIX}/chat`, chatRouter);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/stats`, statsRoute);
app.use(`${API_PREFIX}/users`, userRoutes);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Health check passed",
    timestamp: new Date().toISOString(),
  });
});

// -------404 Handler-------------
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  handleError("[GLOBAL_ERROR]", err, res);
});

server.listen(PORT, () => {
  console.log(
    `Server running in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode`,
  );
  console.log(`http://localhost:${PORT}/`);
});
