import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/rooms/[[...path]]/route";
import { beats } from "@/content/beats.fr";
import { identityHash } from "@/lib/store";
import type { PlayMode, RoomState } from "@/types/domain";

type Browser = { token?: string };
type Payload = Partial<RoomState> & { error?: string; forgotten?: boolean };
const origin = "http://localhost:3000";
let dataDirectory: string;
const previousDataDirectory = process.env.DEMO_DATA_DIR;

beforeEach(async () => {
  vi.stubEnv("PRESENTER_PASSWORD_HASH", createHash("sha256").update("test-presenter-password").digest("hex"));
  dataDirectory = await mkdtemp(path.join(os.tmpdir(), "entreprendre-room-test-"));
  process.env.DEMO_DATA_DIR = dataDirectory;
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  if (previousDataDirectory === undefined) delete process.env.DEMO_DATA_DIR;
  else process.env.DEMO_DATA_DIR = previousDataDirectory;
  // Cleanup is restricted to the explicitly created test directory under the temp root.
  if (path.dirname(path.resolve(dataDirectory)) !== path.resolve(os.tmpdir()) || !path.basename(dataDirectory).startsWith("entreprendre-room-test-")) throw new Error("Unexpected test cleanup path");
  await rm(dataDirectory, { recursive: true, force: true });
});

async function request(browser: Browser, code = "", body?: object, overrides: { origin?: string; raw?: string; query?: string } = {}) {
  const headers = new Headers({ host: "localhost:3000" });
  if (body !== undefined || overrides.raw !== undefined) headers.set("origin", overrides.origin ?? origin);
  if (browser.token) headers.set("cookie", `elab_identity=${browser.token}`);
  const isPost = body !== undefined || overrides.raw !== undefined;
  const incoming = new NextRequest(`${origin}/api/rooms${code ? `/${code}` : ""}${overrides.query ?? ""}`, {
    method: isPost ? "POST" : "GET", headers,
    ...(isPost ? { body: overrides.raw ?? JSON.stringify(body) } : {}),
  });
  const response = await (isPost ? POST : GET)(incoming, { params: Promise.resolve({ path: code ? code.split("/") : [] }) });
  const cookie = response.cookies.get("elab_identity");
  if (cookie) browser.token = cookie.value;
  return { response, payload: await response.json() as Payload };
}

async function create(browser: Browser, mode: PlayMode = "phones") {
  const result = await request(browser, "", { action: "create", mode, password: "test-presenter-password" });
  expect(result.response.status).toBe(200);
  expect(result.payload.code).toMatch(/^[A-Z2-9]{6}$/);
  return result.payload.code!;
}

async function control(browser: Browser, code: string, controller = randomUUID()) {
  const result = await request(browser, code, { action: "sync", controller });
  expect(result.response.status).toBe(200);
  expect(result.payload.canControl).toBe(true);
  return controller;
}

async function open(browser: Browser, code: string, controller: string, questionId = "launch", version = 0) {
  const target = beats.findIndex(beat => beat.questionId === questionId && beat.kind.endsWith("-open"));
  const result = await request(browser, code, { action: "move", direction: 1, version, controller, target });
  expect(result.response.status).toBe(200);
  expect(result.payload.round?.state).toBe("open");
  return result.payload;
}

