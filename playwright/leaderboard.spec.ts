import { test, expect } from "@playwright/test";

test("projector rankings follow explanation, survive reload, and fit projectors", async ({ page, playwright, baseURL }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Espace présentateur", exact: true }).click();
  await expect(page.getByRole("button", { name: "En équipes", exact: true })).toHaveCount(0);
  await page.getByLabel("Mot de passe présentateur").fill(process.env.PRESENTER_TEST_PASSWORD || "test-presenter-password");
  await page.getByRole("button", { name: "Créer la salle" }).click();
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "welcome");
  const code = page.url().split("/").at(-2)!;
  const clients = await Promise.all(Array.from({ length: 7 }, () => playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } })));
  try {
    for (const [i, client] of clients.entries()) await client.post(`/api/rooms/${code}`, { data: { action: "join", nickname: i === 6 ? "Un pseudo très très long" : `Joueur ${i + 1}` } });
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "opening-open");
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "opening-results", { timeout: 22000 });
    await expect(page.locator(".explanation-card")).toBeVisible();
    await expect(page.locator(".ranking-layout")).toHaveCount(0);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "opening-leaderboard");
    await expect(page.locator(".podium-card")).toHaveCount(3);
    await expect(page.locator(".ranking-row")).toHaveCount(3);
    await expect(page.locator(".ranking-roast")).toContainText("Tout le monde est ex æquo");
    await page.waitForTimeout(2300);
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      expect(await page.locator(".ranking-layout").evaluate(el => {
        const canvas = el.closest(".stage-canvas")!.getBoundingClientRect();
        return [...el.querySelectorAll("h1,h2,h3,.ranking-roast,.ranking-next")].every(item => {
          const r = item.getBoundingClientRect();
          return r.bottom <= canvas.bottom + 2 && r.top >= canvas.top && r.right <= innerWidth && r.left >= 0;
        });
      })).toBe(true);
    }
    await page.screenshot({ path: "artifacts/leaderboard-projector.png", animations: "disabled" });
    const phone = await (await clients[0].get(`/api/rooms/${code}`)).json();
    expect(phone.leaderboard).toBeUndefined();
    expect(phone.leaderboardVisible).toBeUndefined();
    await page.reload();
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "opening-leaderboard");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".score-static").first()).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(".explanation-card")).toBeVisible();
    await page.waitForTimeout(250);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".ranking-layout")).toBeVisible();
    await page.waitForTimeout(250);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "mission");
    for (const id of ["definition", "lina", "nour", "launch-open"]) {
      await page.waitForTimeout(250);
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", id);
    }
    for (const [i, client] of clients.entries()) {
      const answer = await client.post(`/api/rooms/${code}`, { data: { action: "answer", questionId: "launch", answer: i < 6 ? { choice: 1, reason: 2 } : { choice: 0, reason: 0 } } });
      expect(answer.ok()).toBe(true);
    }
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "launch-results", { timeout: 22000 });
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".ranking-roast h2")).toHaveText("Un pseudo très très long");
    await expect(page.locator(".podium-card").first().locator(".score-static")).not.toHaveText("0");
    await page.screenshot({ path: "artifacts/leaderboard-scored-projector.png", animations: "disabled" });
  } finally { await Promise.all(clients.map(client => client.dispose())); }
});
