// Signaling server configuration
// Production signaling server hosted on Render.com
// Use wss:// for secure WebSocket over HTTPS
export const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'wss://streamlink-signaling.onrender.com';

// Log which signaling server we're connecting to
console.log('📡 Signaling server URL:', SIGNALING_URL);
console.log('💡 Make sure all devices use the same signaling server!');

