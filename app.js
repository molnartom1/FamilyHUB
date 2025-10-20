<!doctype html>
</div>
<div class="divider"></div>
<div class="inline" style="gap:8px;margin-bottom:8px">
<input id="taskTitle" placeholder="Teendő címe" />
<select id="taskAssignee"></select>
<button id="taskAdd">Hozzáadás</button>
</div>
<div id="taskList" class="list"></div>
</template>


<template id="tpl-shopping">
<div class="inline" style="gap:8px;margin-bottom:8px">
<input id="shopTitle" placeholder="Tétel (pl. tej)" />
<input id="shopQty" placeholder="Mennyiség (pl. 2)" style="max-width:120px" />
<select id="shopCat">
<option>Élelmiszer</option>
<option>Háztartás</option>
<option>Gyerek</option>
<option>Egyéb</option>
</select>
<button id="shopAdd">Hozzáadás</button>
<button id="shopClearBought">Megvett törlése</button>
</div>
<div id="shopList" class="list"></div>
</template>


<template id="tpl-wall">
<div class="inline" style="gap:8px;margin-bottom:8px">
<input id="wallMsg" placeholder="Üzenj a családnak..." />
<button id="wallSend">Küldés</button>
</div>
<div id="wallFeed" class="list"></div>
</template>


<template id="tpl-settings">
<div class="grid">
<div class="card">
<h3>Család beállítások</h3>
<label>Család neve</label>
<input id="familyName" placeholder="Pl. Kovács család" />
<div class="divider"></div>
<h4>Tagok</h4>
<div id="members"></div>
<div class="inline" style="gap:8px;margin-top:8px">
<input id="memberName" placeholder="Új családtag neve" />
<input id="memberEmoji" placeholder="Emoji (pl. 😀)" style="max-width:120px" />
<input id="memberColor" type="color" value="#4cc9f0"/>
<button id="addMember">Hozzáadás</button>
</div>
</div>
<div class="card">
<h3>Diagnosztika & PWA</h3>
<div class="inline" style="gap:8px;flex-wrap:wrap">
<button id="btnTestSW">Service Worker teszt</button>
<button id="btnSelfTestICS">ICS körteszt</button>
<button id="btnUnregSW" class="btn">SW eltávolítás</button>
<button id="btnClearCaches" class="btn">Cache ürítés</button>
<button id="btnFactoryReset" class="btn">Gyári visszaállítás</button>
</div>
<small class="muted">GitHub Pages-en a scope **/FamilyHUB/**. A `sw.js`-t a repo gyökerébe tedd.</small>
</div>
</div>
</template>


<div id="toast" class="toast hidden"></div>


<script src="./app.js" defer></script>
</body>
</html>