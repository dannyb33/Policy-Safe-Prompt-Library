// @ts-ignore
import { MongoClient, Db, Collection } from "mongodb";
import type { PromptTemplate } from "../core/types.js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const TEMPLATES_COLLECTION = process.env.TEMPLATES_COLLECTION || "templates";
const RULES_COLLECTION     = process.env.RULES_COLLECTION     || "policy_rules";
const DEMO_COLLECTION      = process.env.DEMO_COLLECTION      || "demo";

if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in environment variables (.env file)");
if (!MONGODB_DB)  throw new Error("MONGODB_DB is not set in environment variables (.env file)");

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db && client) return db;

  client = new MongoClient(MONGODB_URI!);
  await client.connect();
  db = client.db(MONGODB_DB!);

  return db;
}

// templates collection
export async function getTemplatesCollection(): Promise<Collection<PromptTemplate>> {
  const database = await connectDb();
  const collection = database.collection<PromptTemplate>(TEMPLATES_COLLECTION);

  await collection.createIndex({ id: 1, version: 1 }, { unique: true, background: true });
  await collection.createIndex({ id: 1, version: -1 }, { background: true });

  return collection;
}

// policy_rules collection
export async function getPoliciesCollection(): Promise<Collection> {
  const database = await connectDb();
  return database.collection(RULES_COLLECTION);
}

// demo collection
export async function getDemoCollection(): Promise<Collection> {
  const database = await connectDb();
  return database.collection(DEMO_COLLECTION);
}

export async function closeDb(): Promise<void> {
  if (!client) return;
  await client.close();
  client = null;
  db = null;
}
