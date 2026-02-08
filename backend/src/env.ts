import { z } from "zod";

/**
 * Environment variable schema using Zod
 * All fields are optional with sensible defaults so the app can start
 * in any environment (local dev, Vercel serverless, etc.)
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.string().optional(),
  BACKEND_URL: z.string().optional().default("http://localhost:3000"),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    console.log("✅ Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("⚠️ Environment variable validation issues:");
      error.issues.forEach((err: any) => {
        console.warn(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    // Return defaults instead of crashing — allows serverless cold starts
    return {
      PORT: "3000",
      NODE_ENV: undefined,
      BACKEND_URL: "http://localhost:3000",
    };
  }
}

/**
 * Validated and typed environment variables
 */
export const env = validateEnv();

/**
 * Type of the validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Extend process.env with our environment variables
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line import/namespace
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