describe("room API ownership and durable classroom flow", () => {
  it("persists editable recall autosaves privately and closes them after one minute", async () => {
    const host: Browser = {}, student: Browser = {}, peer: Browser = {};
    const code = await create(host);
    await request(student, code, { action: "join", nickname: "Writer" });
    await request(peer, code, { action: "join", nickname: "Peer" });
    const controller = await control(host, code);
    const opened = await open(host, code, controller, "mini");
    await request(student, code, { action: "answer", questionId: "mini", answer: { recall: ["ex"] } });
    vi.spyOn(Date, "now").mockReturnValue(opened.round!.openedAt + 30000);
    const saved = await request(student, code, { action: "answer", questionId: "mini", answer: { recall: ["ex nihilo", "essaimage", "franchise"] } });
    expect(saved.response.status).toBe(200);
    expect(saved.payload.round?.submission?.feedback).toBeUndefined();
    expect((await request(peer, code)).payload.round?.submission).toBeUndefined();
    const restored = await request({ token: student.token }, code);
    expect(restored.payload.round?.submission?.answer.recall).toEqual(["ex nihilo", "essaimage", "franchise"]);
    vi.spyOn(Date, "now").mockReturnValue(opened.round!.openedAt + 60000);
    const closed = await request(student, code);
    expect(closed.payload.round?.state).toBe("revealed");
    expect(closed.payload.xp).toBe(750);
    expect((await request(student, code, { action: "answer", questionId: "mini", answer: { recall: ["vert"] } })).response.status).toBe(409);
  });
  it("cannot create a room by bypassing the presenter dialog", async () => {
    expect((await request({}, "", { action: "create", mode: "phones" })).response.status).toBe(401);
    expect((await request({}, "", { action: "create", mode: "phones", password: "incorrect" })).response.status).toBe(401);
    await create({});
  });

  it("automatically reveals at 20 seconds and rejects a late answer", async () => {
    const host: Browser = {}, student: Browser = {};
    const code = await create(host);
    await request(student, code, { action: "join", nickname: "Timer" });
    const controller = await control(host, code);
    const opened = await open(host, code, controller);
    vi.spyOn(Date, "now").mockReturnValue(opened.round!.openedAt + 20_000);
    const current = await request(student, code);
    expect(current.payload.round?.state).toBe("revealed");
    expect(beats[current.payload.index!].id).toBe("launch-results");
    expect((await request(student, code, { action: "answer", questionId: "launch", answer: { choice: 1, reason: 2 } })).payload.code).toBe("CLOSED");
  });

  it("persists two independent student answers, preserves refresh identity, and reveals private feedback", async () => {
    const host: Browser = {}, alice: Browser = {}, bilal: Browser = {};
    const code = await create(host);
    const controller = await control(host, code);
    for (const [browser, nickname] of [[alice, "Alice"], [bilal, "Bilal"]] as const) {
      const joined = await request(browser, code, { action: "join", nickname });
      expect(joined.response.status).toBe(200);
      expect(joined.payload.role).toBe("student");
      expect(joined.response.cookies.get("elab_identity")).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    }
    const opened = await open(host, code, controller);
    const answer = { action: "answer", questionId: "launch", answer: { choice: 1, reason: 2 } };
    const first = await request(alice, code, answer);
    expect(first.payload.round?.submission?.feedback).toBeUndefined();
    expect(first.payload.round?.correctChoice).toBeUndefined();
    await request(bilal, code, { ...answer, answer: { choice: 0, reason: 0 } });
    const duplicate = await request(alice, code, answer);
    expect(duplicate.payload.round?.count).toBe(2);
    const early = await request(host, code, { action: "move", direction: 1, version: opened.version, controller });
    expect(early.response.status).toBe(409);
    expect(early.payload.code).toBe("EARLY_CLOSE");
    const revealed = await request(host, code, { action: "move", direction: 1, version: opened.version, controller, force: true });
    expect(revealed.payload.round?.state).toBe("revealed");
    expect(revealed.payload.round?.counts).toBeUndefined();
    const aliceRefresh = await request({ token: alice.token }, code);
    const bilalRefresh = await request({ token: bilal.token }, code);
    expect(aliceRefresh.payload).toMatchObject({ recognized: ["exnihilo", "essaimage"] });
    expect(aliceRefresh.payload.xp).toBeGreaterThanOrEqual(500);
    expect(aliceRefresh.payload.xp).toBeLessThanOrEqual(1000);
    expect(aliceRefresh.payload.round?.submission?.feedback?.correct).toBe(true);
    expect(aliceRefresh.payload).not.toHaveProperty("presenterNote");
    expect(bilalRefresh.payload).not.toHaveProperty("presenterNote");
    expect(revealed.payload.presenterNote).toBeTruthy();
    expect(bilalRefresh.payload).toMatchObject({ xp: 0, recognized: [] });
    expect(bilalRefresh.payload.round?.submission?.answer).toEqual({ choice: 0, reason: 0 });
    expect(aliceRefresh.response.headers.get("cache-control")).toBe("no-store, private");
    const serialized = await readFile(path.join(dataDirectory, "rehearsal.json"), "utf8");
    expect(serialized).toContain(identityHash(alice.token!));
    expect(serialized).not.toContain(alice.token!);
    expect(serialized).not.toContain(host.token!);
    const durable = JSON.parse(serialized);
    expect(durable.sessions[code].index).toBe(revealed.payload.index);
    expect(Object.keys(durable.sessions[code].rounds.launch.responses)).toHaveLength(2);
  });

  it("requires membership and never trusts a student's claimed host role or controller", async () => {
    const host: Browser = {}, student: Browser = {}, outsider: Browser = {};
    const code = await create(host);
    const controller = await control(host, code);
    expect((await request(outsider, code)).response.status).toBe(403);
    expect((await request(outsider, code, { action: "answer", questionId: "launch", answer: { choice: 1, reason: 2 } })).response.status).toBe(403);
    await request(student, code, { action: "join", nickname: "Équipe A" });
    expect((await request(student, code, { action: "sync", controller })).response.status).toBe(403);
    expect((await request(student, code, { action: "move", controller, direction: 1, version: 0, role: "host", hostHash: identityHash(host.token!) })).response.status).toBe(403);
    expect((await request(host, code)).payload.index).toBe(0);
    // A room code and nickname grant no access to the host identity.
    const joinedAsSameName = await request(outsider, code, { action: "join", nickname: "Équipe A" });
    expect(joinedAsSameName.payload.role).toBe("student");
    expect(joinedAsSameName.payload.participants).toBe(2);
  });

  it("limits control to one host tab until the lease is released or expires", async () => {
    const host: Browser = {};
    const code = await create(host);
    const first = await control(host, code);
    const second = randomUUID();
    const competing = await request(host, code, { action: "sync", controller: second });
    expect(competing.payload.canControl).toBe(false);
    expect((await request(host, code, { action: "move", controller: second, direction: 1, version: 0 })).payload.code).toBe("CONTROLLER");
    await request(host, code, { action: "release", controller: second });
    expect((await request(host, code, undefined, { query: `?controller=${first}` })).payload.canControl).toBe(true);
    await request(host, code, { action: "release", controller: first });
    await control(host, code, second);
    const future = Date.now() + 8_001;
    vi.spyOn(Date, "now").mockReturnValue(future);
    expect((await request(host, code, { action: "move", controller: second, direction: 1, version: 0 })).payload.code).toBe("CONTROLLER");
    await control(host, code, first);
  });

  it("handles an owner GET without a controller and rejects an owner answer without a lease", async () => {
    const host: Browser = {};
    const code = await create(host);
    const state = await request(host, code);
    expect(state.response.status).toBe(200);
    expect(state.payload).toMatchObject({ role: "host", canControl: false });
    const answer = await request(host, code, { action: "answer", questionId: "opening", answer: { choice: 0 } });
    expect(answer.response.status).toBe(409);
    expect(answer.payload.code).toBe("CONTROLLER");
  });

  it("serializes concurrent navigation so only one command at a version succeeds", async () => {
    const host: Browser = {};
    const code = await create(host);
    const controller = await control(host, code);
    const command = { action: "move", controller, direction: 1, version: 0 };
    const results = await Promise.all([request(host, code, command), request(host, code, command)]);
    expect(results.map(result => result.response.status).sort()).toEqual([200, 409]);
    expect(results.find(result => result.response.status === 409)?.payload.code).toBe("STALE");
    const refreshed = await request(host, code);
    expect(refreshed.payload).toMatchObject({ index: 1, version: 1 });
  });

  it("serializes simultaneous student answers and retries without losing or duplicating responses", async () => {
    const host: Browser = {};
    const code = await create(host);
    const controller = await control(host, code);
    const students: Browser[] = [{}, {}, {}];
    await Promise.all(students.map((student, index) => request(student, code, { action: "join", nickname: `Équipe ${index + 1}` })));
    await open(host, code, controller);
    const body = { action: "answer", questionId: "launch", answer: { choice: 1, reason: 2 } };
    const submitted = await Promise.all([...students, students[0]].map(student => request(student, code, body)));
    expect(submitted.every(result => result.response.status === 200)).toBe(true);
    expect((await request(host, code)).payload.round?.count).toBe(3);
    const altered = await request(students[0], code, { ...body, answer: { choice: 0, reason: 0 } });
    expect(altered.response.status).toBe(409);
    expect(altered.payload.code).toBe("ALREADY_ANSWERED");
  });

  it("rejects team creation and host answers", async () => {
    const host: Browser = {};
    expect((await request(host, "", { action: "create", mode: "teams", password: "test-presenter-password" })).response.status).toBe(422);
    const code = await create(host);
    const controller = await control(host, code);
    await open(host, code, controller);
    expect((await request(host, code, { action: "answer", questionId: "launch", answer: { choice: 1, reason: 2 }, controller })).response.status).toBe(403);
  });

  it("forgets only the requesting student's answers and membership", async () => {
    const host: Browser = {}, alice: Browser = {}, bilal: Browser = {};
    const code = await create(host);
    const controller = await control(host, code);
    await request(alice, code, { action: "join", nickname: "Alice" });
    await request(bilal, code, { action: "join", nickname: "Bilal" });
    await open(host, code, controller);
    const answer = { action: "answer", questionId: "launch", answer: { choice: 1, reason: 2 } };
    await request(alice, code, answer);
    await request(bilal, code, answer);
    expect((await request(host, code, { action: "forget" })).response.status).toBe(400);
    expect((await request(alice, code, { action: "forget" })).payload.forgotten).toBe(true);
    expect((await request(alice, code)).response.status).toBe(403);
    const remaining = await request(bilal, code);
    expect(remaining.payload.participants).toBe(1);
    expect(remaining.payload.round?.count).toBe(1);
    expect(remaining.payload.round?.submission?.answer).toEqual(answer.answer);
    const durable = await readFile(path.join(dataDirectory, "rehearsal.json"), "utf8");
    expect(durable).not.toContain(identityHash(alice.token!));
    expect(durable).not.toContain("Alice");
  });
});

