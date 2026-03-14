"use client";

import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteReportAction } from "@/app/protected/profile/actions";
import type { ReportListItem } from "@/lib/queries/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportsProps = {
  initialReports: ReportListItem[];
  patientId: string | null;
};

function formatReportDate(d: Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Reports({ initialReports, patientId }: ReportsProps) {
  const [reports, setReports] = useState<ReportListItem[]>(initialReports);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (sessionId: string) => {
    setError(null);
    setDeletingId(sessionId);
    const result = await deleteReportAction(sessionId);
    setDeletingId(null);
    if (result.success) {
      setReports((prev) => prev.filter((r) => r.id !== sessionId));
    } else {
      setError(result.error);
    }
  };

  return (
    <Card className="bg-muted w-full">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle>Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-8 pb-8">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">
            No reports yet. Record a session to see reports here.
          </p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              {patientId && (
                <Link
                  href={`/protected/diagnostics?patient=${patientId}`}
                  className="rounded p-1.5 text-foreground hover:bg-muted shrink-0"
                  aria-label={`View diagnostics for report from ${formatReportDate(report.createdAt)}`}
                >
                  <FileText className="h-5 w-5" />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-medium block truncate">
                  {formatReportDate(report.createdAt)}
                </span>
                <span className="text-muted-foreground text-sm capitalize">
                  {report.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(report.id)}
                disabled={deletingId === report.id}
                className="rounded p-1.5 text-foreground hover:bg-muted shrink-0 disabled:opacity-50"
                aria-label={`Delete report from ${formatReportDate(report.createdAt)}`}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))
        )}
        {patientId && (
          <Button asChild variant="outline" size="sm" className="w-full mt-2">
            <Link href={`/protected/diagnostics?patient=${patientId}`}>
              Record session
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
