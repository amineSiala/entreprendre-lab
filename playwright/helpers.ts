import { expect, type Page } from "@playwright/test";
export async function start(page: Page) {
await page.emulateMedia({ reducedMotion:"reduce" });
await page.goto("/");
await page.getByRole("button",{name:"Espace présentateur",exact:true}).click();
await page.getByLabel("Mot de passe présentateur").fill(process.env.PRESENTER_TEST_PASSWORD || "test-presenter-password");
await page.getByRole("button",{name:"Créer la salle"}).click();
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","welcome");
return page.url().split("/").at(-2)!;
}
export async function next(page: Page,id: string){
await page.waitForTimeout(260); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(300);
if(await page.locator(".early-toast").isVisible()) {await page.keyboard.press("ArrowRight");await page.waitForTimeout(300);}
if((await page.locator(".stage-canvas").getAttribute("data-beat"))?.endsWith("-leaderboard")&&!id.endsWith("-leaderboard")) {await page.waitForTimeout(260);await page.keyboard.press("ArrowRight");}
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat",id);
}
export async function jump(page: Page,chapter: number,id: string){
await page.getByRole("button",{name:"Les chapitres",exact:true}).click();
await page.locator(".chapter-menu button").nth(chapter-1).click();
await page.getByRole("button",{name:"Aller à cette étape"}).click();
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat",id);
}
export async function join(phone:Page,code:string,name="Joueur"){
await phone.goto(`/join/${code}`);
await phone.getByLabel("Comment vous appelle-t-on ?").fill(name);
await phone.getByRole("button",{name:"J’entre dans la partie"}).click();
await expect(phone.getByText("Synchronisé avec le présentateur")).toBeVisible();
}
