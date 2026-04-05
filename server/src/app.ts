import "dotenv/config";
import { createServer } from "node:http";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import authRoutes from "./modules/auth/auth.route";
import rfpsRoutes from "./modules/rfps/rfps.route";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || "v1";
const API_PREFIX = `/api/${API_VERSION}`;

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "PRODUCTION";
const vpsURL = process.env.VPS_URL;

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BASE_URL = isProduction ? vpsURL : "http://localhost:5173";

app.use(
  cors({
    origin: BASE_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
});

app.use(limiter);
app.use(cookieParser());

// Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/rfps`, rfpsRoutes);

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

server.listen(PORT, () => {
  console.log(
    `Server running in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode`,
  );
  console.log(`http://localhost:${PORT}/`);
});
