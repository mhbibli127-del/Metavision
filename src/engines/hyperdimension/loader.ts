import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createSimulationModules } from "./simulation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = Record<string, any>;

export type LoadedModules = {
  config: AnyModule;
  experiment: AnyModule;
  statistics: AnyModule;
  validation: AnyModule;
  discovery: AnyModule;
  discoveryCore: AnyModule;
  regimeTheory: AnyModule;
  universalLaw: AnyModule;
  audit: AnyModule;
};

const JS_ROOT = path.join(process.cwd(), "hyperdimension", "js");

let cache: LoadedModules | null = null;

async function importJs(file: string): Promise<AnyModule> {
  const url = pathToFileURL(path.join(JS_ROOT, file)).href;
  return import(url);
}

/** TypeScript simulation engine — replaces broken hardcoded fallback */
function tsSimulationModules(): LoadedModules {
  return createSimulationModules() as LoadedModules;
}

export async function loadHyperdimensionModules(): Promise<LoadedModules> {
  if (cache) return cache;

  if (!fs.existsSync(JS_ROOT)) {
    cache = tsSimulationModules();
    return cache;
  }

  try {
    cache = {
      config: await importJs("config.js"),
      experiment: await importJs("experiment.js"),
      statistics: await importJs("statistics.js"),
      validation: await importJs("validation.js"),
      discovery: await importJs("discovery.js"),
      discoveryCore: await importJs("discovery-core.js"),
      regimeTheory: await importJs("regime-theory.js"),
      universalLaw: await importJs("universal-law.js"),
      audit: await importJs("audit.js"),
    };
  } catch {
    cache = tsSimulationModules();
  }

  return cache;
}

export function clearModuleCache(): void {
  cache = null;
}
