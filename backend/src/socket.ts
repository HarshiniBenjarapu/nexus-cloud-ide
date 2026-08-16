import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface ClientConnection {
  ws: WebSocket;
  userId: string;
  userName: string;
  activeFile?: string;
  cursor?: { line: number; column: number };
}

export const setupWebSocketServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ server, path: '/ws/collaboration' });
  const clients = new Map<string, ClientConnection>();

  wss.on('connection', (ws: WebSocket) => {
    const clientId = `client_${Math.random().toString(36).substring(2, 9)}`;

    ws.on('message', (data: string) => {
      try {
        const payload = JSON.parse(data.toString());

        switch (payload.type) {
          case 'JOIN': {
            clients.set(clientId, {
              ws,
              userId: payload.userId || clientId,
              userName: payload.userName || 'Anonymous Developer',
              activeFile: payload.activeFile,
            });

            // Broadcast room presence
            const activeUsers = Array.from(clients.values()).map((c) => ({
              userId: c.userId,
              userName: c.userName,
              activeFile: c.activeFile,
              cursor: c.cursor,
            }));

            broadcast(wss, { type: 'PRESENCE_UPDATE', users: activeUsers });
            break;
          }

          case 'CURSOR_MOVE': {
            const client = clients.get(clientId);
            if (client) {
              client.cursor = payload.cursor;
              client.activeFile = payload.activeFile;

              broadcast(wss, {
                type: 'REMOTE_CURSOR',
                userId: client.userId,
                userName: client.userName,
                activeFile: payload.activeFile,
                cursor: payload.cursor,
              }, ws);
            }
            break;
          }

          case 'CODE_DELTA': {
            broadcast(wss, {
              type: 'REMOTE_CODE_DELTA',
              filePath: payload.filePath,
              changes: payload.changes,
              senderId: payload.userId,
            }, ws);
            break;
          }

          default:
            break;
        }
      } catch (err) {
        // Ignore parse error
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      const activeUsers = Array.from(clients.values()).map((c) => ({
        userId: c.userId,
        userName: c.userName,
        activeFile: c.activeFile,
      }));
      broadcast(wss, { type: 'PRESENCE_UPDATE', users: activeUsers });
    });
  });

  return wss;
};

const broadcast = (wss: WebSocketServer, message: any, excludeWs?: WebSocket) => {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(data);
    }
  });
};
