import { test,expect } from "@playwright/test";
import { beats } from "../src/content/beats.fr";
import { characters } from "../src/content/curriculum.fr";
import { start,next,jump,join } from "./helpers";
test("all 48 steps fit projectors; identities wait for reveal; video plays with keyboard controls",async({page,browser})=>{
await page.setViewportSize({width:1366,height:768});const code=await start(page);
const contexts=await Promise.all([1,2,3].map(()=>browser.newContext()));
for(let i=0;i<3;i++)await join(await contexts[i].newPage(),code,`Pitch ${i+1}`);
const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));const overflow:string[]=[];
for(let i=0;i<beats.length;i++){
const beat=beats[i];if(i)await next(page,beat.id);
if(beat.kind==="pitch"){
for(let n=1;n<=3;n++){
await page.getByRole("button",{name:`Pitch ${n}, sans équipe`,exact:true}).click();
await page.getByRole("button",{name:n===3?"Vérifier les équipes":`Choisir l’équipe ${n+1}`,exact:true}).click();
}
await page.getByRole("button",{name:"Confirmer les équipes",exact:true}).click();
for(let n=1;n<=3;n++){
await page.getByRole("button",{name:`Commencer le pitch de l’équipe ${n}`,exact:true}).click();
await page.getByRole("button",{name:`Ouvrir le vote pour l’équipe ${n}`,exact:true}).click();
await page.getByRole("button",{name:"Fermer le vote",exact:true}).click();
}
await page.getByRole("button",{name:"Révéler les résultats",exact:true}).click();
}
if(beat.kind==="teaser"||beat.kind==="story"){
const person=characters.find(c=>c.id===beat.character)!;
await expect(page.locator(".stage-canvas")).not.toContainText(person.company);
expect(await page.locator(".stage-canvas img").count()).toBe(0);
}
if(beat.kind==="reveal")await expect.poll(()=>page.locator(".entrepreneur-photo img").evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
if(beat.kind==="synthesis"){
await expect(page.locator(".instadeep-layout")).toContainText("Karim Beguir et Zohra Slim");
await expect(page.locator(".instadeep-card h2")).toHaveText(["International","Innovant","En partenariat"]);
await expect(page.locator(".instadeep-layout img, .instadeep-layout video")).toHaveCount(0);
}
for(const viewport of [{width:1366,height:768},{width:1920,height:1080},{width:1024,height:768}]){
await page.setViewportSize(viewport);
const bad=await page.locator(".stage-canvas").evaluate(canvas=>{const b=canvas.getBoundingClientRect();return [...canvas.querySelectorAll("h1,h2,p,.answer-tile,figcaption,video")].filter(el=>{const r=el.getBoundingClientRect();return r.height>0&&(r.bottom>b.bottom+3||r.top<b.top-3||r.right>innerWidth+3||r.left<0);}).map(el=>el.textContent?.slice(0,90));});
overflow.push(...bad.map(x=>beat.id+" "+viewport.width+" "+x));
}
if(["story-1-teaser","story-2-reveal","story-4-reveal","boss-open","instadeep","conclusion"].includes(beat.id))await page.screenshot({path:`artifacts/${beat.id}.png`,animations:"disabled"});
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
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","instadeep");
expect(await page.evaluate(()=>(window as unknown as {closingVideo:HTMLVideoElement}).closingVideo.paused)).toBe(true);
await page.reload();await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","instadeep");
for(const c of contexts)await c.close();
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
