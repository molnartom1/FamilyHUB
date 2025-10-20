export const onRequestGet: PagesFunction<{ ROOM: DurableObjectNamespace }> = async ({ request, env }) => {
  const url = new URL(request.url);
  const familyId = url.searchParams.get('familyId') || '';
  if (!familyId) return new Response('familyId required', { status: 400 });
  const id = env.ROOM.idFromName(familyId);
  const obj = env.ROOM.get(id);
  const wsUrl = new URL(request.url);
  wsUrl.pathname = '/ws';
  return obj.fetch(new Request(wsUrl.toString(), request));
};