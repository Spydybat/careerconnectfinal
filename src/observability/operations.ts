/** Sprint 14 — the shape the operations console and alert engine consume. */

import type { ComponentHealth, HealthStatus } from "./types";
import type { MetricsSnapshot } from "./metrics";
import type { DatabaseObservability } from "./database";
import type { EtlRunSummary } from "./etl";
import type { QualitySnapshot, QualityTrendPoint } from "./quality";
import type { FreshnessReport } from "./freshness";
import type { AiObservability } from "./ai";
import type { SecurityObservability } from "./security";
import type { StorageObservability } from "./storage";

export interface OperationsSnapshot {
  generated_at: string;
  environment: string;
  status: HealthStatus;
  components: ComponentHealth[];
  application: MetricsSnapshot;
  database: DatabaseObservability;
  etl: EtlRunSummary;
  quality: QualitySnapshot;
  quality_trend: QualityTrendPoint[];
  warehouse: FreshnessReport;
  bi: {
    last_updated: string;
    data_through: string;
    pipeline_status: EtlRunSummary["status"];
    freshness: FreshnessReport["status"];
    query_duration_ms: number;
  };
  ai: AiObservability;
  storage: StorageObservability;
  security: SecurityObservability;
  alerts: import("./alerts").AlertEvaluation[];
}
