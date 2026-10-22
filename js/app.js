(function(){
'use strict';
/*PARSER_START*/
const SAMPLE = `school 7:30 to 1 pm
i have to go at 7

redy start from 6+ - 6:10

wake up at 4 +  - 4:30    -> math (Olympiad)        + 1:30 hr

-+ 1:45 home
- 2 : 30  all done
 |
 v
++ physics , pw class , chemistry        +2 hr
4 : 20 to 6: 10 coaching

6 :  10 to 6: 30 fun

7 to 8 :30 class
8 30 to 9 dinner
9 to 10 subjective        + 1hr

===========================================================
total ++        4 : 30 hr`;

const uid=()=>Math.random().toString(36).slice(2,9);
const fmt=m=>{m=((Math.round(m)%1440)+1440)%1440;let hh=Math.floor(m/60);const mm=m%60;const ap=hh>=12?'PM':'AM';hh=hh%12||12;return hh+':'+String(mm).padStart(2,'0')+' '+ap;};
const fmtDur=m=>{m=Math.round(m);if(m<=0)return '';const hh=Math.floor(m/60),mm=m%60;return [hh?hh+' hr':'',mm?mm+' min':''].filter(Boolean).join(' ');};

const MORNING=/\b(wake|wakeup|ready|redy|get up|brush|bath|breakfast|school|bus|leave|go|morning|assembly)\b/i;
const EVENING=/\b(dinner|supper|night|evening|sleep|bed)\b/i;

function parseDuration(text){
  const re=/(?<![\d:])\+?\s*(\d+)(?:\s*:\s*(\d{1,2}))?\s*(hours?|hrs?|h|minutes?|mins?)\b/i;
  const m=re.exec(text);
  if(!m) return {min:null,rest:text};
  const isHour=m[3][0].toLowerCase()==='h';
  const min=isHour?(+m[1])*60+(m[2]?+m[2]:0):+m[1];
  return {min,rest:text.slice(0,m.index)+' '+text.slice(m.index+m[0].length)};
}

function findTimes(text){
  const re=/(?<![\d:.])(\d{1,2})(?:\s*:\s*(\d{2})|\s+([0-5]\d)(?!\d))?(?:\s*(a\.?m\.?|p\.?m\.?)(?![a-z]))?/gi;
  const out=[];let m;
  while((m=re.exec(text))){
    const h=+m[1];
    const mi=m[2]!=null?+m[2]:(m[3]!=null?+m[3]:0);
    let ap=m[4]?m[4][0].toLowerCase()+'m':null;
    const before=text.slice(0,m.index);
    const after=text.slice(m.index+m[0].length);
    const ok=m[2]!=null||m[3]!=null||ap
      ||/(?:\b(?:at|from|to|till|until|by|upto)|@|[-–—>])\s*$/i.test(before)
      ||/^\s*(?:to\b|till\b|until\b|[-–—])\s*\d/i.test(after);
    if(!ok||h>23||mi>59) continue;
    if(h===0||h>12) ap='24';
    out.push({h,m:mi,ap,idx:m.index,len:m[0].length});
  }
  return out;
}

function cleanTitle(s){
  s=s.replace(/\s+/g,' ').trim();
  for(let i=0;i<4;i++){
    s=s.replace(/^[\s,;:.\-–—]+|[\s,;:.\-–—]+$/g,'')
       .replace(/^(?:at|from|to|till|until|by)\s+/i,'')
       .replace(/\s+(?:at|from|to|till|until|by)$/i,'')
       .replace(/^(?:at|from|to|till|until|by)$/i,'');
  }
  s=s.replace(/^(?:i|we)\s+(?:have|need|want)\s+to\s+/i,'').replace(/^(?:i|we)\s+(?:must|should|will)\s+/i,'');
  return s.trim();
}

function niceTitle(t){
  const k=t.toLowerCase().replace(/\s+/g,' ').trim();
  if(/^(?:redy|ready)(?: start)?$/.test(k)) return 'Get ready';
  if(/^(?:go|leave)$/.test(k)) return 'Leave home';
  if(k==='home') return 'Reach home';
  t=t.replace(/\bredy\b/gi,'ready').replace(/\bpw\b/gi,'PW');
  return t.charAt(0).toUpperCase()+t.slice(1);
}

function kindOf(t){
  t=t.toLowerCase();
  if(/\b(dinner|lunch|breakfast|snack|tiffin|meal)\b/.test(t)) return 'meal';
  if(/\b(fun|break|play|game|games|relax|rest|walk|tv|chill|music)\b/.test(t)) return 'break';
  if(/\b(wake|ready|home|leave|bath|sleep|bed|done|brush)\b/.test(t)) return 'routine';
  if(/(math|physics|chem|bio|science|olympiad|study|revis|homework|practice|subjective|reading|notes|problem|solve|assignment|test|exam)/.test(t)) return 'study';
  if(/(school|class|coaching|tuition|lecture|lab|college|session)/.test(t)) return 'class';
  return 'other';
}

function cands(t){
  if(t.ap==='24') return [t.h*60+t.m];
  const b=(t.h%12)*60+t.m;
  if(t.ap==='am') return [b];
  if(t.ap==='pm') return [b+720];
  return [b,b+720];
}
function resolveOne(t,hint,prevEnd){
  let cs=cands(t);
  if(t.ap==null&&hint){ const b=(t.h%12)*60+t.m; cs=[hint==='am'?b:b+720]; }
  if(cs.length===1) return cs[0];
  if(prevEnd!=null){
    const ok=cs.filter(c=>c>=prevEnd-30);
    return ok.length?Math.min(...ok):Math.min(...cs);
  }
  const mer=(t.h===12||(t.h>=1&&t.h<=3))?1:0;
  return cs[mer];
}
function resolveRange(a,b,hint,prevEnd){
  let s,e;
  if(a.ap==null&&b.ap!=null){
    e=cands(b)[0];
    const cs=cands(a).filter(c=>c<e);
    s=cs.length?Math.max(...cs):Math.min(...cands(a));
  }else{
    s=resolveOne(a,hint,prevEnd);
    const eb=cands(b); const cs=eb.filter(c=>c>s);
    e=cs.length?Math.min(...cs):Math.min(...eb)+1440;
  }
  return [s,e];
}

function parsePart(p){
  p=p.replace(/[+|]/g,' ');
  const times=findTimes(p);
  let s=p;
  for(let i=times.length-1;i>=0;i--) s=s.slice(0,times[i].idx)+' '+s.slice(times[i].idx+times[i].len);
  return {times:times.slice(0,2),title:cleanTitle(s)};
}

function buildTask(seg,dur,prevEnd){
  if(seg.title.length<2&&!seg.times.length) return null;
  const raw=seg.title||'Task';
  const low=raw.toLowerCase();
  const hint=MORNING.test(low)?'am':(EVENING.test(low)?'pm':null);
  const tm=seg.times;
  let start,end,flag='';
  if(tm.length>=2){ [start,end]=resolveRange(tm[0],tm[1],hint,prevEnd); }
  else if(tm.length===1){ start=resolveOne(tm[0],hint,prevEnd); end=start+(dur||0); }
  else{
    if(prevEnd!=null) start=prevEnd; else { start=540; flag='No time found, so 9:00 AM was used.'; }
    end=start+(dur||30);
    if(dur==null) flag=(flag?flag+' ':'')+'No length found, so 30 min was used.';
  }
  const parts=raw.split(/\s*,\s*/).filter(Boolean);
  let title,subs=[];
  if(parts.length>=2&&parts.length<=8){
    const nice=parts.map(niceTitle);
    title=nice.join(' · ');
    subs=nice.map(t=>({id:uid(),title:t}));
  }else title=niceTitle(raw);
  const kind=kindOf(title);
  const focus=kind==='study'?(dur!=null?dur:Math.max(0,end-start)):0;
  return {id:uid(),title,start,end,kind,focus,subs,flag};
}

function parseSummary(src){
  const tasks=[];let total=null;let prevEnd=null;
  for(const rawLine of String(src).split(/\r?\n/)){
    let line=rawLine.replace(/[=_~]{3,}/g,' ');
    if(/^\W*total\b/i.test(line)){ const d=parseDuration(line).min; if(d!=null) total=d; continue; }
    line=line.replace(/^[\s\-+*•>|=~#.]+/,'');
    if(!line.trim()) continue;
    const du=parseDuration(line); const dur=du.min; line=du.rest;
    const segs=line.split(/\s*(?:-+>|=+>|→)\s*/).map(parsePart);
    for(let i=0;i<segs.length-1;i++){
      if(!segs[i].title&&segs[i].times.length&&!segs[i+1].times.length){ segs[i+1].times=segs[i].times; segs[i].times=[]; }
    }
    const real=segs.filter(s=>s.title||s.times.length);
    real.forEach((seg,i)=>{
      const t=buildTask(seg,i===real.length-1?dur:null,prevEnd);
      if(!t) return;
      tasks.push(t); prevEnd=t.end;
    });
  }
  return {tasks,total};
}
/*PARSER_END*/

/* ---------- app ---------- */
const KEY='daybreak.planner.v1';
const ALL=[0,1,2,3,4,5,6];
const WEEK_ORDER=[1,2,3,4,5,6,0];
const DAY_SHORT=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_LONG=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const KIND_LABEL={study:'Study',class:'Class',meal:'Meal',break:'Break',routine:'Routine',other:'Other'};
const EMPTY={done:{},subs:{},extra:{},notes:{},skip:{}};
const CHECK='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const $=s=>document.querySelector(s);
const sum=a=>a.reduce((x,y)=>x+y,0);
const byTime=(a,b)=>a.start-b.start||a.end-b.end;
const ico=s=>{const t=document.createElement('template');t.innerHTML=s;return t.content.firstChild;};
function h(tag,attrs,...kids){
  const e=document.createElement(tag);
  if(attrs) for(const [k,v] of Object.entries(attrs)){
    if(v==null||v===false) continue;
    if(k==='class') e.className=v;
    else if(k.startsWith('on')&&typeof v==='function') e.addEventListener(k.slice(2),v);
    else if(v===true) e.setAttribute(k,'');
    else e.setAttribute(k,v);
  }
  for(const kid of kids.flat()){
    if(kid==null||kid===false) continue;
    e.append(kid.nodeType?kid:document.createTextNode(String(kid)));
  }
  return e;
}

const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const weekStart=d=>addDays(startOfDay(d),-((d.getDay()+6)%7));
const toIn=m=>{m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
const fromIn=s=>{const p=String(s).split(':').map(Number);return (p[0]||0)*60+(p[1]||0);};
function daysLabel(ds){
  const set=new Set(ds);
  if(set.size===7) return 'Every day';
  if(set.size===0) return 'Not scheduled';
  if(set.size===6&&!set.has(0)) return 'Mon–Sat';
  if(set.size===5&&!set.has(0)&&!set.has(6)) return 'Weekdays';
  if(set.size===2&&set.has(0)&&set.has(6)) return 'Weekends';
  return WEEK_ORDER.filter(d=>set.has(d)).map(d=>DAY_SHORT[d]).join(', ');
}

function freshState(){
  const p=parseSummary(SAMPLE);
  return {v:1,summary:SAMPLE,days:[...ALL],total:p.total,tasks:p.tasks.map(t=>({...t,days:[...ALL]})),dates:{},remind:{on:true,lead:5,sound:true,system:false,awake:false,ongoing:false},fired:{}};
}
function load(){
  try{
    const raw=localStorage.getItem(KEY); if(!raw) return null;
    const s=JSON.parse(raw);
    if(s&&Array.isArray(s.tasks)&&s.dates&&typeof s.dates==='object') return s;
  }catch(e){}
  return null;
}
let state=load()||freshState();
function normalize(){
  if(!Array.isArray(state.days)||!state.days.length) state.days=[...ALL];
  if(typeof state.summary!=='string') state.summary=SAMPLE;
  state.remind=Object.assign({on:true,lead:5,sound:true,system:false,awake:false,ongoing:false},state.remind||{});
  const todayK=dkey(new Date()),fired={};
  if(state.fired&&typeof state.fired==='object') for(const k of Object.keys(state.fired)) if(k.startsWith(todayK)) fired[k]=1;
  state.fired=fired;
  state.tasks.forEach(t=>{ t.days=Array.isArray(t.days)?t.days:[...ALL]; t.subs=Array.isArray(t.subs)?t.subs:[]; t.focus=+t.focus||0; });
}
normalize();
let saveT;
function save(){ clearTimeout(saveT); saveT=setTimeout(()=>{ try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){} },150); }

const rec=dk=>state.dates[dk]||(state.dates[dk]={done:{},subs:{},extra:{},notes:{},skip:{}});
const peek=dk=>state.dates[dk]||EMPTY;

const mq=window.matchMedia('(min-width:960px)');
const VIEWS=['add','day','widget','week','tasks','alerts'];
const SIDE_KEY='daybreak.sideOpen';
let MINI=(location.hash==='#widget');   // opened as the small "Now" window: no chrome, no duplicate reminders
const ui={view:'day',date:startOfDay(new Date()),open:new Set(),refocus:null,sysTried:false,awakeFail:false,offlineReady:false,sideOpen:true};
{ const hv=location.hash.slice(1); if(VIEWS.includes(hv)) ui.view=hv; }
try{ ui.sideOpen=localStorage.getItem(SIDE_KEY)!=='0'; }catch(e){}
const effView=()=>ui.view==='add'&&mq.matches?'day':ui.view;
const curKey=()=>dkey(ui.date);

/* toast + undo */
let toastT;
function hideToast(){ $('#toast').classList.remove('show'); }
function toast(msg,action){
  const t=$('#toast');
  t.replaceChildren(h('span',null,msg),action?h('button',{class:'tbtn',type:'button',onclick:()=>{action.fn();hideToast();}},action.label):null);
  t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(hideToast,8000);
}
function restore(snap){
  state=JSON.parse(snap); normalize(); save();
  $('#summary').value=state.summary; renderAddDays(); renderPreview(); render();
}

/* mutations */
function toggleDone(id){ const r=rec(curKey()); r.done[id]=!r.done[id]; save(); render(); }
function toggleSub(sid){ const r=rec(curKey()); r.subs[sid]=!r.subs[sid]; save(); render(); }
function toggleSkip(id){ const r=rec(curKey()); r.skip[id]=!r.skip[id]; save(); render(); }
function addExtra(id,text){
  text=text.trim(); if(!text) return;
  const r=rec(curKey()); (r.extra[id]=r.extra[id]||[]).push({id:uid(),title:text,done:false});
  ui.refocus='step-'+id; save(); render();
}
function toggleExtra(id,xid){ const x=(rec(curKey()).extra[id]||[]).find(e=>e.id===xid); if(x){x.done=!x.done; save(); render();} }
function removeExtra(id,xid){ const r=rec(curKey()); r.extra[id]=(r.extra[id]||[]).filter(e=>e.id!==xid); save(); render(); }
function setNote(id,text){ rec(curKey()).notes[id]=text; save(); }
function toggleDay(id,wd){
  const t=state.tasks.find(x=>x.id===id); if(!t) return;
  const i=t.days.indexOf(wd); if(i>=0) t.days.splice(i,1); else t.days.push(wd);
  save(); render();
}
function deleteTask(id){
  const snap=JSON.stringify(state);
  state.tasks=state.tasks.filter(t=>t.id!==id); save(); render();
  toast('Task removed.',{label:'Undo',fn:()=>restore(snap)});
}

/* small builders */
const chip=kind=>h('span',{class:'chip k-'+kind},h('i'),KIND_LABEL[kind]||'Other');
function stepRow(label,checked,onToggle,onRemove){
  return h('li',{class:'step'+(checked?' is-done':'')},
    h('button',{type:'button',class:'sbox',role:'checkbox','aria-checked':String(checked),'aria-label':label,onclick:onToggle},ico(CHECK)),
    h('span',{class:'stext'},label),
    onRemove?h('button',{type:'button',class:'rm','aria-label':'Remove '+label,onclick:onRemove},'×'):null);
}

/* ---------- Day view ---------- */
function statFor(date){
  const wd=date.getDay(),d=peek(dkey(date));
  const act=state.tasks.filter(t=>t.days.includes(wd)&&!d.skip[t.id]);
  return {total:act.length,done:act.filter(t=>d.done[t.id]).length};
}
function detailFor(t,d){
  const subs=t.subs||[],extra=d.extra[t.id]||[];
  const dl=DAY_LONG[ui.date.getDay()]+' '+ui.date.getDate();
  return h('div',{class:'detail'},
    subs.length?h('div',null,h('h4',null,'Steps in this block'),
      h('ul',{class:'steps'},subs.map(s=>stepRow(s.title,!!d.subs[s.id],()=>toggleSub(s.id))))):null,
    h('div',null,h('h4',null,'Only for '+dl),
      extra.length?h('ul',{class:'steps'},extra.map(x=>stepRow(x.title,x.done,()=>toggleExtra(t.id,x.id),()=>removeExtra(t.id,x.id)))):h('p',{class:'hint'},'Add steps that apply to this date only.'),
      h('form',{class:'addstep',onsubmit:e=>{e.preventDefault();addExtra(t.id,e.target.elements.step.value);}},
        h('input',{class:'inp',name:'step',id:'step-'+t.id,placeholder:'Add a step for this date','aria-label':'New step for this date',autocomplete:'off'}),
        h('button',{class:'btn small',type:'submit'},'Add'))),
    h('div',null,h('label',{for:'note-'+t.id},'Note for this date'),
      h('textarea',{class:'inp',id:'note-'+t.id,rows:'2',oninput:e=>setNote(t.id,e.target.value)},d.notes[t.id]||'')),
    h('div',{class:'dact'},h('button',{type:'button',class:'btn small',onclick:()=>toggleSkip(t.id)},'Skip on this date')));
}
function taskItem(t,d,now,nx){
  const done=!!d.done[t.id],open=ui.open.has(t.id),point=t.end<=t.start;
  const isNow=now>=0&&!point&&now>=t.start&&now<t.end;
  const subs=t.subs||[],extra=d.extra[t.id]||[];
  const subTotal=subs.length+extra.length;
  const subDone=subs.filter(s=>d.subs[s.id]).length+extra.filter(x=>x.done).length;
  const ov=nx?t.end-nx.start:0;
  return h('li',{class:'task k-'+t.kind+(done?' done':'')+(isNow?' now':'')+(point?' point':'')},
    h('div',{class:'tm'},h('span',{class:'a'},fmt(t.start)),point?null:h('span',null,fmt(t.end))),
    h('div',{class:'card'},
      h('div',{class:'row'},
        h('button',{type:'button',class:'chk',role:'checkbox','aria-checked':String(done),'aria-label':t.title,onclick:()=>toggleDone(t.id)},ico(CHECK)),
        h('div',{class:'ttl'},h('h3',null,t.title),
          h('div',{class:'meta'},chip(t.kind),
            t.focus>0?h('span',{class:'chip focus'},'Focus '+fmtDur(t.focus)):(!point?h('span',{class:'chip'},fmtDur(t.end-t.start)):null),
            isNow?h('span',{class:'chip now'},'Now'):null,
            ov>0?h('span',{class:'chip warn'},'Overlaps '+nx.title+' by '+fmtDur(ov)):null,
            t.flag?h('span',{class:'chip warn',title:t.flag},'Check time'):null)),
        h('button',{type:'button',class:'more','aria-expanded':String(open),'aria-label':'Details for '+t.title,onclick:()=>{open?ui.open.delete(t.id):ui.open.add(t.id);render();}},
          h('span',null,subTotal?subDone+'/'+subTotal:'Details'),ico(CHEV))),
      open?detailFor(t,d):null));
}
function dayView(){
  const date=ui.date,dk=dkey(date),wd=date.getDay(),d=peek(dk);
  const isToday=dk===dkey(new Date());
  const all=state.tasks.filter(t=>t.days.includes(wd)).sort(byTime);
  const act=all.filter(t=>!d.skip[t.id]);
  const fp=sum(act.map(t=>t.focus)),fd=sum(act.filter(t=>d.done[t.id]).map(t=>t.focus));
  const dn=act.filter(t=>d.done[t.id]).length;
  const nowD=new Date();
  const now=isToday?nowD.getHours()*60+nowD.getMinutes():-1;
  const pct=fp?fd/fp:(act.length?dn/act.length:0);
  const ws=weekStart(date);
  const sub=act.length?dn+' of '+act.length+' done'+(fp?' · Focus '+(fmtDur(fd)||'0 min')+' of '+fmtDur(fp):''):'Nothing is set for this day';
  const items=[];
  all.forEach(t=>{
    if(d.skip[t.id]){
      items.push(h('li',{class:'skipped'},h('span',null,t.title+' · skipped on this date'),h('button',{type:'button',class:'btn quiet small',onclick:()=>toggleSkip(t.id)},'Restore')));
      return;
    }
    const nx=act[act.indexOf(t)+1];
    items.push(taskItem(t,d,now,nx));
    if(nx){ const g=nx.start-t.end; if(g>=20) items.push(h('li',{class:'gap'},fmtDur(g)+' free until '+fmt(nx.start))); }
  });
  return h('div',null,
    h('div',{class:'mh'},
      h('div',null,h('h1',null,DAY_LONG[wd]+', '+date.getDate()+' '+MONTHS[date.getMonth()]+(isToday?' · Today':'')),h('p',{class:'sub'},sub),
        h('div',{class:'meta',style:'margin-top:2px'},
          h('button',{type:'button',class:'btn quiet small',style:'padding-left:0;min-height:30px',onclick:()=>{ui.view='alerts';render();}},state.remind.on?'Reminders on · '+leadLabel():'Reminders off'),
          h('button',{type:'button',class:'btn quiet small',style:'min-height:30px',onclick:openMini},'Mini window'))),
      h('div',{class:'nav'},
        h('button',{type:'button',class:'iconbtn','aria-label':'Previous week',onclick:()=>{ui.date=addDays(ui.date,-7);render();}},'‹'),
        h('button',{type:'button',class:'iconbtn',onclick:()=>{ui.date=startOfDay(new Date());render();}},'Today'),
        h('button',{type:'button',class:'iconbtn','aria-label':'Next week',onclick:()=>{ui.date=addDays(ui.date,7);render();}},'›'))),
    h('div',{class:'dates',role:'group','aria-label':'Days of this week'},
      [...Array(7)].map((_,i)=>{
        const day=addDays(ws,i),sel=dkey(day)===dk,st=statFor(day);
        return h('button',{type:'button',class:'datebtn'+(dkey(day)===dkey(new Date())?' today':''),'aria-pressed':String(sel),'aria-label':DAY_LONG[day.getDay()]+' '+day.getDate(),onclick:()=>{ui.date=day;render();}},
          h('span',{class:'wd'},DAY_SHORT[day.getDay()]),h('span',{class:'dn'},day.getDate()),h('span',{class:'dc'},st.total?st.done+'/'+st.total:'–'));
      })),
    h('div',{class:'prog',role:'progressbar','aria-label':'Progress for the day','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(Math.round(pct*100))},
      h('span',{style:'width:'+Math.round(pct*100)+'%'})),
    all.length?h('ul',{class:'list'},items):
      h('div',{class:'empty'},h('p',null,'No tasks are set to show on '+DAY_LONG[wd]+'s.'),
        h('button',{type:'button',class:'btn',onclick:()=>{ui.view='week';render();}},'Choose days in Week view')));
}

/* ---------- Week view ---------- */
function weekView(){
  const ws=weekStart(ui.date),days=[...Array(7)].map((_,i)=>addDays(ws,i));
  const tasks=[...state.tasks].sort(byTime),todayK=dkey(new Date()),we=addDays(ws,6);
  return h('div',null,
    h('div',{class:'mh'},
      h('div',null,h('h1',null,ws.getDate()+' '+MONTHS[ws.getMonth()]+' – '+we.getDate()+' '+MONTHS[we.getMonth()]),
        h('p',{class:'sub'},'Tap a square to show or hide a task on that weekday. It repeats every week.')),
      h('div',{class:'nav'},
        h('button',{type:'button',class:'iconbtn','aria-label':'Previous week',onclick:()=>{ui.date=addDays(ui.date,-7);render();}},'‹'),
        h('button',{type:'button',class:'iconbtn',onclick:()=>{ui.date=startOfDay(new Date());render();}},'This week'),
        h('button',{type:'button',class:'iconbtn','aria-label':'Next week',onclick:()=>{ui.date=addDays(ui.date,7);render();}},'›'))),
    tasks.length?h('div',{class:'scroll'},h('table',{class:'matrix'},
      h('thead',null,h('tr',null,h('th',{class:'tk',scope:'col'},'Task'),
        days.map(day=>h('th',{scope:'col'},h('button',{type:'button',class:'dayjump'+(dkey(day)===todayK?' today':''),'aria-label':'Open '+DAY_LONG[day.getDay()]+' '+day.getDate(),onclick:()=>{ui.date=day;ui.view='day';render();}},
          h('span',null,DAY_SHORT[day.getDay()]),h('b',null,day.getDate())))))),
      h('tbody',null,tasks.map(t=>h('tr',{class:'k-'+t.kind},
        h('th',{class:'tk',scope:'row'},h('b',null,t.title),h('span',null,(t.end>t.start?fmt(t.start)+' – '+fmt(t.end):fmt(t.start))+' · '+daysLabel(t.days))),
        days.map(day=>{const wd=day.getDay(),on=t.days.includes(wd);
          return h('td',null,h('button',{type:'button',class:'cell','aria-pressed':String(on),'aria-label':t.title+' on '+DAY_LONG[wd],onclick:()=>toggleDay(t.id,wd)},ico(CHECK)));}))) ),
      h('tfoot',null,h('tr',null,h('th',{class:'tk',scope:'row'},h('span',null,'Done')),
        days.map(day=>{const st=statFor(day);return h('td',null,st.total?st.done+'/'+st.total:'–');}))))):
    h('div',{class:'empty'},h('p',null,'No tasks yet. Add some from the summary box.')));
}

/* ---------- Tasks (editor) ---------- */
function field(label,id,control){ return h('div',{class:'efield'},h('label',{for:id},label),control); }
function editCard(t){
  const idp=t.id;
  const subsList=h('ul',{class:'esubs'},(t.subs||[]).map((s,i)=>h('li',null,
    h('input',{class:'inp',value:s.title,'aria-label':'Step '+(i+1),oninput:e=>{s.title=e.target.value;save();}}),
    h('button',{type:'button',class:'rm','aria-label':'Remove step '+(i+1),onclick:()=>{t.subs=t.subs.filter(x=>x!==s);save();render();}},'×'))));
  return h('li',{class:'ecard k-'+t.kind},
    field('Task','t-title-'+idp,h('input',{class:'inp',id:'t-title-'+idp,value:t.title,oninput:e=>{t.title=e.target.value;save();}})),
    h('div',{class:'egrid'},
      field('Starts','t-start-'+idp,h('input',{class:'inp',type:'time',id:'t-start-'+idp,value:toIn(t.start),onchange:e=>{if(!e.target.value)return;t.start=fromIn(e.target.value);if(t.end<t.start)t.end=t.start;delete t.flag;save();render();}})),
      field('Ends','t-end-'+idp,h('input',{class:'inp',type:'time',id:'t-end-'+idp,value:toIn(t.end),onchange:e=>{if(!e.target.value)return;let v=fromIn(e.target.value);if(v<t.start)v+=1440;t.end=v;delete t.flag;save();render();}})),
      field('Type','t-kind-'+idp,h('select',{class:'inp',id:'t-kind-'+idp,onchange:e=>{t.kind=e.target.value;save();render();}},
        Object.entries(KIND_LABEL).map(([k,l])=>h('option',{value:k,selected:k===t.kind},l)))),
      field('Focus (minutes)','t-focus-'+idp,h('input',{class:'inp',type:'number',min:'0',step:'5',id:'t-focus-'+idp,value:String(t.focus||0),onchange:e=>{t.focus=Math.max(0,+e.target.value||0);save();render();}}))),
    h('div',{class:'efield'},h('span',{class:'lbl'},'Shows on · '+daysLabel(t.days)),
      h('div',{class:'chips',role:'group','aria-label':'Weekdays for '+t.title},WEEK_ORDER.map(wd=>h('button',{type:'button',class:'dchip','aria-pressed':String(t.days.includes(wd)),onclick:()=>toggleDay(t.id,wd)},DAY_SHORT[wd])))),
    h('div',{class:'efield'},h('span',{class:'lbl'},'Reminder'),
      h('button',{type:'button',class:'dchip','aria-pressed':String(t.notify!==false),onclick:()=>{t.notify=t.notify===false;save();render();}},t.notify!==false?'Reminder on':'Reminder off')),
    h('div',{class:'efield'},h('span',{class:'lbl'},'Steps shown on every date'),subsList,
      h('form',{class:'addstep',onsubmit:e=>{e.preventDefault();const v=e.target.elements.s.value.trim();if(!v)return;t.subs.push({id:uid(),title:v});save();ui.refocus='addsub-'+t.id;render();}},
        h('input',{class:'inp',name:'s',id:'addsub-'+idp,placeholder:'Add a step','aria-label':'New step',autocomplete:'off'}),
        h('button',{type:'submit',class:'btn small'},'Add'))),
    h('div',{class:'eact'},h('button',{type:'button',class:'btn small',onclick:()=>deleteTask(t.id)},'Delete task')));
}
function tasksView(){
  const tasks=[...state.tasks].sort(byTime),focus=sum(tasks.map(t=>t.focus));
  const total=state.total;
  return h('div',null,
    h('div',{class:'mh'},
      h('div',null,h('h1',null,'Tasks'),h('p',{class:'sub'},tasks.length+' tasks · '+(fmtDur(focus)||'0 min')+' of focus on a full day')),
      h('button',{type:'button',class:'btn',onclick:()=>{
        state.tasks.push({id:uid(),title:'New task',start:540,end:600,kind:'other',focus:0,subs:[],days:[...ALL]});
        save();ui.refocus=null;render();}},'New task')),
    total!=null?h('p',{class:'callout '+(total===focus?'good':'warn')},
      total===focus?'Focus matches the total in your summary ('+fmtDur(total)+').':'Your summary says '+fmtDur(total)+' of focus, but these tasks add up to '+(fmtDur(focus)||'0 min')+'.'):null,
    tasks.length?h('ul',{class:'list',style:'margin-top:14px'},tasks.map(editCard)):h('div',{class:'empty'},h('p',null,'No tasks yet. Add some from the summary box.')));
}

/* ---------- add panel ---------- */
const ta=$('#summary');
function renderAddDays(){
  $('#addDays').replaceChildren(...WEEK_ORDER.map(wd=>h('button',{type:'button',class:'dchip','aria-pressed':String(state.days.includes(wd)),onclick:()=>{
    const i=state.days.indexOf(wd);
    if(i>=0){ if(state.days.length>1) state.days.splice(i,1); } else state.days.push(wd);
    save(); renderAddDays();
  }},DAY_SHORT[wd])));
  const set=(ds)=>()=>{state.days=[...ds];save();renderAddDays();};
  $('#presets').replaceChildren(
    h('button',{type:'button',class:'btn quiet small',onclick:set(ALL)},'Every day'),
    h('button',{type:'button',class:'btn quiet small',onclick:set([1,2,3,4,5,6])},'Mon–Sat'),
    h('button',{type:'button',class:'btn quiet small',onclick:set([1,2,3,4,5])},'Weekdays'));
}
function renderPreview(){
  const p=parseSummary(ta.value),n=p.tasks.length,box=$('#preview');
  $('#btnReplace').disabled=!n; $('#btnAppend').disabled=!n;
  if(!n){ box.replaceChildren(h('p',{class:'hint'},'Nothing recognised yet. Try “Chemistry 5 to 6:30 pm” on its own line.')); return; }
  const fo=sum(p.tasks.map(t=>t.focus));
  const rows=[...p.tasks].sort(byTime).map(t=>h('div',{class:'prow k-'+t.kind},
    h('span',{class:'pt'},t.end>t.start?fmt(t.start)+' – '+fmt(t.end):fmt(t.start)),
    h('span',{class:'pn'},h('b',null,t.title),' ',chip(t.kind),t.focus?h('span',{class:'hint'},' focus '+fmtDur(t.focus)):null),
    t.flag?h('span',{class:'pflag'},t.flag):null));
  const nodes=[h('h3',null,'What I found · '+n+(n===1?' task':' tasks')),...rows];
  if(p.total!=null) nodes.push(h('p',{class:'callout '+(p.total===fo?'good':'warn')},
    p.total===fo?'Focus adds up to '+fmtDur(fo)+', matching your total.':'Your total says '+fmtDur(p.total)+', but focus adds up to '+(fmtDur(fo)||'0 min')+'.'));
  box.replaceChildren(...nodes);
}
function applyPlan(mode){
  const p=parseSummary(ta.value); if(!p.tasks.length) return;
  const snap=JSON.stringify(state);
  const nt=p.tasks.map(t=>({...t,days:[...state.days]}));
  if(mode==='replace'){ state.tasks=nt; state.dates={}; state.total=p.total; }
  else{ state.tasks=state.tasks.concat(nt); if(p.total!=null) state.total=p.total; }
  state.summary=ta.value; save();
  if(ui.view==='add') ui.view='day';
  render();
  toast((mode==='replace'?'Plan replaced with ':'Added ')+nt.length+(nt.length===1?' task.':' tasks.'),{label:'Undo',fn:()=>restore(snap)});
}
ta.addEventListener('input',()=>{ state.summary=ta.value; save(); renderPreview(); });
$('#btnReplace').addEventListener('click',()=>applyPlan('replace'));
$('#btnAppend').addEventListener('click',()=>applyPlan('append'));
$('#btnSample').addEventListener('click',()=>{ ta.value=SAMPLE; state.summary=SAMPLE; save(); renderPreview(); });

/* ---------- reminders ---------- */
const LEADS=[0,5,10,15,30];
const leadLabel=()=>state.remind.lead===0?'at start':state.remind.lead+' min before';
let alertsList=[],ac=null,lock=null;

function unlockAudio(){
  try{
    if(!ac){ const C=window.AudioContext||window.webkitAudioContext; if(C) ac=new C(); }
    if(ac&&ac.state==='suspended') ac.resume();
  }catch(e){}
}
document.addEventListener('pointerdown',unlockAudio,{passive:true});
document.addEventListener('keydown',unlockAudio);
function beep(){
  if(!state.remind.sound||!ac) return;
  try{
    unlockAudio();
    const t0=ac.currentTime;
    [880,1175].forEach((f,i)=>{
      const o=ac.createOscillator(),g=ac.createGain(),s=t0+i*.22;
      o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,s);
      g.gain.exponentialRampToValueAtTime(0.25,s+.02);
      g.gain.exponentialRampToValueAtTime(0.0001,s+.2);
      o.connect(g); g.connect(ac.destination); o.start(s); o.stop(s+.22);
    });
  }catch(e){}
}
function renderBanners(){
  $('#alerts').replaceChildren(...alertsList.map(a=>h('div',{class:'alert',role:'alert'},
    h('div',null,h('b',null,a.title),h('small',null,a.body)),
    h('div',{class:'abtns'},
      a.taskId?h('button',{type:'button',class:'abtn',onclick:()=>{rec(dkey(new Date())).done[a.taskId]=true;save();dismissAlert(a.id);render();}},'Mark done'):null,
      h('button',{type:'button',class:'abtn p',onclick:()=>dismissAlert(a.id)},'Dismiss')))));
}
function dismissAlert(id){ alertsList=alertsList.filter(x=>x.id!==id); renderBanners(); }
async function showSystem(title,body,tag){
  const opts={body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:tag||'daybreak'};
  try{
    const reg=('serviceWorker' in navigator)?await navigator.serviceWorker.getRegistration():null;
    if(reg&&reg.showNotification){ await reg.showNotification(title,opts); return; }
    new Notification(title,opts);
  }catch(e){}
}
function notify(title,body,taskId){
  alertsList.push({id:uid(),title,body,taskId});
  renderBanners(); beep();
  if(state.remind.system&&'Notification' in window&&Notification.permission==='granted') showSystem(title,body,taskId);
}
function checkReminders(){
  const R=state.remind; if(!R.on||MINI) return;
  const nd=new Date(),dk=dkey(nd),wd=nd.getDay(),now=nd.getHours()*60+nd.getMinutes()+nd.getSeconds()/60,d=peek(dk);
  let changed=false;
  state.tasks.forEach(t=>{
    if(t.notify===false||!t.days.includes(wd)||d.skip[t.id]||d.done[t.id]) return;
    if(now<t.start-R.lead||now>=t.start+10) return;
    const k=dk+'|'+t.id+'|'+R.lead;
    if(state.fired[k]) return;
    state.fired[k]=1; changed=true;
    const diff=t.start-now;
    const head=diff>0.5?'Starts in '+Math.round(diff)+' min':(diff>-1?'Starting now':'Started '+Math.round(-diff)+' min ago');
    notify(head,t.title+' · '+fmt(t.start)+(t.end>t.start?' – '+fmt(t.end):''),t.id);
  });
  if(changed) save();
}
async function askPermission(){
  try{
    if(!('Notification' in window)) return false;
    let p=Notification.permission;
    if(p==='default') p=await Notification.requestPermission();
    return p==='granted';
  }catch(e){ return false; }
}
async function toggleSystem(){
  const R=state.remind;
  if(R.system){ R.system=false; save(); render(); return; }
  R.system=await askPermission(); ui.sysTried=true; save(); render();
}
function sysStatus(){
  if(!('Notification' in window)) return 'Not available in this view.';
  if(Notification.permission==='denied') return 'Blocked in this browser.';
  if(state.remind.system) return 'On. Shown as well as the banner.';
  return ui.sysTried?'Not allowed in this view.':'Off. Banners still appear on this page.';
}
async function setAwake(on){
  const R=state.remind;
  if(!on){ try{ if(lock) await lock.release(); }catch(e){} lock=null; R.awake=false; save(); render(); return; }
  try{
    if(!navigator.wakeLock) throw new Error('unsupported');
    lock=await navigator.wakeLock.request('screen');
    lock.addEventListener('release',()=>{lock=null;});
    R.awake=true; ui.awakeFail=false;
  }catch(e){ R.awake=false; ui.awakeFail=true; }
  save(); render();
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&state.remind.awake&&!lock) setAwake(true);
});
/* ---------- current-task widget ---------- */
let pipWin=null,pipRoot=null,lastOngoing='';
function nowInfo(){
  const nd=new Date(),dk=dkey(nd),wd=nd.getDay();
  const m=nd.getHours()*60+nd.getMinutes()+nd.getSeconds()/60,d=peek(dk);
  const list=state.tasks.filter(t=>t.days.includes(wd)&&!d.skip[t.id]).sort(byTime);
  const span=t=>t.end>t.start?t.end-t.start:5;
  const run=list.filter(t=>m>=t.start&&m<t.start+span(t));
  const cur=run.length?run[run.length-1]:null;
  const next=list.find(t=>t.start>m)||null;
  return {dk,m,d,list,cur,next,span};
}
const leftTxt=min=>{ min=Math.ceil(min); return min<=0?'Ending now':fmtDur(min)+' left'; };
function refreshAll(){ render(); pipRender(); updateOngoing(); }
function widgetCard(where){
  const I=nowInfo(),cur=I.cur,next=I.next,m=I.m,d=I.d;
  const done=!!(cur&&d.done[cur.id]);
  const kids=[h('div',{class:'wgt-top'},
    cur?h('span',{class:'chip '+(done?'good':'now')},done?'Done':'Now'):h('span',{class:'chip'},'Free'),
    h('span',{class:'wgt-clock'},fmt(Math.floor(m))))];
  if(cur){
    const total=I.span(cur),pct=Math.max(0,Math.min(1,(m-cur.start)/total)),pc=Math.round(pct*100);
    kids.push(h('h2',{class:'wgt-title'},cur.title),
      h('p',{class:'wgt-time'},cur.end>cur.start?fmt(cur.start)+' – '+fmt(cur.end):'At '+fmt(cur.start)),
      h('div',{class:'prog',role:'progressbar','aria-label':'Time used','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(pc)},h('span',{style:'width:'+pc+'%'})),
      h('p',{class:'wgt-left'},leftTxt(cur.start+total-m)));
    if(next) kids.push(h('p',{class:'wgt-next'},'Next · ',h('b',null,next.title),' · '+fmt(next.start)+' · in '+fmtDur(Math.ceil(next.start-m))));
  }else if(next){
    kids.push(h('h2',{class:'wgt-title'},'Free time'),
      h('p',{class:'wgt-time'},'Next in '+fmtDur(Math.ceil(next.start-m))),
      h('p',{class:'wgt-next'},'Next · ',h('b',null,next.title),' · '+fmt(next.start)));
  }else if(I.list.length){
    const dn=I.list.filter(t=>I.d.done[t.id]).length;
    kids.push(h('h2',{class:'wgt-title'},'All done for today'),h('p',{class:'wgt-time'},dn+' of '+I.list.length+' tasks ticked off'));
  }else{
    kids.push(h('h2',{class:'wgt-title'},'Nothing scheduled today'),h('p',{class:'wgt-time'},'Add tasks or pick days in the Week view.'));
  }
  const acts=[];
  if(cur) acts.push(h('button',{type:'button',class:'btn small'+(done?'':' primary'),onclick:()=>{const r=rec(I.dk);r.done[cur.id]=!r.done[cur.id];save();refreshAll();}},done?'Undo done':'Mark done'));
  if(where==='pip') acts.push(h('button',{type:'button',class:'btn small',onclick:()=>{ try{window.focus();}catch(e){} if(pipWin) pipWin.close(); }},'Open planner'));
  if(where==='mini') acts.push(h('button',{type:'button',class:'btn small',onclick:()=>{ MINI=false; ui.view='day'; try{history.replaceState(null,'',location.pathname+location.search);}catch(e){} render(); }},'Open planner'));
  if(acts.length) kids.push(h('div',{class:'wgt-acts'},acts));
  return h('div',{class:'wgt'+(cur?' k-'+cur.kind:'')},kids);
}
function widgetView(){
  return h('div',{class:'wview'},
    MINI?null:h('div',{class:'mh'},
      h('div',null,h('h1',null,'Now'),h('p',{class:'sub'},'What you should be doing right now.')),
      h('button',{type:'button',class:'btn small',onclick:openMini},'Mini window')),
    widgetCard(MINI?'mini':'tab'));
}
function copyStyles(doc){
  for(const sheet of document.styleSheets){
    try{
      const st=doc.createElement('style');
      st.textContent=[...sheet.cssRules].map(r=>r.cssText).join('\n');
      doc.head.append(st);
    }catch(e){
      if(sheet.href){ const l=doc.createElement('link'); l.rel='stylesheet'; l.href=sheet.href; doc.head.append(l); }
    }
  }
}
function pipRender(){ if(pipWin&&!pipWin.closed&&pipRoot) pipRoot.replaceChildren(widgetCard('pip')); }
async function openMini(){
  if(pipWin&&!pipWin.closed){ try{pipWin.focus();}catch(e){} return; }
  if('documentPictureInPicture' in window){
    try{
      const w=await window.documentPictureInPicture.requestWindow({width:340,height:250});
      copyStyles(w.document);
      const th=document.documentElement.getAttribute('data-theme');
      if(th) w.document.documentElement.setAttribute('data-theme',th);
      w.document.body.className='is-pip';
      pipRoot=w.document.createElement('div'); w.document.body.append(pipRoot);
      pipWin=w;
      w.addEventListener('pagehide',()=>{ pipWin=null; pipRoot=null; });
      w.setInterval(pipRender,5000);
      pipRender();
      return;
    }catch(e){}
  }
  let pop=null;
  try{ pop=window.open(location.pathname+'#widget','daybreak-mini','popup=yes,width=360,height=270'); }catch(e){}
  if(!pop){ ui.view='widget'; render(); toast('This browser cannot float a window here, so the Now view is shown instead.'); }
}

/* current task as a silent notification: the closest thing to a phone widget */
async function clearOngoing(){
  lastOngoing='';
  try{
    const reg=('serviceWorker' in navigator)?await navigator.serviceWorker.getRegistration():null;
    if(reg){ (await reg.getNotifications({tag:'daybreak-now'})).forEach(n=>n.close()); }
  }catch(e){}
}
async function updateOngoing(){
  const R=state.remind;
  if(MINI||!R.ongoing||!('Notification' in window)||Notification.permission!=='granted') return;
  const I=nowInfo(),cur=I.cur;
  const key=cur?cur.id+':'+Math.ceil((I.span(cur)-(I.m-cur.start))/5):'none';
  if(key===lastOngoing) return;
  lastOngoing=key;
  try{
    const reg=('serviceWorker' in navigator)?await navigator.serviceWorker.getRegistration():null;
    if(!reg) return;
    if(!cur){ (await reg.getNotifications({tag:'daybreak-now'})).forEach(n=>n.close()); return; }
    const nx=I.next;
    await reg.showNotification('Now: '+cur.title,{
      body:(cur.end>cur.start?fmt(cur.start)+' – '+fmt(cur.end)+' · ':'')+leftTxt(cur.start+I.span(cur)-I.m)+(nx?' · Next: '+nx.title+' '+fmt(nx.start):''),
      tag:'daybreak-now',silent:true,requireInteraction:true,renotify:false,icon:'icons/icon-192.png',badge:'icons/icon-192.png'});
  }catch(e){}
}
async function toggleOngoing(){
  const R=state.remind;
  if(R.ongoing){ R.ongoing=false; save(); await clearOngoing(); render(); return; }
  R.ongoing=await askPermission(); ui.sysTried=true; save(); lastOngoing=''; render(); updateOngoing();
}

/* ---------- add-panel collapse (desktop) ---------- */
const CHEV_L='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3L5.5 8l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV_R='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function applySide(){
  const b=$('#sideToggle'),open=ui.sideOpen,label=open?'Hide the add panel':'Show the add panel';
  $('#shell').classList.toggle('collapsed',!open);
  b.replaceChildren(ico(open?CHEV_L:CHEV_R));
  b.setAttribute('aria-expanded',String(open)); b.setAttribute('aria-label',label); b.title=label;
}
$('#sideToggle').addEventListener('click',()=>{
  ui.sideOpen=!ui.sideOpen;
  try{ localStorage.setItem(SIDE_KEY,ui.sideOpen?'1':'0'); }catch(e){}
  applySide();
});

/* ---------- PWA: install + offline ---------- */
let deferredInstall=null;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const canUseSW=()=>'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredInstall=e; if(effView()==='alerts') render(); });
window.addEventListener('appinstalled',()=>{ deferredInstall=null; if(effView()==='alerts') render(); });
async function installApp(){
  if(!deferredInstall) return;
  try{ deferredInstall.prompt(); await deferredInstall.userChoice; }catch(e){}
  deferredInstall=null; render();
}
if(canUseSW()){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
    navigator.serviceWorker.ready.then(()=>{ ui.offlineReady=true; if(effView()==='alerts') render(); }).catch(()=>{});
  });
}
function installSub(){
  if(isStandalone()) return 'Installed. You are using the app.';
  if(deferredInstall) return 'Add Daybreak to your home screen or desktop.';
  if(isIOS()) return 'In Safari, tap Share, then Add to Home Screen.';
  if(!canUseSW()) return 'Open this app over https (or on localhost) to install it.';
  return 'Use your browser menu: Install app, or Add to Home screen.';
}
function sw(on,label,fn,disabled){
  return h('button',{type:'button',class:'switch',role:'switch','aria-checked':String(!!on),'aria-label':label,disabled:disabled||null,onclick:fn});
}
function srow(title,sub,control){
  return h('div',{class:'srow'},h('div',{class:'st'},h('b',null,title),sub?h('small',null,sub):null),control);
}
function alertsView(){
  const R=state.remind;
  const nd=new Date(),wd=nd.getDay(),now=nd.getHours()*60+nd.getMinutes(),d=peek(dkey(nd));
  const up=state.tasks.filter(t=>t.notify!==false&&t.days.includes(wd)&&!d.skip[t.id]&&!d.done[t.id]&&t.start>now).sort(byTime).slice(0,6);
  const awakeSub=ui.awakeFail?'Not allowed in this view.':(R.awake?'On. The screen stays lit while this page is visible.':'Off.');
  return h('div',{class:'stack'},
    h('div',{class:'mh'},h('div',null,h('h1',null,'Alerts'),
      h('p',{class:'sub'},'Reminders appear on this page when a task is about to start.'))),
    h('div',{class:'panel set'},
      srow('Reminders','Turn all reminders on or off.',sw(R.on,'Reminders',()=>{R.on=!R.on;save();render();})),
      srow('Remind me','How early to warn you.',
        h('select',{class:'inp','aria-label':'How early to remind',onchange:e=>{R.lead=+e.target.value;save();render();}},
          LEADS.map(l=>h('option',{value:String(l),selected:l===R.lead},l===0?'At start':l+' min before')))),
      srow('Sound','A two-tone chime. It plays once you have tapped anywhere on the page.',sw(R.sound,'Sound',()=>{R.sound=!R.sound;save();render();})),
      srow('System notifications',sysStatus(),sw(R.system,'System notifications',toggleSystem)),
      srow('Keep screen awake',awakeSub,sw(R.awake,'Keep screen awake',()=>setAwake(!R.awake))),
      srow('Try it','See how a reminder looks and sounds.',
        h('button',{type:'button',class:'btn small',onclick:()=>{unlockAudio();notify('Starts in '+(R.lead||1)+' min','Math (Olympiad) · 4:30 AM – 6:00 AM (test)');}},'Send a test'))),
    h('div',{class:'panel set'},
      srow('Current task in notifications',R.ongoing?'On. Updates every few minutes while the app is running.':'Keeps a silent notification showing what you should be doing now. The closest thing to a widget on a phone.',sw(R.ongoing,'Current task in notifications',toggleOngoing)),
      srow('Mini window','A small floating window that stays on top and shows the current task.',h('button',{type:'button',class:'btn small',onclick:openMini},'Open'))),
    h('div',{class:'panel set'},
      srow('Install as an app',installSub(),deferredInstall&&!isStandalone()?h('button',{type:'button',class:'btn small primary',onclick:installApp},'Install'):null),
      srow('Works offline',ui.offlineReady?'Ready. The planner opens without a connection.':(canUseSW()?'Getting ready. Keep this page open for a moment.':'Needs https or localhost.'),null)),
    h('p',{class:'callout warn'},'A web page cannot notify you after it is closed. Keep this page open, for example in a pinned tab, and reminders will fire on time. For a phone that is locked, also set an alarm for the tasks that matter most.'),
    h('div',{class:'panel'},h('h3',{class:'panel-h'},'Coming up today'),
      up.length?h('ul',{class:'upnext'},up.map(t=>h('li',null,h('span',null,t.title),h('span',{class:'ut'},R.on?'Reminder '+fmt(t.start-R.lead):'Starts '+fmt(t.start)))))
        :h('p',{class:'hint'},'No more reminders for today.')));
}

/* ---------- render ---------- */
const TABS=[['add','Add'],['day','Day'],['widget','Now'],['week','Week'],['tasks','Tasks'],['alerts','Alerts']];
function render(){
  const cur=effView();
  $('#tabs').replaceChildren(...TABS.map(([id,label])=>h('button',{type:'button',class:'tab tab-'+id,role:'tab','aria-selected':String(cur===id),onclick:()=>{ui.view=id;render();}},label)));
  $('#shell').dataset.view=ui.view;
  document.body.classList.toggle('is-widget',MINI&&cur==='widget');
  $('#main').replaceChildren(cur==='week'?weekView():cur==='tasks'?tasksView():cur==='alerts'?alertsView():cur==='widget'?widgetView():dayView());
  if(ui.refocus){ const el=document.getElementById(ui.refocus); if(el) el.focus(); ui.refocus=null; }
}
mq.addEventListener('change',render);
setInterval(()=>{
  const a=document.activeElement;
  if(effView()==='day'&&!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) render();
},60000);

ta.value=state.summary;
renderAddDays(); renderPreview(); render();
applySide();
checkReminders();
setInterval(checkReminders,15000);
if(state.remind.awake) setAwake(true);
updateOngoing();
setInterval(updateOngoing,30000);
setInterval(()=>{ if(effView()==='widget') render(); pipRender(); },10000);
window.addEventListener('hashchange',()=>{ const hv=location.hash.slice(1); if(VIEWS.includes(hv)){ ui.view=hv; render(); } });
// Another window (for example the mini window) saved a change: pick it up.
window.addEventListener('storage',e=>{
  if(e.key!==KEY) return;
  const s=load(); if(!s) return;
  state=s; normalize(); render(); pipRender();
});
})();
