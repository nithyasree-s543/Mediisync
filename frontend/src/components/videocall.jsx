import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Singleton socket
let socket = null;
function getSocket() {
    if (!socket) {
        socket = io(API, { transports: ['websocket', 'polling'] });
    }
    return socket;
}

export default function VideoCall({ onClose, initialCallData = null }) {
    const { user } = useAuth();
    const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
    const [incomingCall, setIncomingCall] = useState(initialCallData);
    const [currentCall, setCurrentCall] = useState(null);
    const [remoteUser, setRemoteUser] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const callTimerRef = useRef(null);

    useEffect(() => {
        const s = getSocket();

        // Join with user info
        if (user) {
            s.emit('join', { userId: user.id, name: user.name, role: user.role });
        }

        // Incoming call
        s.on('incomingCall', (callInfo) => {
            console.log('Incoming call:', callInfo);
            setIncomingCall(callInfo);
            setCallState('ringing');
            // Play ringtone (optional)
            // new Audio('/ringtone.mp3').play().catch(()=>{});
        });

        s.on('call:ringing', ({ callId }) => {
            setCallState('calling');
        });

        s.on('call:accepted', ({ callId }) => {
            setCallState('connected');
            startCallTimer();
        });

        s.on('call:rejected', () => {
            setCallState('ended');
            setTimeout(() => onClose && onClose(), 2000);
        });

        s.on('call:ended', () => {
            endCallCleanup();
            setCallState('ended');
            setTimeout(() => onClose && onClose(), 1500);
        });

        s.on('call:failed', ({ message }) => {
            alert(message);
            setCallState('idle');
        });

        // WebRTC signaling
        s.on('signal', async ({ fromUserId, signal, callId }) => {
            console.log('Signal received:', signal.type || signal.candidate ? 'ICE' : 'unknown');
            try {
                if (signal.type === 'offer') {
                    await handleOffer(signal, fromUserId, callId);
                } else if (signal.type === 'answer') {
                    await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(signal));
                } else if (signal.candidate) {
                    await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch (err) {
                console.error('Signal error:', err);
            }
        });

        return () => {
            s.off('incomingCall');
            s.off('call:ringing');
            s.off('call:accepted');
            s.off('call:rejected');
            s.off('call:ended');
            s.off('call:failed');
            s.off('signal');
        };
    }, [user]);

    useEffect(() => {
        if (initialCallData) {
            setIncomingCall(initialCallData);
            setCallState('ringing');
        }
    }, [initialCallData]);

    const startCallTimer = () => {
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const stopCallTimer = () => {
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
        setCallDuration(0);
    };

    const createPeerConnection = (toUserId, callId) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                getSocket().emit('signal', {
                    toUserId,
                    callId,
                    signal: { candidate: event.candidate }
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('Remote track received');
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        peerConnectionRef.current = pc;
        return pc;
    };

    const startLocalVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error('Failed to get media:', err);
            alert('Camera/Mic permission denied or not available. Video call needs camera access.');
            throw err;
        }
    };

    const handleOffer = async (offer, fromUserId, callId) => {
        await startLocalVideo();
        const pc = createPeerConnection(fromUserId, callId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        getSocket().emit('signal', {
            toUserId: fromUserId,
            callId,
            signal: pc.localDescription
        });

        setCallState('connected');
        startCallTimer();
    };

    // Doctor/Patient initiates call
    const initiateCall = async (toUser, callType = 'video') => {
        try {
            setRemoteUser(toUser);
            await startLocalVideo();

            const callId = `${user.id}-${toUser.id}-${Date.now()}`;
            const callInfo = {
                callId,
                fromUserId: user.id,
                toUserId: toUser.id,
                fromName: user.name,
                fromRole: user.role
            };
            setCurrentCall(callInfo);

            const pc = createPeerConnection(toUser.id, callId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            getSocket().emit('call:user', {
                toUserId: toUser.id,
                fromUserId: user.id,
                fromName: user.name,
                fromRole: user.role,
                callType
            });

            // Send offer after call initiation
            setTimeout(() => {
                getSocket().emit('signal', {
                    toUserId: toUser.id,
                    callId,
                    signal: pc.localDescription
                });
            }, 500);

            setCallState('calling');
        } catch (err) {
            console.error('Call initiation failed:', err);
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        setRemoteUser({ id: incomingCall.fromUserId, name: incomingCall.fromName, role: incomingCall.fromRole });
        setCurrentCall(incomingCall);

        getSocket().emit('call:accept', {
            callId: incomingCall.callId,
            toUserId: incomingCall.fromUserId
        });

        // Offer handling will happen via signal event
        setCallState('connected');
    };

    const rejectCall = () => {
        if (incomingCall) {
            getSocket().emit('call:reject', {
                callId: incomingCall.callId,
                toUserId: incomingCall.fromUserId
            });
        }
        endCallCleanup();
        setCallState('ended');
        setTimeout(() => onClose && onClose(), 1000);
    };

    const endCall = () => {
        const callId = currentCall?.callId || incomingCall?.callId;
        if (callId) {
            getSocket().emit('call:end', { callId });
        }
        endCallCleanup();
        setCallState('ended');
        setTimeout(() => onClose && onClose(), 1000);
    };

    const endCallCleanup = () => {
        stopCallTimer();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Expose initiateCall to parent via window for easy access (or use ref)
    useEffect(() => {
        window.medisyncInitiateCall = initiateCall;
        return () => { delete window.medisyncInitiateCall; };
    }, [user]);

    if (callState === 'idle') {
        return null; // No active call UI, but socket still listening for incoming calls
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '900px', padding: '0', overflow: 'hidden', background: '#0F172A' }}>

                {/* Header */}
                <div style={{ padding: '16px 20px', background: '#1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {callState === 'ringing' && incomingCall ? incomingCall.fromName?.charAt(0) : remoteUser?.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>
                                {callState === 'ringing' ? `Incoming call from ${incomingCall?.fromName}` :
                                    callState === 'calling' ? `Calling ${remoteUser?.name}...` :
                                        callState === 'connected' ? `${remoteUser?.name || incomingCall?.fromName} • ${formatDuration(callDuration)}` :
                                            'Call ended'}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>
                                {callState === 'ringing' ? `${incomingCall?.fromRole} • Video Call` :
                                    callState === 'connected' ? '🔒 Encrypted • MediSync Secure Call' :
                                        callState}
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-ghost" style={{ color: 'white' }} onClick={callState === 'connected' || callState === 'calling' ? endCall : onClose}>✕</button>
                </div>

                {/* Video Area */}
                <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Remote Video */}
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                    {/* Placeholder when no remote video */}
                    {callState !== 'connected' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '16px' }}>
                                {callState === 'ringing' ? '📞' : callState === 'calling' ? '📱' : '👨‍⚕️'}
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                                {callState === 'ringing' ? `${incomingCall?.fromName} is calling...` :
                                    callState === 'calling' ? `Calling ${remoteUser?.name}...` :
                                        'Connecting...'}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.7 }}>
                                {callState === 'ringing' ? 'Video consultation request' : 'Please wait, connecting securely...'}
                            </div>
                            {callState === 'calling' && (
                                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                                    <span style={{ fontSize: '13px' }}>Ringing...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Local Video - Picture in Picture */}
                    <div style={{
                        position: 'absolute', bottom: '20px', right: '20px', width: '160px', height: '120px',
                        background: '#1E293B', borderRadius: '12px', overflow: 'hidden', border: '2px solid white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        {isVideoOff && (
                            <div style={{ position: 'absolute', inset: 0, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>
                                Camera Off
                            </div>
                        )}
                        <div style={{ position: 'absolute', bottom: '4px', left: '6px', fontSize: '10px', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
                            You {isMuted ? '🔇' : '🎤'}
                        </div>
                    </div>

                    {/* Call duration overlay */}
                    {callState === 'connected' && (
                        <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                            ⏱️ {formatDuration(callDuration)} • 🔒 Encrypted
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div style={{ padding: '20px', background: '#1E293B', display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
                    {callState === 'ringing' ? (
                        <>
                            <button onClick={rejectCall} className="btn" style={{ background: '#EF4444', color: 'white', padding: '14px 24px', borderRadius: '50px', fontWeight: 600 }}>
                                ❌ Decline
                            </button>
                            <button onClick={acceptCall} className="btn" style={{ background: '#10B981', color: 'white', padding: '14px 32px', borderRadius: '50px', fontWeight: 600, fontSize: '16px' }}>
                                ✅ Accept Video Call
                            </button>
                        </>
                    ) : callState === 'calling' ? (
                        <>
                            <button className="btn" style={{ background: '#334155', color: 'white', padding: '12px', borderRadius: '50%' }} disabled>🎤</button>
                            <button onClick={endCall} className="btn" style={{ background: '#EF4444', color: 'white', padding: '14px 28px', borderRadius: '50px', fontWeight: 600 }}>
                                📴 Cancel Call
                            </button>
                            <button className="btn" style={{ background: '#334155', color: 'white', padding: '12px', borderRadius: '50%' }} disabled>📹</button>
                        </>
                    ) : callState === 'connected' ? (
                        <>
                            <button onClick={toggleMute} className="btn" style={{ background: isMuted ? '#EF4444' : '#334155', color: 'white', padding: '14px', borderRadius: '50%', width: '50px', height: '50px' }}>
                                {isMuted ? '🔇' : '🎤'}
                            </button>
                            <button onClick={endCall} className="btn" style={{ background: '#EF4444', color: 'white', padding: '14px 32px', borderRadius: '50px', fontWeight: 600 }}>
                                📴 End Call
                            </button>
                            <button onClick={toggleVideo} className="btn" style={{ background: isVideoOff ? '#EF4444' : '#334155', color: 'white', padding: '14px', borderRadius: '50%', width: '50px', height: '50px' }}>
                                {isVideoOff ? '📹❌' : '📹'}
                            </button>
                        </>
                    ) : (
                        <div style={{ color: 'white', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Call {callState}</div>
                            <button onClick={onClose} className="btn btn-secondary">Close</button>
                        </div>
                    )}
                </div>

                <div style={{ padding: '10px', background: '#0F172A', textAlign: 'center', fontSize: '11px', color: '#64748B' }}>
                    🔒 End-to-End Encrypted Video • MediSync Secure • {callState === 'connected' ? `Connected to ${remoteUser?.name || incomingCall?.fromName}` : 'WebRTC P2P'}
                </div>
            </div>
        </div>
    );
}

// Hook to manage incoming calls globally
export function useVideoCall() {
    const [incomingCall, setIncomingCall] = useState(null);
    const [showCallUI, setShowCallUI] = useState(false);

    useEffect(() => {
        const s = getSocket();
        s.on('incomingCall', (callInfo) => {
            setIncomingCall(callInfo);
            setShowCallUI(true);
        });
        return () => s.off('incomingCall');
    }, []);

    const startCall = (toUser) => {
        // This will be handled by VideoCall component's initiateCall
        // We trigger via custom event or directly
        if (window.medisyncInitiateCall) {
            window.medisyncInitiateCall(toUser);
            setShowCallUI(true);
        }
    };

    return { incomingCall, showCallUI, setShowCallUI, startCall, setIncomingCall };
}

export { getSocket };
