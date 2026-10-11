import { test,expect } from "@playwright/test";
import { start,jump,next } from "./helpers";
test("rankings survive refresh, handle ties, remain projector-only and fit three sizes",async({page,playwright,baseURL})=>{
const code=await start(page);const clients=await Promise.all(Array.from({length:7},()=>playwright.request.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL!}})));
try{
for(let i=0;i<clients.length;i++)await clients[i].post(`/api/rooms/${code}`,{data:{action:"join",nickname:"Joueur "+i}});
await jump(page,3,"individual-open");
for(let i=0;i<clients.length;i++)expect((await clients[i].post(`/api/rooms/${code}`,{data:{action:"answer",questionId:"individual",answer:{choice:i<6?1:0}}})).ok()).toBe(true);
await next(page,"individual-results");await next(page,"individual-leaderboard");await expect(page.locator(".podium-card")).toHaveCount(3);await expect(page.locator(".ranking-row")).toHaveCount(3);await expect(page.locator(".ranking-roast")).toContainText("Joueur 6");
for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1024,height:768}]){await page.setViewportSize(viewport);expect(await page.locator(".ranking-layout").evaluate(el=>{const b=el.closest(".stage-canvas")!.getBoundingClientRect();return [...el.querySelectorAll("h1,h2,h3,.ranking-roast,.ranking-next")].every(x=>x.getBoundingClientRect().bottom<=b.bottom+2);})).toBe(true);}
const student=await(await clients[0].get(`/api/rooms/${code}`)).json();expect(student.leaderboard).toBeUndefined();
await page.reload();await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","individual-leaderboard");await page.keyboard.press("ArrowLeft");await expect(page.locator(".explanation-card")).toBeVisible();
await page.screenshot({path:"artifacts/new-leaderboard.png",animations:"disabled"});
}finally{await Promise.all(clients.map(c=>c.dispose()));}
});
