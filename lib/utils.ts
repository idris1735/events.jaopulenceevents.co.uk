import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatCurrencyPounds(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(value);
}

export function isPlaceholderEventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() >= 2099;
}

export function formatDateTime(value: string) {
  if (isPlaceholderEventDate(value)) {
    return "Date to be announced";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London"
  }).format(new Date(value));
}

export function formatTimeLondon(value: string) {
  if (isPlaceholderEventDate(value)) {
    return "To be announced";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone: "Europe/London"
  }).format(new Date(value));
}

export function poundsToPence(value: number) {
  return Math.round(value * 100);
}

export function isWithinSalesWindow(startAt: string, endAt: string, now = new Date()) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const current = now.getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return current >= start && current <= end;
}
