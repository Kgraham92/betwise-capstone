import type { Express } from "express";
import type { Server } from "http";
import request, { type SuperTest, type Test } from "supertest";

export type TestServer = {
  server: Server;
  request: SuperTest<Test>;
};

export async function startTestServer(app: Express): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, request: request(server) });
    });

    server.on("error", (err) => reject(err));
  });
}

export async function stopTestServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
