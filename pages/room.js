import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import io from 'socket.io-client';
import { createPeerConnection, getUserMedia } from '../lib/webrtc';

export default function Room() {
    const router = useRouter();
    const { username } = router.query;

    const [peers, setPeers] = useState(new Map());
    const [localStream, setLocalStream] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [participantCount, setParticipantCount] = useState(1);
    const [showRoomFull, setShowRoomFull] = useState(false);
    const [mediaError, setMediaError] = useState(null);

    const socketRef = useRef(null);
    const localVideoRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());
    const remoteStreamsRef = useRef(new Map());

    useEffect(() => {
        if (!username) {
            router.push('/');
            return;
        }

        let mounted = true;

        // Initialize media and socket connection
        const init = async () => {
            try {
                // Get user media
                const stream = await getUserMedia({ video: true, audio: true });
                if (!mounted) return;

                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Initialize Socket.IO connection
                socketRef.current = io('http://localhost:3000', {
                    transports: ['websocket', 'polling']
                });

                const socket = socketRef.current;

                // Join room
                socket.emit('join-room', username);

                // Handle room full
                socket.on('room-full', () => {
                    setShowRoomFull(true);
                    stream.getTracks().forEach(track => track.stop());
                });

                // Handle existing users
                socket.on('all-users', ({ users, isHost: hostStatus }) => {
                    console.log('Existing users:', users);
                    setIsHost(hostStatus);
                    setParticipantCount(users.length + 1);

                    // Create peer connections for all existing users
                    users.forEach(user => {
                        createOffer(user.socketId, stream);
                    });
                });

                // Handle new user joining
                socket.on('user-joined', ({ socketId, username: newUsername }) => {
                    console.log('User joined:', newUsername);
                    setParticipantCount(prev => prev + 1);

                    // Peer connection will be created when we receive their offer
                    setPeers(prev => new Map(prev).set(socketId, { username: newUsername, stream: null }));
                });

                // Handle incoming offer
                socket.on('offer', async ({ offer, from }) => {
                    console.log('Received offer from:', from);
                    await handleOffer(offer, from, stream);
                });

                // Handle incoming answer
                socket.on('answer', async ({ answer, from }) => {
                    console.log('Received answer from:', from);
                    const peerConnection = peerConnectionsRef.current.get(from);
                    if (peerConnection) {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                });

                // Handle ICE candidates
                socket.on('ice-candidate', async ({ candidate, from }) => {
                    const peerConnection = peerConnectionsRef.current.get(from);
                    if (peerConnection && candidate) {
                        try {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (error) {
                            console.error('Error adding ICE candidate:', error);
                        }
                    }
                });

                // Handle user disconnection
                socket.on('user-disconnected', (socketId) => {
                    console.log('User disconnected:', socketId);
                    setParticipantCount(prev => prev - 1);

                    // Close peer connection
                    const peerConnection = peerConnectionsRef.current.get(socketId);
                    if (peerConnection) {
                        peerConnection.close();
                        peerConnectionsRef.current.delete(socketId);
                    }

                    // Remove peer
                    setPeers(prev => {
                        const newPeers = new Map(prev);
                        newPeers.delete(socketId);
                        return newPeers;
                    });

                    // Remove remote stream
                    remoteStreamsRef.current.delete(socketId);
                });

            } catch (error) {
                console.error('Error initializing:', error);
                setMediaError('Unable to access camera/microphone. Please check permissions.');
            }
        };

        init();

        // Cleanup
        return () => {
            mounted = false;

            // Close all peer connections
            peerConnectionsRef.current.forEach(pc => pc.close());
            peerConnectionsRef.current.clear();

            // Stop local stream
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            // Disconnect socket
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [username, router]);

    // Create offer for a peer
    const createOffer = async (socketId, stream) => {
        const socket = socketRef.current;

        const peerConnection = createPeerConnection(
            socketId,
            stream,
            socket,
            handleRemoteTrack
        );

        peerConnectionsRef.current.set(socketId, peerConnection);

        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offer', {
            offer,
            to: socketId
        });
    };

    // Handle incoming offer
    const handleOffer = async (offer, from, stream) => {
        const socket = socketRef.current;

        const peerConnection = createPeerConnection(
            from,
            stream,
            socket,
            handleRemoteTrack
        );

        peerConnectionsRef.current.set(from, peerConnection);

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Create and send answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer', {
            answer,
            to: from
        });
    };

    // Handle remote track
    const handleRemoteTrack = (event, socketId) => {
        console.log('Received remote track from:', socketId);
        const [remoteStream] = event.streams;

        remoteStreamsRef.current.set(socketId, remoteStream);

        setPeers(prev => {
            const newPeers = new Map(prev);
            const peer = newPeers.get(socketId) || {};
            newPeers.set(socketId, { ...peer, stream: remoteStream });
            return newPeers;
        });
    };

    // Toggle audio
    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    // Leave call
    const leaveCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        router.push('/');
    };

    if (showRoomFull) {
        return (
            <>
                <Head>
                    <title>Room Full - Family Video Call</title>
                </Head>
                <div className="error-container">
                    <div className="error-card">
                        <div className="error-icon">⚠️</div>
                        <h1>Room Full</h1>
                        <p>This call has reached the maximum of 10 participants.</p>
                        <p>Please try again later.</p>
                        <button onClick={() => router.push('/')} className="btn-primary">
                            Back to Home
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (mediaError) {
        return (
            <>
                <Head>
                    <title>Error - Family Video Call</title>
                </Head>
                <div className="error-container">
                    <div className="error-card">
                        <div className="error-icon">🎥</div>
                        <h1>Media Access Required</h1>
                        <p>{mediaError}</p>
                        <button onClick={() => router.push('/')} className="btn-primary">
                            Back to Home
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Video Call - {username}</title>
            </Head>

            <div className="room-container">
                {/* Header */}
                <div className="room-header">
                    <div className="room-info">
                        <h2>Family Video Call</h2>
                        <div className="participant-info">
                            <span className="participant-count">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6c0-2.5 2-4 5-4s5 1.5 5 4H3z" />
                                </svg>
                                {participantCount} / 10
                            </span>
                            {isHost && <span className="host-badge">Host</span>}
                        </div>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="video-grid">
                    {/* Local Video */}
                    <div className="video-wrapper">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="video-element"
                        />
                        <div className="video-label">
                            {username} (You)
                            {!isVideoEnabled && <span className="status-badge">📷 Off</span>}
                            {!isAudioEnabled && <span className="status-badge">🎤 Off</span>}
                        </div>
                    </div>

                    {/* Remote Videos */}
                    {Array.from(peers.entries()).map(([socketId, peer]) => (
                        <div key={socketId} className="video-wrapper">
                            <video
                                autoPlay
                                playsInline
                                className="video-element"
                                ref={(video) => {
                                    if (video && peer.stream) {
                                        video.srcObject = peer.stream;
                                    }
                                }}
                            />
                            <div className="video-label">
                                {peer.username || 'Connecting...'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="controls-bar">
                    <div className="controls">
                        <button
                            onClick={toggleAudio}
                            className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
                            title={isAudioEnabled ? 'Mute' : 'Unmute'}
                        >
                            {isAudioEnabled ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 11h-2c0 .91-.25 1.75-.69 2.48l1.46 1.46A6.921 6.921 0 0019 11zm-4 .16L9 5.18V5c0-1.66 1.34-3 3-3s3 1.34 3 3v6.16zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c.98-.14 1.88-.51 2.65-1.08l3.08 3.08L20 18.73 4.27 3z" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
                            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {isVideoEnabled ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={leaveCall}
                            className="control-btn leave-btn"
                            title="Leave call"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
