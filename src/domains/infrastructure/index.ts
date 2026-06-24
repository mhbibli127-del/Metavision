/**
 * Infrastructure adapters — persistence, messaging, external APIs.
 */
export { connectDb } from "@/lib/mongodb";
export { callAI } from "@/lib/ai-backend";
export { enqueueJob, startWorkers } from "@/lib/queue";
