import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';
import './ChatConsultation.css';

const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
  withCredentials: true
});

export default function ChatConsultation() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [consultation, setConsultation] = useState(null);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get(`/consultations/${roomId}`);
        setConsultation(res.data.consultation);
        setMessages(res.data.consultation.messages || []);

        const msgRes = await api.get(`/consultations/${roomId}/messages`);
        if (msgRes.data.messages) setMessages(msgRes.data.messages);

        socket.emit('join-room', roomId);
        await api.put(`/consultations/${roomId}/start`);
      } catch (error) {
        console.error(error);
      }
    };

    init();

    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('typing', () => setTyping(true));
    socket.on('stop-typing', () => setTyping(false));

    return () => {
      socket.off('chat-message');
      socket.off('typing');
      socket.off('stop-typing');
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    socket.emit('typing', { roomId, userId: user.id });
    setTimeout(() => {
      socket.emit('stop-typing', { roomId, userId: user.id });
    }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      sender: user.id,
      senderName: user.name,
      content: newMessage,
      timestamp: new Date()
    };

    socket.emit('chat-message', { roomId, message: msgData });

    try {
      await api.post(`/consultations/${roomId}/message`, {
        content: newMessage,
        messageType: 'text'
      });
    } catch (error) {
      console.error(error);
    }

    setNewMessage('');
  };

  const handleFileShare = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // In production, upload to cloud storage first
      const fakeUrl = URL.createObjectURL(file);
      const msgData = {
        sender: user.id,
        senderName: user.name,
        content: `Shared a file: ${file.name}`,
        messageType: 'file',
        fileUrl: fakeUrl,
        fileName: file.name,
        timestamp: new Date()
      };

      socket.emit('chat-message', { roomId, message: msgData });

      try {
        await api.post(`/consultations/${roomId}/message`, {
          content: `Shared: ${file.name}`,
          messageType: 'file',
          fileUrl: fakeUrl,
          fileName: file.name
        });
        await api.post(`/consultations/${roomId}/share-report`, {
          fileName: file.name,
          fileUrl: fakeUrl,
          fileType: file.type
        });
      } catch (error) {
        console.error(error);
      }
    };
    input.click();
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="chat-avatar">👨‍⚕️</div>
            <div>
              <h3>Consultation</h3>
              <span className="chat-status">● Active</span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => handleFileShare('file')}>📎 Attach</button>
            <button className="btn btn-ghost btn-sm" onClick={() => handleFileShare('image')}>🖼️ Image</button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">💬</div>
              <h3>Consultation Started</h3>
              <p>Start chatting with your healthcare provider. You can share text messages, files, and images.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.sender === user?.id ? 'own' : 'other'}`}>
              <div className="msg-avatar">
                {msg.sender === user?.id ? '🧑' : '👨‍⚕️'}
              </div>
              <div className="msg-content">
                <div className="msg-header">
                  <strong>{msg.senderName || 'User'}</strong>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {msg.messageType === 'file' ? (
                  <div className="msg-file">
                    📄 <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">{msg.fileName}</a>
                  </div>
                ) : msg.messageType === 'image' ? (
                  <img src={msg.fileUrl} alt="" className="msg-image" />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {typing && <div className="typing-indicator">typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input-bar" onSubmit={sendMessage}>
          <button type="button" className="attach-btn" onClick={() => handleFileShare('file')}>📎</button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
            placeholder="Type your message..."
          />
          <button type="submit" className="btn btn-primary btn-sm">Send</button>
        </form>
      </div>
    </div>
  );
}
