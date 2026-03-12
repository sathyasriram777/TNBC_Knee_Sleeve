"use client";

import {
  CircleMinus,
  FileText,
  PlusCircle,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialPatients: { id: string; name: string }[] = [];

export function Patients() {
  const [patients, setPatients] = useState(initialPatients);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");

  const handleAddPatient = () => {
    const name = newPatientName.trim();
    if (!name) return;
    setPatients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name },
    ]);
    setNewPatientName("");
    setShowAddForm(false);
  };

  const handleDeletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
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
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
            <Input
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
              placeholder="Patient name"
              className="flex-1 min-w-[120px] bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPatient();
                if (e.key === "Escape") setShowAddForm(false);
              }}
              autoFocus
            />
            <Button type="button" size="sm" onClick={handleAddPatient}>
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewPatientName("");
              }}
            >
              Cancel
            </Button>
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
