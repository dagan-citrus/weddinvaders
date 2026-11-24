// Returns the subset of the event's items that can spawn in this level, in item order
export function getSpawnPool(level, items) {
  const allowed = new Set([...level.required, ...level.optional]);
  return items.filter(item =>
    allowed.has(item.id) || (level.hasMines && item.incomeType === 'mine')
  );
}

// True when every required item has been acquired
export function isLevelComplete(level, acquiredItems) {
  return level.required.every(id => acquiredItems.includes(id));
}
