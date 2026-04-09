import 'dotenv/config';

import express from "express";
import router from "./routes/routes.js";

const app = express();

app.use(express.json());

app.use("/api/templates", router)

const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

app.get('/', (req, res) => {
  res.send('Policy-CLI Home Page')
})