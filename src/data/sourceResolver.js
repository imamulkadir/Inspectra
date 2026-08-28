// Resolves sourceIds arrays (present on nearly every dataset record) into
// full source records for provenance display. An unresolved ID is reported
// rather than silently dropped so a broken reference is visible in QA.
export function resolveSources(sourceIds, sourceById) {
  const resolved = [];
  const unresolved = [];

  for (const id of sourceIds ?? []) {
    const source = sourceById.get(id);
    if (source) resolved.push(source);
    else unresolved.push(id);
  }

  return { resolved, unresolved };
}
