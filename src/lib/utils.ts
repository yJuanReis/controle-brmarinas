import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Busca inteligente com prioridade no início + busca difusa
 * Primeiro tenta encontrar no início do campo (startsWith)
 * Depois procura em qualquer parte do conteúdo (includes)
 */
export function smartSearch(text: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  
  const lowerText = text.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Primeiro tenta busca no início (prioridade)
  if (lowerText.startsWith(lowerSearchTerm)) return true;
  
  // Depois busca em qualquer parte do conteúdo
  return lowerText.includes(lowerSearchTerm);
}

/**
 * Filtra uma lista de objetos usando busca inteligente em múltiplos campos
 */
export function filterWithSmartSearch<T>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  
  return items.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value == null) return false;
      return smartSearch(String(value), searchTerm);
    });
  });
}
