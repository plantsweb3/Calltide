"use client";

import { useState, useEffect } from "react";

let cachedName: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

export function useReceptionistName(): string {
  const [name, setName] = useState(cachedName || "Maria");

  useEffect(() => {
    if (cachedName) {
      setName(cachedName);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch("/api/receptionist/profile")
        .then((r) => r.ok ? r.json() : { receptionistName: "Maria" })
        .then((d) => {
          cachedName = d.receptionistName || "Maria";
          return cachedName;
        })
        .catch(() => {
          cachedName = "Maria";
          return "Maria";
        });
    }

    fetchPromise.then((n) => setName(n || "Maria"));
  }, []);

  return name;
}
