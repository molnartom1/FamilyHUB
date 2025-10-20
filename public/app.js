(function(){
  function showOverlay(msg){
    var o=document.getElementById('fatal');
    if(!o){o=document.createElement('div');o.id='fatal';o.style.cssText='position:fixed;inset:0;background:rgba(10,0,25,.9);color:#fff;z-index:99999;padding:20px;overflow:auto;font:14px/1.4 system-ui';document.body.appendChild(o);}
    o.innerHTML='<h2>Hiba</h2><pre style="white-space:pre-wrap">'+msg+'</pre><button onclick="this.parentNode.remove()" style="margin-top:10px;padding:8px 12px;border-radius:8px;border:1px solid #34568a;background:#152039;color:#fff">Bezár</button>';
  }
  addEventListener('error', e=>showOverlay(e.message+'\n'+(e.filename||'')+':'+(e.lineno||'')));
  addEventListener('unhandledrejection', e=>showOverlay('Unhandled: '+(e.reason&&e.reason.stack||e.reason||'ismeretlen')));
  window.__FHUB_DEBUG_OVERLAY__=showOverlay;
})();

const API = {
  async createFamily(){ const r=await fetch('/api/family',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Család'})}); return r.json(); },
  async joinByCode(code){ const r=await fetch('/api/family',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({joinCode:code})}); return r.json(); },
  async pull(fid){ const r=await fetch('/api/state?familyId='+encodeURIComponent(fid)); return r.json(); },
  async upsert(item){ await fetch('/api/upsert',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(item)}); }
};

