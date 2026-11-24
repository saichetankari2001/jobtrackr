/**
 * True when a single-key shortcut (like "/" or "n") should run: no modifier keys held,
 * and the user isn't typing into a field, where the key must stay plain text.
 */
export function isShortcut(e: KeyboardEvent, key: string): boolean {
  if (e.key.toLowerCase() !== key || e.ctrlKey || e.metaKey || e.altKey) return false
  const el = e.target as HTMLElement
  return !(el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}
