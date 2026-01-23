import React, { useState, useEffect, useRef } from 'react';
import { User, MessageCircle, Send, Search, Clock, CheckCheck, Paperclip, FileText, X, Loader2, Download, ChevronLeft, Phone, Video } from 'lucide-react';
import api from '../services/api';
import { socket } from '../services/socket';
import { showAlert } from '../utils/alerts';

interface ChatUser {
  id: number;
  name: string;
  avatarUrl?: string; // If user has avatar
}

interface Conversation {
  id: number;
  lastMessageAt: string;
  unreadCount: number;
  user: ChatUser; // The other party (customer)
  messages: {
    message: string;
    createdAt: string;
    isRead: boolean;
  }[];
}

interface Message {
  id: number;
  senderId: number;
  text: string;
  time: string;
  isMine: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  metadata?: {
    type?: 'forum_post_share';
    postId?: string | number;
    title?: string;
    content?: string;
    author?: string;
    link?: string;
    image?: string;
  };
}

interface ShopChatInterfaceProps {
    initialTargetUserId?: number;
}

export const ShopChatInterface: React.FC<ShopChatInterfaceProps> = ({ initialTargetUserId }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvoId, setSelectedConvoId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [myUserId, setMyUserId] = useState<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: 'image' | 'pdf'; name: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const initializedRef = useRef(false);

    const checkUser = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setMyUserId(user.id);
        }
    };

    const fetchConversations = async () => {
        try {
            // Get current user ID first
            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).id : 0;
            
            const { data } = await api.get('/conversations');
            
            // Transform data
            const transformedConvos = data.map((c: any) => {
                let participantName = 'Unknown';
                let participantImage = undefined;
                let participantId = 0;

                // Logic matched from FloatingChat to handle Shop vs User
                if (c.shop) {
                    if (c.shop.userId === currentUserId) {
                         // I own the shop -> Show Customer
                         const otherUser = c.user1Id === currentUserId ? c.user2 : c.user1;
                         participantName = otherUser?.name || 'Unknown User';
                         participantImage = otherUser?.avatarUrl;
                         participantId = otherUser?.id || 0;
                    } else {
                         // I am customer -> Show Shop
                         participantName = c.shop.name;
                         participantImage = c.shop.imageUrl || c.shop.image;
                         participantId = c.shop.id; 
                    }

                } else {
                    // User-to-User
                    const otherUser = c.user1Id === currentUserId ? c.user2 : c.user1;
                    participantName = otherUser?.name || 'Unknown User';
                    participantImage = otherUser?.avatarUrl;
                    participantId = otherUser?.id || 0;
                }

                return {
                    id: c.id,
                    lastMessageAt: c.lastMessageAt,
                    unreadCount: c._count?.messages || 0,
                    user: { 
                        id: participantId,
                        name: participantName,
                        avatarUrl: participantImage
                    },
                    messages: c.messages || []
                };
            });
            return transformedConvos;
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    const initializeChat = async () => {
        if (initializedRef.current) return;
        initializedRef.current = true;
        setLoading(true);

        const convos = await fetchConversations();
        
        // Handle auto-selection if target user is provided
        if (initialTargetUserId) {
             try {
                 const { data: targetConvo } = await api.get(`/conversations/user/${initialTargetUserId}`);
                 
                 // Check if this conversation is already in our list
                 const exists = convos.find((c: Conversation) => c.id === targetConvo.id);
                 
                 if (!exists) {
                     // Get user details or shop details for the list item
                     // Similar transformation logic...
                     // For simplicity, let's just make a basic object or refetch (but refetch might not show it if it has no messages? Backend usually returns empty conversations)
                     // Best is to conform to the structure
                     
                     // We can just add it to the state
                     // BUT we need to transform it correctly.
                     
                     // Quick fix: Add it to the list using the returned detailed data
                     // We need the same logic as above to determine participant
                     const userStr = localStorage.getItem('user');
                     const currentUserId = userStr ? JSON.parse(userStr).id : 0;
                     
                     let participantName = 'New Chat';
                     let participantImage = undefined;
                     let participantId = 0;
                     
                     if (targetConvo.shop) {
                         if (targetConvo.shop.userId === currentUserId) {
                             const otherUser = targetConvo.user1Id === currentUserId ? targetConvo.user2 : targetConvo.user1;
                             participantName = otherUser?.name;
                             participantImage = otherUser?.avatarUrl;
                             participantId = otherUser?.id;
                         } else {
                             participantName = targetConvo.shop.name;
                             participantImage = targetConvo.shop.imageUrl;
                             participantId = targetConvo.shop.id;
                         }
                     } else {
                         const otherUser = targetConvo.user1Id === currentUserId ? targetConvo.user2 : targetConvo.user1;
                         participantName = otherUser?.name;
                         participantImage = otherUser?.avatarUrl;
                         participantId = otherUser?.id;
                     }
                     
                     const newConvoItem: Conversation = {
                         id: targetConvo.id,
                         lastMessageAt: targetConvo.lastMessageAt || new Date().toISOString(),
                         unreadCount: 0,
                         user: {
                             id: participantId,
                             name: participantName,
                             avatarUrl: participantImage
                         },
                         messages: []
                     };
                     
                     setConversations([newConvoItem, ...convos]);
                 } else {
                     setConversations(convos);
                 }
                 
                 setSelectedConvoId(targetConvo.id);
             } catch (err) {
                 console.error("Failed to load target conversation", err);
                 setConversations(convos);
             }
        } else {
            setConversations(convos);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        checkUser();
        initializeChat();
    }, [initialTargetUserId]); // Re-run if target changes

    // Socket subscription
    useEffect(() => {
        if (!selectedConvoId) return;

        const roomId = `conversation_${selectedConvoId}`;
        socket.connect();
        socket.emit('join_room', roomId);

        const handleReceive = (msg: any) => {
             // Deduplicate: If we already have this message (e.g. from optimistic update), ignore
             setMessages(prev => {
                const isDuplicate = prev.some(m => m.id === msg.id || (m.text === msg.text && m.isMine && Math.abs(new Date(m.time).getTime() - new Date(msg.time).getTime()) < 5000));
                if (isDuplicate) return prev;
                
                const type = msg.attachmentUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
                const newMsg: Message = {
                    id: msg.id,
                    senderId: msg.senderId,
                    text: msg.text,
                    time: new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    isMine: msg.senderId === myUserId,
                    attachmentUrl: msg.attachmentUrl,
                    attachmentType: msg.attachmentUrl ? type : undefined
                };
                return [...prev, newMsg];
             });
             
             // Update sidebar last message and unread count
             setConversations(prev => prev.map(c => {
                 if (c.id === msg.conversationId) {
                     const isViewing = selectedConvoId === msg.conversationId;
                     
                     return {
                         ...c,
                         lastMessageAt: new Date().toISOString(),
                         unreadCount: isViewing ? 0 : (c.unreadCount + 1),
                         messages: [{
                             message: msg.text,
                             createdAt: new Date().toISOString(),
                             isRead: false
                         }]
                     };
                 }
                 return c;
             }));
        };

        socket.on('receive_message', handleReceive);

        return () => {
            socket.off('receive_message', handleReceive);
            socket.disconnect();
        };
    }, [selectedConvoId, myUserId]);


    const handleSelectConversation = async (id: number) => {
        setSelectedConvoId(id);
        
        // Optimistic update to clear unread count
        setConversations(prev => prev.map(c => {
            if (c.id === id && c.unreadCount > 0) {
                return { ...c, unreadCount: 0 };
            }
            return c;
        }));

        try {
            await api.put(`/conversations/${id}/read`);
        } catch (error) {
            console.error('Failed to mark conversation as read', error);
        }
    };

    // Load messages when selecting a conversation
    useEffect(() => {
        if (!selectedConvoId) return;

        const loadMessages = async () => {
            try {
                const { data } = await api.get(`/conversations/${selectedConvoId}`);
                if (data.messages) {
                    setMessages(data.messages.map((m: any) => {
                        const type = m.attachmentUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
                        return {
                            id: m.id,
                            senderId: m.senderId,
                            text: m.message,
                            time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                            isMine: m.senderId === myUserId,
                            attachmentUrl: m.attachmentUrl,
                            attachmentType: m.attachmentUrl ? type : undefined
                        };
                    }));
                    scrollToBottom();
                }
            } catch (err) {
                console.error("Failed to load conversation details", err);
            }
        };

        loadMessages();
    }, [selectedConvoId, myUserId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle file selection and upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            showAlert.warning('Only images and PDFs are allowed', 'Invalid File Type');
            return;
        }

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        
        setUploading(true);
        
        // Immediate preview using local blob URL
        const localPreviewUrl = URL.createObjectURL(file);
        setPendingAttachment({
            url: localPreviewUrl, // Use local URL for preview
            type: isImage ? 'image' : 'pdf',
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
        if ((!inputText.trim() && !pendingAttachment) || !selectedConvoId) return;

        const text = inputText.trim();
        const tempId = Date.now();
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Use the server URL (not blob) for attachment if it exists
        const currentAttachment = pendingAttachment;
        const attachmentUrl = currentAttachment?.url?.startsWith('blob:') ? undefined : currentAttachment?.url;

        // Optimistic Update
        const optimisticMsg: Message = {
            id: tempId,
            senderId: myUserId,
            text: text,
            time: time,
            isMine: true,
            attachmentUrl: currentAttachment?.url, // Use blob for immediate display
            attachmentType: currentAttachment?.type
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInputText('');
        setPendingAttachment(null);

        // Update sidebar optimistically
        setConversations(prev => prev.map(c => {
            if (c.id === selectedConvoId) {
                return {
                    ...c,
                    lastMessageAt: new Date().toISOString(),
                    messages: [{ message: text, createdAt: new Date().toISOString(), isRead: true }]
                };
            }
            return c;
        }));

        try {
            await api.post(`/conversations/${selectedConvoId}/messages`, { text, attachmentUrl });
        } catch (err) {
            console.error("Failed to reply", err);
            // On error, we could remove the optimistic message
            setMessages(prev => prev.filter(m => m.id !== tempId));
            showAlert.error("Failed to send message. Please try again.");
        }
    };
    return (
        <div className="flex h-full min-h-[520px] glass-card rounded-2xl overflow-hidden border border-white/5">
           {/* Sidebar */}
           <div className="w-1/3 border-r border-white/5 bg-slate-900/50 flex flex-col">
              <div className="p-4 border-b border-white/5">
                 <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" /> Inbox
                 </h3>
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="input input-sm w-full bg-slate-800 pl-9 border-white/5 focus:outline-none"
                    />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                 {loading ? (
                    <div className="p-4 text-center text-slate-500">Loading...</div>
                 ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No conversations yet.</div>
                 ) : (
                    conversations.map(convo => (
                        <div 
                          key={convo.id} 
                          onClick={() => handleSelectConversation(convo.id)}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${selectedConvoId === convo.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm text-slate-200">{convo.user.name}</h4>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] text-slate-500">{new Date(convo.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {convo.unreadCount > 0 && (
                                        <span className="w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                                            {convo.unreadCount > 4 ? '4+' : convo.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className={`text-xs line-clamp-1 ${convo.unreadCount > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                                {convo.messages[0]?.message || 'No messages'}
                            </p>
                        </div>
                    ))
                 )}
              </div>
           </div>

           {/* Chat Area */}
           <div className="flex-1 bg-slate-950 flex flex-col relative">
              {selectedConvoId ? (
                  <>
                     {/* Chat Header */}
                     <div className="p-4 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                {conversations.find(c => c.id === selectedConvoId)?.user.avatarUrl ? (
                                    <img 
                                        src={conversations.find(c => c.id === selectedConvoId)?.user.avatarUrl} 
                                        alt="Avatar" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold">
                                    {conversations.find(c => c.id === selectedConvoId)?.user.name}
                                </h3>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Online
                                </p>
                            </div>
                        </div>
                     </div>

                     {/* Messages */}
                     <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                        {messages.length === 0 ? (
                           <div className="text-center text-slate-600 text-xs mt-4">Start of conversation history</div>
                        ) : (
                           messages.map(msg => (
                              <div key={msg.id} className={`chat ${msg.isMine ? 'chat-end' : 'chat-start'}`}>
                                 <div className={`chat-bubble rounded-2xl ${msg.isMine ? 'bg-primary text-black font-medium' : 'bg-slate-800 text-white'}`}>
                                    {/* Show attachment if present */}
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
                                    
                                    {/* Forum Post Share Preview */}
                                    {msg.metadata?.type === 'forum_post_share' && msg.metadata.link && (
                                      <a 
                                        href={msg.metadata.link}
                                        className="block bg-slate-900/80 rounded-xl overflow-hidden border border-white/10 mb-2 hover:border-primary/30 transition-colors group"
                                      >
                                        <div className="flex gap-3 p-3">
                                          {msg.metadata.image && (
                                            <img 
                                              src={msg.metadata.image.startsWith('http') ? msg.metadata.image : `http://localhost:5000${msg.metadata.image}`} 
                                              alt="" 
                                              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                            />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-white group-hover:text-primary transition-colors line-clamp-1">{msg.metadata.title}</p>
                                            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{msg.metadata.content}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">By {msg.metadata.author} • Forum Post</p>
                                          </div>
                                        </div>
                                      </a>
                                    )}
                                    
                                    {/* Regular text (hide if it's just a forum share link) */}
                                    {!(msg.metadata?.type === 'forum_post_share') && msg.text}
                                 </div>
                                 <div className="chat-footer opacity-50 text-[10px] mt-1">{msg.time}</div>
                              </div>
                           ))
                        )}
                        <div ref={messagesEndRef} />
                     </div>

                     {/* Input */}
                     <div className="p-4 bg-slate-900 border-t border-white/5">
                        {/* Pending Attachment Preview */}
                        {pendingAttachment && (
                          <div className="mb-3">
                            <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                              {pendingAttachment.type === 'image' ? (
                                <img 
                                  src={pendingAttachment.url.startsWith('blob:') ? pendingAttachment.url : `${'http://localhost:5000'}${pendingAttachment.url}`} 
                                  alt="Preview" 
                                  className="w-12 h-12 object-cover rounded-lg" 
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-primary" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white truncate">{pendingAttachment.name}</p>
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
                        
                        <div className="flex gap-2">
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             disabled={uploading}
                             className="btn btn-ghost btn-square text-slate-400 hover:text-primary disabled:opacity-50"
                           >
                             {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                           </button>
                           <input 
                             type="text" 
                             className="input input-bordered w-full bg-slate-800 border-white/5"
                             placeholder="Type a reply..."
                             value={inputText}
                             onChange={(e) => setInputText(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                           />
                           <button onClick={handleSend} disabled={uploading} className="btn btn-primary btn-square">
                              <Send className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                  </>
              ) : (
                  <div className="flex-1 flex items-center justify-center flex-col text-slate-500">
                      <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
                      <p>Select a conversation to start messaging</p>
                  </div>
              )}
           </div>
        </div>
    );
};
