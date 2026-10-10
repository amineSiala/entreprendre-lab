import { test, expect } from "@playwright/test";

test("QR lobby shows arrivals, fits a full class, and waits for the presenter to start", async ({ page, playwright, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem("elab_last_room", "CEG8QA"));
  await page.goto("/");
  await expect(page.getByText(/Reprendre la salle/)).toHaveCount(0);
  await expect(page.getByText("objectif de séance")).toHaveCount(0);
  await expect(page.getByText(/Imaginé pour apprendre ensemble/)).toHaveCount(0);
  await page.getByRole("button", { name: "Espace présentateur", exact: true }).click();
  await page.getByLabel("Mot de passe présentateur").fill(process.env.PRESENTER_TEST_PASSWORD || "test-presenter-password");
  await page.getByRole("button", { name: "Créer la salle" }).click();
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "welcome");
  await expect(page.locator(".lobby-qr svg")).toBeVisible();
  await expect(page.getByText("On attend les premiers joueurs…")).toBeVisible();
  const code = page.url().split("/").at(-2)!;
  const clients = await Promise.all(Array.from({ length: 60 }, () => playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } })));
  try {
    const joined = await Promise.all(clients.map((client, i) => client.post(`/api/rooms/${code}`, { data: { action: "join", nickname: i === 0 ? "Un pseudo très très long" : `Campus ${i + 1}` } })));
    expect(joined.every(response => response.ok())).toBe(true);
    await expect(page.locator(".lobby-player")).toHaveCount(60);
    await expect(page.locator(".lobby-count")).toHaveText("60 arrivés");
    await expect(page.locator(".lobby-player").filter({ hasText: "Un pseudo très très long" })).toHaveCount(1);
    const host = await page.evaluate(async room => (await fetch(`/api/rooms/${room}`)).json(), code);
    expect(host.index).toBe(0);
    expect(host.round).toBeUndefined();
    const phone = await (await clients[0].get(`/api/rooms/${code}`)).json();
    expect(phone.lobbyParticipants).toBeUndefined();
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      expect(await page.locator(".lobby-layout").evaluate(el => {
        const canvas = el.closest(".stage-canvas")!.getBoundingClientRect();
        return [...el.querySelectorAll("h1,h2,.lobby-join,.lobby-player-list,.lobby-start")].every(item => {
          const r = item.getBoundingClientRect();
          return r.bottom <= canvas.bottom + 2 && r.top >= canvas.top && r.right <= innerWidth && r.left >= 0;
        });
      })).toBe(true);
      expect(await page.locator(".lobby-player-list").evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
      await page.screenshot({ path: `artifacts/lobby-${viewport.width}.png`, animations: "disabled" });
    }
    await clients[0].post(`/api/rooms/${code}`, { data: { action: "forget" } });
    await expect(page.locator(".lobby-player")).toHaveCount(59);
    await expect(page.locator(".lobby-player").filter({ hasText: "Un pseudo très très long" })).toHaveCount(0);
    await page.reload();
    await expect(page.locator(".lobby-player")).toHaveCount(59);
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "welcome");
    await page.getByRole("button", { name: "Commencer", exact: true }).click();
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "opening-open");
    const started = await (await clients[1].get(`/api/rooms/${code}`)).json();
    expect(started.round.state).toBe("open");
    expect(started.lobbyParticipants).toBeUndefined();
  } finally { await Promise.all(clients.map(client => client.dispose())); }
});
