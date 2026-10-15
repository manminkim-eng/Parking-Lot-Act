// 부설주차장 법정대수 산정기 매뉴얼 화면 캡처 — usage: node capture_park.js <repoDir> <outDir>
// 규격: 1440×900 · DSF 1.25 (영상용 좁은 화면: MM_VW=720 MM_VH=1280 MM_DSF=2) · serviceWorkers block · _marks.json · _example.json(앱 엔진 결과)
// 입력 설정은 앱의 매뉴얼 캡처용 읽기 창구 window.__mmPark(setRows · state · R)와 입력란 id를 쓴다.
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=+(process.env.MM_VW||1440),VH=+(process.env.MM_VH||900),DSF=+(process.env.MM_DSF||1.25),PORT=8901;
/* 예제 A = 익산 근린생활 · 업무 복합 — 제1종 근생 450㎡ · 제2종 근생 400㎡ · 업무 1,200㎡ (앱 기본 용도 구성)
   예제 B = 익산 공동주택 + 근생 — 전용 59㎡ × 40세대 · 84㎡ × 60세대(제27조 다목) + 제1종 근생 600㎡ · 친환경차 대상
   예제 C = 전북 조례 자동 적용 — 예제 A와 같은 용도 구성에 「익산시 주차장 설치 및 관리 조례 [별표 4]」 선택(v5.1.1) */
