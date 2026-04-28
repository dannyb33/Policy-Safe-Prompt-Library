import 'dotenv/config';

import express from "express";
import templateRouter from "./routes/templateRoutes.js";
import policyRouter from "./routes/policyRoutes.js";
import healthRouter from "./routes/healthRoutes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import llmRouter from './routes/llmRoutes.js';

const PORT = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "../public");

const app = express();

app.use(express.json());
app.use("/gui", express.static(publicDir));

app.use("/api/templates", templateRouter);
app.use("/api/policies", policyRouter);
app.use("/api/llm", llmRouter);
app.use("/api/health", healthRouter);

app.get('/', (req, res) => {
  res.send('Policy-CLI Home Page');
});

app.get('/gui', (req, res) => {
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
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ["src/server/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running at http://localhost:${PORT}`)
);