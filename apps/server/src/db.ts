import mongoose from "mongoose";

export async function connectDb(mongoUri: string, dbName?: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, dbName ? { dbName } : undefined);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