var App=(function(){
  var state={ family:{id:'family-001',name:'Család',members:[{id:'m1',name:'Anya',emoji:'👩',color:'#ff5d6c'},{id:'m2',name:'Apa',emoji:'👨',color:'#4cc9f0'}]},
    tasks:[],shopping:[],wall:[],events:[],monthOffset:0,familyId:null,joinCode:null };
  function $(s){return document.querySelector(s)}; function el(t,a,c){a=a||{};c=c||[];var n=document.createElement(t);Object.keys(a).forEach(k=>{var v=a[k]; if(k==='class')n.className=v; else if(k==='html')n.innerHTML=v; else if(k.indexOf('on')===0)n.addEventListener(k.slice(2),v); else n.setAttribute(k,v);}); c.forEach(x=>n.append(x)); return n;}
  function id(p){return(p||'id')+Math.random().toString(36).slice(2,9)}; function toast(m){var t=$('#toast'); if(!t)return; t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),2400);}
  function save(){try{localStorage.setItem('familyhub.data',JSON.stringify(state));}catch(e){}}
  function load(){try{var raw=localStorage.getItem('familyhub.data'); if(raw){Object.assign(state,JSON.parse(raw));}}catch(e){}}
  function updateNet(){var b=$('#netBadge'); if(!b)return; if(navigator.onLine){b.textContent='online';b.classList.add('online');b.classList.remove('offline');}else{b.textContent='offline';b.classList.add('offline');b.classList.remove('online');}}
  addEventListener('online',updateNet); addEventListener('offline',updateNet);
  async function ensureNotifications(){ if(!('Notification' in window)){toast('Nincs értesítés támogatás.');return false;} try{ if(Notification.permission==='granted')return true; const p=await Notification.requestPermission(); return p==='granted'; }catch(_){return false;}}
  function notifyLocal(t,b){try{if('Notification'in window&&Notification.permission==='granted')new Notification(t,{body:b});}catch(_){ } toast(b); try{ if(navigator.serviceWorker&&navigator.serviceWorker.controller){ navigator.serviceWorker.controller.postMessage({type:'notify',title:t,body:b}); } }catch(_){ }}

  var tabs=[{id:'dashboard',name:'Irányítópult'},{id:'calendar',name:'Naptár'},{id:'tasks',name:'Teendők'},{id:'shopping',name:'Bevásárló'},{id:'wall',name:'Üzenőfal'},{id:'settings',name:'Beállítások'}];
  function renderTabs(a){a=a||'dashboard'; var w=$('#tabs'); w.innerHTML=''; tabs.forEach(t=>w.append(el('button',{class:'tab'+(t.id===a?' active':''),onclick:()=>switchView(t.id)},[t.name])));}
  function switchView(v){document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden')); $('#view-'+v).classList.remove('hidden'); renderTabs(v); ({dashboard:renderDashboard,calendar:renderCalendar,tasks:renderTasks,shopping:renderShopping,wall:renderWall,settings:renderSettings}[v]||function(){})();}

  function bindPickers(){ ['evtDate','evtStart','evtEnd'].forEach(function(id){
    var inp=document.getElementById(id); if(!inp) return;
    function open(){ try{ if(typeof inp.showPicker==='function') inp.showPicker(); else inp.focus({preventScroll:true}); }catch(_){ inp.focus(); } }
    var lab=inp.closest('div') && inp.closest('div').querySelector('label');
    if(lab){ lab.addEventListener('click',function(e){e.preventDefault(); open();}); lab.addEventListener('touchend',function(e){e.preventDefault(); open();},{passive:true});}
    inp.addEventListener('touchend',function(){ if(document.activeElement!==inp) open(); },{passive:true});
  });}

  function memberPill(mid){var m=state.family.members.find(x=>x.id===mid); return m? '<span class="tag" style="border-color:'+m.color+';">'+(m.emoji||'👤')+' '+m.name+'</span>':'<span class="tag">Ismeretlen</span>';}

  function renderDashboard(){
    var root=$('#view-dashboard'); root.innerHTML=$('#tpl-dashboard').innerHTML;
    var open=state.tasks.filter(t=>!t.done).slice(0,5), list=el('div',{class:'list'});
    open.forEach(t=>{ var it=el('div',{class:'item'}); var chk=el('input',{type:'checkbox',onchange:()=>{t.done=true; save(); renderDashboard(); notifyLocal('Teendő kész',t.title); upsertToServer({type:'task',...t});}}); var meta=el('div',{},[el('div',{html:'<strong>'+t.title+'</strong>'}), el('div',{class:'muted',html:memberPill(t.assignee)+' • '+new Date(t.created).toLocaleString()})]); it.append(chk,meta); list.append(it); });
    var now=new Date(), in7=new Date(now.getTime()+7*86400000);
    var upcoming=state.events.filter(e=> new Date(e.start)<=in7 && new Date(e.end||e.start)>=now).sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,5);
    var elv=el('div',{class:'list'}); upcoming.forEach(e=>{ var it=el('div',{class:'item'}); it.append(el('div',{class:'tag',html:new Date(e.start).toLocaleString()}), el('div',{html:'<strong>'+e.title+'</strong> <span class="muted">'+(e.note? '• '+e.note:'')+'</span>'})); elv.append(it);});
    var de=$('#dash-events'); if(de) de.replaceWith(elv); var dt=$('#dash-tasks'); if(dt) dt.replaceWith(list);
    $('#addTaskBtn').onclick=()=>{var v=$('#newTaskTitle').value.trim(); if(!v) return; var a=state.family.members[0]&&state.family.members[0].id; var task={id:id('t'), title:v, assignee:a, done:false, created:Date.now()}; state.tasks.unshift(task); save(); renderDashboard(); notifyLocal('Új teendő',v); upsertToServer({type:'task', familyId:state.familyId, ...task}); $('#newTaskTitle').value=''; };
    $('#addEvtBtn').onclick=()=>{var title=$('#evtTitle').value.trim(); var date=$('#evtDate').value; var s=$('#evtStart').value; var e=$('#evtEnd').value; var note=$('#evtNote').value.trim(); if(!title||!date){ toast('Cím és dátum kötelező'); return; } var start=new Date(date+'T'+(s||'09:00')+':00'); var end=new Date(date+'T'+(e||s||'10:00')+':00'); var evt={ id:id('e'), title, start, end, note }; state.events.push(evt); save(); renderDashboard(); notifyLocal('Új esemény', title+' • '+start.toLocaleString()); upsertToServer({ type:'event', familyId:state.familyId, id:evt.id, title:evt.title, start:evt.start.toISOString(), end:evt.end?evt.end.toISOString():undefined, note:evt.note, updatedAt:new Date().toISOString() }); $('#evtTitle').value=''; $('#evtNote').value=''; };
    bindPickers();
  }

  function monthStart(o){var d=new Date(); d.setDate(1); d.setMonth(d.getMonth()+o); return d;}
  function daysInMonth(d){return new Date(d.getFullYear(),d.getMonth()+1,0).getDate();}
  function renderCalendar(){
    var root=$('#view-calendar'); root.innerHTML=$('#tpl-calendar').innerHTML;
    var base=monthStart(state.monthOffset), y=base.getFullYear(), m=base.getMonth();
    $('#monthLabel').textContent=base.toLocaleString('hu-HU',{month:'long',year:'numeric'});
    var grid=$('#calGrid'); grid.innerHTML=''; var first=(new Date(y,m,1).getDay()||7)-1; for(var i=0;i<first;i++) grid.append(el('div',{class:'cal-cell muted'}));
    var days=daysInMonth(base); for(var d=1; d<=days; d++){ var cell=el('div',{class:'cal-cell'}), date=new Date(y,m,d); cell.append(el('div',{class:'d',html:date.toLocaleDateString('hu-HU',{weekday:'short'})+' • '+d})); var todays=state.events.filter(e=> new Date(e.start).toDateString()===date.toDateString()); todays.forEach(ev=>{ cell.append(el('div',{class:'cal-evt', html:'<strong>'+ev.title+'</strong><br/><span class="muted">'+new Date(ev.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})+(ev.end?'–'+new Date(ev.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}):'')+'</span>'})); }); grid.append(cell); }
    $('#prevMonth').onclick=()=>{state.monthOffset--; renderCalendar();}; $('#nextMonth').onclick=()=>{state.monthOffset++; renderCalendar();};
    $('#icsExport').onclick=exportICS; $('#icsImportFile').addEventListener('change', importICS);
  }

  function exportICS(){ var lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FamilyHub//HU//']; state.events.forEach(e=>{ lines.push('BEGIN:VEVENT'); lines.push('UID:'+e.id+'@familyhub'); var dt=d=> new Date(d).toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}Z/,'Z'); lines.push('DTSTART:'+dt(e.start)); if(e.end) lines.push('DTEND:'+dt(e.end)); lines.push('SUMMARY:'+(e.title||'')); if(e.note) lines.push('DESCRIPTION:'+(e.note)); lines.push('END:VEVENT'); }); lines.push('END:VCALENDAR'); var blob=new Blob([lines.join('\\n')],{type:'text/calendar'}); el('a',{href:URL.createObjectURL(blob),download:'familyhub.ics'}).click(); }
  function importICS(ev){ var f=ev.target.files[0]; if(!f) return; f.text().then(text=>{ var items=[], cur=null; text.split(/\\r?\\n/).forEach(line=>{ if(line==='BEGIN:VEVENT'){cur={};} else if(line==='END:VEVENT'){ if(cur&&cur.title&&cur.start) items.push(cur); cur=null;} else if(cur){ if(line.indexOf('SUMMARY:')===0) cur.title=line.slice(8); else if(line.indexOf('DTSTART:')===0) cur.start=icsToDate(line.slice(8)); else if(line.indexOf('DTEND:')===0) cur.end=icsToDate(line.slice(6)); else if(line.indexOf('DESCRIPTION:')===0) cur.note=line.slice(12);} }); items.forEach(e=>{ var evt={id:id('e'), title:e.title, start:e.start, end:e.end, note:e.note}; state.events.push(evt); upsertToServer({type:'event', familyId:state.familyId, id:evt.id, title:evt.title, start:new Date(evt.start).toISOString(), end:evt.end?new Date(evt.end).toISOString():undefined, note:evt.note}); }); save(); renderCalendar(); toast('ICS import kész: '+items.length+' esemény'); ev.target.value=''; }); function icsToDate(s){ var m=/^(\\d{4})(\\d{2})(\\d{2})T(\\d{2})(\\d{2})(\\d{2})Z$/.exec(s); return m? new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6])):new Date(s); } }

  function renderTasks(){ var root=$('#view-tasks'); root.innerHTML=$('#tpl-tasks').innerHTML; var sel=$('#taskAssignee'); sel.innerHTML=''; state.family.members.forEach(m=> sel.append(el('option',{value:m.id},[m.name]))); function draw(){ var filter=$('#taskFilter').value; var wrap=$('#taskList'); wrap.innerHTML=''; state.tasks.filter(t=> filter==='all'||(filter==='open'&&!t.done)||(filter==='done'&&t.done)).forEach(t=>{ var it=el('div',{class:'item'}); var chk=el('input',{type:'checkbox'}); chk.checked=t.done; chk.onchange=()=>{t.done=chk.checked; save(); draw(); upsertToServer({type:'task', familyId:state.familyId, ...t});}; var meta=el('div',{},[el('div',{html:'<strong>'+t.title+'</strong> '+memberPill(t.assignee)}), el('div',{class:'muted',html:new Date(t.created).toLocaleString()})]); var del=el('button',{onclick:()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id); save(); draw(); upsertToServer({type:'task', familyId:state.familyId, ...t, deleted:true});}},['Törlés']); it.append(chk,meta,del); wrap.append(it); }); } draw(); $('#taskAdd').onclick=()=>{ var title=$('#taskTitle').value.trim(); if(!title) return; var a=$('#taskAssignee').value; var t={id:id('t'), title:title, assignee:a, done:false, created:Date.now()}; state.tasks.unshift(t); save(); draw(); toast('Új teendő: '+title); upsertToServer({type:'task', familyId:state.familyId, ...t}); $('#taskTitle').value=''; }; $('#taskFilter').onchange=draw; $('#clearDone').onclick=()=>{state.tasks=state.tasks.filter(t=>!t.done); save(); draw();}; }

  function renderShopping(){ var root=$('#view-shopping'); root.innerHTML=$('#tpl-shopping').innerHTML; function draw(){ var wrap=$('#shopList'); wrap.innerHTML=''; state.shopping.forEach(itm=>{ var it=el('div',{class:'item'}); var chk=el('input',{type:'checkbox'}); chk.checked=!!itm.bought; chk.onchange=()=>{ itm.bought=chk.checked; save(); draw(); upsertToServer({type:'shopping', familyId:state.familyId, ...itm}); }; var meta=el('div',{},[el('div',{html:'<strong>'+itm.title+'</strong> <span class="muted">'+(itm.qty||'')+' '+(itm.cat? '• '+itm.cat:'')+'</span>'}), el('div',{class:'muted',html:new Date(itm.created).toLocaleString()})]); var del=el('button',{onclick=()=>{ state.shopping=state.shopping.filter(x=>x.id!==itm.id); save(); draw(); upsertToServer({type:'shopping', familyId:state.familyId, ...itm, deleted:true}); }},['Törlés']); it.append(chk,meta,del); wrap.append(it); }); } draw(); $('#shopAdd').onclick=()=>{ var title=$('#shopTitle').value.trim(); if(!title) return; var qty=$('#shopQty').value.trim(); var cat=$('#shopCat').value; var by=state.family.members[0]&&state.family.members[0].id; var itm={id:id('s'), title, qty, cat, by, created:Date.now()}; state.shopping.unshift(itm); save(); draw(); toast('Bevásárlólista: '+title+(qty?' × '+qty:'')); upsertToServer({type:'shopping', familyId:state.familyId, ...itm}); $('#shopTitle').value=''; $('#shopQty').value=''; }; $('#shopClearBought').onclick=()=>{ state.shopping=state.shopping.filter(i=>!i.bought); save(); draw(); }; }

  function renderWall(){ var root=$('#view-wall'); root.innerHTML=$('#tpl-wall').innerHTML; function draw(){ var wrap=$('#wallFeed'); wrap.innerHTML=''; state.wall.slice(0,100).forEach(w=>{ var it=el('div',{class:'item'}); it.append(el('div',{class:'avatar',style:'background:#334'}), el('div',{},[ el('div',{html:'<strong>'+(w.by||'tag')+'</strong> <span class="muted">'+new Date(w.at).toLocaleString()+'</span>'}), el('div',{html:w.text}) ])); wrap.append(it); }); } draw(); $('#wallSend').onclick=()=>{ var text=$('#wallMsg').value.trim(); if(!text) return; var msg={id:id('w'), text, by:'tag', at:Date.now()}; state.wall.unshift(msg); save(); draw(); toast('Új üzenet: '+text); upsertToServer({type:'wall', familyId:state.familyId, ...msg}); $('#wallMsg').value=''; }; }

  function renderSettings(){ var root=$('#view-settings'); root.innerHTML=$('#tpl-settings').innerHTML; $('#familyName').value=state.family.name||''; $('#familyName').oninput=e=>{ state.family.name=e.target.value; $('#familyNameLabel').textContent=state.family.name||'Család'; save(); }; $('#btnTestSW').onclick=testSW; $('#btnSelfTestICS').onclick=selfTestICS; $('#btnUnregSW').onclick=unregisterAllSW; $('#btnClearCaches').onclick=clearAllCaches; $('#btnFactoryReset').onclick=()=>{ unregisterAllSW().then(()=>clearAllCaches()).then(()=>{ localStorage.removeItem('familyhub.data'); toast('Gyári visszaállítás kész. Frissítés…'); setTimeout(()=>location.reload(),600); }); }; $('#btnJoinCode').onclick=async()=>{ var code=$('#joinCode').value.trim(); if(!code) return; try{ var data=await API.joinByCode(code); state.familyId=data.id; state.joinCode=code; localStorage.setItem('family_id',data.id); localStorage.setItem('join_code',code); await pullAllFromServer(); toast('Csatlakozva'); renderTabs('dashboard'); switchView('dashboard'); }catch(_){ toast('Join kód hiba'); } }; }

  function testSW(){ if(!('serviceWorker'in navigator)){toast('Nincs SW támogatás.'); return;} navigator.serviceWorker.getRegistrations().then(regs=>{ if(!regs.length){ toast('Nem található SW regisztráció.'); return;} toast('SW scope: '+regs.map(r=>r.scope).join(', ')); }); }
  function unregisterAllSW(){ if(!('serviceWorker'in navigator)) return Promise.resolve(); return navigator.serviceWorker.getRegistrations().then(regs=>Promise.all(regs.map(r=>r.unregister()))).then(()=>toast('SW eltávolítva')); }
  function clearAllCaches(){ return caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>toast('Cache ürítve')); }
  function selfTestICS(){ var tmp={ id:id('e'), title:'[TESZT] ICS', start:new Date(), end:new Date(Date.now()+3600000), note:'diag' }; var lines=['BEGIN:VEVENT','UID:'+tmp.id,'DTSTART:'+tmp.start.toISOString(),'DTEND:'+tmp.end.toISOString(),'SUMMARY:'+tmp.title,'DESCRIPTION:'+tmp.note,'END:VEVENT']; var ok=lines.join('\\n').includes('DTSTART:'); toast(ok?'ICS ön-teszt: OK':'ICS ön-teszt: HIBA'); }

  var deferred=null; addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferred=e; var b=$('#installBtn'); if(b) b.disabled=false; });
  function bindHeader(){ var b=$('#installBtn'); if(b) b.onclick=()=>{ if(!deferred){ toast('Már telepítve lehet vagy még nem elérhető.'); return;} deferred.prompt(); }; var n=$('#notifBtn'); if(n) n.onclick=ensureNotifications; var ex=$('#exportBtn'); if(ex) ex.onclick=exportAll; $('#familyNameLabel').textContent=state.family.name||'Család'; updateNet(); }
  function exportAll(){ var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); el('a',{href:URL.createObjectURL(blob),download:'FamilyHub_backup_'+new Date().toISOString().slice(0,10)+'.json'}).click(); }

  function connectRealtime(fid){ const proto=location.protocol==='https:'?'wss':'ws'; const url=`${proto}://${location.host}/ws?familyId=${encodeURIComponent(fid)}`; const ws=new WebSocket(url);
    ws.onmessage=ev=>{ try{ const msg=JSON.parse(ev.data); if(msg.type==='upsert'&&msg.item){ const it=msg.item; if(it.type==='event'){ const i=state.events.findIndex(x=>x.id===it.id); it.start=new Date(it.start); if(it.end) it.end=new Date(it.end); if(i>=0) state.events[i]={...state.events[i],...it}; else state.events.unshift(it); save(); } else if(it.type==='task'){ const i=state.tasks.findIndex(x=>x.id===it.id); if(i>=0) state.tasks[i]={...state.tasks[i],...it}; else state.tasks.unshift(it); save(); } else if(it.type==='shopping'){ const i=state.shopping.findIndex(x=>x.id===it.id); if(i>=0) state.shopping[i]={...state.shopping[i],...it}; else state.shopping.unshift(it); save(); } else if(it.type==='wall'){ const i=state.wall.findIndex(x=>x.id===it.id); if(i>=0) state.wall[i]={...state.wall[i],...it}; else state.wall.unshift(it); save(); } } }catch(_){ } }; ws.onclose=()=>setTimeout(()=>connectRealtime(fid),2000); }

  async function ensureFamily(){ var fam=localStorage.getItem('family_id'); var code=localStorage.getItem('join_code'); if(fam){ state.familyId=fam; state.joinCode=code||null; return;} var created=await API.createFamily(); state.familyId=created.id; state.joinCode=created.joinCode; localStorage.setItem('family_id',state.familyId); localStorage.setItem('join_code',state.joinCode); toast('Join kód: '+state.joinCode); }
  async function pullAllFromServer(){ if(!state.familyId) return; const data=await API.pull(state.familyId); state.events=(data.events||[]).map(e=>({...e,start:new Date(e.start), end:e.end?new Date(e.end):undefined})); state.tasks=data.tasks||[]; state.shopping=data.shopping||[]; state.wall=data.wall||[]; save(); }
  async function upsertToServer(item){ if(!state.familyId) return; const payload={ familyId:state.familyId, updatedAt:new Date().toISOString(), ...item }; await API.upsert(payload); }
  function registerSW(){ if(!('serviceWorker'in navigator)) return; navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(r=>console.log('SW OK',r.scope)).catch(err=>console.error('SW err',err)); }

  async function init(){ load(); await ensureFamily(); await pullAllFromServer(); connectRealtime(state.familyId); bindHeader(); renderTabs('dashboard'); switchView('dashboard'); registerSW(); }
  return { init };
})();

document.addEventListener('DOMContentLoaded', ()=>{ try{ App.init(); }catch(e){ console.error(e); window.__FHUB_DEBUG_OVERLAY__ && window.__FHUB_DEBUG_OVERLAY__(e.stack||e.message); } });
