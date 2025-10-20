# FamilyHub • Cloudflare Pages szinkron (KV + Durable Object)

## Lépések
1. Hozz létre egy **KV Namespace**-t: `HUB_DATA` (prod és preview ID-ket írd be a `wrangler.toml`-ba).
2. A Pages projektben:
   - Build output: `./public`
   - Functions dir: `./functions`
3. Deploy. Az első indításnál a DO migráció létrejön.
4. Nyisd meg a site-ot. Az első eszköz létrehoz egy családot és **join-kódot**.

## Lokális fejlesztés
```
wrangler pages dev --local
```

## Endpontok
- `POST /api/family` – új család (→ `{ id, joinCode }`)
- `POST /api/family` `{ joinCode }` – csatlakozás
- `GET  /api/state?familyId=...` – kezdeti állapot
- `POST /api/upsert` – mentés + realtime broadcast
- `GET  /ws?familyId=...` – WebSocket csatlakozás
