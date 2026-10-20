/**
 * Local CLI: materialises the data lake, warehouse and marts on disk.
 *
 * Run with:  bun run data:build            (scale 0.05, fast)
 *            bun run data:build -- --scale=1 --out=.data-lake
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { createConfig } from "../src/data-platform/config";
import { createFsLakeStore } from "../src/data-platform/lake/store";
import { runPipeline } from "../src/data-platform/etl/pipeline";
import { buildWarehouse } from "../src/data-platform/warehouse/build";
import { buildMarts } from "../src/data-platform/marts";
import { buildDataDictionary } from "../src/data-platform/dictionary";

function arg(name: string, fallback: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
}

const scale = Number(arg("scale", "0.05"));
const root = arg("out", ".data-lake");
const mode = arg("mode", "full") === "incremental" ? "incremental" : "full";

const config = createConfig({ scale, lakeRoot: root });
const fs = { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } as never;
const store = createFsLakeStore(fs, root);

console.log(`Building data platform (scale=${scale}, mode=${mode}) into ${root}/ ...`);
const started = Date.now();

const pipeline = runPipeline({ config, mode, store, echoLogs: true });
const { tables, scd } = buildWarehouse({
  curated: pipeline.curated,
  effectiveFrom: pipeline.run.started_at,
});
const marts = buildMarts(tables);
const dictionary = buildDataDictionary();

const writeJson = (path: string, data: unknown) => {
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 0));
};

for (const [name, rows] of Object.entries(tables))
  writeJson(`${root}/warehouse/${name}.json`, rows);
for (const [name, rows] of Object.entries(marts)) writeJson(`${root}/marts/${name}.json`, rows);
writeJson(`${root}/_metadata/run.json`, pipeline.run);
writeJson(`${root}/_metadata/reconciliation.json`, pipeline.reconciliation);
writeJson(`${root}/_metadata/quality.json`, pipeline.run.quality);
writeJson(`${root}/_metadata/watermarks.json`, pipeline.watermarks.all());
writeJson(`${root}/_metadata/logs.json`, pipeline.logs);
writeJson(`${root}/_metadata/data-dictionary.json`, dictionary);

console.log("\n--- Curated row counts ---");
for (const [name, rows] of Object.entries(pipeline.curated)) {
  console.log(`${name.padEnd(24)} ${rows.length}`);
}
console.log("\n--- Warehouse row counts ---");
for (const [name, rows] of Object.entries(tables)) console.log(`${name.padEnd(24)} ${rows.length}`);
console.log("\n--- Mart row counts ---");
for (const [name, rows] of Object.entries(marts)) console.log(`${name.padEnd(24)} ${rows.length}`);
console.log("\nQuality:", pipeline.summary.quality);
console.log("Reconciliation:", pipeline.summary.reconciliation);
console.log("SCD:", scd);
console.log(`Run ${pipeline.run.run_id} -> ${pipeline.run.status} in ${Date.now() - started}ms`);
