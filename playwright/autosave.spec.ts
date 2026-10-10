import { test, expect } from "@playwright/test";

test("typing autosaves, recovers a failed save, restores on refresh and reveals after 60 seconds", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Espace présentateur", exact: true }).click();
  await page.getByLabel("Mot de passe présentateur").fill(process.env.PRESENTER_TEST_PASSWORD || "test-presenter-password");
  await page.getByRole("button", { name: "Créer la salle" }).click();
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "welcome");
  const code = page.url().split("/").at(-2)!;
  const context = await browser.newContext({ viewport: { width: 320, height: 844 } });
  const phone = await context.newPage();
  try {
    await phone.goto(`/join/${code}`);
    await phone.getByLabel("Comment vous appelle-t-on ?").fill("Writer");
    await phone.getByRole("button", { name: "J’entre dans la partie" }).click();
    await expect(phone.getByText("Synchronisé avec le présentateur")).toBeVisible();
    await page.getByRole("button", { name: "Les chapitres", exact: true }).click();
    await page.locator(".chapter-menu button").nth(6).click();
    await page.getByRole("button", { name: "Aller à cette étape" }).click();
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "mini-open");
    await expect(page.locator(".question-timer")).toContainText(/00:(59|58)|01:00/);
    await expect(phone.getByLabel("Forme 1", { exact: true })).toBeVisible();
    await expect(phone.getByRole("button", { name: /Envoyer|Valider/ })).toHaveCount(0);
    let failOnce = true;
    await phone.route(`**/api/rooms/${code}`, async route => {
      if (route.request().method() === "POST" && failOnce) { failOnce = false; await route.abort(); }
      else await route.continue();
    });
    await phone.getByLabel("Forme 1", { exact: true }).fill("ex nihilo");
    await expect(phone.locator(".student-answer-error")).toContainText("Sauvegarde non confirmée");
    await expect(phone.getByText("Sauvegardé automatiquement", { exact: true })).toBeVisible();
    await phone.getByLabel("Forme 2", { exact: true }).fill("essaimage");
    await phone.getByLabel("Forme 3", { exact: true }).fill("franchise");
    await expect(phone.getByText("Sauvegardé automatiquement", { exact: true })).toBeVisible();
    await phone.reload();
    await expect(phone.getByLabel("Forme 1", { exact: true })).toHaveValue("ex nihilo");
    await expect(phone.getByLabel("Forme 3", { exact: true })).toHaveValue("franchise");
    await phone.getByLabel("Forme 3", { exact: true }).fill("");
    await expect(phone.getByText("Sauvegardé automatiquement", { exact: true })).toBeVisible();
    await phone.getByLabel("Forme 3", { exact: true }).fill("reprise");
    await expect(phone.getByText("Sauvegardé automatiquement", { exact: true })).toBeVisible();
    await phone.screenshot({ path: "artifacts/typing-autosave-320.png", fullPage: true });
    expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "mini-results", { timeout: 65000 });
    await expect(phone.getByRole("heading", { name: "3 sur 3 retrouvées." })).toBeVisible();
    await expect(phone.getByLabel("Forme 1", { exact: true })).toHaveCount(0);
    const late = await phone.evaluate(async room => (await fetch(`/api/rooms/${room}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "answer", questionId: "mini", answer: { recall: ["vert"] } }) })).status, code);
    expect(late).toBe(409);
  } finally { await context.close(); }
});
