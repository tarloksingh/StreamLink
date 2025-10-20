// Simple WebRTC Signaling Server
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('StreamLink Signaling Server Running\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store active streams and connections
const activeStreams = new Map(); // streamId -> broadcaster socket
const viewers = new Map(); // viewer socket -> streamId

console.log('🚀 StreamLink Signaling Server');
console.log('================================');

wss.on('connection', (ws) => {
  console.log('📱 New client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type, data.streamId);
      
      switch (data.type) {
        case 'broadcaster':
          // Register broadcaster
          handleBroadcaster(ws, data);
          break;
          
        case 'viewer':
          // Register viewer
          handleViewer(ws, data);
          break;
          
        case 'offer':
          // Forward offer from broadcaster to viewer
          handleOffer(ws, data);
          break;
          
        case 'answer':
          // Forward answer from viewer to broadcaster
          handleAnswer(ws, data);
          break;
          
        case 'ice-candidate':
          // Forward ICE candidate
          handleIceCandidate(ws, data);
          break;
          
        case 'get-streams':
          // Send list of active streams
          handleGetStreams(ws);
          break;
          
        default:
          console.log('❓ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('👋 Client disconnected');
    handleDisconnect(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

function handleBroadcaster(ws, data) {
  const { streamId, streamTitle } = data;
  
  activeStreams.set(streamId, {
    socket: ws,
    streamId,
    title: streamTitle || `Live Stream ${streamId.substring(0, 4)}`,
    startTime: Date.now(),
    viewers: 0
  });
  
  ws.streamId = streamId;
  ws.role = 'broadcaster';
  
  console.log(`📡 Broadcaster registered: ${streamId}`);
  
  // Notify all clients about new stream
  broadcastStreamList();
  
  ws.send(JSON.stringify({
    type: 'registered',
    role: 'broadcaster',
    streamId
  }));
}

function handleViewer(ws, data) {
  const { streamId } = data;
  const stream = activeStreams.get(streamId);
  
  if (!stream) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Stream not found'
    }));
    return;
  }
  
  viewers.set(ws, streamId);
  ws.streamId = streamId;
  ws.role = 'viewer';
  stream.viewers++;
  
  console.log(`👀 Viewer joined stream: ${streamId}`);
  
  // Tell viewer they're registered
  ws.send(JSON.stringify({
    type: 'registered',
    role: 'viewer',
    streamId
  }));
  
  // Tell broadcaster to create offer for this viewer
  stream.socket.send(JSON.stringify({
    type: 'viewer-joined',
    viewerId: getSocketId(ws)
  }));
  
  // Update stream list
  broadcastStreamList();
}

function handleOffer(ws, data) {
  const { streamId, offer, viewerId } = data;
  
  // Find the viewer socket
  for (const [viewerSocket, vStreamId] of viewers.entries()) {
    if (vStreamId === streamId && getSocketId(viewerSocket) === viewerId) {
      viewerSocket.send(JSON.stringify({
        type: 'offer',
        offer,
        streamId
      }));
      console.log(`📤 Forwarded offer to viewer for stream: ${streamId}`);
      break;
    }
  }
}

function handleAnswer(ws, data) {
  const { streamId, answer } = data;
  const stream = activeStreams.get(streamId);
  
  if (stream) {
    stream.socket.send(JSON.stringify({
      type: 'answer',
      answer,
      viewerId: getSocketId(ws)
    }));
    console.log(`📤 Forwarded answer to broadcaster for stream: ${streamId}`);
  }
}

function handleIceCandidate(ws, data) {
  const { streamId, candidate, target } = data;
  
  if (target === 'broadcaster') {
    const stream = activeStreams.get(streamId);
    if (stream) {
      stream.socket.send(JSON.stringify({
        type: 'ice-candidate',
        candidate,
        from: 'viewer'
      }));
    }
  } else {
    // Send to viewer
    for (const [viewerSocket, vStreamId] of viewers.entries()) {
      if (vStreamId === streamId) {
        viewerSocket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate,
          from: 'broadcaster'
        }));
      }
    }
  }
}

function handleGetStreams(ws) {
  const streams = Array.from(activeStreams.values()).map(stream => ({
    id: stream.streamId,
    title: stream.title,
    viewerCount: stream.viewers,
    thumbnail: null
  }));
  
  ws.send(JSON.stringify({
    type: 'stream-list',
    streams
  }));
}

function handleDisconnect(ws) {
  if (ws.role === 'broadcaster' && ws.streamId) {
    console.log(`📡 Broadcaster disconnected: ${ws.streamId}`);
    activeStreams.delete(ws.streamId);
    
    // Notify viewers that stream ended
    for (const [viewerSocket, streamId] of viewers.entries()) {
      if (streamId === ws.streamId) {
        viewerSocket.send(JSON.stringify({
          type: 'stream-ended',
          streamId
        }));
        viewers.delete(viewerSocket);
      }
    }
    
    broadcastStreamList();
  } else if (ws.role === 'viewer' && ws.streamId) {
    console.log(`👀 Viewer disconnected from: ${ws.streamId}`);
    const stream = activeStreams.get(ws.streamId);
    if (stream) {
      stream.viewers--;
      broadcastStreamList();
    }
    viewers.delete(ws);
  }
}

function broadcastStreamList() {
  const streams = Array.from(activeStreams.values()).map(stream => ({
    id: stream.streamId,
    title: stream.title,
    viewerCount: stream.viewers,
    thumbnail: null
  }));
  
  const message = JSON.stringify({
    type: 'stream-list',
    streams
  });
  
  // Send to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  });
}

function getSocketId(ws) {
  // Generate a simple ID for the socket
  if (!ws.id) {
    ws.id = Math.random().toString(36).substring(7);
  }
  return ws.id;
}

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`🌐 WebSocket URL: ws://localhost:${PORT}`);
  console.log('================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️  Shutting down gracefully...');
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

