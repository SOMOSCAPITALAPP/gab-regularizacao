import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, locale: "pt-BR" | "fr") {
  return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "fr-FR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(value?: string, locale: "pt-BR" | "fr" = "pt-BR") {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "pt-BR" ? "pt-BR" : "fr-FR").format(new Date(value));
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
