export function generateCombinationKey(options: Record<string, any>): string {
  return Object.keys(options)
    .sort()
    .map((key) => String(options[key]).toLowerCase().trim())
    .join('-');
}
