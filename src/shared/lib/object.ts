export function hasOwn<K extends PropertyKey>(
  value: object,
  key: K,
): value is Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(value, key)
}
