type ItemBase = { id: string; familyId: string; updatedAt: string; deleted?: boolean };
type EventItem   = ItemBase & { type: "event";   title: string; start: string; end?: string; note?: string };
type TaskItem    = ItemBase & { type: "task";    title: string; assignee?: string; done?: boolean };
type ShoppingItem= ItemBase & { type: "shopping";title: string; qty?: string; cat?: string; by?: string; bought?: boolean };
type WallItem    = ItemBase & { type: "wall";    text: string; by?: string; at: string };
type AnyItem = EventItem | TaskItem | ShoppingItem | WallItem;

const idxKey = (f: string, t: string) => `idx:${f}:${t}`;
const itemKey= (f: string, t: string, id: string) => `item:${f}:${t}:${id}`;

async function readIndex(kv: KVNamespace, familyId: string, type: string) {
  return JSON.parse((await kv.get(idxKey(familyId, type))) || "[]") as string[];
}
async function writeIndex(kv: KVNamespace, familyId: string, type: string, ids: string[]) {
  await kv.put(idxKey(familyId, type), JSON.stringify(ids));
}
async function upsertItem(kv: KVNamespace, it: AnyItem) {
  await kv.put(itemKey(it.familyId, it.type, it.id), JSON.stringify(it));
  const ids = await readIndex(kv, it.familyId, it.type);
  if (!ids.includes(it.id)) { ids.unshift(it.id); await writeIndex(kv, it.familyId, it.type, ids); }
}
async function listItems<T extends AnyItem>(kv: KVNamespace, familyId: string, type: T["type"]) {
  const ids = await readIndex(kv, familyId, type);
  const results = await Promise.all(ids.map(id => kv.get(itemKey(familyId, type, id))));
  return results.map(r => r && JSON.parse(r) as T).filter(Boolean);
}

export const onRequestGet: PagesFunction<{ HUB_DATA: KVNamespace }> = async ({ request, env }) => {
  const url = new URL(request.url);
  const familyId = url.searchParams.get('familyId') || '';
  if (!familyId) return new Response(JSON.stringify({ error: 'familyId required' }), { status: 400 });

  const [events, tasks, shopping, wall] = await Promise.all([
    listItems(env.HUB_DATA, familyId, 'event'),
    listItems(env.HUB_DATA, familyId, 'task'),
    listItems(env.HUB_DATA, familyId, 'shopping'),
    listItems(env.HUB_DATA, familyId, 'wall'),
  ]);
  return new Response(JSON.stringify({ events, tasks, shopping, wall }), { headers: { 'content-type': 'application/json' }});
};
