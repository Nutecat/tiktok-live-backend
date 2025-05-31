# tiktok-live-backend
Backend server for receiving and filtering TikTok LIVE comments, streaming them via WebSocket to clients.
TikTok Live Comments Backend
Backend server to connect to TikTok LIVE streams, receive and filter live comments, and stream them via WebSocket to connected clients in real-time.

Features
Connects to TikTok LIVE by username using tiktok-live-connector

Receives live chat comments with user metadata (subscriber, team member badges)

Filters comments based on customizable criteria:

All users

Only subscribers

Only team members

Any combination of the above

Sends filtered comments to connected clients via WebSocket

Supports multiple clients listening to the same TikTok user

Automatically closes TikTok connection when no clients remain

Getting Started
Prerequisites
Node.js v16 or higher

npm

Installation
Clone the repo:

bash
Copiar
Editar
git clone https://github.com/tu-usuario/tiktok-live-backend.git
cd tiktok-live-backend
Install dependencies:

bash
Copiar
Editar
npm install
Run the server:

bash
Copiar
Editar
npm start
By default, the WebSocket server listens on port 8080 or the port defined in the PORT environment variable.

Usage
Connect a WebSocket client to ws://localhost:8080 (or your deployed URL)

Send a JSON message with the following format:

json
Copiar
Editar
{
  "username": "tiktok_username",
  "filters": {
    "todos": true,
    "subs": false,
    "miembros": false
  }
}
Receive filtered comments in real-time as JSON messages:

json
Copiar
Editar
{
  "user": "commenter_username",
  "message": "This is a live comment",
  "subscriber": true,
  "member": false
}
Filtering Logic
Filters selected	Comments read
todos	All comments
subs	Only subscribers
miembros	Only team members
subs + miembros	Subscribers and team members
todos + subs or miembros	All comments

Deployment
Deploy on platforms like Railway or Render

Set environment variable PORT if necessary
