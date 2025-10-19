# VideoCall - Web-Based Video Calling Application

## Overview
A minimalist web-based video calling application with H.264/H.265 codec support, full-screen display, and AirPlay compatibility. Built with WebRTC for peer-to-peer connections and optimized for mobile devices, particularly iPhones.

## Core Features
- **One-Tap Call Creation**: Single button to instantly create and join a video call
- **Shareable Links**: Unique URLs for each call session that anyone can join
- **Full-Screen Video**: No letterboxing - video fills entire screen using object-fit: cover
- **Rear Camera Default**: Automatically selects rear camera on mobile for best quality
- **AirPlay Prompt**: Helpful overlay reminding users to connect to TV via AirPlay
- **WebRTC P2P**: Direct peer-to-peer connection for low latency
- **Codec Negotiation**: Attempts H.265 (HEVC) first, falls back to H.264
- **Call Controls**: Mute, camera flip, full screen toggle, end call, share link
- **Connection Status**: Quality indicator and call duration display
- **Auto Full Screen**: Automatically enters full screen when peer connects, with manual toggle button

## Tech Stack
### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- WebRTC API for video calling
- MediaDevices API for camera access

### Backend
- Express.js HTTP server
- WebSocket (ws) for WebRTC signaling
- In-memory storage for call sessions
- STUN servers for NAT traversal

## Project Structure
```
client/
  src/
    pages/
      home.tsx           - Landing page with "Create Call" button
      video-call.tsx     - Main video call interface
    components/
      airplay-prompt.tsx       - AirPlay connection reminder overlay
      call-controls.tsx        - Mute, camera, full screen, end call buttons
      connection-status.tsx    - Quality indicator and duration
      waiting-overlay.tsx      - Shown while waiting for peer
    hooks/
      use-webrtc.ts      - WebRTC logic and signaling
server/
  routes.ts             - API endpoints and WebSocket signaling
  storage.ts            - In-memory call session management
shared/
  schema.ts             - TypeScript types for call sessions and signaling
```

## User Flow
1. User taps "Create Call" button
2. Call session created, user redirected to /call/:callId
3. Rear camera activates, AirPlay prompt appears
4. User can connect to TV via native AirPlay button
5. User shares link via native share API or copy
6. Recipient opens link, joins same call ID
7. WebRTC peer connection established
8. Video automatically enters full screen mode
9. Users see each other full-screen
10. Call controls available at bottom (auto-hide after 3s)
11. Full screen can be toggled manually via Maximize/Minimize button

## Design System
- **Colors**: Dark mode primary (near black backgrounds), blue primary CTAs, green success indicators
- **Typography**: System font stack (SF Pro on iOS)
- **Spacing**: Tailwind units (4, 8, 12, 16, 24)
- **Touch Targets**: Minimum 56px for controls
- **Animations**: Minimal, fade transitions 200-300ms

## WebRTC Implementation
- **Signaling**: WebSocket server relays offer/answer/ICE candidates
- **STUN Servers**: Google STUN servers for NAT traversal
- **Video Constraints**: 1920x1080@30fps ideal, rear camera preferred
- **Audio**: Echo cancellation, noise suppression, auto gain control enabled (48kHz sample rate)
- **Codec Preference**: H.265 (HEVC) preferred on Safari, falls back to H.264 → VP9 → VP8
- **AirPlay Support**: Native Safari AirPlay button enabled via x-webkit-airplay attribute

## Mobile Optimizations
- Full-screen API for immersive experience
- Viewport meta tags prevent zoom
- Apple-specific meta tags for web app mode
- Safe area padding for notched devices
- Touch-friendly control spacing

## Recent Changes (Oct 19, 2025)
- **Added manual full screen toggle button** with Maximize/Minimize icon in call controls
- **Added H.265 (HEVC) codec support** with automatic fallback to H.264
- **Added native Safari AirPlay support** via WebKit API (x-webkit-airplay attribute)
- **Optimized audio settings** for better echo cancellation (48kHz sample rate)
- Initial implementation with complete MVP features
- WebRTC peer-to-peer video calling
- WebSocket signaling server
- Mobile-optimized UI with FaceTime-inspired design
- AirPlay integration prompts
- Full-screen video display

## API Endpoints
- `POST /api/calls/create` - Create new call session, returns callId and URL
- `WebSocket /ws` - Signaling server for WebRTC offer/answer/ICE exchange

## Environment
- No external API keys required
- Uses public STUN servers
- In-memory storage (sessions cleared on server restart)
