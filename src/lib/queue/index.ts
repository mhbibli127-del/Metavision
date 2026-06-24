import type { JobName, JobPayload } from "./types";

export type { JobName, JobPayload } from "./types";

const memoryJobs: Array<{ name: JobName; data: JobPayload; at: number }> = [];

type BullQueue = import("bullmq").Queue;
type BullWorker = import("bullmq").Worker;

let bullQueue: BullQueue | null = null;
let bullWorker: BullWorker | null = null;

function redisConnection() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  return { url, maxRetriesPerRequest: null as null };
}

async function getBullQueue(): Promise<BullQueue | null> {
  const connection = redisConnection();
  if (!connection) return null;
  if (bullQueue) return bullQueue;
  const { Queue } = await import("bullmq");
  bullQueue = new Queue("metavision", { connection });
  return bullQueue;
}

async function runJob(name: JobName, data: JobPayload) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (name === "trends.refresh") {
    await fetch(`${base}/api/trends/refresh`, { method: "POST" }).catch(() => {});
  }
  if (name === "report.daily") {
    await fetch(`${base}/api/reports/daily`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
  }
}

export async function enqueueJob(name: JobName, data: JobPayload, delayMs = 0): Promise<string | null> {
  const queue = await getBullQueue();
  if (queue) {
    const job = await queue.add(name, data, { delay: delayMs });
    return job.id ?? null;
  }
  memoryJobs.push({ name, data, at: Date.now() + delayMs });
  return `mem-${memoryJobs.length}`;
}

export async function startWorkers(): Promise<void> {
  if (process.env.ENABLE_BULLMQ_WORKER !== "true") return;

  const connection = redisConnection();
  if (connection) {
    if (bullWorker) return;
    const { Worker } = await import("bullmq");
    bullWorker = new Worker(
      "metavision",
      async (job) => {
        await runJob(job.name as JobName, job.data as JobPayload);
      },
      { connection },
    );
    return;
  }

  setInterval(() => {
    const now = Date.now();
    while (memoryJobs.length && memoryJobs[0].at <= now) {
      const job = memoryJobs.shift()!;
      void runJob(job.name, job.data);
    }
  }, 5000);
}
