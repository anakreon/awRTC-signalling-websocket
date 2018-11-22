import { SignallingBase } from 'awrtc-signalling';

type AwSignallingType = 'register' | 'relay' | 'peerlist';
type PeerId = string;
type PeerList = string[];

interface AwRelayData {
    peerId: string;
    data: string;
}

type AwSignallingData = PeerId | PeerList | AwRelayData;

interface AwSignallingPacket {
    signallingType: AwSignallingType;
    signallingData: AwSignallingData;
}

type AwPeerEventType = 'offer' | 'answer' | 'candidate';

interface AwPeerData {
    eventType: AwPeerEventType;
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
        socket.addEventListener('open', (event: Event) => console.log('socket open', event));
        socket.addEventListener('message', (event: MessageEvent) => this.onMessage(event));
        socket.addEventListener('error', (event: Event) => console.log('Socket Error:', event));
        socket.addEventListener('close', (event: CloseEvent) => console.log('The Socket is Closed', event));
        return socket;
    }
    private onMessage (event: MessageEvent): void {
        console.log('received message: ', event.data);
        const signallingPacket = <AwSignallingPacket>JSON.parse(event.data);
        if (signallingPacket.signallingType === 'peerlist') {
            this.handle('peerList', { peerList: signallingPacket.signallingData });
        } else if (signallingPacket.signallingType === 'relay') {
            const relayData = <AwRelayData>signallingPacket.signallingData;
            const peerData = <AwPeerData>JSON.parse(relayData.data);
            if (peerData.eventType === 'offer') {
                this.handle('offer', { peerId: relayData.peerId, offer: peerData.eventData });
            } else if (peerData.eventType === 'answer') {
                this.handle('answer', { peerId: relayData.peerId, answer: peerData.eventData });
            } else if (peerData.eventType === 'candidate') {
                this.handle('newCandidate', { peerId: relayData.peerId, iceCandidate: peerData.eventData });
            }
        }
    }

    public registerPeer (peerId: string) {
        const signallingPacket = {
            signallingType: 'register',
            signallingData: peerId
        };
        const transferDataJSON = JSON.stringify(signallingPacket);
        this.socket.send(transferDataJSON);
    }
    public sendOfferToRemotePeer (peerId: string, offer: RTCSessionDescriptionInit) {
        this.relayDataThroughWebsocket('offer', peerId, offer);
    }
    public sendAnswerToRemotePeer (peerId: string, answer: RTCSessionDescriptionInit) {
        this.relayDataThroughWebsocket('answer', peerId, answer);
    }
    public sendNewCandidateToRemotePeer (peerId: string, candidate: RTCIceCandidate) {
        this.relayDataThroughWebsocket('candidate', peerId, candidate);
    }
    private relayDataThroughWebsocket (eventType: string, peerId: string, eventData?: RTCSessionDescriptionInit | RTCIceCandidate): void {
        const signallingPacket = {
            signallingType: 'relay',
            signallingData: {
                peerId: peerId,
                data: JSON.stringify({
                    eventType: eventType,
                    eventData: eventData
                })
            }
        };
        const transferDataJSON = JSON.stringify(signallingPacket);
        this.socket.send(transferDataJSON);
    }
}