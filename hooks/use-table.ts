"use client";

import { useEffect, useState } from "react";
import { readTable, readTableFromSearch, saveTable } from "@/lib/table";

export function useTable() {
  const [table, setTable] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const fromLink = readTableFromSearch(window.location.search);
      if (fromLink !== null) { saveTable(fromLink); setTable(fromLink); return; }
      setTable(readTable());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return table;
}
