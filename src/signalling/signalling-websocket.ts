import { SignallingBase } from 'awrtc-signalling';

interface AwSignallingPacket {
    peerId: string;
    data: AwPeerDataPacket;
}

interface AwPeerDataPacket {
    type: string;
    eventData?: RTCSessionDescriptionInit | RTCIceCandidate;
}

export class WebsocketSignalling extends SignallingBase {
    private socket: WebSocket;

    constructor (serverUrl: string) {
        super();
        this.socket = this.initializeWebsocket(serverUrl);
    }
    private initializeWebsocket (serverUrl: string): WebSocket {
        const socket = new WebSocket(serverUrl);
        this.socket.addEventListener('open', (event: Event) => console.log('socket open', event));
        this.socket.addEventListener('message', (event: MessageEvent) => this.onMessage(event));
        this.socket.addEventListener('error', (event: Event) => console.log('Socket Error:', event));
        this.socket.addEventListener('close', (event: CloseEvent) => console.log('The Socket is Closed', event));
        return socket;
    }
    private onMessage (event: MessageEvent): void {
        console.log('received message: ', event.data);
        const transferedData = <AwSignallingPacket>JSON.parse(event.data);
        if (transferedData.data.type === 'offer') {
            this.handle('offer', { peerId: transferedData.peerId, offer: transferedData.data.eventData });
        } else if (transferedData.data.type === 'answer') {
            this.handle('answer', { peerId: transferedData.peerId, answer: transferedData.data.eventData });
        } else if (transferedData.data.type === 'candidate') {
            this.handle('newCandidate', { peerId: transferedData.peerId, iceCandidate: transferedData.data.eventData });
        }
    }

    public registerPeer (peerId: string) {
        this.sendDataThroughWebsocket('register', peerId);
    }
    public sendOfferToRemotePeer (peerId: string, offer: RTCSessionDescriptionInit) {
        this.sendDataThroughWebsocket('offer', peerId, offer);
    }
    public sendAnswerToRemotePeer (peerId: string, answer: RTCSessionDescriptionInit) {
        this.sendDataThroughWebsocket('answer', peerId, answer);
    }
    public sendNewCandidateToRemotePeer (peerId: string, candidate: RTCIceCandidate) {
        this.sendDataThroughWebsocket('candidate', peerId, candidate);
    }
    private sendDataThroughWebsocket (type: string, peerId: string, eventData?: RTCSessionDescriptionInit | RTCIceCandidate): void {
        const transferData = this.buildWebsocketMessage(type, peerId, eventData);
        const transferDataJSON = JSON.stringify(transferData);
        this.socket.send(transferDataJSON);
    }
    private buildWebsocketMessage (type: string, peerId: string, eventData?: RTCSessionDescriptionInit | RTCIceCandidate): AwSignallingPacket {
        const buildDataPacket = { type, eventData };
        return { 
            peerId, 
            data: buildDataPacket 
        };
    }
}