import { test, expect } from "@playwright/test";

test("a chosen answer can be reselected before automatic reason submission", async ({ page, browser }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Espace présentateur", exact: true }).click();
  await page.getByLabel("Mot de passe présentateur").fill(process.env.PRESENTER_TEST_PASSWORD || "test-presenter-password");
  await page.getByRole("button", { name: "Créer la salle" }).click();
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "welcome");
  const code = page.url().split("/").at(-2)!;
  const context = await browser.newContext();
  const phone = await context.newPage();
  try {
    await phone.goto(`/join/${code}`);
    await phone.getByLabel("Comment vous appelle-t-on ?").fill("Tapper");
    await phone.getByRole("button", { name: "J’entre dans la partie" }).click();
    await expect(phone.getByText("Synchronisé avec le présentateur")).toBeVisible();
    await page.getByRole("button", { name: "Les chapitres", exact: true }).click();
    await page.locator(".chapter-menu button").nth(3).click();
    await page.getByRole("button", { name: "Aller à cette étape" }).click();
    await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "lina");
    for (const id of ["nour", "launch-open"]) {
      await page.waitForTimeout(250);
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", id);
    }
    await expect(phone.locator(".student-option")).toHaveCount(4);
    await phone.locator(".student-option").nth(1).click();
    await expect(phone.locator(".student-option")).toHaveCount(3);
    await phone.getByRole("button", { name: "Modifier mon choix" }).click();
    await expect(phone.locator(".student-option")).toHaveCount(4);
    await phone.locator(".student-option").nth(1).click();
    await expect(phone.locator(".student-option")).toHaveCount(3);
    await phone.locator(".student-option").nth(2).click();
    await expect(phone.getByText("RÉPONSE ENREGISTRÉE", { exact: true })).toBeVisible();
    const saved = await phone.evaluate(async room => (await fetch(`/api/rooms/${room}`)).json(), code);
    expect(saved.round.count).toBe(1);
    expect(saved.round.submission.answer).toEqual({ choice: 1, reason: 2 });
    expect(saved.round.submission.feedback).toBeUndefined();
  } finally { await context.close(); }
});
