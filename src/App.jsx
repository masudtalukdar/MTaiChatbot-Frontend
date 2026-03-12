import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Menu, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile after send

    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    try {
      const response = await fetch('/api/chat', { 
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: newMessages }),
});

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                const otherMsgs = prev.slice(0, -1);
                return [...otherMsgs, { ...lastMsg, content: lastMsg.content + parsed.content }];
              });
            } catch (e) { console.error(e); }
          }
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0E14] text-slate-200 overflow-hidden font-sans relative">
      
      {/* MOBILE TOP NAV (Visible only on mobile) */}
      <header className="md:hidden absolute top-0 w-full z-20 bg-[#12161F]/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Bot size={20} className="text-indigo-500" />
            <span className="font-bold text-white tracking-tighter">MT<span className="text-indigo-400">ai</span></span>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                <Trash2 size={20} />
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg">
                <Menu size={20} />
            </button>
        </div>
      </header>

      {/* SIDEBAR OVERLAY (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:relative z-40 h-full w-72 bg-[#12161F] border-r border-slate-800/50 
        flex flex-col p-4 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Close (Mobile) */}
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-4 top-6 text-slate-400">
            <X size={24} />
        </button>

        <div className="flex items-center gap-3 px-2 mb-10 mt-4">
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl">
            <Bot size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tighter text-white">MT<span className="text-indigo-400">ai</span></h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Chatbot v1.0</span>
          </div>
        </div>

        <button onClick={() => setMessages([])} className="flex items-center gap-2 w-full p-3 rounded-lg hover:bg-slate-800 transition-colors text-sm text-slate-400 border border-slate-800 shadow-sm">
          <Trash2 size={16} /> Delete Conversation
        </button>

        <div className="mt-auto p-4 bg-indigo-600/5 rounded-xl border border-indigo-500/10">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">Developer</p>
          <p className="text-sm font-semibold text-white">Masud Talukdar</p>
          <p className="text-xs text-slate-400 italic">University of Verona</p>
          <p className="text-xs text-slate-400 italic">Verona, Italy</p>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Sparkles className="text-indigo-500 mb-4 animate-pulse" size={48} />
              <h2 className="text-2xl font-bold text-white">Welcome to MTaiChatbot</h2>
              <p className="max-w-xs text-slate-400 text-sm mt-2">Powered by Gemini 3.1 Flash-Lite. Ask about 2026 events or coding help.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-slate-800 border border-slate-700'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-indigo-400" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-[13px] md:text-sm leading-relaxed prose prose-invert max-w-none shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#1A1F29] border border-slate-800'}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 md:p-6 bg-[#0B0E14]">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message MTaiChatbot..."
              className="w-full bg-[#1A1F29] border border-slate-800 rounded-2xl py-3.5 md:py-4 pl-5 pr-14 focus:outline-none focus:border-indigo-500/50 text-white placeholder-slate-500"
            />
            <button type="submit" disabled={isLoading} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl">
              <Send size={18} />
            </button>
          </form>
          <p className="text-center text-[9px] text-slate-600 mt-4 uppercase tracking-widest">MTaiChatbot v1.0 | Masud Talukdar | 2026</p>
        </div>
      </main>
    </div>
  );
}

export default App;