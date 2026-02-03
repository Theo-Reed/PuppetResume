import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const url = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!url || !dbName) {
  console.error('❌ MONGODB_URI or MONGODB_DB_NAME is not defined in .env');
  process.exit(1);
}

let db: Db | null = null;
let client: MongoClient | null = null;

export async function connectToLocalMongo(): Promise<Db> {
  if (db) return db;

  const connectionUrl = process.env.MONGODB_URI;
  const targetDbName = process.env.MONGODB_DB_NAME;

  if (!connectionUrl || !targetDbName) {
    console.error('❌ MONGODB_URI or MONGODB_DB_NAME is not defined in .env');
    process.exit(1);
  }

  try {
    client = new MongoClient(connectionUrl);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    db = client.db(targetDbName);
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToLocalMongo first.');
  }
  return db;
}

export async function closeLocalMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
