/**
 * Hyperdimension batch worker — runs parameter grid off main thread.
 * Usage: new Worker("/hyperdimension-batch-worker.js")
 */
self.onmessage = async (e) => {
  const { maxCombos = 200, simulationSteps = 400 } = e.data ?? {};
  try {
    const res = await fetch("/api/engines/hyperdimension/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "train", maxCombos, config: { simulationSteps } }),
    });
    const data = await res.json();
    self.postMessage({ ok: true, data });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};
