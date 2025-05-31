const { WebSocketServer } = require('ws');
const { TikTokLiveConnection } = require('tiktok-live-connector');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket Server escuchando en puerto ${PORT}`);

// Guarda conexiones por username
const liveConnections = new Map(); // username -> { conn, clients }

wss.on('connection', (ws) => {
  console.log('📡 Cliente conectado por WebSocket');

  let currentUsername = null;

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      const username = data.username;

      if (!username || typeof username !== 'string') {
        ws.send(JSON.stringify({ error: "Usuario inválido" }));
        ws.close();
        return;
      }

      currentUsername = username;

      if (!liveConnections.has(username)) {
        console.log(`🤝 Nueva conexión TikTok para @${username}`);

        const conn = new TikTokLiveConnection(username);
        const clients = new Set([ws]);

        liveConnections.set(username, { conn, clients });

        conn.connect().catch(err => {
          console.error(`❌ Error conectando con @${username}:`, err.message);
        });

        conn.on('connected', () => {
          console.log(`✅ Conectado a TikTok Live de @${username}`);
        });

        conn.on('chat', (chat) => {
          const payload = {
            user: chat.uniqueId,
            message: chat.comment
          };

          const group = liveConnections.get(username);
          if (!group) return;

          group.clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify(payload));
            }
          });
        });

      } else {
        // Ya existe conexión → solo agregar cliente
        const group = liveConnections.get(username);
        group.clients.add(ws);
      }

    } catch (err) {
      console.error("❌ Error al procesar mensaje:", err.message);
    }
  });

  ws.on('close', () => {
    if (currentUsername && liveConnections.has(currentUsername)) {
      const group = liveConnections.get(currentUsername);
      group.clients.delete(ws);
      if (group.clients.size === 0) {
        console.log(`❎ Cerrando conexión TikTok de @${currentUsername}`);
        group.conn.disconnect();
        liveConnections.delete(currentUsername);
      }
    }
  });
});
