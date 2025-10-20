// Signaling server configuration
// IMPORTANT: For local network testing, use ws:// with local IP
// The web app can be HTTPS (ngrok) but signaling can be local ws://
export const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || 'ws://192.168.1.74:3001';

// Log which signaling server we're connecting to
console.log('📡 Signaling server URL:', SIGNALING_URL);
console.log('💡 Make sure all devices use the same signaling server!');

