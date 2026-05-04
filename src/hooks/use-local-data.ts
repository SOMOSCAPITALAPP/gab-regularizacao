"use client";

import { useEffect, useMemo, useState } from "react";
import { estimatedCommission, gabPriorityScore } from "@/lib/calculations";
import { seedData } from "@/lib/seed";
import type { AppData, Property } from "@/lib/types";

const STORAGE_KEY = "gab-regularizacao-v1";

function normalize(data: AppData): AppData {
  return {
    ...data,
    properties: data.properties.map((property) => {
      const commission = estimatedCommission(property.estimatedValue, property.commissionPercentage);
      return {
        ...property,
        estimatedCommission: commission,
        opportunityScore: gabPriorityScore({ ...property, estimatedCommission: commission }),
      };
    }),
  };
}

export function useLocalData() {
  const [data, setData] = useState<AppData>(seedData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setData(normalize(JSON.parse(stored) as AppData));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, ready]);

  const api = useMemo(
    () => ({
      reset() {
        setData(seedData);
      },
      upsertProperty(property: Property) {
        const now = new Date().toISOString();
        const commission = estimatedCommission(property.estimatedValue, property.commissionPercentage);
        const normalized = {
          ...property,
          estimatedCommission: commission,
          opportunityScore: gabPriorityScore({ ...property, estimatedCommission: commission }),
          updatedAt: now,
          createdAt: property.createdAt || now,
        };
        setData((current) => ({
          ...current,
          properties: current.properties.some((item) => item.id === property.id)
            ? current.properties.map((item) => (item.id === property.id ? normalized : item))
            : [normalized, ...current.properties],
        }));
      },
      deleteProperty(id: string) {
        setData((current) => ({
          ...current,
          properties: current.properties.filter((item) => item.id !== id),
          documents: current.documents.filter((item) => item.propertyId !== id),
          checklist: current.checklist.filter((item) => item.propertyId !== id),
          activities: current.activities.filter((item) => item.propertyId !== id),
        }));
      },
      setData,
    }),
    [],
  );

  return { data, ready, ...api };
}
