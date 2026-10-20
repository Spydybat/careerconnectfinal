import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyticsAccess, analyticsDashboard, analyticsExport } from "@/lib/analytics.functions";
import type { AnalyticsFilters } from "@/analytics/filters";
import type { AnalyticsDomain, DashboardResponse } from "@/analytics/types";
import type { ExportFormat } from "@/analytics/export";

export interface DashboardParams {
  domain: AnalyticsDomain;
  filters: AnalyticsFilters;
  page: number;
  pageSize: number;
}

export function useAnalyticsAccess() {
  const fetchAccess = useServerFn(analyticsAccess);
  return useQuery({
    queryKey: ["analytics", "access"],
    queryFn: () => fetchAccess(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboard(params: DashboardParams) {
  const fetchDashboard = useServerFn(analyticsDashboard);
  return useQuery<DashboardResponse>({
    queryKey: ["analytics", "dashboard", params],
    queryFn: () => fetchDashboard({ data: params }),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

function download(filename: string, mimeType: string, base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useDashboardExport(params: DashboardParams) {
  const runExport = useServerFn(analyticsExport);
  return useMutation({
    mutationFn: async (format: ExportFormat) => runExport({ data: { ...params, format } }),
    onSuccess: (result) => download(result.filename, result.mime_type, result.content),
  });
}
