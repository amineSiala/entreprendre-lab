import { test,expect } from "@playwright/test";
import { start,jump,next,join } from "./helpers";
const all=["individuel","association","innovant","social","forte croissance","intrapreneuriat","familial","international"];
test("recall restores drafts, retries saves and final submissions, locks without exposing results",async({page,browser})=>{
const code=await start(page);const ctx=await browser.newContext({viewport:{width:320,height:844}});const phone=await ctx.newPage();
try{await join(phone,code,"Writer");await jump(page,8,"boss-open");await expect(page.locator(".question-timer")).toContainText(/02:00|01:5[0-9]/);
let failDraft=true,failFinal=true;
await phone.route(`**/api/rooms/${code}`,async route=>{if(route.request().method()==="POST"){const data=route.request().postDataJSON();if(data.action==="answer"&&!data.finalize&&failDraft){failDraft=false;await route.abort();return;}if(data.finalize&&failFinal){failFinal=false;await route.fetch();await route.abort();return;}}await route.continue();});
await phone.getByLabel("Forme 1",{exact:true}).fill("individuel");await expect(phone.locator(".student-answer-error")).toContainText("Sauvegarde non confirmée");await expect(phone.getByText("Brouillon sauvegardé automatiquement",{exact:true})).toBeVisible();
await phone.reload();await expect(phone.getByLabel("Forme 1",{exact:true})).toHaveValue("individuel");
for(let i=1;i<8;i++)await phone.getByLabel(`Forme ${i+1}`,{exact:true}).fill(all[i]);
await expect(phone.getByText("Brouillon sauvegardé automatiquement",{exact:true})).toBeVisible();await phone.getByLabel("Forme 8",{exact:true}).fill("");await expect(phone.getByText("Brouillon sauvegardé automatiquement",{exact:true})).toBeVisible();await phone.getByLabel("Forme 8",{exact:true}).fill("international");
await phone.screenshot({path:"artifacts/final-recall-320.png",fullPage:true});
await phone.getByRole("button",{name:"Valider mes réponses"}).click();
await expect(phone.getByText("RÉPONSE ENREGISTRÉE",{exact:true})).toBeVisible({timeout:10000});
await phone.reload();await expect(phone.getByText("RÉPONSE ENREGISTRÉE",{exact:true})).toBeVisible();
const before=await phone.evaluate(async c=>(await fetch(`/api/rooms/${c}`)).json(),code);expect(before.round.submission.finalized).toBe(true);expect(before.round.submission.feedback).toBeUndefined();expect(before.xp).toBe(0);
await next(page,"boss-results");await expect(phone.getByRole("heading",{name:"8 sur 8 retrouvées."})).toBeVisible();const after=await phone.evaluate(async c=>(await fetch(`/api/rooms/${c}`)).json(),code);expect(after.xp).toBeGreaterThan(4000);expect(after.xp).toBeLessThanOrEqual(8000);
expect(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}finally{await ctx.close();}
});
test("unsubmitted drafts count at the real 120-second deadline",async({page,browser})=>{
test.setTimeout(170000);const code=await start(page);const ctx=await browser.newContext();const phone=await ctx.newPage();
try{await join(phone,code,"Patient");await jump(page,8,"boss-open");for(let i=0;i<8;i++)await phone.getByLabel(`Forme ${i+1}`,{exact:true}).fill(all[i]);
await expect(phone.getByText("Brouillon sauvegardé automatiquement",{exact:true})).toBeVisible();
await expect(page.locator(".stage-canvas")).toHaveAttribute("data-beat","boss-results",{timeout:125000});await expect(phone.getByText("+4000 points",{exact:true})).toBeVisible();
const late=await phone.evaluate(async c=>(await fetch(`/api/rooms/${c}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"answer",questionId:"boss",answer:{recall:["social"]},finalize:true})})).status,code);expect(late).toBe(409);
}finally{await ctx.close();}
});
