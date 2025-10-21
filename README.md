# FamBoard — Családi tábla (React + Firebase + PWA)

Modern, valós idejű, offline-képes webapp családoknak: napi teendők, bevásárlólista, események/szülinapok és jegyzetek.

## Fő funkciók
- Google bejelentkezés (Firebase Auth)
- Háztartás (household), meghívók rövid kóddal (`/join/:code`)
- Mindenkinek saját szín és (opcionális) avatar
- Napi feladatlista (csak a mai nap), közös bevásárlólista
- Események/szülinapok listázása és közelgő értesítések (böngésző Notification API)
- Jegyzetek
- PWA: offline cache + Firestore IndexedDB perzisztencia

## Technológiák
Vite, React, TypeScript, TailwindCSS, Firebase (Auth + Firestore).

## Gyors indítás
1. Hozz létre egy Firebase projektet, kapcsold be az **Authentication**-t (Google provider) és a **Cloud Firestore**-t.
2. Másold ki a projekt configot, és add hozzá a `.env` fájlhoz:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. Telepítés és futtatás:
   ```bash
   npm i
   npm run dev
   ```
4. Build:
   ```bash
   npm run build && npm run preview
   ```

## Firestore struktúra (egyszerű)
```
households (collection)
  {householdId}
    members (subcollection) : { uid, name, color, avatarUrl?, birthday? }
    tasks (subcollection)    : { title, done, date(YYYY-MM-DD), assignedTo?, createdAt }
    shopping (subcollection) : { title, qty?, done, createdAt, addedBy? }
    events (subcollection)   : { title, date(YYYY-MM-DD), time?, type?, createdAt }
    notes (subcollection)    : { text, createdAt }
    invites (subcollection)  : { code, createdAt, createdBy, acceptedBy? }
```

## Meghívók
A háztartás oldalán *Meghívó link* gomb generál egy rövid kódot. A meghívott a `/join/:code` útvonalon tud csatlakozni (Google-belépés után).

## Értesítések
A böngészőben kér engedélyt. Ha engedélyezett, a következő 7 nap eseményeiből rövid értesítést dob, amikor frissül az eseménylista. (Push értesítésekhez FCM szükséges + szerveroldali küldés — ez nincs beépítve.)

## PWA / Offline
- `public/sw.js` egyszerű cache-first SW az alap static assetekre.
- Firestore offline perzisztencia engedélyezve.
- `manifest.webmanifest` telepíthetővé teszi.

## Deployment
- **Firebase Hosting** vagy bármely static host.
- GitHub: töltsd fel a repo-ba, majd CI/CD-vel deploy.

## TODO ötletek
- Jogosultságok/role-ok.
- Állítható boardok/kollekciók.
- Push értesítések (FCM) + időzített emlékeztetők Cloud Functions-szel.
- Avatar feltöltés (Firebase Storage).
- Több háztartás kezelése, háztartásváltó menü.
```

