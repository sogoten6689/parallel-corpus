export function containsSublistUnordered<T>(mainList: T[], subList: T[]): boolean {
  const mainSet = new Set(mainList);
  const subSet = new Set(subList);

  for (const item of subSet) {
    if (!mainSet.has(item)) {
      return false;
    }
  }
  return true;
}