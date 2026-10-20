/** Structured, in-memory pipeline logger (no console noise unless enabled). */

import type { EtlStage } from "./errors";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  at: string;
  run_id: string;
  stage: EtlStage | "pipeline";
  dataset: string | undefined;
  message: string;
  context: Record<string, unknown> | undefined;
}

export interface PipelineLogger {
  log(
    level: LogLevel,
    stage: EtlStage | "pipeline",
    message: string,
    options?: { dataset?: string; context?: Record<string, unknown> },
  ): void;
  entries(): LogEntry[];
}

export function createLogger(options: {
  runId: string;
  clock: () => string;
  echo?: boolean;
  minLevel?: LogLevel;
}): PipelineLogger {
  const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  const min = order[options.minLevel ?? "info"];
  const entries: LogEntry[] = [];

  return {
    log(level, stage, message, opts) {
      if (order[level] < min) return;
      const entry: LogEntry = {
        level,
        at: options.clock(),
        run_id: options.runId,
        stage,
        dataset: opts?.dataset,
        message,
        context: opts?.context,
      };
      entries.push(entry);
      if (options.echo) {
        const scope = opts?.dataset ? `${stage}/${opts.dataset}` : stage;
        console.log(`${level.toUpperCase().padEnd(5)} ${scope.padEnd(28)} ${message}`);
      }
    },
    entries: () => [...entries],
  };
}
