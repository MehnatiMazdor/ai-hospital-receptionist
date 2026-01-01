import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



/**
 * Convert any filename into a "safe" filename
 * - Replaces spaces with underscores
 * - Removes any characters except letters, numbers, dot, dash, underscore
 * 
 * @param filename Original filename (e.g., file.name)
 * @returns Safe filename string
 */
export const getSafeFileName = (filename: string): string => {
  return filename
    .trim()                    // remove leading/trailing spaces
    .replace(/\s+/g, "_")      // replace spaces with underscores
    .replace(/[^\w.-]/g, "");  // remove all non-alphanumeric except _ . -
};



export function truncateName(name: string, max = 14) {
  if (name.length <= max) return name
  return name.slice(0, max) + "…"
}
