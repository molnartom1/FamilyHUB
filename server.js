import express from "express";
import cors from "cors";
import webpush from "web-push";

const app = express();
app.use(cors());
app.use(express.json());

// 1) VAPID kulcsok – egyszer generáld:
//   node -e "console.log(require('web-push').generateVAPIDKeys())"
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || "PASTE_PUBLIC";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || "PASTE_PRIVATE";
webpush.setVapidDetails("mailto:you@example.com", VAPID_PUBLIC, VAPID_PRIVATE);

// Egyszerű (memória) tár a feliratkozásoknak
const subs = new Set();

app.get("/vapid/public", (req, res) => res.json({ publicKey: VAPID_PUBLIC }));

app.post("/subscribe", (req, res) => {
  subs.add(JSON.stringify(req.body));
  res.json({ ok: true });
});

app.post("/unsubscribe", (req, res) => {
  subs.delete(JSON.stringify(req.body));
  res.json({ ok: true });
});

app.post("/notify", async (req, res) => {
  const payload = JSON.stringify({
    title: req.body?.title || "FamilyHub",
    body: req.body?.body || "Új üzenet a FamilyHubtól.",
    url: req.body?.url || "/FamilyHUB/",
  });
  const all = Array.from(subs);
  let sent = 0;
  await Promise.all(all.map(async (s) => {
    try { await webpush.sendNotification(JSON.parse(s), payload); sent++; }
    catch (e) { if (e.statusCode === 410 || e.statusCode === 404) subs.delete(s); }
  }));
  res.json({ ok: true, sent });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Push server running");
});
