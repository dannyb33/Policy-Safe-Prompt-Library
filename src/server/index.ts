import 'dotenv/config';

import express from "express";
import templateRouter from "./routes/templateRoutes.js";
import policyRouter from "./routes/policyRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/templates", templateRouter)
app.use("/api/policies", policyRouter)

const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

app.get('/', (req, res) => {
  res.send('Policy-CLI Home Page')
})