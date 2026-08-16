import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

export interface RemoteUserCursor {
  userId: string;
  userName: string;
  activeFile?: string;
  cursor?: { line: number; column: number };
}

export const useCollaborationSocket = (activeFile?: string) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [remoteCursors, setRemoteCursors] = useState<RemoteUserCursor[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:5000/ws/collaboration';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'JOIN',
          userId: user?.id || 'guest',
          userName: user?.fullName || 'Guest Developer',
          activeFile,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'PRESENCE_UPDATE') {
          setRemoteCursors(data.users.filter((u: any) => u.userId !== user?.id));
        } else if (data.type === 'REMOTE_CURSOR') {
          setRemoteCursors((prev) => {
            const idx = prev.findIndex((u) => u.userId === data.userId);
            const updated = {
              userId: data.userId,
              userName: data.userName,
              activeFile: data.activeFile,
              cursor: data.cursor,
            };
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            return [...prev, updated];
          });
        }
      } catch (err) {
        // Ignore
      }
    };

    return () => {
      ws.close();
    };
  }, [user, activeFile]);

  const broadcastCursorMove = (line: number, column: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'CURSOR_MOVE',
          activeFile,
          cursor: { line, column },
        })
      );
    }
  };

  return { remoteCursors, broadcastCursorMove };
};
