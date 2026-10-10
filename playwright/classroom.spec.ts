import { test, expect, type Page } from "@playwright/test";
import { beats } from "../src/content/beats.fr";

async function next(page: Page, id: string) {
  await page.waitForTimeout(240);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(280);
  if (await page.locator(".early-toast").isVisible()) { await page.keyboard.press("ArrowRight"); }
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", id);
}
async function start(page: Page, phones = false) {
  await page.goto("/");
  if (phones) await page.getByRole("button", { name: "Sur téléphone", exact: true }).click();
  await page.getByRole("button", { name: "C’est parti !" }).click();
  await expect(page.locator("[data-beat='welcome']")).toBeVisible();
  return page.url().split("/").at(-2)!;
}

test("all 36 beats fit 16:9 and 4:3 projectors, with keyboard replay and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1366, height: 768 });
  await start(page);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  const layouts: string[] = [];
  for (let i = 0; i < beats.length; i++) {
    if (i) await next(page, beats[i].id);
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      const overflow = await page.locator(".stage-canvas").evaluate(canvas => {
        const bounds = canvas.getBoundingClientRect();
        return Array.from(canvas.querySelectorAll("h1,h2,p,.answer-tile,.character-poster,.join-panel,.recall-slots,.conclusion-forms"))
          .filter(el => { const r = el.getBoundingClientRect(); return r.height > 0 && (r.bottom > bounds.bottom + 3 || r.top < bounds.top - 3 || r.right > innerWidth + 3 || r.left < -3); })
          .map(el => `${el.tagName}.${el.className}: ${Math.round(el.getBoundingClientRect().bottom)} > ${Math.round(bounds.bottom)}`);
      });
      layouts.push(...overflow.map(item => `${beats[i].id} ${viewport.width}: ${item}`));
      if (["welcome", "lina", "launch-open", "network-results", "boss-open", "conclusion"].includes(beats[i].id) && viewport.width !== 1024) await page.screenshot({ path: `artifacts/${beats[i].id}-${viewport.width}.png`, animations: "disabled" });
    }
  }
  expect(layouts).toEqual([]);
  expect(errors).toEqual([]);
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "transfer-results");
  await page.reload();
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "transfer-results");
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "transfer-results");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("three independent phones persist answers, reasoning and private recall across refresh", async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1366, height: 768 });
  const code = await start(page, true);
  const contexts = await Promise.all([320, 390, 430].map(width => browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" })));
  const phones = await Promise.all(contexts.map(context => context.newPage()));
  for (let i = 0; i < phones.length; i++) {
    await phones[i].goto(`/join/${code}`);
    await phones[i].getByLabel("Comment vous appelle-t-on ?").fill(`Campus${i + 1}`);
    await phones[i].getByRole("button", { name: "J’entre dans la partie" }).click();
    await expect(phones[i].getByText("Synchronisé avec le présentateur")).toBeVisible();
  }
  await next(page, "opening-open");
  for (let i = 0; i < phones.length; i++) {
    await phones[i].getByRole("radio").nth(i % 2).check();
    await phones[i].getByRole("button", { name: "Envoyer mon avis" }).click();
    await expect(phones[i].getByText("RÉPONSE ENREGISTRÉE", { exact: true })).toBeVisible();
  }
  await next(page, "opening-results");
  await expect(page.getByText("3 / 3 réponses · résultats anonymes")).toBeVisible();
  await page.waitForTimeout(240);
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("Relecture · question déjà fermée")).toBeVisible();
  await next(page, "opening-results");
  await phones[0].reload();
  await expect(phones[0].getByText("Votre avis compte.")).toBeVisible();
  await expect(phones[0].getByText("+10 points de participation")).toBeVisible();
  for (const beat of beats.slice(3, 8)) await next(page, beat.id);
  for (let i = 0; i < phones.length; i++) {
    await expect(phones[i].getByRole("radio")).toHaveCount(4);
    await phones[i].getByRole("radio").nth(1).check();
    await phones[i].getByRole("button", { name: "Je justifie mon choix" }).click();
    await phones[i].getByRole("radio").nth(i === 0 ? 2 : 0).check();
    await phones[i].getByRole("button", { name: "Valider mon raisonnement" }).click();
    await expect(phones[i].getByText("RÉPONSE ENREGISTRÉE", { exact: true })).toBeVisible();
  }
  await next(page, "launch-results");
  await expect(phones[0].getByRole("heading", { name: "Bien raisonné !" })).toBeVisible();
  await expect(phones[1].getByText("Justification à revoir")).toBeVisible();
  await phones[0].screenshot({ path: "artifacts/phone-feedback-320.png", fullPage: true, animations: "disabled" });
  for (const beat of beats.slice(9, 18)) await next(page, beat.id);
  await phones[0].goto("/me");
  await expect(phones[0].getByRole("heading", { name: "Un défi sans indices est en cours." })).toBeVisible();
  await expect(phones[0].getByText("Vos huit repères")).not.toBeVisible();
  await phones[0].getByRole("link", { name: "Retour au défi" }).click();
  await phones[0].getByLabel("Forme 1", { exact: true }).fill("EX NIHILO");
  await phones[0].getByLabel("Forme 2", { exact: true }).fill("essaimage");
  await phones[0].getByLabel("Forme 3", { exact: true }).fill("intrapreneuriat");
  await phones[0].screenshot({ path: "artifacts/phone-recall-320.png", fullPage: true, animations: "disabled" });
  await phones[0].getByRole("button", { name: "Envoyer mes réponses" }).click();
  await expect(phones[0].getByText("RÉPONSE ENREGISTRÉE", { exact: true })).toBeVisible();
  await next(page, "mini-results");
  await expect(phones[0].getByRole("heading", { name: "3 sur 3 retrouvées." })).toBeVisible();
  await expect(page.getByText("1 réponse(s). Répartition masquée en dessous de 3 participants.")).toBeVisible();
  for (const beat of beats.slice(19, 32)) await next(page, beat.id);
  const recalled = ["Création ex nihilo", "Essaimage", "Franchise", "Intrapreneuriat", "Reprise d’entreprise", "Social et solidaire", "Techno-entrepreneuriat", "Vert"];
  for (let i = 0; i < recalled.length; i++) await phones[0].getByLabel(`Forme ${i + 1}`, { exact: true }).fill(recalled[i]);
  await phones[0].getByRole("button", { name: "Envoyer mes réponses" }).click();
  await expect(phones[0].getByText("RÉPONSE ENREGISTRÉE", { exact: true })).toBeVisible();
  await next(page, "boss-results");
  await expect(phones[0].getByRole("heading", { name: "8 sur 8 retrouvées." })).toBeVisible();
  await next(page, "transfer-open");
  await phones[0].getByRole("radio").nth(0).check();
  await phones[0].getByRole("button", { name: "Je justifie mon choix" }).click();
  await phones[0].getByRole("radio").nth(1).check();
  await phones[0].getByRole("button", { name: "Valider mon raisonnement" }).click();
  await expect(phones[0].getByText("RÉPONSE ENREGISTRÉE", { exact: true })).toBeVisible();
  await next(page, "transfer-results");
  await expect(phones[0].getByRole("heading", { name: "Bien raisonné !" })).toBeVisible();
  await next(page, "conclusion");
  await phones[0].getByRole("link", { name: "Voir mon carnet" }).click();
  await expect(phones[0].getByRole("heading", { name: "Vos huit repères" })).toBeVisible();
  await phones[0].screenshot({ path: "artifacts/phone-progress-320.png", fullPage: true, animations: "disabled" });
  for (const phone of phones) expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // A student cannot control the host even with a guessed controller ID.
  const attack = await phones[0].evaluate(async code => { const response = await fetch(`/api/rooms/${code}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "move", controller: crypto.randomUUID(), version: 0, direction: 1 }) }); return response.status; }, code);
  expect(attack).toBe(403);
  await phones[0].getByRole("button", { name: "Effacer ma participation à cette salle" }).click();
  await phones[0].getByRole("button", { name: "Oui, effacer" }).click();
  await expect(phones[0].getByRole("heading", { name: "Vos réponses ont été effacées." })).toBeVisible();
  await Promise.all(contexts.map(context => context.close()));
});

test("only one host tab controls the room and offline slides never fabricate results", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const code = await start(page);
  const second = await context.newPage();
  await second.goto(`/host/session/${code}/stage`);
  await expect(second.getByText(/Un autre onglet pilote cette salle/)).toBeVisible();
  await second.keyboard.press("ArrowRight");
  await expect(second.locator(".stage-canvas")).toHaveAttribute("data-beat", "welcome");
  await second.close();
  await next(page, "opening-open");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Continuer hors ligne" }).click();
  await next(page, "opening-results");
  await expect(page.getByRole("heading", { name: "Les résultats sont sur le serveur." })).toBeVisible();
  await context.setOffline(false);
  await page.keyboard.press("r");
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "opening-open");
  await expect(page.getByText(/votes et sauvegarde suspendus/)).not.toBeVisible();
});

test("focused controls keep native Space; answer retries and replay never award twice", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await next(page, "opening-open");
  const first = page.locator(".answer-tile").first();
  await first.focus(); await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat", "opening-open");
  await page.getByRole("button", { name: "Valider le choix" }).click();
  await expect(page.getByText("Choix collectif enregistré · → pour révéler")).toBeVisible();
  await next(page, "opening-results");
  await expect(page.getByText("+10 pts", { exact: true })).toBeVisible();
  await page.waitForTimeout(240);
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("Relecture · question déjà fermée")).toBeVisible();
  await next(page, "opening-results");
  await expect(page.getByText("+10 pts", { exact: true })).toBeVisible();
});

test("60 simulated API participants can join and save exactly one answer each", async ({ page, playwright, baseURL }) => {
  if (!baseURL) throw new Error("A test server URL is required");
  const code = await start(page, true);
  const clients = await Promise.all(Array.from({ length: 60 }, () => playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } })));
  const joinStarted = Date.now();
  try {
    const joins = await Promise.all(clients.map((client, index) => client.post(`/api/rooms/${code}`, { data: { action: "join", nickname: `Test${index}` } })));
    expect(joins.every(response => response.ok())).toBe(true);
    const joinMs = Date.now() - joinStarted;
    await next(page, "opening-open");
    const submitStarted = Date.now();
    const responses = await Promise.all(clients.map((client, index) => client.post(`/api/rooms/${code}`, { data: { action: "answer", questionId: "opening", answer: { choice: index % 4 } } })));
    expect(responses.every(response => response.ok())).toBe(true);
    const submitMs = Date.now() - submitStarted;
    const retries = await Promise.all(clients.map((client, index) => client.post(`/api/rooms/${code}`, { data: { action: "answer", questionId: "opening", answer: { choice: index % 4 } } })));
    expect(retries.every(response => response.ok())).toBe(true);
    await expect(page.getByText("60 / 60 réponses")).toBeVisible();
    await next(page, "opening-results");
    await expect(page.getByText("60 / 60 réponses · résultats anonymes")).toBeVisible();
    const snapshot = await page.evaluate(async room => (await fetch(`/api/rooms/${room}`)).json(), code);
    expect(snapshot.round.count).toBe(60);
    expect(snapshot.round.counts).toEqual([15, 15, 15, 15]);
    console.log(`Local loopback rehearsal: 60 joins ${joinMs}ms; 60 submissions ${submitMs}ms; 60 identical retries, 0 duplicates.`);
  } finally { await Promise.all(clients.map(client => client.dispose())); }
});
