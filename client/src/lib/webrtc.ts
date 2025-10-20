// Simple WebRTC implementation for live streaming
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isBroadcaster: boolean = false;
  private streamId: string = '';
  private onRemoteStream?: (stream: MediaStream) => void;
  private onConnectionState?: (state: string) => void;

  constructor() {
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real app, you'd send this to the other peer via signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log('Connection state:', this.peerConnection.connectionState);
        if (this.onConnectionState) {
          this.onConnectionState(this.peerConnection.connectionState);
        }
      }
    };
  }

  async startBroadcasting(streamId: string): Promise<MediaStream> {
    this.streamId = streamId;
    this.isBroadcaster = true;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: "environment" }
        },
        audio: true
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      // Create offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // In a real app, you'd send this offer to viewers via signaling server
      console.log('Created offer for stream:', streamId);

      return this.localStream;
    } catch (error) {
      console.error('Error starting broadcast:', error);
      throw error;
    }
  }

  async startViewing(streamId: string): Promise<void> {
    this.streamId = streamId;
    this.isBroadcaster = false;

    try {
      // In a real app, you'd receive the offer from the broadcaster via signaling server
      // For now, we'll simulate this
      console.log('Starting to view stream:', streamId);
      
      // This would normally come from the signaling server
      // const offer = await this.receiveOfferFromSignalingServer(streamId);
      // await this.peerConnection!.setRemoteDescription(offer);
      
      // const answer = await this.peerConnection!.createAnswer();
      // await this.peerConnection!.setLocalDescription(answer);
      
      // await this.sendAnswerToSignalingServer(streamId, answer);
    } catch (error) {
      console.error('Error starting viewing:', error);
      throw error;
    }
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  setOnConnectionState(callback: (state: string) => void) {
    this.onConnectionState = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  isCurrentlyBroadcasting(): boolean {
    return this.isBroadcaster && this.localStream !== null;
  }

  async stopStreaming(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.setupPeerConnection();
    }

    this.isBroadcaster = false;
    this.streamId = '';
  }

  // Simulate receiving a stream (for demo purposes)
  simulateRemoteStream(): void {
    if (!this.isBroadcaster) {
      // Create a simple canvas stream for demo
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      
      // Draw a more realistic stream simulation
      let frame = 0;
      const animate = () => {
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${(frame * 2) % 360}, 70%, 60%)`);
        gradient.addColorStop(1, `hsl(${(frame * 2 + 60) % 360}, 70%, 40%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some visual elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LIVE STREAM', canvas.width / 2, canvas.height / 2 - 100);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Arial';
        ctx.fillText(`Stream ID: ${this.streamId}`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(`Viewing as: ${frame}`, canvas.width / 2, canvas.height / 2);
        
        // Add a pulsing dot to simulate live indicator
        ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + 0.5 * Math.sin(frame * 0.1)})`;
        ctx.beginPath();
        ctx.arc(100, 100, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('LIVE', 100, 105);
        
        frame++;
        requestAnimationFrame(animate);
      };
      animate();

      const stream = canvas.captureStream(30);
      if (this.onRemoteStream) {
        this.onRemoteStream(stream);
      }
    }
  }
}
