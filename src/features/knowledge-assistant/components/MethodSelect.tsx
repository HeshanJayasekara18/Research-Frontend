"use client";

import { useId } from "react";

import type { RetrievalMethod } from "../api/types";
import { METHOD_ORDER, METHODS } from "../lib/methods";
import styles from "./controls.module.css";

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
    <div className={styles.group}>
      <label className="field" htmlFor={id}>
        Retrieval method
      </label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value as RetrievalMethod)}>
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
      <span className={styles.help}>{info.description}</span>
    </div>
  );
}
