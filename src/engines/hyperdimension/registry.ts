import fs from "node:fs";
import path from "node:path";
import type { ExecutionGraph, ModuleDescriptor, ModuleType } from "./types";

const ENGINE_ROOT = path.join(process.cwd(), "hyperdimension");
const JS_ROOT = path.join(ENGINE_ROOT, "js");

const MODULE_META: Record<string, Omit<ModuleDescriptor, "name" | "path">> = {
  config: {
    type: "utils",
    dependencies: [],
    inputSchema: [],
    outputSchema: ["CONFIG", "BATCH_RANGES"],
  },
  physics: {
    type: "model",
    dependencies: ["config", "grounding", "phase", "critical", "numerics"],
    inputSchema: ["HyperdimensionConfig"],
    outputSchema: ["simulationState", "wStats", "energy"],
  },
  experiment: {
    type: "pipeline",
    dependencies: ["config", "physics", "numerics", "validation"],
    inputSchema: ["HyperdimensionConfig"],
    outputSchema: ["ExperimentResult"],
  },
  statistics: {
    type: "analyzer",
    dependencies: [],
    inputSchema: ["ExperimentResult[]"],
    outputSchema: ["batchAnalysis", "report"],
  },
  validation: {
    type: "analyzer",
    dependencies: ["experiment"],
    inputSchema: ["ExperimentResult[]", "HyperdimensionConfig"],
    outputSchema: ["modelAssessment"],
  },
  discovery: {
    type: "pipeline",
    dependencies: ["statistics"],
    inputSchema: ["ExperimentResult[]"],
    outputSchema: ["discoveryReport"],
  },
  "invariant-pipeline": {
    type: "pipeline",
    dependencies: ["discovery", "theory"],
    inputSchema: ["ExperimentResult[]"],
    outputSchema: ["invariants", "symmetry_groups"],
  },
  "discovery-core": {
    type: "pipeline",
    dependencies: ["invariant-pipeline", "theory"],
    inputSchema: ["ExperimentResult[]"],
    outputSchema: ["universal_law_found", "candidate_laws"],
  },
  "regime-theory": {
    type: "model",
    dependencies: ["invariant-pipeline"],
    inputSchema: ["ExperimentResult[]"],
    outputSchema: ["regime_models", "transition_operator"],
  },
  "universal-law": {
    type: "analyzer",
    dependencies: ["discovery-core"],
    inputSchema: ["ExperimentResult[]"],
    outputSchema: ["universal_law_candidate"],
  },
  renderer: {
    type: "utils",
    dependencies: ["physics", "projection"],
    inputSchema: ["HyperdimensionConfig"],
    outputSchema: ["visualFrame"],
  },
};

function inferType(fileName: string): ModuleType {
  if (fileName.includes("worker")) return "worker";
  if (MODULE_META[fileName.replace(/\.js$/, "")]?.type) {
    return MODULE_META[fileName.replace(/\.js$/, "")]!.type;
  }
  if (fileName.includes("discovery") || fileName.includes("pipeline") || fileName.includes("experiment")) {
    return "pipeline";
  }
  if (fileName.includes("theory") || fileName.includes("physics") || fileName.includes("regime")) {
    return "model";
  }
  if (fileName.includes("statistics") || fileName.includes("validation") || fileName.includes("audit")) {
    return "analyzer";
  }
  return "utils";
}

function parseDependencies(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf8");
  const deps = new Set<string>();
  const importRe = /from\s+['"]\.\/([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(content)) !== null) {
    deps.add(match[1].replace(/\.js$/, ""));
  }
  return [...deps];
}

export function buildModuleRegistry(): Record<string, ModuleDescriptor> {
  const registry: Record<string, ModuleDescriptor> = {};

  if (!fs.existsSync(JS_ROOT)) {
    return registry;
  }

  for (const file of fs.readdirSync(JS_ROOT)) {
    if (!file.endsWith(".js") || file.endsWith("-worker.js")) continue;
    const name = file.replace(/\.js$/, "");
    const filePath = path.join(JS_ROOT, file);
    const meta = MODULE_META[name];
    registry[name] = {
      name,
      path: filePath,
      type: meta?.type ?? inferType(file),
      dependencies: meta?.dependencies ?? parseDependencies(filePath),
      inputSchema: meta?.inputSchema ?? [],
      outputSchema: meta?.outputSchema ?? [],
    };
  }

  const pyScript = path.join(ENGINE_ROOT, "scripts", "theory_discover.py");
  if (fs.existsSync(pyScript)) {
    registry.theory_discover_py = {
      name: "theory_discover_py",
      path: pyScript,
      type: "pipeline",
      dependencies: ["discovery-core"],
      inputSchema: ["ExperimentResult[]"],
      outputSchema: ["candidate_laws"],
    };
  }

  return registry;
}

export function buildExecutionGraph(registry = buildModuleRegistry()): ExecutionGraph {
  const pipelineOrder = [
    "config",
    "physics",
    "experiment",
    "statistics",
    "validation",
    "discovery",
    "invariant-pipeline",
    "discovery-core",
    "regime-theory",
    "universal-law",
  ];

  const nodes = pipelineOrder.filter((n) => registry[n]);
  const edges: ExecutionGraph["edges"] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i], to: nodes[i + 1] });
  }

  for (const node of nodes) {
    for (const dep of registry[node]?.dependencies ?? []) {
      if (registry[dep] && !edges.some((e) => e.from === dep && e.to === node)) {
        edges.push({ from: dep, to: node });
      }
    }
  }

  return { nodes, edges };
}

export function getEngineRoot(): string {
  return ENGINE_ROOT;
}
