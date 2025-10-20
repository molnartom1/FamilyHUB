export const onRequestPost: PagesFunction<{ HUB_DATA: KVNamespace }> = async ({ request, env }) => {
  const body = await request.json().catch(()=> ({}));
  const name = body.name || 'Család';
  const joinCode = body.joinCode;

  if (joinCode) {
    const famId = await env.HUB_DATA.get(`family:byjoin:${joinCode}`);
    if (!famId) return new Response(JSON.stringify({ error: 'joinCode not found' }), { status: 404 });
    return new Response(JSON.stringify({ id: famId, joinCode }), { headers: { 'content-type': 'application/json' }});
  }

  const id = crypto.randomUUID();
  const code = Math.random().toString(36).slice(2,8).toUpperCase();
  await env.HUB_DATA.put(`family:${id}`, JSON.stringify({ id, name, joinCode: code, createdAt: new Date().toISOString() }));
  await env.HUB_DATA.put(`family:byjoin:${code}`, id);
  return new Response(JSON.stringify({ id, joinCode: code }), { headers: { 'content-type': 'application/json' }});
};