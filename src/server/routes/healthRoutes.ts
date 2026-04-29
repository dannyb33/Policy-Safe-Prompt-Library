import { Router } from "express";
import { connectDb } from "../../modules/db.js";

const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    const db = await connectDb();
    await db.command({ ping: 1 });

    res.status(200).json({
      status: "ok",
      services: {
        api: "up",
        database: "up",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    res.status(503).json({
      status: "degraded",
      services: {
        api: "up",
        database: "down",
      },
      error: e.message || "Database ping failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export default healthRouter;