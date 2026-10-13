"use client";

import { useId } from "react";

import { ui } from "@/components/ui/styles";

import type { RetrievalMethod } from "../api/types";
import { METHOD_ORDER, METHODS } from "../lib/methods";

export function MethodSelect({
  value,
  onChange,
  semanticReady,
}: {
  value: RetrievalMethod;
  onChange: (m: RetrievalMethod) => void;
  semanticReady: boolean;
}) {
  const id = useId();
  const info = METHODS[value];
  return (
    <div className="grid min-w-0 gap-1.5">
      <label className={ui.field} htmlFor={id}>
        Retrieval method
      </label>
      <select id={id} className={ui.input} value={value} onChange={(e) => onChange(e.target.value as RetrievalMethod)}>
        {METHOD_ORDER.map((m) => {
          const off = METHODS[m].semantic && !semanticReady;
          return (
            <option key={m} value={m} disabled={off}>
              {METHODS[m].short} · {METHODS[m].label}
              {METHODS[m].experimental ? " (experimental)" : ""}
              {off ? " (unavailable)" : ""}
            </option>
          );
        })}
      </select>
      <span className="text-[0.78rem] text-label-3">{info.description}</span>
    </div>
  );
}
