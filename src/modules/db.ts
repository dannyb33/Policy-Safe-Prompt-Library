// @ts-ignore
import { MongoClient, Db, Collection } from "mongodb";
import type { PromptTemplate } from "../core/types.js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const TEMPLATES_COLLECTION = process.env.TEMPLATES_COLLECTION || "templates";

if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in environment variables (.env file)");
if (!MONGODB_DB) throw new Error("MONGODB_DB is not set in environment variables (.env file)");


let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db && client) return db;

  client = new MongoClient(MONGODB_URI!);
  await client.connect();
  db = client.db(MONGODB_DB!);

  return db;
}

export async function getTemplatesCollection(): Promise<Collection<PromptTemplate>> {
  const database = await connectDb();
  const collection = database.collection<PromptTemplate>(TEMPLATES_COLLECTION);

  await collection.createIndex({ id: 1, version: 1 }, { unique: true, background: true });
  await collection.createIndex({ id: 1, version: -1 }, { background: true });

  return collection;
}

export async function closeDb(): Promise<void> {
  if (!client) return;
  await client.close();
  client = null;
  db = null;
}
