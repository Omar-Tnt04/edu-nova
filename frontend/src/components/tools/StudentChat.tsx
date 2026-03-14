import { useState, useRef, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Send, User as UserIcon, Bot, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function StudentChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Advanced Inputs
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [stage, setStage] = useState("guide");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    
    setMessages((prev) => [...prev, { sender_type: "user", content: userMsg }]);
    setLoading(true);

    try {
      const payload = {
        content: userMsg,
        chat_session_id: session ? session.id : null,
        topic: topic || "general",
        difficulty: difficulty,
        stage: stage
      };

      const res = await fetchApi("/tutor", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (!session && res.chat_session_id) {
        setSession({ id: res.chat_session_id });
      }

      setMessages((prev) => [...prev, { 
        sender_type: "assistant", 
        content: res.answer, 
        raw: res.raw_tutor_response,
        meta: { difficulty, topic, stage }
      }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender_type: "error", content: err.message || "Failed to connect to Tutor Engine." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
       {/* Background */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent pointer-events-none"></div>

      {/* Configuration Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#050505]/40 backdrop-blur-xl shrink-0 flex flex-wrap gap-4 items-center justify-between relative z-20">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Topic (e.g. Vectors)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-sm px-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-neutral-600 font-mono tracking-wide w-48"
          />
          <select 
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-sm px-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors text-white appearance-none font-mono tracking-wide"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="exam">Exam Prep</option>
          </select>
        </div>
        
        <div className="flex p-1 bg-black/40 rounded-lg border border-white/10 gap-1">
          {['guide', 'hint_1', 'hint_2', 'final_answer'].map(s => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase rounded-md transition-all ${
                stage === s ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 relative z-10 scrollbar-hide">
        {messages.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <Bot size={48} className="text-blue-500 mb-6" strokeWidth={1} />
            <h2 className="text-2xl font-normal mb-3 text-white font-display tracking-tight">Ask your AI Tutor</h2>
            <p className="text-neutral-500 max-w-md font-light leading-relaxed">
              Your tutor will ground all answers in the PDFs you've uploaded to the Sources panel.
            </p>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto w-full">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 animate-enter ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender_type !== "user" && (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-lg ${
                    msg.sender_type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-black/60 border-blue-500/30 backdrop-blur-md'
                  }`}>
                    {msg.sender_type === 'error' ? <AlertCircle size={18} className="text-red-400" /> : <Bot size={18} className="text-blue-500" strokeWidth={1.5} />}
                  </div>
                )}
                
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-6 shadow-2xl relative ${
                  msg.sender_type === "user" 
                    ? "bg-white text-black rounded-tr-sm font-medium" 
                    : msg.sender_type === 'error'
                      ? "bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-sm"
                      : "bg-[#0a0a0a] border border-white/10 rounded-tl-sm text-neutral-300 backdrop-blur-md"
                }`}>
                  {msg.sender_type === "assistant" && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-blue-500/50 to-transparent"></div>}
                  <p className="whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">{msg.content}</p>
                  
                  {msg.meta && msg.sender_type === "assistant" && (
                     <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap gap-2">
                       <span className="px-2.5 py-1 bg-black/40 rounded-sm text-[10px] uppercase font-semibold text-neutral-400 border border-white/5 font-mono tracking-widest">
                         {msg.meta.topic}
                       </span>
                       <span className="px-2.5 py-1 bg-blue-900/10 rounded-sm text-[10px] uppercase font-semibold text-blue-400 border border-blue-500/20 font-mono tracking-widest">
                         {msg.meta.difficulty}
                       </span>
                       <span className="px-2.5 py-1 bg-purple-900/10 rounded-sm text-[10px] uppercase font-semibold text-purple-400 border border-purple-500/20 font-mono tracking-widest">
                         {msg.meta.stage.replace('_', ' ')}
                       </span>
                       {(msg.raw?.source_nodes || true) && (
                         <span className="px-2.5 py-1 bg-emerald-500/10 rounded-sm text-[10px] uppercase font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono tracking-widest">
                           <CheckCircle2 size={12} /> Grounded
                         </span>
                       )}
                     </div>
                  )}
                </div>

                {msg.sender_type === "user" && (
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                    <UserIcon size={18} className="text-white" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4 justify-start animate-enter">
                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center shrink-0 border border-blue-500/30 backdrop-blur-md shadow-lg">
                  <Bot size={18} className="text-blue-500" strokeWidth={1.5} />
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl rounded-tl-sm p-6 flex items-center gap-4 shadow-2xl backdrop-blur-md">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                  <span className="text-neutral-400 text-sm font-mono tracking-widest uppercase text-[10px]">Analyzing sources & formulating response...</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-[#050505]/60 backdrop-blur-xl shrink-0 border-t border-white/5 relative z-20">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor something... (e.g. Can you explain the second paragraph?)"
            className="w-full bg-black/40 border border-white/10 rounded-full pl-6 pr-16 py-4 focus:outline-none focus:border-blue-500 focus:bg-black/60 transition-all text-white shadow-inner placeholder:text-neutral-600 font-light"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 w-12 btn-hover-effect bg-white disabled:bg-white/10 disabled:text-neutral-600 disabled:border-transparent text-black rounded-full flex items-center justify-center transition-all shadow-sm group-focus-within:bg-blue-500 group-focus-within:text-white"
          >
            <Send size={18} className={input.trim() && !loading ? "translate-x-0.5" : ""} strokeWidth={2} />
          </button>
        </form>
        <p className="text-center text-[10px] text-neutral-600 mt-4 font-mono tracking-widest uppercase">
          AI answers are grounded in your uploaded documents.
        </p>
      </div>
    </div>
  );
}
