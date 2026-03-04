export function toTimestamp(value: number | string) {
  if (typeof value === "number") return value

  const asNumber = Number(value)
  if (!Number.isNaN(asNumber)) return asNumber

  return Date.parse(value)
}
