# Design Guidelines: Video Calling Application

## Design Approach
**System-Based Approach** following Apple HIG principles with inspiration from FaceTime and modern video calling interfaces. The design prioritizes functionality, clarity, and minimal distraction during active calls.

## Core Design Principles
1. **Simplicity First**: Minimal UI that stays out of the way during calls
2. **Full Screen Priority**: Video content takes maximum available space
3. **Mobile-First**: Optimized for iPhone and mobile devices
4. **Clear Affordances**: Obvious CTAs and connection states

## Color Palette

### Dark Mode (Primary)
- **Background**: 0 0% 8% (near black for video calling)
- **Surface**: 0 0% 12%
- **Primary**: 210 100% 55% (clear blue for CTAs)
- **Success**: 145 70% 50% (active call indicator)
- **Text Primary**: 0 0% 98%
- **Text Secondary**: 0 0% 70%

### Light Mode
- **Background**: 0 0% 98%
- **Surface**: 0 0% 100%
- **Primary**: 210 100% 50%
- **Text Primary**: 0 0% 10%

## Typography
- **Font**: System font stack (SF Pro on iOS, Roboto on Android, system-ui fallback)
- **Heading**: 600 weight, 28px-32px for main CTAs
- **Body**: 400 weight, 16px for instructions
- **Small**: 14px for status indicators

## Layout System
- **Spacing Units**: Tailwind's 4, 8, 12, 16, 24 (p-4, m-8, gap-12, etc.)
- **Container**: Full viewport for video, max-w-md for pre-call screens
- **Grid**: Single column mobile-first layout

## Component Specifications

### Pre-Call Screen
- Centered layout with max-w-md container
- Large "Create Call" button (w-full, h-16, rounded-xl)
- App name/logo above (text-3xl, font-semibold)
- Subtle background gradient or solid dark color
- Bottom padding for safe area on mobile

### Active Call Interface
- **Video Container**: Absolute positioned, w-full h-full, object-cover to fill screen
- **Control Overlay**: Fixed bottom position with backdrop-blur-xl, semi-transparent dark background
- **Controls**: Flex row with gap-4, large touch targets (min 56px)
- **Status Indicator**: Top-right corner showing call duration and connection quality

### AirPlay Prompt
- **Position**: Center overlay when rear camera detected
- **Card**: Backdrop blur with semi-transparent background
- **Icon**: Large TV/AirPlay icon (64px)
- **Message**: "Connect to your TV" with "Tap the AirPlay button in the video" instruction
- **Dismissible**: Tap outside or X button to close

### Call Controls
- **Mute Button**: Microphone icon, toggle state with clear visual feedback
- **Camera Toggle**: Camera flip icon for switching cameras
- **End Call**: Red rounded button, slightly larger than other controls
- **AirPlay Status**: Small indicator showing connection state
- All buttons: rounded-full, with shadow-lg, clear icons from Heroicons

## UI States

### Connection States
1. **Idle**: "Create Call" button ready state
2. **Connecting**: Loading spinner with "Connecting..." text
3. **Connected**: Full screen video with minimal controls
4. **Waiting**: "Waiting for other person to join..." overlay
5. **AirPlay Prompt**: Overlay message when rear camera active

### Button States
- **Default**: Primary color with subtle shadow
- **Hover**: Slightly lighter shade (desktop)
- **Active**: Pressed state with reduced shadow
- **Disabled**: 50% opacity, no interaction

## Animations
- **Minimal Use**: Fade in/out for overlays (200ms duration)
- **Control Overlay**: Slide up from bottom on tap (300ms)
- **No Distractions**: Avoid animations during active calls

## Accessibility
- High contrast text on video overlays
- Large touch targets (minimum 44x44px)
- Clear focus states for keyboard navigation
- ARIA labels for icon-only buttons
- Support for system dark mode preference

## Mobile Optimizations
- Safe area padding for notched devices (iOS)
- Prevent zoom on input fields
- Landscape orientation lock during calls
- Full screen API for immersive experience
- Touch-friendly spacing (minimum 8px between interactive elements)

## Critical Implementation Notes
- Video element uses object-fit: cover for full screen
- Aspect ratio fills viewport completely (no letterboxing)
- Controls auto-hide after 3 seconds of inactivity during calls
- Rear camera selected by default on mobile via MediaDevices constraints
- Link sharing via native share API when available

## Images
No hero images or decorative imagery needed. The video stream IS the visual content. Keep the interface minimal and functional.