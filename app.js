// --- Hiba-overlay ---
(function(){
  function showOverlay(msg){
    var o=document.getElementById('fatal');
    if(!o){o=document.createElement('div');o.id='fatal';o.style.cssText='position:fixed;inset:0;background:rgba(10,0,25,.9);color:#fff;z-index:99999;padding:20px;overflow:auto;font:14px/1.4 system-ui';document.body.appendChild(o);}
    o.innerHTML='<h2>Hiba a betöltéskor</h2><pre style="white-space:pre-wrap">'+msg+'</pre><button onclick="this.parentNode.remove()" style="margin-top:10px;padding:8px 12px;border-radius:8px;border:1px solid #34568a;background:#152039;color:#fff">Bezár</button>';
  }
  window.addEventListener('error', function(e){ showOverlay(e.message+'\n'+(e.filename||'')+':'+(e.lineno||'')); });
  window.addEventListener('unhandledrejection', function(e){ showOverlay('Unhandled: '+ (e.reason&&e.reason.stack||e.reason||'ismeretlen')); });
  window.__FHUB_DEBUG_OVERLAY__=showOverlay;
})();

var App = (function(){
  var state = {
    family: { id:'family-001', name:'Család', members:[
      { id:'m1', name:'Anya', emoji:'👩', color:'#ff5d6c' },
      { id:'m2', name:'Apa',  emoji:'👨', color:'#4cc9f0' }
    ]},
    tasks: [], shopping: [], wall: [], events: [], monthOffset: 0
  };

  function $(s){ return document.querySelector(s); }
  function el(tag, attrs, children){ attrs=attrs||{}; children=children||[]; var n=document.createElement(tag);
    Object.keys(attrs).forEach(function(k){ var v=attrs[k]; if(k==='class') n.className=v; else if(k==='html') n.innerHTML=v; else if(k.indexOf('on')===0) n.addEventListener(k.slice(2), v); else n.setAttribute(k,v); });
    children.forEach(function(c){ n.append(c); }); return n; }
  function genId(pfx){ pfx=pfx||'id'; return pfx+Math.random().toString(36).slice(2,9); }
  function toast(msg){ var t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.remove('hidden'); setTimeout(function(){ t.classList.add('hidden'); }, 2400); }
  function save(){ try{ localStorage.setItem('familyhub.data', JSON.stringify(state)); }catch(e){} }
  function load(){ try{ var raw=localStorage.getItem('familyhub.data'); if(raw){ var obj=JSON.parse(raw); Object.assign(state, obj); } }catch(e){ console.warn('Load failed', e); } }

  function updateNet(){ var b=$('#netBadge'); if(!b) return; if(navigator.onLine){ b.textContent='online'; b.classList.add('online'); b.classList.remove('offline'); } else { b.textContent='offline'; b.classList.add('offline'); b.classList.remove('online'); } }
  addEventListener('online', updateNet); addEventListener('offline', updateNet);

  function ensureNotifications(){ if(!('Notification' in window)) { toast('Nincs értesítés támogatás.'); return Promise.resolve(false); } try{ if(Notification.permission==='granted') return Promise.resolve(true); return Notification.requestPermission().then(function(p){ return p==='granted'; }); }catch(e){ return Promise.resolve(false); } }
  function notifyLocal(title, body){ try{ if('Notification' in window && Notification.permission==='granted') new Notification(title, { body: body }); }catch(e){} toast(body); try{ if(navigator.serviceWorker && navigator.serviceWorker.controller){ navigator.serviceWorker.controller.postMessage({type:'notify', title:title, body:body}); } }catch(e){} }

  var tabs=[{id:'dashboard',name:'Irányítópult'},{id:'calendar',name:'Naptár'},{id:'tasks',name:'Teendők'},{id:'shopping',name:'Bevásárló'},{id:'wall',name:'Üzenőfal'},{id:'settings',name:'Beállítások'}];
  function renderTabs(active){ active=active||'dashboard'; var wrap=$('#tabs'); if(!wrap) return; wrap.innerHTML=''; tabs.forEach(function(t){ wrap.append(el('button',{class:'tab'+(t.id===active?' active':''),onclick:function(){switchView(t.id);}},[t.name])); }); }
  function switchView(view){ Array.prototype.forEach.call(document.querySelectorAll('.view'), function(v){ v.classList.add('hidden'); }); var tgt=$('#view-'+view); if(tgt) tgt.classList.remove('hidden'); renderTabs(view); var map={dashboard:renderDashboard,calendar:renderCalendar,tasks:renderTasks,shopping:renderShopping,wall:renderWall,settings:renderSettings}; if(map[view]) map[view](); }

  function memberPill(mid){ var m=state.family.members.find(function(x){return x.id===mid;}); return m? '<span class="tag" style="border-color:'+m.color+';">'+(m.emoji||'👤')+' '+m.name+'</span>':'<span class="tag">Ismeretlen</span>'; }
  function renderDashboard(){ var root=$('#view-dashboard'); if(!root) return; root.innerHTML=$('#tpl-dashboard').innerHTML; var open=state.tasks.filter(function(t){return !t.done;}).slice(0,5); var list=el('div',{class:'list'}); open.forEach(function(t){ var it=el('div',{class:'item'}); var chk=el('input',{type:'checkbox',onchange:function(){t.done=true; save(); renderDashboard(); notifyLocal('Teendő kész',t.title);}}); var meta=el('div',{},[el('div',{html:'<strong>'+t.title+'</strong>'}), el('div',{class:'muted',html:memberPill(t.assignee)+' • '+new Date(t.created).toLocaleString()})]); it.append(chk,meta); list.append(it); }); var anchor=document.getElementById('dash-tasks'); if(anchor) anchor.replaceWith(list);
    var now=new Date(); var in7=new Date(now.getTime()+7*86400000); var up=state.events.filter(function(e){return new Date(e.start)<=in7 && new Date(e.end||e.start)>=now;}).sort(function(a,b){return new Date(a.start)-new Date(b.start);}).slice(0,5); var evWrap=el('div',{class:'list'}); up.forEach(function(e){ var it=el('div',{class:'item'}); it.append(el('div',{class:'tag',html:new Date(e.start).toLocaleString()}), el('div',{html:'<strong>'+e.title+'</strong> <span class="muted">'+(e.note? '• '+e.note:'')+'</span>'})); evWrap.append(it); }); var evAnchor=document.getElementById('dash-events'); if(evAnchor) evAnchor.replaceWith(evWrap);
    document.getElementById('addTaskBtn').onclick=function(){ var v=document.getElementById('newTaskTitle').value.trim(); if(!v) return; var a=state.family.members[0]? state.family.members[0].id : null; state.tasks.unshift({id:genId('t'), title:v, assignee:a, done:false, created:Date.now()}); save(); renderDashboard(); notifyLocal('Új teendő',v); document.getElementById('newTaskTitle').value=''; };
    document.getElementById('addEvtBtn').onclick=function(){ var title=document.getElementById('evtTitle').value.trim(); var date=document.getElementById('evtDate').value; var s=document.getElementById('evtStart').value; var e=document.getElementById('evtEnd').value; var note=document.getElementById('evtNote').value.trim(); if(!title||!date){ toast('Cím és dátum kötelező'); return; } var start=new Date(date+'T'+(s||'09:00')+':00'); var end=new Date(date+'T'+(e||s||'10:00')+':00'); state.events.push({id:genId('e'),title:title,start:start,end:end,note:note}); save(); renderDashboard(); notifyLocal('Új esemény', title+' • '+start.toLocaleString()); document.getElementById('evtTitle').value=''; document.getElementById('evtNote').value=''; };

    // --- Mobil dátum/ idő picker kényszerített megnyitása labelre tap esetén ---
    ['evtDate','evtStart','evtEnd'].forEach(function(id){
      var inp = document.getElementById(id);
      if(!inp) return;
      function openPicker(){
        try { if (typeof inp.showPicker === 'function') { inp.showPicker(); } else { inp.focus({preventScroll:true}); } }
        catch(_) { inp.focus(); }
      }
      var lab = inp.closest('div') && inp.closest('div').querySelector('label');
      if (lab) {
        lab.addEventListener('click', function(e){ e.preventDefault(); openPicker(); });
        lab.addEventListener('touchend', function(e){ e.preventDefault(); openPicker(); }, {passive:true});
      }
      inp.addEventListener('touchend', function(){ if (document.activeElement !== inp) openPicker(); }, {passive:true});
    });
  }

  function monthStart(o){ var d=new Date(); d.setDate(1); d.setMonth(d.getMonth()+o); return d; }
  function daysInMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }
  function renderCalendar(){ var root=$('#view-calendar'); if(!root) return; root.innerHTML=$('#tpl-calendar').innerHTML; var base=monthStart(state.monthOffset); var y=base.getFullYear(), m=base.getMonth(); document.getElementById('monthLabel').textContent=base.toLocaleString('hu-HU',{month:'long',year:'numeric'}); var grid=document.getElementById('calGrid'); grid.innerHTML=''; var first=(new Date(y,m,1).getDay()||7)-1; for(var i=0;i<first;i++) grid.append(el('div',{class:'cal-cell muted'})); var days=daysInMonth(base); for(var d=1; d<=days; d++){ var cell=el('div',{class:'cal-cell'}); var dt=new Date(y,m,d); cell.append(el('div',{class:'d',html:dt.toLocaleDateString('hu-HU',{weekday:'short'})+' • '+d})); var todays=state.events.filter(function(e){return new Date(e.start).toDateString()===dt.toDateString();}); todays.forEach(function(ev){ cell.append(el('div',{class:'cal-evt', html:'<strong>'+ev.title+'</strong><br/><span class="muted">'+new Date(ev.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})+(ev.end?'–'+new Date(ev.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}):'')+'</span>'})); }); grid.append(cell); }
    document.getElementById('prevMonth').onclick=function(){state.monthOffset--; renderCalendar();};
    document.getElementById('nextMonth').onclick=function(){state.monthOffset++; renderCalendar();};
    document.getElementById('icsExport').onclick=exportICS;
    document.getElementById('icsImportFile').addEventListener('change', importICS);
  }

  function exportICS(){ var lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FamilyHub//HU//']; state.events.forEach(function(e){ lines.push('BEGIN:VEVENT'); lines.push('UID:'+e.id+'@familyhub'); var dt=function(d){ return new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z'); }; lines.push('DTSTART:'+dt(e.start)); if(e.end) lines.push('DTEND:'+dt(e.end)); lines.push('SUMMARY:'+(e.title||'')); if(e.note) lines.push('DESCRIPTION:'+(e.note)); lines.push('END:VEVENT'); }); lines.push('END:VCALENDAR'); var blob=new Blob([lines.join('\n')],{type:'text/calendar'}); el('a',{href:URL.createObjectURL(blob),download:'familyhub.ics'}).click(); }
  function importICS(ev){ var f=ev.target.files[0]; if(!f) return; f.text().then(function(text){ var items=[]; var cur=null; text.split(/\r?\n/).forEach(function(line){ if(line==='BEGIN:VEVENT'){ cur={}; } else if(line==='END:VEVENT'){ if(cur&&cur.title&&cur.start) items.push(cur); cur=null; } else if(cur){ if(line.indexOf('SUMMARY:')===0) cur.title=line.slice(8); else if(line.indexOf('DTSTART:')===0) cur.start=icsToDate(line.slice(8)); else if(line.indexOf('DTEND:')===0) cur.end=icsToDate(line.slice(6)); else if(line.indexOf('DESCRIPTION:')===0) cur.note=line.slice(12); } }); items.forEach(function(e){ state.events.push({id:genId('e'), title:e.title, start:e.start, end:e.end, note:e.note}); }); save(); renderCalendar(); notifyLocal('ICS import kész', items.length+' esemény hozzáadva'); ev.target.value=''; });
    function icsToDate(s){ var m=/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s); return m? new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6])):new Date(s); }
  }

  function renderTasks(){ var root=$('#view-tasks'); if(!root) return; root.innerHTML=$('#tpl-tasks').innerHTML; var sel=document.getElementById('taskAssignee'); sel.innerHTML=''; state.family.members.forEach(function(m){ sel.append(el('option',{value:m.id},[m.name])); }); function draw(){ var f=document.getElementById('taskFilter').value; var wrap=document.getElementById('taskList'); wrap.innerHTML=''; state.tasks.filter(function(t){ return f==='all'||(f==='open'&&!t.done)||(f==='done'&&t.done); }).forEach(function(t){ var it=el('div',{class:'item'}); var chk=el('input',{type:'checkbox'}); chk.checked=t.done; chk.onchange=function(){ t.done=chk.checked; save(); draw(); }; var meta=el('div',{},[el('div',{html:'<strong>'+t.title+'</strong> '+memberPill(t.assignee)}), el('div',{class:'muted',html:new Date(t.created).toLocaleString()})]); var del=el('button',{onclick:function(){ state.tasks=state.tasks.filter(function(x){return x.id!==t.id;}); save(); draw(); }},['Törlés']); it.append(chk,meta,del); wrap.append(it); }); } draw(); document.getElementById('taskAdd').onclick=function(){ var title=document.getElementById('taskTitle').value.trim(); if(!title) return; var a=document.getElementById('taskAssignee').value; state.tasks.unshift({id:genId('t'), title:title, assignee:a, done:false, created:Date.now()}); save(); draw(); notifyLocal('Új teendő', title); document.getElementById('taskTitle').value=''; }; document.getElementById('taskFilter').onchange=draw; document.getElementById('clearDone').onclick=function(){ state.tasks=state.tasks.filter(function(t){return !t.done;}); save(); draw(); } }

  function renderShopping(){ var root=$('#view-shopping'); if(!root) return; root.innerHTML=$('#tpl-shopping').innerHTML; function draw(){ var wrap=document.getElementById('shopList'); wrap.innerHTML=''; state.shopping.forEach(function(itm){ var it=el('div',{class:'item'}); var chk=el('input',{type:'checkbox'}); chk.checked=!!itm.bought; chk.onchange=function(){ itm.bought=chk.checked; save(); draw(); }; var meta=el('div',{},[ el('div',{html:'<strong>'+itm.title+'</strong> <span class="muted">'+(itm.qty||'')+' '+(itm.cat? '• '+itm.cat:'')+'</span>'}), el('div',{class:'muted', html:memberPill(itm.by)+' • '+new Date(itm.created).toLocaleString()}) ]); var del=el('button',{onclick:function(){ state.shopping=state.shopping.filter(function(x){return x.id!==itm.id;}); save(); draw(); }},['Törlés']); it.append(chk,meta,del); wrap.append(it); }); } draw(); document.getElementById('shopAdd').onclick=function(){ var title=document.getElementById('shopTitle').value.trim(); if(!title) return; var qty=document.getElementById('shopQty').value.trim(); var cat=document.getElementById('shopCat').value; var by=state.family.members[0]? state.family.members[0].id : null; state.shopping.unshift({id:genId('s'), title:title, qty:qty, cat:cat, by:by, created:Date.now()}); save(); draw(); notifyLocal('Bevásárlólista', title+(qty?' × '+qty:'')); document.getElementById('shopTitle').value=''; document.getElementById('shopQty').value=''; }; document.getElementById('shopClearBought').onclick=function(){ state.shopping=state.shopping.filter(function(i){return !i.bought;}); save(); draw(); } }

  function renderWall(){ var root=$('#view-wall'); if(!root) return; root.innerHTML=$('#tpl-wall').innerHTML; function draw(){ var wrap=document.getElementById('wallFeed'); wrap.innerHTML=''; state.wall.slice(0,100).forEach(function(w){ var it=el('div',{class:'item'}); var found=state.family.members.find(function(m){return m.id===w.by;})||{}; var color=found.color||'#333'; var name=found.name||'Ismeretlen'; it.append( el('div',{class:'avatar',style:'background:'+color}), el('div',{},[ el('div',{html:'<strong>'+name+'</strong> <span class="muted">'+new Date(w.at).toLocaleString()+'</span>'}), el('div',{html:w.text}) ]) ); wrap.append(it); }); } draw(); document.getElementById('wallSend').onclick=function(){ var text=document.getElementById('wallMsg').value.trim(); if(!text) return; var by=state.family.members[0]? state.family.members[0].id : null; state.wall.unshift({id:genId('w'), text:text, by:by, at:Date.now()}); save(); draw(); notifyLocal('Új üzenet', text); document.getElementById('wallMsg').value=''; } }

  function renderSettings(){ var root=$('#view-settings'); if(!root) return; root.innerHTML=$('#tpl-settings').innerHTML; document.getElementById('familyName').value=state.family.name||''; document.getElementById('familyName').oninput=function(e){ state.family.name=e.target.value; document.getElementById('familyNameLabel').textContent=state.family.name||'Család'; save(); }; var list=document.getElementById('members'); list.innerHTML=''; state.family.members.forEach(function(m){ var row=el('div',{class:'item'},[ el('span',{class:'avatar',style:'background:'+m.color}), el('div',{},[el('div',{html:'<strong>'+m.name+'</strong> <span class="muted">'+(m.emoji||'')+'</span>'})]), el('button',{onclick:function(){ state.tasks.forEach(function(t){ if(t.assignee===m.id) t.assignee=state.family.members[0]? state.family.members[0].id : null; }); state.family.members=state.family.members.filter(function(x){return x.id!==m.id;}); save(); renderSettings(); }},['Eltávolítás']) ]); list.append(row); });
    document.getElementById('btnTestSW').onclick=testSW;
    document.getElementById('btnSelfTestICS').onclick=selfTestICS;
    document.getElementById('btnUnregSW').onclick=unregisterAllSW;
    document.getElementById('btnClearCaches').onclick=clearAllCaches;
    document.getElementById('btnFactoryReset').onclick=function(){ unregisterAllSW().then(function(){ return clearAllCaches(); }).then(function(){ localStorage.removeItem('familyhub.data'); toast('Gyári visszaállítás kész. Frissítés…'); setTimeout(function(){ location.reload(); },600); }); };
  }

  function testSW(){ if(!('serviceWorker' in navigator)) { toast('Nincs SW támogatás.'); return; } navigator.serviceWorker.getRegistrations().then(function(regs){ if(!regs.length){ toast('Nem található SW regisztráció.'); return; } toast('SW scope: '+regs.map(function(r){return r.scope;}).join(', ')); }); }
  function unregisterAllSW(){ if(!('serviceWorker' in navigator)) return Promise.resolve(); return navigator.serviceWorker.getRegistrations().then(function(regs){ return Promise.all(regs.map(function(r){return r.unregister();})); }).then(function(){ toast('SW eltávolítva'); }); }
  function clearAllCaches(){ return caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){return caches.delete(k);})); }).then(function(){ toast('Cache ürítve'); }); }
  function selfTestICS(){ var tmp={ id:genId('e'), title:'[TESZT] ICS', start:new Date(), end:new Date(Date.now()+3600000), note:'diagnosztika' }; var backup=state.events.slice(); state.events.push(tmp); var lines=['BEGIN:VEVENT','UID:'+tmp.id+'@familyhub','DTSTART:'+new Date(tmp.start).toISOString(),'DTEND:'+new Date(tmp.end).toISOString(),'SUMMARY:'+tmp.title,'DESCRIPTION:'+tmp.note,'END:VEVENT']; var ok=lines.join('\n').indexOf('DTSTART:')>0; state.events=backup; toast(ok?'ICS ön-teszt: OK':'ICS ön-teszt: HIBA'); }

  var deferredPrompt=null; addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferredPrompt=e; var b=document.getElementById('installBtn'); if(b) b.disabled=false; });
  function bindHeader(){ var b=document.getElementById('installBtn'); if(b) b.onclick=function(){ if(!deferredPrompt){ toast('Már telepítve lehet vagy még nem elérhető.'); return; } deferredPrompt.prompt(); }; var nb=document.getElementById('notifBtn'); if(nb) nb.addEventListener('click', ensureNotifications); var ex=document.getElementById('exportBtn'); if(ex) ex.addEventListener('click', exportAll); document.getElementById('familyNameLabel').textContent=state.family.name||'Család'; updateNet(); }
  function exportAll(){ var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); el('a',{href:URL.createObjectURL(blob), download:'FamilyHub_backup_'+new Date().toISOString().slice(0,10)+'.json'}).click(); }

  function registerSW(){ if(!('serviceWorker' in navigator)) return; var BASE='/FamilyHUB/'; // GitHub Pages útvonal
    var swURL=new URL('sw.js', location.origin+BASE).toString();
    navigator.serviceWorker.register(swURL, { scope: BASE }).then(function(reg){ console.log('SW reg OK:', reg.scope); }).catch(function(err){ console.error('SW reg error', err); toast('SW reg hiba: hiányzik a sw.js a '+BASE+' alatt?'); });
  }

  function init(){ load(); bindHeader(); renderTabs('dashboard'); switchView('dashboard'); registerSW(); }
  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function(){ try{ App.init(); }catch(e){ console.error(e); window.__FHUB_DEBUG_OVERLAY__ && window.__FHUB_DEBUG_OVERLAY__(e.stack||e.message); } });
