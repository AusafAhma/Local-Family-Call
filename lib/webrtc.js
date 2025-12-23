// WebRTC Configuration
export const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

/**
 * Create a new RTCPeerConnection for a specific peer
 * @param {string} socketId - The socket ID of the remote peer
 * @param {MediaStream} localStream - Local media stream to add to the connection
 * @param {Object} socket - Socket.IO client instance
 * @param {Function} onTrack - Callback when remote track is received
 * @returns {RTCPeerConnection}
 */
export function createPeerConnection(socketId, localStream, socket, onTrack) {
    const peerConnection = new RTCPeerConnection(rtcConfig);

    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                to: socketId
            });
        }
    };

    // Handle remote track
    peerConnection.ontrack = (event) => {
        if (onTrack) {
            onTrack(event, socketId);
        }
    };

    // Log connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${socketId}: ${peerConnection.connectionState}`);
    };

    return peerConnection;
}

/**
 * Get user media with audio and video
 * @param {Object} constraints - Media constraints
 * @returns {Promise<MediaStream>}
 */
export async function getUserMedia(constraints = { video: true, audio: true }) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return stream;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        throw error;
    }
}
