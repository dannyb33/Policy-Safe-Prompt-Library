import 'dotenv/config';

import express from "express";
import templateRouter from "./routes/templateRoutes.js";
import policyRouter from "./routes/policyRoutes.js";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();

app.use(express.json());

app.use("/api/templates", templateRouter);
app.use("/api/policies", policyRouter);

app.get('/', (req, res) => {
  res.send('Policy-CLI Home Page');
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
        url: `http://localhost:${process.env.PORT || 4000}`,
      },
    ],
  },
  apis: ["src/server/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);