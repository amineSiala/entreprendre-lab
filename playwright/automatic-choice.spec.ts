import { test,expect } from "@playwright/test";
import { start,jump,next,join } from "./helpers";
test("three phones save single-tap choices privately and results appear at 20 seconds",async({page,browser})=>{
const code=await start(page);const contexts=await Promise.all([320,390,430].map(width=>browser.newContext({viewport:{width,height:844}})));const phones=await Promise.all(contexts.map(c=>c.newPage()));
try{
for(let i=0;i<phones.length;i++)await join(phones[i],code,"Joueur "+i);
await jump(page,3,"individual-open");
for(let i=0;i<phones.length;i++){await expect(phones[i].locator(".student-option")).toHaveCount(4);await expect(phones[i].getByRole("button",{name:/Valider|Envoyer/})).toHaveCount(0);await phones[i].locator(".student-option").nth(i===1?0:1).click();await expect(phones[i].getByText("RÉPONSE ENREGISTRÉE",{exact:true})).toBeVisible();}
await phones[0].reload();await expect(phones[0].getByText("RÉPONSE ENREGISTRÉE",{exact:true})).toBeVisible();
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","individual-results",{timeout:25000});
await expect(phones[0].locator(".student-answer-checks")).toContainText("Choix correct");await expect(phones[1].locator(".student-answer-checks")).toContainText("Choix à revoir");await expect(phones[0].getByText(/Justification correcte/)).toHaveCount(0);
for(const p of phones)expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
await next(page,"individual-leaderboard");await expect(page.locator(".ranking-layout")).toBeVisible();await next(page,"partners-open");await expect(phones[0].locator(".student-option")).toHaveCount(2);
}finally{await Promise.all(contexts.map(c=>c.close()));}
});
