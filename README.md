# Thermal Rage: Neon Nightfall — Online 1v1

This is a cyberpunk browser FPS with a Node.js WebSocket room server. Both players use the same hosted URL; one creates a six-character room code and shares an invite link. No WebRTC manual handshake.

## Deploy (Render)
1. Create a GitHub repository and upload **all files in this folder**, retaining the `public/` subfolder.
2. Visit https://dashboard.render.com/ and create a **Web Service** from that GitHub repo (or select **New → Blueprint** to use `render.yaml`).
3. Use **Node**, build command `npm install`, start command `npm start`, and an available web-service plan.
4. Wait for Render to report that the service is live. Visit the `https://...onrender.com` URL Render gives you.
5. Click **Create Room**, then **Copy Invite Link** and send it to your friend. Your friend opens the link and clicks **Join Room**.

A free server may go to sleep when idle; opening the site again will wake it. Running locally is possible with `npm install`, `npm start`, and visiting `http://localhost:3000`, but your friend needs the publicly hosted link.

The lightweight gameplay uses client-simulated hit detection and relay synchronization. It is playable but **not cheat-resistant** or latency-compensated. The temperature converter appears at match end.