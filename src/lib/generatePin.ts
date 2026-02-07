/**
 * Genera un PIN aleatori de 6 dígits
 */
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
