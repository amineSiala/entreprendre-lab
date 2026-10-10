import { describe, expect, it } from "vitest";
import { stageKey } from "@/lib/keyboard";
import { browserId } from "@/lib/browser-id";

const key = (value: string) => ({ key: value, repeat: false, ctrlKey: false, metaKey: false, altKey: false });
describe("projector keyboard safeguards", () => {
  it("allows arrows and presentation clicker equivalents", () => {
    for (const name of ["ArrowRight", "PageDown", " "]) expect(stageKey(key(name))).toBe("next");
    for (const name of ["ArrowLeft", "PageUp"]) expect(stageKey(key(name))).toBe("previous");
  });
  it("never hijacks typing, operating-system shortcuts or held keys", () => {
    expect(stageKey(key("ArrowRight"), true)).toBeNull();
    for (const property of ["ctrlKey", "metaKey", "altKey", "repeat"]) expect(stageKey({ ...key("ArrowRight"), [property]: true })).toBeNull();
    expect(stageKey(key("Tab"))).toBeNull();
  });
  it("recognizes optional stage controls without treating answer letters as navigation", () => {
    expect(stageKey(key("F"))).toBe("f"); expect(stageKey(key("P"))).toBe("p");
    expect(stageKey(key("?"))).toBe("?"); expect(stageKey(key("Escape"))).toBe("escape");
    expect(stageKey(key("a"))).toBeNull();
  });
  it("creates controller IDs using an API supported on HTTP classroom networks", () => {
    const ids = Array.from({ length: 100 }, browserId);
    expect(new Set(ids).size).toBe(100);
    for (const id of ids) expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  });
});