describe("API input and cookie boundaries", () => {
  it("replaces an invalid identity cookie and leaves the new room controllable", async () => {
    const browser: Browser = { token: "invalid-cookie" };
    const code = await create(browser);
    expect(browser.token).toMatch(/^[a-f0-9]{64}$/);
    const state = await request(browser, code);
    expect(state.response.status).toBe(200);
    expect(state.payload.role).toBe("host");
  });

  it.each(["https://attacker.example", "not a url", "null", "https://localhost:3000", ""])("rejects absent, malformed, or foreign origin %j", async submittedOrigin => {
    const result = await request({}, "", { action: "create", mode: "phones" }, { origin: submittedOrigin });
    expect(result.response.status).toBe(403);
  });

  it("rejects malformed JSON, invalid fields, oversized bodies, and invalid room paths", async () => {
    expect((await request({}, "", undefined, { raw: "{" })).response.status).toBe(422);
    expect((await request({}, "", { action: "create", mode: "forged" })).response.status).toBe(422);
    expect((await request({}, "", undefined, { raw: "x".repeat(6_001) })).response.status).toBe(413);
    expect((await request({}, "ABC234/extra")).response.status).toBe(404);
    expect((await request({}, "invalid")).response.status).toBe(404);
    expect((await request({}, "ABC234")).response.status).toBe(404);
  });

  it("returns a safe 404 for unknown or inherited-object question names", async () => {
    const host: Browser = {}, student: Browser = {};
    const code = await create(host);
    await request(student, code, { action: "join", nickname: "Équipe A" });
    for (const questionId of ["missing", "constructor", "__proto__"]) {
      const result = await request(student, code, { action: "answer", questionId, answer: { choice: 0 } });
      expect(result.response.status).toBe(404);
    }
  });
});
