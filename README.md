# LiveStream - Live Streaming Platform

A simple live streaming platform built with React and Vite, optimized for AirPlay streaming.

## Features

- 🎥 **Live Streaming**: Start live streams with your device camera
- 📱 **AirPlay Support**: Stream directly to Apple TV and AirPlay-compatible devices
- 🎬 **Clean Interface**: Simple, focused streaming experience
- 📺 **Full Screen**: Immersive full-screen streaming

## GitHub Pages Deployment

This app is configured for automatic deployment to GitHub Pages.

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Navigate to "Pages" section
   - Set Source to "GitHub Actions"

2. **Push to Main Branch**:
   - The GitHub Action will automatically build and deploy
   - Your site will be available at: `https://yourusername.github.io/StreamLink/`

### Manual Deployment

If you want to deploy manually:

```bash
# Build for GitHub Pages
npm run build:gh-pages

# The built files will be in ./dist/public/
# Upload these to your GitHub Pages deployment
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## How to Use

1. **Start a Live Stream**:
   - Click "Start Live" button
   - Allow camera and microphone access
   - Your stream will be live

2. **AirPlay to TV**:
   - Tap the AirPlay button during streaming
   - Select your Apple TV or AirPlay device
   - Enjoy your stream on the big screen

3. **End Stream**:
   - Tap the red phone button to stop streaming

## Technical Details

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: Wouter
- **Deployment**: GitHub Pages with GitHub Actions

## Version History

- **Version 4**: Complete rewrite as live streaming platform
- Removed complex calling infrastructure
- Simplified to pure live streaming with AirPlay support
- Clean, focused user experience

## License

MIT
