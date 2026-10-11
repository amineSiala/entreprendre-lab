import { describe, expect, it, vi, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { grade } from "@/lib/grading";
import { requirePresenter } from "@/lib/presenter-auth";
import { questions } from "@/content/questions.fr";

afterEach(() => vi.unstubAllEnvs());
describe("speed scoring", () => {
  it("awards 1000 immediately, 750 halfway, 500 just before the deadline and zero after", () => {
    const answer = { choice: 1, reason: 2 };
    expect([0, 10000, 19999, 20000].map(time => grade("individual", answer, time).xp)).toEqual([1000, 750, 500, 0]);
    expect(grade("individual", { choice: 0 }, 0).xp).toBe(0);
    expect(grade("individual", answer, -100).xp).toBe(1000);
  });
  it("uses 20 seconds for choices and 120 for typing, with a proportional 8000-point recall", () => {
    expect(Object.values(questions).every(q => q.seconds === (q.kind === "recall" ? 120 : 20))).toBe(true);
    expect(grade("boss", { recall: ["familial", "international"] }, 30000).xp).toBe(1750);
  });
});
describe("server-side presenter authentication", () => {
  it("rejects absent or wrong credentials and accepts only the configured password", () => {
    vi.stubEnv("PRESENTER_PASSWORD_HASH", createHash("sha256").update("test-password").digest("hex"));
    expect(() => requirePresenter()).toThrow(expect.objectContaining({ status: 401 }));
    expect(() => requirePresenter("wrong")).toThrow(expect.objectContaining({ status: 401 }));
    expect(() => requirePresenter("test-password")).not.toThrow();
  });
  it("fails closed without configuration", () => {
    vi.stubEnv("PRESENTER_PASSWORD_HASH", "");
    expect(() => requirePresenter("anything")).toThrow(expect.objectContaining({ status: 503 }));
  });
});
