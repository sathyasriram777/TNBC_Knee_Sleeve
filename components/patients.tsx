"use client";

import {
  CircleMinus,
  FileText,
  PlusCircle,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addPatientAction, deletePatientAction } from "@/app/protected/profile/actions";
import type { PatientListItem } from "@/lib/queries/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PatientsProps = {
  initialPatients: PatientListItem[];
};

export function Patients({ initialPatients }: PatientsProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientListItem[]>(initialPatients);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPatient = async () => {
    const name = newPatientName.trim();
    if (!name) return;
    setAddError(null);
    setIsAdding(true);
    const result = await addPatientAction(name);
    setIsAdding(false);
    if (result.success) {
      setPatients((prev) => [...prev, result.patient]);
      setNewPatientName("");
      setShowAddForm(false);
      router.push(`/protected/get-data?patient=${result.patient.id}`);
    } else {
      setAddError(result.error);
    }
  };

  const handleDeletePatient = async (id: string) => {
    const result = await deletePatientAction(id);
    if (result.success) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <Card className="bg-muted w-full">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle>Patients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-8 pb-8">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-foreground"
          >
            <User className="h-5 w-5 shrink-0 text-foreground" />
            <span className="flex-1 truncate font-medium">{patient.name}</span>
            <Link
              href={`/protected/diagnostics?patient=${patient.id}`}
              className="rounded p-1.5 text-foreground hover:bg-muted"
              aria-label={`View diagnostics for ${patient.name}`}
            >
              <FileText className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={() => handleDeletePatient(patient.id)}
              className="rounded p-1.5 text-foreground hover:bg-muted"
              aria-label="Remove patient"
            >
              <CircleMinus className="h-5 w-5" />
            </button>
          </div>
        ))}
        {showAddForm && (
          <div className="space-y-2 rounded-lg border border-border bg-background px-4 py-3">
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={newPatientName}
                onChange={(e) => {
                  setNewPatientName(e.target.value);
                  setAddError(null);
                }}
                placeholder="Patient name"
                className="flex-1 min-w-[120px] bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPatient();
                  if (e.key === "Escape") setShowAddForm(false);
                }}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddPatient}
                disabled={isAdding}
              >
                {isAdding ? "Adding…" : "Add"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPatientName("");
                  setAddError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        <Button
          className="w-full gap-2"
          size="default"
          onClick={() => setShowAddForm(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Add Patient
        </Button>
      </CardContent>
    </Card>
  );
}
