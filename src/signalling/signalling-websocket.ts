import { SignallingBase } from 'awrtc-signalling';

type AwSignallingType = 'register' | 'relay' | 'peerlist' | 'close';
type PeerId = string;
type PeerList = string[];

interface AwRelayData {
    peerId: string;
    data: string;
}

type AwSignallingData = PeerId | PeerList | AwRelayData;
interface AwSignallingPacket {
    signallingType: AwSignallingType;
    signallingData: string;
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
            const peerList = <PeerList>JSON.parse(signallingPacket.signallingData);
            this.handle('peerList', { peerList });
        } else if (signallingPacket.signallingType === 'relay') {
            const relayData = <AwRelayData>JSON.parse(signallingPacket.signallingData);
            const peerData = <AwPeerData>JSON.parse(relayData.data);
            if (peerData.eventType === 'offer') {
                this.handle('offer', { peerId: relayData.peerId, offer: peerData.eventData });
            } else if (peerData.eventType === 'answer') {
                this.handle('answer', { peerId: relayData.peerId, answer: peerData.eventData });
            } else if (peerData.eventType === 'candidate') {
                this.handle('newCandidate', { peerId: relayData.peerId, iceCandidate: peerData.eventData });
            }
        } else if (signallingPacket.signallingType === 'close') {

        }
    }

    public registerPeer (peerId: PeerId): void {
        const signallingPacket = this.buildSignallingPacket('register', peerId);
        this.sendSignallingPacket(signallingPacket);
    }
    public sendOfferToRemotePeer (peerId: PeerId, offer: RTCSessionDescriptionInit) {
        this.relayDataThroughWebsocket('offer', peerId, offer);
    }
    public sendAnswerToRemotePeer (peerId: PeerId, answer: RTCSessionDescriptionInit) {
        this.relayDataThroughWebsocket('answer', peerId, answer);
    }
    public sendNewCandidateToRemotePeer (peerId: PeerId, candidate: RTCIceCandidate) {
        this.relayDataThroughWebsocket('candidate', peerId, candidate);
    }
    private relayDataThroughWebsocket (eventType: AwPeerEventType, peerId: PeerId, eventData?: RTCSessionDescriptionInit | RTCIceCandidate): void {
        const peerData = { eventType, eventData };
        const relayData = this.buildRelayData(peerId, peerData);
        const signallingPacket = this.buildSignallingPacket('relay', relayData);
        this.sendSignallingPacket(signallingPacket);
    }
    private buildRelayData (peerId: PeerId, peerData: AwPeerData): AwRelayData {
        return {
            peerId,
            data: JSON.stringify(peerData)
        }
    }
    private buildSignallingPacket (signallingType: AwSignallingType, signallingData: AwSignallingData): AwSignallingPacket {
        return {
            signallingType,
            signallingData: JSON.stringify(signallingData)
        };
    }
    private sendSignallingPacket (signallingPacket: AwSignallingPacket): void {
        const transferDataJSON = JSON.stringify(signallingPacket);
        this.socket.send(transferDataJSON);
    }
}