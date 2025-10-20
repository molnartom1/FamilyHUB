export class FamilyRoom {
  state: DurableObjectState;
  sockets: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sockets = new Set();
  }

  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname.endsWith('/ws') && req.headers.get('upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      server.accept();
      server.addEventListener('close', () => this.sockets.delete(server));
      this.sockets.add(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname.endsWith('/broadcast') && req.method === 'POST') {
      const msg = await req.text();
      for (const ws of this.sockets) { try { ws.send(msg); } catch {} }
      return new Response('ok');
    }

    return new Response('bad request', { status: 400 });
  }
}