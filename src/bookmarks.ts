export function migrateBookmarks(
  values: string[],
  legacy: Record<string, string>,
  records: { id: string; uid: string }[],
  needsRenumbering: boolean,
) {
  // Map the original snapshot once: never feed a migrated ID back into the map.
  const ids = values.filter(id => !needsRenumbering || (id !== 'X-023' && id !== 'X-037'))
    .map(id => needsRenumbering ? legacy[id] ?? id : id);
  return [...new Set(ids.map(id => records.find(r => r.id === id)?.uid).filter((uid): uid is string => Boolean(uid)))];
}
