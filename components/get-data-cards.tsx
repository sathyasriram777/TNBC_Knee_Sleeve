"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Square } from "lucide-react";
import { startGetDataAction, stopGetDataAction } from "@/app/protected/get-data/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionSummary = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  payloadCount: number;
};

type PayloadSummary = {
  id: string;
  data: unknown;
  createdAt: string;
};

type GetDataCardProps = {
  patientId: string;
  initialSession: SessionSummary | null;
  initialPayloads: PayloadSummary[];
};

type UiState =
  | "idle"
  | "starting"
  | "waiting"
  | "receiving"
  | "stopped"
  | "error";

const POLL_INTERVAL_MS = 2000;

export function GetDataCard({
  patientId,
  initialSession,
  initialPayloads,
}: GetDataCardProps) {
  const [uiState, setUiState] = useState<UiState>(() => {
    if (initialSession?.status === "recording") return initialPayloads.length > 0 ? "receiving" : "waiting";
    if (initialSession?.status === "stopped") return "stopped";
    return "idle";
  });
  const [sessionId, setSessionId] = useState<string | null>(initialSession?.id ?? null);
  const [sessionStatus, setSessionStatus] = useState<string>(initialSession?.status ?? "");
  const [payloads, setPayloads] = useState<PayloadSummary[]>(initialPayloads);
  const [lastUpdated, setLastUpdated] = useState<string>(initialSession?.updatedAt ?? "");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchSession = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/get-data/session/${sid}`);
      if (!res.ok) {
        setUiState("error");
        setErrorMessage("Failed to load session data.");
        stopPolling();
        return;
      }
      const data = (await res.json()) as {
        sessionId: string;
        status: string;
        payloads: { id: string; data: unknown; createdAt: string }[];
      };
      setSessionStatus(data.status);
      setPayloads(
        data.payloads.map((p) => ({
          id: p.id,
          data: p.data,
          createdAt: p.createdAt,
        }))
      );
      const latest = data.payloads[data.payloads.length - 1];
      if (latest) setLastUpdated(latest.createdAt);
      if (data.status === "stopped") {
        setUiState("stopped");
        stopPolling();
      } else if (data.payloads.length > 0) {
        setUiState("receiving");
      } else {
        setUiState("waiting");
      }
    } catch {
      setUiState("error");
      setErrorMessage("Polling failed.");
      stopPolling();
    }
  }, [stopPolling]);

  useEffect(() => {
    if (sessionId && (uiState === "waiting" || uiState === "receiving")) {
      pollRef.current = setInterval(() => fetchSession(sessionId), POLL_INTERVAL_MS);
      return () => stopPolling();
    }
  }, [sessionId, uiState, fetchSession, stopPolling]);

  const handleGetData = async () => {
    setErrorMessage("");
    setUiState("starting");
    const result = await startGetDataAction(patientId);
    if (result.ok) {
      setSessionId(result.sessionId);
      setSessionStatus("recording");
      setPayloads([]);
      setLastUpdated(new Date().toISOString());
      setUiState("waiting");
    } else {
      setUiState("error");
      setErrorMessage(result.error);
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    setErrorMessage("");
    const result = await stopGetDataAction(sessionId, patientId);
    if (result.ok) {
      setSessionStatus("stopped");
      setUiState("stopped");
      stopPolling();
      router.push(`/protected/diagnostics?patient=${patientId}`);
    } else {
      setUiState("error");
      setErrorMessage(result.error);
    }
  };

  const statusLabel =
    uiState === "idle"
      ? "Ready"
      : uiState === "starting"
        ? "Starting..."
        : uiState === "waiting"
          ? "Waiting for ESP data..."
          : uiState === "receiving"
            ? "Receiving data"
            : uiState === "stopped"
              ? "Stopped"
              : "Error";

  return (
    <Card className="border-0 bg-white w-full">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          Get data from ESP
        </CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-8 space-y-4">
        <p className="text-muted-foreground text-sm">
          Create a session and wait for incoming ESP data. The ESP can POST to{" "}
          <code className="text-xs bg-muted px-1 rounded">/api/esp/upload</code>.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {uiState === "idle" && (
            <Button
              variant="secondary"
              size="default"
              onClick={handleGetData}
            >
              Get data from ESP
            </Button>
          )}
          {(uiState === "waiting" || uiState === "receiving") && (
            <Button
              variant="destructive"
              size="default"
              onClick={handleStop}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          )}
          {uiState === "stopped" && (
            <Button variant="secondary" size="default" onClick={handleGetData}>
              Start new session
            </Button>
          )}
          {uiState === "error" && (
            <Button variant="secondary" size="default" onClick={handleGetData}>
              Try again
            </Button>
          )}
        </div>

        {(sessionId || uiState !== "idle") && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-medium text-foreground">Status: {statusLabel}</p>
            {sessionId && (
              <p className="text-muted-foreground">
                Session ID: <code className="text-xs">{sessionId}</code>
              </p>
            )}
            {lastUpdated && (
              <p className="text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
            <p className="text-muted-foreground">
              Payloads: {payloads.length}
            </p>
            {errorMessage && (
              <p className="text-destructive">{errorMessage}</p>
            )}
            {payloads.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-muted-foreground">
                  Last payload (raw JSON)
                </summary>
                <pre className="mt-2 p-2 rounded bg-background text-xs overflow-auto max-h-40">
                  {JSON.stringify(payloads[payloads.length - 1]?.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
