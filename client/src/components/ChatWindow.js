import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Send, Plus, Smile, Check, CheckCheck } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import config from '../config';

const ChatWindow = ({ contact, socket, onContactUpdate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Fetch messages when contact changes
  useEffect(() => {
    if (contact) {
      fetchMessages();
    }
  }, [contact]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !contact) return;

    socket.on('newMessage', (data) => {
      if (data.message.senderId === contact._id) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    });

    socket.on('userTyping', (data) => {
      if (data.userId === contact._id) setIsTyping(true);
    });

    socket.on('userStopTyping', (data) => {
      if (data.userId === contact._id) setIsTyping(false);
    });

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('userStopTyping');
    };
  }, [socket, contact]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.API_URL}/messages/${contact._id}`);
      setMessages(response.data.messages);

      if (response.data.messages.some((msg) => !msg.isRead && msg.senderId === contact._id)) {
        await axios.post(`${config.API_URL}/messages/${contact._id}/mark-read`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      const response = await axios.post(`${config.API_URL}/messages/${contact._id}`, {
        message: newMessage.trim(),
      });

      setMessages((prev) => [...prev, response.data.data]);
      setNewMessage('');
      setShowEmojiPicker(false);

      if (socket) {
        socket.emit('stopTyping', { contactId: contact._id });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket) {
      socket.emit('typing', { contactId: contact._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { contactId: contact._id });
      }, 1000);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message) => message.senderId === user._id;

  const getMessageStatus = (message) => {
    if (!isOwnMessage(message)) return null;
    return message.isRead ? (
      <CheckCheck className="h-4 w-4 text-white-400" />
    ) : (
      <Check className="h-4 w-4 text-white-400" />
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-800/50 backdrop-blur-sm relative">
      {/* Header */}
      <div className="p-6 border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{contact.email.charAt(0).toUpperCase()}</span>
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                contact.isOnline ? 'bg-green-400' : 'bg-slate-500'
              }`}
            ></div>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-white">{contact.email}</h3>
            <p className="text-sm text-slate-300">
              {contact.isOnline ? 'Online' : 'Offline'} • ID: {contact.uniqueId}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[calc(100vh-200px)]">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            <div className="h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Send size={24} className="text-white" />
            </div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message._id} className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                  isOwnMessage(message)
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.message}</p>
                <div
                  className={`flex items-center justify-between mt-2 ${
                    isOwnMessage(message) ? 'text-purple-100' : 'text-slate-400'
                  }`}
                >
                  <p className="text-xs">{formatTime(message.timestamp)}</p>
                  {getMessageStatus(message)}
                </div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-3 rounded-2xl border border-white/20">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 left-6 z-50 bg-slate-800/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl"
        >
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            width={350}
            height={400}
            searchPlaceholder="Search emoji"
            skinTonesDisabled
            lazyLoadEmojis
            theme="dark"
          />
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-white/20 bg-white/5 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors duration-200"
          >
            <Plus size={20} />
          </button>

          <button
            type="button"
            onClick={toggleEmojiPicker}
            className={`p-3 rounded-xl transition-all duration-200 ${
              showEmojiPicker ? 'text-purple-400 bg-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smile size={20} />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
