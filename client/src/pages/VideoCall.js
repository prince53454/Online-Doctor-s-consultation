import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import './VideoCall.css';

const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
  withCredentials: true
});

export default function VideoCall() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callFrameRef = useRef(null);

  const [consultation, setConsultation] = useState(null);
  const [videoConfig, setVideoConfig] = useState(null);
  const [connected, setConnected] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(true);
  const [audioOnly, setAudioOnly] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize consultation and show waiting room
  const initCall = useCallback(async () => {
    try {
      const res = await api.get(`/consultations/${roomId}`);
      setConsultation(res.data.consultation);
      setVideoConfig(res.data.videoConfig);

      // Start camera preview in waiting room
      try {
        const constraints = audioOnly ? { audio: true } : { video: true, audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        if (localVideoRef.current && !audioOnly) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch (err) {
        console.warn('Camera not available:', err.message);
        setCameraReady(true); // Allow joining without camera
      }
    } catch (error) {
      console.error('Video call init error:', error);
      toast.error('Failed to load consultation details.');
    }
  }, [roomId, audioOnly]);

  // Join call from waiting room
  const joinCall = async () => {
    try {
      socket.emit('join-room', roomId);
      socket.emit('video-signal', { roomId, signal: 'join', userId: user.id });
      await api.put(`/consultations/${roomId}/start`);
      setInWaitingRoom(false);
      setConnected(true);
    } catch (error) {
      console.error('Join call error:', error);
      setInWaitingRoom(false);
      setConnected(true);
    }
  };

  useEffect(() => {
    initCall();

    socket.on('video-signal', ({ signal, userId }) => {
      if (signal === 'join' && userId !== user.id) {
        toast.success('Other participant joined');
      }
    });

    socket.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('call-ended', () => {
      toast.success('Call ended by other participant');
      navigate('/appointments');
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      socket.emit('leave-room', { roomId });
      socket.off('video-signal');
      socket.off('chat-message');
      socket.off('call-ended');
    };
  }, [roomId, user, navigate, initCall]);

  // Duration timer
  useEffect(() => {
    if (connected) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [connected]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => { track.enabled = isVideoOff; });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing && screenStreamRef.current) {
      // Stop screen sharing
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      // Restore camera
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        // When user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (err) {
        console.log('Screen share cancelled');
      }
    }
  };

  const endCall = async () => {
    try {
      await api.put(`/consultations/${roomId}/end`);
      socket.emit('end-call', { roomId });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      toast.success('Call ended');
      navigate('/appointments');
    } catch (error) {
      navigate('/appointments');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
      sender: user.id,
      senderName: user.name,
      content: newMessage,
      timestamp: new Date()
    };
    socket.emit('chat-message', { roomId, message: msg });
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Waiting Room
  if (inWaitingRoom) {
    return (
      <div className="video-call-page waiting-room">
        <div className="wr-card">
          <div className="wr-header">
            <h2>📹 Waiting Room</h2>
            <p>Dr. {consultation?.doctor?.user?.name || 'Doctor'} — {consultation?.type || 'Video'} Consultation</p>
          </div>

          {/* Camera Preview */}
          <div className="wr-preview">
            {audioOnly ? (
              <div className="wr-audio-preview">
                <span className="wr-audio-icon">🎤</span>
                <p>Audio Only Mode</p>
              </div>
            ) : (
              <>
                <video ref={localVideoRef} autoPlay playsInline muted className="wr-local-video" />
                {!cameraReady && (
                  <div className="wr-loading">
                    <div className="spinner" />
                    <p>Setting up your camera...</p>
                  </div>
                )}
              </>
            )}
            <div className="wr-preview-name">{user?.name || 'You'}</div>
          </div>

          {/* Controls */}
          <div className="wr-controls">
            <button className={`wr-ctrl-btn ${isMuted ? 'off' : ''}`} onClick={() => {
              setIsMuted(!isMuted);
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
              }
            }}>{isMuted ? '🔇' : '🎤'}</button>
            <button className={`wr-ctrl-btn ${isVideoOff || audioOnly ? 'off' : ''}`} onClick={() => {
              if (audioOnly) {
                setAudioOnly(false);
                // Re-init camera
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
                  localStreamRef.current = stream;
                  if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                });
              } else {
                setIsVideoOff(!isVideoOff);
                if (localStreamRef.current) {
                  localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
                }
              }
            }}>{isVideoOff || audioOnly ? '📷' : '📹'}</button>
            <button className={`wr-ctrl-btn ${audioOnly ? 'active' : ''}`} onClick={() => setAudioOnly(!audioOnly)} title="Toggle audio-only">
              {audioOnly ? '🔊 Audio Only' : '🎤 Voice Call'}
            </button>
          </div>

          {/* Join Button */}
          <button className="wr-join-btn" onClick={joinCall} disabled={!cameraReady}>
            {cameraReady ? '📞 Join Call' : '⏳ Preparing...'}
          </button>

          <div className="wr-tips">
            <p>💡 Tip: Test your camera and microphone before joining. Use headphones for best audio quality.</p>
          </div>
        </div>
      </div>
    );
  }

  // If Daily.co is configured, show their iframe
  if (videoConfig?.isConfigured && videoConfig?.roomUrl && connected) {
    return (
      <div className="video-call-page">
        <div className="vc-header">
          <div className="vc-title">
            <h2>Video Consultation</h2>
            <span className="vc-duration">⏱ {formatDuration(duration)}</span>
          </div>
          <span className="vc-status connected">● Connected via Daily.co</span>
        </div>

        {/* Daily.co iframe */}
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            ref={callFrameRef}
            src={`${videoConfig.roomUrl}${videoConfig.patientToken ? '?t=' + videoConfig.patientToken : ''}`}
            allow="camera; microphone; fullscreen; speaker"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Daily.co Video Call"
          />
        </div>

        <div className="vc-controls">
          <button className="vc-btn end-call" onClick={endCall}>📞 End Call</button>
        </div>
      </div>
    );
  }

  // Standard WebRTC/P2P view
  return (
    <div className="video-call-page">
      <div className="vc-header">
        <div className="vc-title">
          <h2>{consultation?.type || 'Video'} Consultation</h2>
          <span className="vc-duration">⏱ {formatDuration(duration)}</span>
        </div>
        <div className="vc-header-actions">
          <span className={`vc-status ${connected ? 'connected' : ''}`}>
            {connected ? '● Connected' : '○ Connecting...'}
          </span>
        </div>
      </div>

      <div className="vc-video-area">
        <div className="vc-remote">
          <video ref={remoteVideoRef} autoPlay playsInline className="vc-remote-video" />
          <div className="vc-no-video">
            <span>👤</span>
            <p>Waiting for other participant...</p>
          </div>
        </div>
        <div className="vc-local">
          <video ref={localVideoRef} autoPlay playsInline muted className="vc-local-video" />
          <span className="vc-local-name">{user?.name || 'You'}</span>
        </div>
      </div>

      <div className="vc-controls">
        <button className={`vc-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button className={`vc-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo} title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
          {isVideoOff ? '📷' : '📹'}
        </button>
        <button className={`vc-btn ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
          {isScreenSharing ? '🖥️' : '💻'}
        </button>
        <button className="vc-btn" onClick={() => setChatOpen(!chatOpen)} title="Chat">💬</button>
        <button className="vc-btn end-call" onClick={endCall} title="End Call">📞</button>
      </div>

      {chatOpen && (
        <div className="vc-chat-panel">
          <div className="vc-chat-header">
            <h4>Chat</h4>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className="vc-chat-messages">
            {messages.length === 0 && <p className="text-muted text-sm">No messages yet</p>}
            {messages.map((msg, i) => (
              <div key={i} className={`vc-msg ${msg.sender === user.id ? 'own' : ''}`}>
                <strong>{msg.senderName}</strong>
                <p>{msg.content}</p>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
          <form className="vc-chat-input" onSubmit={sendMessage}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