const EX={
 A:{pn:'익산시 ○○동 근린생활시설 및 업무시설 신축공사',au:'김만민',city:'전북특별자치도 익산시',region:'da',ord:'',ev:false,rows:[{use:'nb1',q:450},{use:'nb2',q:400},{use:'office',q:1200}]},
 B:{pn:'익산시 ○○동 공동주택 및 근린생활시설 신축공사',au:'김만민',city:'전북특별자치도 익산시',region:'da',ord:'',ev:true,rows:[{use:'apt',units:[{a:59,n:40},{a:84,n:60}]},{use:'nb1',q:600}]},
 C:{pn:'익산시 ○○동 근린생활시설 및 업무시설 신축공사 (익산시 조례 적용)',au:'김만민',jb:'iksan',ev:false,rows:[{use:'nb1',q:450},{use:'nb2',q:400},{use:'office',q:1200}]},
};
const FREEZE=`(()=>{const T=new Date(2026,9,15,10,0,0).getTime();const D=Date;class F extends D{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}window.Date=F;window.alert=()=>{};window.confirm=()=>true;try{localStorage.clear();localStorage.setItem('pwa-dismissed','1');}catch(e){}})()`;
const HIDE='#toast,.toast,#pwa-banner{display:none!important}#result-col{position:static!important;max-height:none!important;overflow:visible!important}';
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__find=sel=>{if(sel.startsWith('nth:')){const [q,i]=sel.slice(4).split('|');return [...document.querySelectorAll(q)].filter(__vis)[+i]||null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__EX=${JSON.stringify(EX)};
window.__run=k=>{const e=__EX[k];closeModalDirect();goTab('main');
 const sv=(id,v)=>{const x=document.getElementById(id);x.value=v;};sv('a4ProjName',e.pn);sv('a4Author',e.au);
 document.getElementById('chk-ev').checked=e.ev;document.getElementById('chk-dis').checked=true;sv('inp-dispct','2');sv('inp-evpct','5');sv('inp-mech','');sv('inp-gfa','');document.getElementById('chk-evold').checked=false;
 sv('sel-jb',e.jb||'');pkSetJb(e.jb||'');if(!e.jb){sv('inp-city',e.city);sv('sel-region27',e.region);sv('inp-ordname',e.ord);}
 __mmPark.setRows(e.rows);window.scrollTo(0,0);};
window.__ex=()=>JSON.parse(JSON.stringify({in:__mmPark.state,R:__mmPark.R}));`;
const IN=i=>`nth:#input-col > .card|${i}`, RS=i=>`nth:#result-area .card|${i}`;
const SHOTS=[
 {id:'s01_overview',pre:"__run('A')",clip:'viewport',m:[['.tab-bar-inner','작업 탭 · 매뉴얼'],['.sum-bar','요약 스트립'],[IN(0),'공사 정보(A4 표제)'],[IN(1),'지역 · 조례'],[IN(2),'시설 목록(복합용도)'],[RS(0),'산정 결과'],['#fab-group','초기화 · 이용안내']]},
 {id:'s02_tabs',clip:'header.app-header',m:[['nth:.tab-bar-inner .tb|0','산정 입력 · 결과'],['nth:.tab-bar-inner .tb|1','A4 산정서'],['.tb-manual','매뉴얼'],['.hdr-right','근거 · 시행일']]},
 {id:'s03_region',clip:IN(1),m:[['#sel-jb','전북 시 · 군 조례 선택'],['#inp-city','시 · 군 · 구'],['#sel-region27','주택 지역 구분(제27조 표)'],['#inp-ordname','적용 조례명']]},
 {id:'s04_rows_a',clip:IN(2),m:[['nth:.pk-row|0','1번 줄 — 제1종 근생 450㎡'],['nth:.pk-row|1','2번 줄 — 제2종 근생 400㎡'],['nth:.pk-row|2','3번 줄 — 업무 1,200㎡'],['nth:.pk-ord|0','조례 기준 칸'],['#pk-rows + .reset-btn','＋ 용도 추가'],['#pk-rows ~ .info-box','시설면적 · 증축 · 용도변경']]},
 {id:'s05_result_a',clip:RS(0),m:[['.verdict-hero','부설주차장 대수'],['nth:.metric-card|0','법정(별표 1)'],['nth:.metric-card|1','조례 적용'],['nth:.metric-card|2','장애인 전용'],['nth:.metric-card|3','친환경차 전용']]},
 {id:'s06_table_a',clip:RS(1),m:[['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|0','줄별 산식 — 소수 첫째 자리'],['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|3','합계 → 비고 6'],['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|4','부설주차장 주차대수']]},
 {id:'s07_special_a',clip:RS(2),m:[['nth:#result-area .fade-in > .card:nth-child(3) tbody tr|0','장애인전용 (비고 10)'],['nth:#result-area .fade-in > .card:nth-child(3) tbody tr|1','친환경차 (제18조의5 · 6)'],['nth:#result-area .fade-in > .card:nth-child(3) tbody tr|2','경형 (비고 12)']]},
 {id:'s08_options',clip:IN(3),m:[['.toggle-row:has(#chk-dis)','장애인전용 대상'],['#inp-dispct','조례 비율 2 ~ 4 %'],['.toggle-row:has(#chk-ev)','친환경차 대상'],['#inp-mech','기계식 대수 제외'],['.toggle-row:has(#chk-evold)','기축시설 2 %']]},
 {id:'s09_rows_b',pre:"__run('B')",wait:800,clip:IN(2),m:[['nth:.pk-unit|0','주택형 59㎡ × 40세대'],['nth:.pk-unit|1','주택형 84㎡ × 60세대'],['nth:.pk-chk|0','도시형 생활주택'],['nth:.pk-row|1','제1종 근생 600㎡']]},
 {id:'s10_table_b',clip:RS(1),m:[['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|0','제27조 — 전용면적 합계 · 세대당 하한'],['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|2','제5호 외 합계'],['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|3','제5호 따로 합산'],['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|4','합계 91대']]},
 {id:'s11_special_b',clip:RS(2),m:[['nth:#result-area .fade-in > .card:nth-child(3) tbody tr|0','장애인 2구획'],['nth:#result-area .fade-in > .card:nth-child(3) tbody tr|1','친환경차 5구역']]},
 {id:'s12_rows_c',pre:"__run('C')",wait:800,clip:IN(1),union:IN(2),m:[['#sel-jb','익산시 조례 선택'],['#jb-info','조례 · 장애인 3 % · 유의사항'],['#inp-ordname','조례명 자동 입력'],['nth:.pk-ord|0','조례 기준 — 익산시 150㎡']]},
 {id:'s13_result_c',clip:RS(0),union:RS(1),crop:1500,m:[['.verdict-hero','조례 적용 18대'],['nth:.metric-card|0','법정 12대'],['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|0','법정 2.2 · 조례 3.0'],['nth:#result-area .fade-in > .card:nth-child(2) tbody tr|2','업무 8.0 → 12.0']]},
 {id:'s14_modal_guide',pre:"__run('A');openModal()",wait:700,fixed:true,clip:'.modal-box',m:[]},
 {id:'s15_modal_law',pre:"switchTab(document.querySelectorAll('.m-tab')[1],'mp-law')",wait:500,fixed:true,clip:'.modal-box',m:[]},
 {id:'s16_modal_ref',pre:"switchTab(document.querySelectorAll('.m-tab')[2],'mp-ref')",wait:500,fixed:true,clip:'.modal-box',post:"closeModalDirect()",m:[]},
 {id:'s17_a4',pre:"__run('B');goTab('print');scrollTo(0,0)",wait:1500,clip:'viewport',m:[['.mm-btn-print','인쇄 / PDF'],['.mm-btn-jpg','JPG 저장'],['#a4Page','A4 산정서']]},
 {id:'s18_a4page',clip:'#a4Page',crop:2700,m:[['nth:#a4Page .a4-sub|0','1. 산정 조건'],['nth:#a4Page .a4-sub|1','2. 용도별 산정'],['nth:#a4Page .a4-sub|2','3. 산정 결과'],['nth:#a4Page .a4-sub|3','4. 전용 주차구획'],['nth:#a4Page .a4-sub|4','5. 별표 1'],['nth:#a4Page .a4-sub|5','6. 적용 기준']]},
];
(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch({args:['--lang=ko-KR'],env:{...process.env,LANG:'ko_KR.UTF-8',LANGUAGE:'ko',LC_ALL:'ko_KR.UTF-8'}});
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(FREEZE);
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(2500);
 await pg.addStyleTag({content:HIDE});await pg.evaluate(HELP);
 const ex={};const meta={};
 for(const S of SHOTS){
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||700);
  if(S.clip!=='viewport'&&!S.fixed){await pg.evaluate(c=>{const e=__find(c);if(e){window.scrollTo(0,e.getBoundingClientRect().top+scrollY-40);}},S.clip);await pg.waitForTimeout(500);}
  await pg.evaluate(v=>{const f=document.getElementById('fab-group');if(f)f.style.visibility=v?'':'hidden';},S.clip==='viewport');
  if(S.id==='s01_overview')ex.A=await pg.evaluate('__ex()');
  if(S.id==='s09_rows_b')ex.B=await pg.evaluate('__ex()');
  if(S.id==='s12_rows_c')ex.C=await pg.evaluate('__ex()');
  if(S.id==='s18_a4page')ex.B_a4=await pg.evaluate(()=>document.getElementById('a4Page').innerText.replace(/\s+/g,' '));
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);clip={x:a.x,y:a.y,width:a.w,height:a.h};
     if(S.union){const e2=__find(S.union);if(e2){const a2=abs(e2);const x0=Math.min(clip.x,a2.x),y0=Math.min(clip.y,a2.y),x1=Math.max(clip.x+clip.width,a2.x+a2.w),y1=Math.max(clip.y+clip.height,a2.y+a2.h);clip={x:x0,y:y0,width:x1-x0,height:y1-y0};}}
     const P=12;clip={x:Math.max(0,clip.x-P),y:Math.max(0,clip.y-P),width:clip.width+2*P,height:clip.height+2*P};
     if(S.crop&&clip.height>S.crop)clip.height=S.crop;}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(Math.min(a.w,clip.x+clip.width-a.x)/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW-Math.max(0,c.x)),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){const sx=await pg.evaluate(()=>scrollX),sy=await pg.evaluate(()=>scrollY);await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:Math.max(0,c.x-sx),y:Math.max(0,c.y-sy),width:Math.min(c.width,VW),height:Math.min(c.height,VH-Math.max(0,c.y-sy))}});}
  else{try{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}catch(e){errs.push(S.id+' shot '+JSON.stringify(cl));continue;}}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(Math.min(cl.height,S.fixed?VH:1e9)),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(400);}
 }
 await pg.evaluate("__run('A')");await pg.waitForTimeout(600);ex.after=await pg.evaluate('__ex()');
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true,locale:'ko-KR'});await setup(mctx);
 const mp=await mctx.newPage();await mp.addInitScript(FREEZE);
 await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForTimeout(2500);
 await mp.addStyleTag({content:HIDE});await mp.evaluate(HELP);await mp.evaluate("__run('A')");await mp.waitForTimeout(800);
 await mp.evaluate(()=>{const e=document.querySelector('#input-col > .card:nth-of-type(3)')||document.querySelectorAll('#input-col > .card')[2];window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(600);
 await mp.screenshot({path:path.join(out,'s19_mobile_main.png')});meta['s19_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{const e=document.getElementById('result-area');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(800);
 await mp.screenshot({path:path.join(out,'s20_mobile_result.png')});meta['s20_mobile_result']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{goTab('print');window.scrollTo(0,0);});await mp.waitForTimeout(1500);
 await mp.screenshot({path:path.join(out,'s21_mobile_a4.png')});meta['s21_mobile_a4']={w:390,h:844,marks:[]};
 ex.mobile=await mp.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(ex,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5||m.w<=0||m.h<=0)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 const sh=o=>o&&{legal:o.R.legal,ord:o.R.ordTot,total:o.R.total,dis:o.R.dis.count,ev:o.R.ev.count,S:o.R.S,H:o.R.H};
 console.log(JSON.stringify({A:sh(ex.A),B:sh(ex.B),C:sh(ex.C),same:JSON.stringify(ex.A.R)===JSON.stringify(ex.after.R),mobile:ex.mobile,sizes:Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,v.w+'x'+v.h])),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
