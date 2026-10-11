import { test,expect } from "@playwright/test";
import { beats } from "../src/content/beats.fr";
import { characters } from "../src/content/curriculum.fr";
import { start,next,jump } from "./helpers";
test("all 46 steps fit projectors; identities wait for reveal; video plays with keyboard controls",async({page})=>{
await page.setViewportSize({width:1366,height:768});await start(page);
const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const overflow:string[]=[];
for(let i=0;i<beats.length;i++){
const beat=beats[i];if(i)await next(page,beat.id);
if(beat.kind==="teaser"||beat.kind==="story"){
const person=characters.find(c=>c.id===beat.character)!;
await expect(page.locator(".stage-canvas")).not.toContainText(person.company);
expect(await page.locator(".stage-canvas img").count()).toBe(0);
}
if(beat.kind==="reveal")await expect.poll(()=>page.locator(".entrepreneur-photo img").evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
for(const viewport of [{width:1366,height:768},{width:1920,height:1080},{width:1024,height:768}]){
await page.setViewportSize(viewport);
const bad=await page.locator(".stage-canvas").evaluate(canvas=>{const b=canvas.getBoundingClientRect();return [...canvas.querySelectorAll("h1,h2,p,.answer-tile,figcaption,video")].filter(el=>{const r=el.getBoundingClientRect();return r.height>0&&(r.bottom>b.bottom+3||r.top<b.top-3||r.right>innerWidth+3||r.left<0);}).map(el=>el.textContent?.slice(0,90));});
overflow.push(...bad.map(x=>beat.id+" "+viewport.width+" "+x));
}
if(["story-1-teaser","story-2-reveal","story-4-reveal","boss-open","conclusion"].includes(beat.id))await page.screenshot({path:`artifacts/${beat.id}.png`,animations:"disabled"});
}
expect(overflow).toEqual([]);expect(errors).toEqual([]);
await expect(page.locator(".speaker-pill")).toHaveCount(0);
const video=page.locator("video");await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(1);
expect(await video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
await page.getByRole("button",{name:"Lire la vidéo"}).click();
await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(0);
await video.focus();await page.keyboard.press("ArrowLeft");
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","conclusion");
await page.evaluate(()=>{(window as unknown as {closingVideo:HTMLVideoElement}).closingVideo=document.querySelector("video")!;});
await page.getByRole("button",{name:"Étape précédente",exact:true}).click();
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","boss-results");
expect(await page.evaluate(()=>(window as unknown as {closingVideo:HTMLVideoElement}).closingVideo.paused)).toBe(true);
await page.reload();await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","boss-results");
});
test("controller lease and offline preview do not fabricate results",async({page,context})=>{
const code=await start(page);const second=await context.newPage();await second.goto(`/host/session/${code}/stage`);
await expect(second.getByText(/Un autre onglet pilote/)).toBeVisible();await second.keyboard.press("ArrowRight");await expect(second.locator(".stage-canvas")).toHaveAttribute("data-beat","welcome");await second.close();
await jump(page,3,"individual-open");await context.setOffline(true);await page.getByRole("button",{name:"Continuer hors ligne"}).click();await next(page,"individual-results");await expect(page.getByRole("heading",{name:"Les résultats sont sur le serveur."})).toBeVisible();await context.setOffline(false);await page.keyboard.press("r");await expect(page.locator(".stage-alert")).toHaveCount(0);
});
test("expired host and phone screens stop polling",async({page,browser})=>{
const code=await start(page);const ctx=await browser.newContext();const phone=await ctx.newPage();
await phone.goto(`/join/${code}`);await phone.getByLabel("Comment vous appelle-t-on ?").fill("Expire");await phone.getByRole("button",{name:"J’entre dans la partie"}).click();await expect(phone.getByText("Synchronisé avec le présentateur")).toBeVisible();
let calls=0;
for(const p of [page,phone])await p.route(`**/api/rooms/${code}`,async route=>{calls++;await route.fulfill({status:410,contentType:"application/json",body:JSON.stringify({code:"ROOM_EXPIRED",error:"Cette salle a expiré."})});});
await expect(page.getByRole("heading",{name:"Cette salle a expiré."})).toBeVisible();await expect(phone.getByRole("heading",{name:"Cette salle a expiré."})).toBeVisible();
const stopped=calls;await page.waitForTimeout(3500);expect(calls).toBe(stopped);expect(await phone.evaluate(()=>localStorage.getItem("elab_student"))).toBeNull();await ctx.close();
});
