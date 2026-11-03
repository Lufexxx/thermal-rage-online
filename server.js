const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const PORT = Number(process.env.PORT || 3000);
const rooms = new Map();
const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if(url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    return res.end(html);
  }
  if(url.pathname === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  res.writeHead(404); res.end('Not found');
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8192 });
function emit(ws, obj) { if(ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }
function code() { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let out; do {out=Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join('');} while(rooms.has(out)); return out; }
function leave(ws) {
  if(!ws.room) return;
  const room=rooms.get(ws.room); const oldCode=ws.room; ws.room=null;
  if(!room) return;
  room.players=room.players.filter(p=>p!==ws);
  for(const p of room.players) emit(p,{type:'peer_left'});
  // Do not allow new joiners into half-finished matches: both players must create a fresh room.
  rooms.delete(oldCode);
  for(const p of room.players) p.room=null;
}
wss.on('connection', ws=>{
  ws.room=null; ws.lastMessage=Date.now(); ws.count=0;
  ws.on('message', raw=>{
    let m; try{m=JSON.parse(raw.toString())}catch{return}
    if(!m || typeof m.type!=='string')return;
    const now=Date.now();if(now-ws.lastMessage>1000){ws.lastMessage=now;ws.count=0}
    if(++ws.count>90)return;
    if(m.type==='create') {
      leave(ws); const id=code();rooms.set(id,{players:[ws]});ws.room=id;emit(ws,{type:'created',room:id,id:0});return;
    }
    if(m.type==='join') {
      leave(ws);const id=String(m.room||'').toUpperCase();const room=rooms.get(id);
      if(!room||room.players.length!==1){emit(ws,{type:'error',message:'Room does not exist or is full. Ask your friend to create a new room.'});return}
      room.players.push(ws);ws.room=id;emit(ws,{type:'joined',room:id,id:1});
      for(const p of room.players)emit(p,{type:'start',room:id});return;
    }
    const room=rooms.get(ws.room);if(!room||room.players.length!==2)return;
    const id=room.players.indexOf(ws);if(id<0)return;
    if(['state','shot','restart'].includes(m.type)){
      // Each player may only report their own state and shot. Further validation and anti-cheat would be needed for competitive use.
      if((m.type==='state'||m.type==='shot')&&m.id!==id)return;
      const peer=room.players[1-id];emit(peer,m);
    }
  });
  ws.on('close',()=>leave(ws));ws.on('error',()=>leave(ws));
});
server.listen(PORT, '0.0.0.0', ()=>console.log('Thermal Rage server running on port '+PORT));