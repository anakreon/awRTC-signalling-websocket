import { SignallingBase } from 'awrtc-signalling';

export class WebsocketSignalling extends SignallingBase {
    private socket: WebSocket;

    constructor (serverUrl) {
        super();
        //this.serverUrl = serverUrl;
        //this._initializeConnection();
    }
    /*_initializeConnection () {
        this.socket = new WebSocket(this.serverUrl);
        this.socket.onopen = (event) => this._onSocketOpen(event);
        this.socket.onmessage = (event) => this._onMessage(event);        
        this.socket.onerror = (error) => console.log("Socket Error:", error);
        this.socket.onclose = () => console.log("The Socket is Closed");
    }*/

    _onSocketOpen () {

    }

    _onMessage (event) {
        console.log('received message: ', event.data);
        /*this._onPeerListOffer
        this._onOfferFromRemotePeer
        this._onAnswerFromRemotePeer
        this._onNewCandidateFromRemotePeer*/
    }

    registerPeer (peerName) {
        this.socket.send(peerName);
    }
    sendOfferToRemotePeer (peerName, RTCSessionDescription) {
        this.socket.send(peerName);
    }
    sendAnswerToRemotePeer (peerName, RTCSessionDescription) {
        this.socket.send(peerName);
    }
    sendNewCandidateToRemotePeer (peerName, iceCandidate) {
        this.socket.send(peerName);
    }
}