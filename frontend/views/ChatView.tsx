import React, { useState, useRef, useEffect } from 'react';
import { Shop } from '../types';
import { Send, ArrowLeft, Phone, Video, Paperclip, CheckCheck, MapPin } from 'lucide-react';

interface ChatViewProps {
  shop: Shop;
  onBack: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'shop';
  text: string;
  time: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ shop, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'shop', 
      text: `G'day! 👋 We're ready to get under the hood of your ride. How can we help?`, 
      time: '10:30 AM' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMsg: Message = { 
      id: Date.now(), 
      sender: 'user', 
      text: inputText, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    
    // Simulate auto-reply
    setTimeout(() => {
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            sender: 'shop', 
            text: "Got it. Feel free to attach a quick photo or video of the noise/symptom so we can have our tech look at it before you arrive.", 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        }]);
    }, 1500);
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
                        <img src={shop.image} alt={shop.name} className="object-cover w-full h-full" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-slate-900 shadow-sm"></div>
                </div>
                <div>
                    <h3 className="font-black italic uppercase tracking-tighter text-lg leading-none">{shop.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Mechanic Online</p>
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
                        {msg.sender === 'shop' ? shop.name : 'Vehicle Owner'}
                    </div>
                    <div className={`chat-bubble rounded-2xl p-4 shadow-xl border ${msg.sender === 'user' ? 'bg-primary text-black font-bold border-primary shadow-primary/10' : 'bg-slate-800 text-white border-white/5 shadow-black/40'}`}>
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
            <div className="flex items-center gap-2 max-w-3xl mx-auto bg-slate-800 p-1 rounded-2xl border border-white/5 shadow-inner">
                <button className="btn btn-ghost btn-circle text-slate-400 hover:text-primary">
                    <Paperclip className="w-5 h-5" />
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
                  className={`btn btn-circle shadow-lg transition-all ${inputText.trim() ? 'btn-primary shadow-primary/20 scale-100' : 'btn-ghost text-slate-500 scale-90'}`}
                  onClick={handleSend}
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