// src/docs/openapi.ts
// OpenAPI 3.1 суурь — endpoint баримт нь router файлуудын `@openapi` JSDoc-оос уншигдана.
import fs from "fs";
import path from "path";

import swaggerJsdoc from "swagger-jsdoc";

import { CONFIG } from "../config/env";

export type OpenApiSpec = Record<string, unknown> & {
  openapi: string;
  paths: Record<string, Record<string, unknown>>;
};

function packageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, "../../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const definition = {
  openapi: "3.1.0",
  info: {
    title: `${CONFIG.NAME} API`,
    version: packageVersion(),
    description: [
      "Cron Job backend — хуваарьт HTTP ажлуудыг удирдах REST API.",
      "",
      "**Response envelope** — бүх JSON хариу `{ success, message, code, data }`.",
      "",
      "**Admin** — panel-ийн нэвтрэлт: `Authorization: Bearer <JWT>`.",
      "**API key** — SDK/программ: `x-api-key: <key>`."
    ].join("\n")
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "System", description: "Healthcheck, version" },
    { name: "Public", description: "SDK-аас ажил бүртгэх (backward-compatible)" },
    { name: "Admin Auth", description: "Panel нэвтрэлт (env admin + JWT)" },
    { name: "Jobs", description: "Ажлуудыг удирдах (admin)" },
    { name: "API Keys", description: "SDK түлхүүр удирдах (admin)" },
    { name: "Logs", description: "Ажлын гүйцэтгэлийн log (admin)" },
    { name: "Settings", description: "Тохиргоо — log retention, workspace (admin)" }
  ],
  components: {
    securitySchemes: {
      adminBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Panel-ийн нэвтрэлтийн JWT"
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "SDK/программын API key"
      }
    },
    schemas: {
      ApiResponse: {
        type: "object",
        required: ["success", "message", "code", "data"],
        properties: {
          success: { type: "boolean", examples: [true] },
          message: { type: "string", examples: ["Success"] },
          code: { type: "string", examples: ["200"] },
          data: { description: "Payload" }
        }
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "message", "code", "data"],
        properties: {
          success: { type: "boolean", const: false },
          message: { type: "string", examples: ["Error message"] },
          code: { type: "string", examples: ["400"] },
          data: { type: "null" }
        }
      },
      Job: {
        type: "object",
        properties: {
          _id: { type: "string" },
          id: { type: "string" },
          type_name: { type: "string", enum: ["prod", "staging", "test", "dev"] },
          job_time: { type: "string", examples: ["* * * * *"] },
          config: { type: "object", additionalProperties: true },
          status: { type: "boolean" },
          log_enabled: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      JobLog: {
        type: "object",
        properties: {
          _id: { type: "string" },
          job_id: { type: "string" },
          type_name: { type: "string" },
          status: { type: "string", enum: ["success", "error"] },
          http_code: { type: ["integer", "null"] },
          duration_ms: { type: "integer" },
          request_config: { type: "object", additionalProperties: true },
          response_body: {},
          error_message: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      ApiKey: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          display: { type: "string" },
          status: { type: "boolean" },
          last_used_at: { type: ["string", "null"], format: "date-time" },
          createdAt: { type: "string", format: "date-time" }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Хүсэлт буруу",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
        }
      },
      Unauthorized: {
        description: "Нэвтрээгүй / token хүчингүй",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
        }
      },
      NotFound: {
        description: "Олдсонгүй",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
        }
      }
    }
  }
};

const ROOT = path.resolve(__dirname, "..");
const apis = [path.join(ROOT, "routes.{ts,js}"), path.join(ROOT, "api/**/*.{ts,js}")].map((p) =>
  p.replace(/\\/g, "/")
);

let cached: OpenApiSpec | null = null;

export function buildOpenApiSpec(): OpenApiSpec {
  if (cached) return cached;
  cached = swaggerJsdoc({ definition, apis, failOnErrors: false }) as OpenApiSpec;
  return cached;
}
