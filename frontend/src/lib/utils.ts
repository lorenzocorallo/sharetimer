import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRandomClientId(length: number = 21): string {
  // probability to get two identical is <0.0000004% => 1 / 250mln
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((x) => charset[x % charset.length])
    .join("");
}
