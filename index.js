const { WebSocketServer } = require('ws');
const { TikTokLiveConnection } = require('tiktok-live-connector');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket Server listening on port ${PORT}`);

// Guarda conexiones por usuario de TikTok
const liveConnections = new Map(); // username -> { conn, clients: Set, filters }

wss.on('connection', (ws) => {
    console.log('📡 Cliente conectado');

    let currentUsername = null;

    ws.on('message', async (msg) => {
        try {
            const data = JSON.parse(msg);
            const { username, filters } = data;

            if (!username || typeof filters !== 'object') return;

            currentUsername = username;

            if (!liveConnections.has(username)) {
                console.log(`🤝 Creando nueva conexión para @${username}`);

                const conn = new TikTokLiveConnection(username);
                const clients = new Set([ws]);

                liveConnections.set(username, {
                    conn,
                    clients,
                    filters
                });

                conn.connect().catch(err => {
                    console.error(`❌ Error al conectar con @${username}:`, err);
                });

                conn.on('chat', (chat) => {
                    const subs = chat.user.subscriber;
                    const miembros = chat.user.badges?.some(b => b.type === 'member') || false;

                    const payload = {
                        user: chat.uniqueId,
                        message: chat.comment,
                        subscriber: subs,
                        member: miembros
                    };

                    const group = liveConnections.get(username);
                    if (!group) return;

                    if (shouldReadComment(payload, group.filters)) {
                        group.clients.forEach(client => {
                            if (client.readyState === 1) {
                                client.send(JSON.stringify(payload));
                            }
                        });
                    }
                });

            } else {
                // Ya existe conexión para este usuario
                const group = liveConnections.get(username);
                group.clients.add(ws);
                group.filters = filters; // Actualiza filtros en caliente
            }

        } catch (err) {
            console.error("❌ Error procesando mensaje:", err);
        }
    });

    ws.on('close', () => {
        if (currentUsername && liveConnections.has(currentUsername)) {
            const group = liveConnections.get(currentUsername);
            group.clients.delete(ws);
            if (group.clients.size === 0) {
                console.log(`❎ Cerrando conexión de @${currentUsername}`);
                group.conn.disconnect();
                liveConnections.delete(currentUsername);
            }
        }
    });
});

function shouldReadComment({ subscriber, member }, filters) {
    const { todos, subs, miembros } = filters;

    if (todos) return true;
    if (subs && miembros) return subscriber || member;
    if (subs) return subscriber;
    if (miembros) return member;
    return false;
}
