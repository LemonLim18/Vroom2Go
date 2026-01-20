import React, { useState, useRef, useEffect } from 'react';
import { Shop } from '../types';
import { socket } from '../services/socket';
import api from '../services/api';
import { Send, ArrowLeft, Phone, Video, Paperclip, CheckCheck, MapPin, FileText, X, Loader2, Download, Trash2, Edit2 } from 'lucide-react';
import { showAlert } from '../utils/alerts';

interface ChatViewProps {
  shop: Shop;
  onBack: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'shop';
  text: string;
  time: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
}

export const ChatView: React.FC<ChatViewProps> = ({ shop, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: 'image' | 'pdf'; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch history and connect socket
  useEffect(() => {
    let isSubscribed = true;

    const fetchConversation = async () => {
        try {
            const { data } = await api.get(`/conversations/user/${shop.userId}`);
            if (isSubscribed) {
                setConversationId(data.id);
                // Transform backend messages to frontend format
                const loadedMessages = data.messages.map((m: any) => {
                    const type = m.attachmentUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
                    return {
                        id: m.id,
                        sender: m.senderId === shop.userId ? 'shop' : 'user', 
                        text: m.message,
                        time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        attachmentUrl: m.attachmentUrl,
                        attachmentType: m.attachmentUrl ? type : undefined
                    };
                });
                // If empty, add welcome message
                if (loadedMessages.length === 0) {
                     setMessages([{ 
                        id: 0, 
                        sender: 'shop', 
                        text: `G'day! 👋 We're ready to get under the hood of your ride. How can we help?`, 
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    }]);
                } else {
                    setMessages(loadedMessages);
                }
            }
        } catch (error) {
            console.error('Failed to load conversation', error);
        }
    };

    fetchConversation();

    return () => {
        isSubscribed = false;
    };
  }, [shop.id]); // Re-run when shop changes

  // Socket subscription
  useEffect(() => {
    if (!conversationId) return;

    // Room ID must match backend: conversation_{id}
    const roomId = `conversation_${conversationId}`;
    
    socket.connect();
    socket.emit('join_room', roomId);

    const handleReceiveMessage = (msg: any) => {
        // Get current user ID to check if this is our own message
        const userStr = localStorage.getItem('user');
        const currentUserId = userStr ? JSON.parse(userStr).id : null;
        
        // Skip if this message was sent by us (already shown via optimistic update)
        if (msg.senderId === currentUserId) {
            return;
        }
        
        // Transform incoming message
        // Transform incoming message
        const type = msg.attachmentUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
        const newMsg: Message = {
            id: msg.id,
            sender: msg.senderId === shop.userId ? 'shop' : 'user',
            text: msg.text,
            time: new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            attachmentUrl: msg.attachmentUrl,
            attachmentType: msg.attachmentUrl ? type : undefined
        };

        // Prevent dupes by checking ID
        setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
        });
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.disconnect();
    };
  }, [conversationId]);


  // Handle file selection and upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      showAlert.warning('Only images and PDFs are allowed', 'Invalid File Type');
      return;
    }

    setUploading(true);
    
    // Immediate preview using local blob URL
    const localPreviewUrl = URL.createObjectURL(file);
    setPendingAttachment({
        url: localPreviewUrl, // Use local URL for preview
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        name: file.name
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/upload/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update with real server URL
      setPendingAttachment(prev => prev ? { ...prev, url: data.url } : null);
    } catch (error) {
      console.error('Failed to upload file:', error);
      showAlert.error('Failed to upload file. Please try again.');
      setPendingAttachment(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !pendingAttachment) return;
    
    // Use the server URL (not blob) for attachment
    const attachmentUrl = pendingAttachment?.url?.startsWith('blob:') ? undefined : pendingAttachment?.url;
    const attachmentType = pendingAttachment?.type;
    const text = inputText.trim();
    
    const tempId = Date.now();
    const optimisticMsg: Message = { 
        id: tempId, 
        sender: 'user', 
        text: text, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        attachmentUrl,
        attachmentType
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');
    setPendingAttachment(null);

    try {
        const payload = { text, attachmentUrl };
        
        if (conversationId) {
             const { data } = await api.post(`/conversations/${conversationId}/messages`, payload);
             setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
        } else {
             const { data } = await api.post(`/conversations/user/${shop.userId}/messages`, payload);
             setConversationId(data.conversationId);
             setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
        }
    } catch (error) {
        console.error('Failed to send message', error);
        setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-white/5 animate-in slide-in-from-bottom-8 duration-500 mx-auto max-w-4xl">
        {/* Header */}
        <div className="bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="btn btn-ghost btn-circle btn-sm text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
                        <img src={shop.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1000'} alt={shop.name} className="object-cover w-full h-full" />
                    </div>
                </div>
                <div>
                    <h3 className="font-black italic uppercase tracking-tighter text-lg leading-none">{shop.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Online</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-1">
                <button className="btn btn-ghost btn-circle text-slate-400 hover:text-primary transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="btn btn-ghost btn-circle text-slate-400 hover:text-primary transition-colors"><Video className="w-5 h-5" /></button>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50 relative scrollbar-hide">
            {/* Grid background effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
            
            <div className="text-center mb-4">
              <span className="text-[10px] uppercase font-black tracking-widest bg-slate-800 px-3 py-1 rounded-full text-slate-500 border border-white/5">Secured & Encrypted Pit-Link</span>
            </div>

            {messages.map((msg) => (
                <div key={msg.id} className={`chat ${msg.sender === 'user' ? 'chat-end' : 'chat-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className="chat-header text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">
                        {msg.sender === 'shop' ? shop.name : 'Driver'}
                    </div>
                    <div className={`chat-bubble rounded-2xl p-4 shadow-xl border ${msg.sender === 'user' ? 'bg-primary text-black font-bold border-primary shadow-primary/10' : 'bg-slate-800 text-white border-white/5 shadow-black/40'}`}>
                                    {msg.attachmentUrl && msg.attachmentType === 'image' && (
                                      <img 
                                        src={`${'http://localhost:5000'}${msg.attachmentUrl}`}
                                        alt="Attachment" 
                                        className="max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-90"
                                        onClick={() => window.open(`${'http://localhost:5000'}${msg.attachmentUrl}`, '_blank')}
                                      />
                                    )}
                                    {msg.attachmentUrl && msg.attachmentType === 'pdf' && (
                                      <a 
                                        href={`${'http://localhost:5000'}${msg.attachmentUrl}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg mb-2 hover:bg-black/30"
                                      >
                                        <FileText className="w-5 h-5" />
                                        <span className="text-sm">View PDF Document</span>
                                      </a>
                                    )}
                        {msg.text}
                    </div>
                    <div className="chat-footer mt-1 flex items-center gap-1">
                        <time className="text-[10px] text-slate-600 font-bold">{msg.time}</time>
                        {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-primary opacity-70" />}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-slate-900 p-4 border-t border-white/10">
            {/* Pending Attachment Preview */}
            {pendingAttachment && (
              <div className="max-w-3xl mx-auto mb-3">
                <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                  {pendingAttachment.type === 'image' ? (
                    <img 
                      src={pendingAttachment.url.startsWith('blob:') ? pendingAttachment.url : `${'http://localhost:5000'}${pendingAttachment.url}`} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-lg" 
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white truncate">{pendingAttachment.name}</p>
                    <p className="text-xs text-slate-400">{pendingAttachment.type.toUpperCase()}</p>
                  </div>
                  <button onClick={() => setPendingAttachment(null)} className="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            
            <div className="flex items-center gap-2 max-w-3xl mx-auto bg-slate-800 p-1 rounded-2xl border border-white/5 shadow-inner">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn btn-ghost btn-circle text-slate-400 hover:text-primary disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input 
                    type="text" 
                    className="input bg-transparent w-full focus:outline-none placeholder-slate-600 text-white font-medium" 
                    placeholder="Type technical query..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  className={`btn btn-circle shadow-lg transition-all ${(inputText.trim() || pendingAttachment) ? 'btn-primary shadow-primary/20 scale-100' : 'btn-ghost text-slate-500 scale-90'}`}
                  onClick={handleSend}
                  disabled={uploading}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            <div className="flex justify-center gap-6 mt-3">
              <button className="text-[10px] font-black uppercase italic text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Share Location
              </button>
              <button className="text-[10px] font-black uppercase italic text-slate-500 hover:text-primary transition-colors flex items-center gap-1">
                <Video className="w-3 h-3" /> Start Live Scan
              </button>
            </div>
        </div>
    </div>
  );
};