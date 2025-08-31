import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LogOut, Plus, Circle, MessageCircle, Bell } from 'lucide-react';
import config from '../config';
import AddContactModal from './AddContactModal';
import ChatWindow from './ChatWindow';

const ChatDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
    fetchUnreadCounts();
  }, []);

  // Listen for ESC key to close chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedContact) {
        setSelectedContact(null);
        //toast('Chat closed', { icon: '❌' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedContact]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (data) => {
      if (data.message.senderId !== user._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.message.senderId]: (prev[data.message.senderId] || 0) + 1
        }));
        toast.success(`New message from ${data.sender.email}`, {
          duration: 3000,
          icon: '💬',
        });
      }
    });

    socket.on('userOnline', (data) => {
      setContacts(prev => prev.map(contact =>
        contact._id === data.userId
          ? { ...contact, isOnline: true }
          : contact
      ));
    });

    socket.on('userOffline', (data) => {
      setContacts(prev => prev.map(contact =>
        contact._id === data.userId
          ? { ...contact, isOnline: false }
          : contact
      ));
    });

    return () => {
      socket.off('newMessage');
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, [socket, selectedContact, user._id]);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/contacts`);
      setContacts(response.data.contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/messages/unread/count`);
      const counts = {};
      response.data.unreadCounts.forEach(item => {
        counts[item.contactId] = item.unreadCount;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const handleAddContact = async (uniqueId) => {
    try {
      const response = await axios.post(`${config.API_URL}/contacts/add`, { uniqueId });
      setContacts(prev => [response.data.contact, ...prev]);
      setShowAddContact(false);
      toast.success('Contact added successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add contact');
    }
  };

  const handleContactSelect = async (contact) => {
    setSelectedContact(contact);

    if (unreadCounts[contact._id] > 0) {
      try {
        await axios.post(`${config.API_URL}/messages/${contact._id}/mark-read`);
        setUnreadCounts(prev => ({
          ...prev,
          [contact._id]: 0
        }));
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">OUR chat</h1>
                <p className="text-sm text-slate-300">Welcome back!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getTotalUnreadCount() > 0 && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-purple-400" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* User Status */}
          <div className="flex items-center mb-4">
            <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs text-slate-300">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Add Contact Button */}
          <button
            onClick={() => setShowAddContact(true)}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            <Plus size={16} className="mr-2" />
            Add Contact
          </button>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">No contacts yet</p>
              <p className="text-sm mt-1">Add a contact to start chatting</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {contacts.map((contact) => {
                const unreadCount = unreadCounts[contact._id] || 0;
                return (
                  <div
                    key={contact._id}
                    onClick={() => handleContactSelect(contact)}
                    className={`p-4 cursor-pointer hover:bg-white/5 transition-all duration-200 ${
                      selectedContact?._id === contact._id
                        ? 'bg-white/10 border-r-2 border-purple-500 shadow-glow'
                        : ''
                    } ${unreadCount > 0 ? 'bg-purple-500/10' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {contact.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${
                          contact.isOnline ? 'bg-green-400' : 'bg-slate-500'
                        }`}></div>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{contact.email}</p>
                          {unreadCount > 0 && (
                            <span className="text-xs text-red-400 font-bold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">ID: {contact.uniqueId}</p>
                        <p className="text-xs text-slate-500">
                          {contact.isOnline ? 'Online' : `Last seen ${formatLastSeen(contact.lastSeen)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <ChatWindow
            contact={selectedContact}
            socket={socket}
            onContactUpdate={(updatedContact) => {
              setContacts(prev => prev.map(c =>
                c._id === updatedContact._id ? updatedContact : c
              ));
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-24 w-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
                <MessageCircle size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Welcome to OUR chat</h3>
              <p className="text-slate-300 text-lg mb-2">Select a contact from the sidebar</p>
              <p className="text-slate-400">to start your conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAddContact={handleAddContact}
      />
    </div>
  );
};

export default ChatDashboard;
