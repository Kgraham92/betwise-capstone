import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV ?? "development";

const currentFile = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(currentFile), "..");

const candidates =
  nodeEnv === "test"
    ? [".env.test.local", ".env.test", ".env"]
    : [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, ".env.local", ".env"];

for (const relPath of candidates) {
  const absolutePath = path.join(packageRoot, relPath);
  if (!fs.existsSync(absolutePath)) continue;
  dotenv.config({ path: absolutePath, override: false });
}

