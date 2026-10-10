export function stageKey(event: Pick<KeyboardEvent, "key" | "repeat" | "ctrlKey" | "metaKey" | "altKey">, typing = false) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || typing) return null;
  if (["ArrowRight", "PageDown", " "].includes(event.key)) return "next";
  if (["ArrowLeft", "PageUp"].includes(event.key)) return "previous";
  const key = event.key.toLowerCase();
  if (["f", "p", "r", "?", "escape", "home", "end"].includes(key)) return key;
  return null;
}
