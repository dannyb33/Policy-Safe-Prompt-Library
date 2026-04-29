import 'dotenv/config';

import express from "express";
import templateRouter from "./routes/templateRoutes.js";
import policyRouter from "./routes/policyRoutes.js";
import llmRouter from './routes/llmRoutes.js';
import healthRouter from "./routes/healthRoutes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const PORT = Number(process.env.PORT || 4000);
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
const prod = process.env.NODE_ENV == "production";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "../server/public");

const app = express();

app.use(express.json());
app.use("/gui", express.static(publicDir));

app.use("/api/templates", templateRouter);
app.use("/api/policies", policyRouter);
app.use("/api/llm", llmRouter);
app.use("/api/health", healthRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Policy CLI API",
      version: "1.0.0",
      description: "API documentation for Policy CLI",
    },
    servers: [
      {
        url: API_BASE_URL,
      },
    ],
  },
    apis: prod
    ? ["dist/server/routes/*.js"]
    : ["src/server/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at ${API_BASE_URL}/docs`);
});