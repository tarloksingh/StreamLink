// Signaling client for WebRTC
export class SignalingClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  
  // Callbacks
  public onOpen?: () => void;
  public onClose?: () => void;
  public onError?: (error: Event) => void;
  public onStreamList?: (streams: any[]) => void;
  public onOffer?: (offer: RTCSessionDescriptionInit) => void;
  public onAnswer?: (answer: RTCSessionDescriptionInit) => void;
  public onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  public onViewerJoined?: (viewerId: string) => void;
  public onStreamEnded?: (streamId: string) => void;
  public onRegistered?: (role: string, streamId: string) => void;

  constructor(private serverUrl: string) {
    this.connect();
  }

  private connect() {
    console.log('🔌 Connecting to signaling server:', this.serverUrl);
    
    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to signaling server');
        this.reconnectAttempts = 0;
        if (this.onOpen) this.onOpen();
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from signaling server');
        if (this.onClose) this.onClose();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ Signaling server error:', error);
        if (this.onError) this.onError(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private handleMessage(data: any) {
    console.log('📨 Received message:', data.type);

    switch (data.type) {
      case 'registered':
        if (this.onRegistered) {
          this.onRegistered(data.role, data.streamId);
        }
        break;

      case 'stream-list':
        if (this.onStreamList) {
          this.onStreamList(data.streams);
        }
        break;

      case 'offer':
        if (this.onOffer) {
          this.onOffer(data.offer);
        }
        break;

      case 'answer':
        if (this.onAnswer) {
          this.onAnswer(data.answer);
        }
        break;

      case 'ice-candidate':
        if (this.onIceCandidate) {
          this.onIceCandidate(data.candidate);
        }
        break;

      case 'viewer-joined':
        if (this.onViewerJoined) {
          this.onViewerJoined(data.viewerId);
        }
        break;

      case 'stream-ended':
        if (this.onStreamEnded) {
          this.onStreamEnded(data.streamId);
        }
        break;

      case 'error':
        console.error('❌ Server error:', data.message);
        break;

      default:
        console.log('❓ Unknown message type:', data.type);
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('📤 Sending to signaling server:', data.type, data);
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('❌ WebSocket not connected, cannot send:', data.type);
    }
  }

  public registerAsBroadcaster(streamId: string, streamTitle?: string) {
    this.send({
      type: 'broadcaster',
      streamId,
      streamTitle
    });
  }

  public registerAsViewer(streamId: string) {
    this.send({
      type: 'viewer',
      streamId
    });
  }

  public sendOffer(streamId: string, offer: RTCSessionDescriptionInit, viewerId: string) {
    this.send({
      type: 'offer',
      streamId,
      offer,
      viewerId
    });
  }

  public sendAnswer(streamId: string, answer: RTCSessionDescriptionInit) {
    this.send({
      type: 'answer',
      streamId,
      answer
    });
  }

  public sendIceCandidate(streamId: string, candidate: RTCIceCandidateInit, target: 'broadcaster' | 'viewer') {
    this.send({
      type: 'ice-candidate',
      streamId,
      candidate,
      target
    });
  }

  public getStreamList() {
    this.send({
      type: 'get-streams'
    });
  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

