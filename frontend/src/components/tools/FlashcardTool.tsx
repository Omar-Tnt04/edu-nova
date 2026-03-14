import { useState } from "react";
import { Layers, Loader2, Play, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export function FlashcardTool() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setError("");
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const res = await fetchApi("/flashcards", {
        method: "POST",
        body: JSON.stringify({
          topic,
          difficulty,
          count,
          chat_session_id: "fc-session-1" // Mock
        })
      });
      if (res.flashcards && res.flashcards.length > 0) {
          setCards(res.flashcards);
      } else {
          setError("No flashcards could be generated from the given topic and sources.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c - 1), 150);
    }
  };

  const shuffleCards = () => {
      setIsFlipped(false);
      setTimeout(() => {
          const shuffled = [...cards].sort(() => Math.random() - 0.5);
          setCards(shuffled);
          setCurrentIndex(0);
      }, 150);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      {/* Config Panel */}
      <div className="p-6 border-b border-white/5 bg-[#050505]/40 backdrop-blur-xl shrink-0 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
        
        <h2 className="text-xl font-medium flex items-center gap-3 text-white mb-6 font-display tracking-tight">
          <Layers className="text-blue-500/80" strokeWidth={1.5} />
          Flashcards Studio
        </h2>
        
        <div className="flex flex-wrap items-end gap-4 max-w-4xl">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Topic</label>
            <input 
              type="text" 
              placeholder="e.g. History of ML"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-neutral-700"
            />
          </div>
          <div className="space-y-1.5 w-40">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Difficulty</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white appearance-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="space-y-1.5 w-32">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Count</label>
            <input 
              type="number" 
              min={1} max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={!topic || loading}
            className="btn-hover-effect bg-white text-black px-8 py-2.5 rounded-sm text-xs font-semibold tracking-widest uppercase flex items-center gap-2 transition-all disabled:opacity-50 h-[42px]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Generate
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center overflow-y-auto relative z-10 w-full max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 w-full">
            {error}
          </div>
        )}

        {!cards.length && !loading && (
           <div className="flex flex-col items-center justify-center text-center opacity-40 mt-10">
             <Layers size={64} className="text-neutral-600 mb-6" strokeWidth={1} />
             <h3 className="text-xl font-normal text-white mb-2 font-display">Study with Flashcards</h3>
             <p className="text-neutral-500 max-w-sm font-light">Enter a topic to generate a custom deck of flashcards grounded in your uploaded materials.</p>
           </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center animate-enter mt-10">
             <div className="relative">
               <div className="w-16 h-16 rounded-full border border-white/10"></div>
               <div className="w-16 h-16 rounded-full border border-blue-500 border-t-transparent animate-spin absolute inset-0"></div>
             </div>
             <p className="text-neutral-400 mt-6 font-medium animate-pulse tracking-widest uppercase text-xs">Designing your deck...</p>
          </div>
        )}

        {cards.length > 0 && (
          <div className="w-full max-w-2xl flex flex-col items-center space-y-8 animate-enter duration-500">
            {/* 3D Scene Container */}
            <div className="w-full aspect-[3/2] perspective-[1000px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
              <motion.div 
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={{ rotateX: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 group-hover:border-blue-500/30 transition-colors overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent pointer-events-none"></div>
                    <span className="absolute top-6 left-6 text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Front</span>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-normal text-white leading-relaxed font-display relative z-10">{cards[currentIndex].front}</h3>
                    <p className="absolute bottom-6 text-neutral-500 text-xs flex items-center gap-2 font-light tracking-wide"><RefreshCw size={12}/> Click to flip</p>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden bg-blue-950/20 backdrop-blur-md border border-blue-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center overflow-y-auto shadow-[0_0_30px_rgba(59,130,246,0.1)]" style={{ transform: "rotateX(180deg)" }}>
                    <span className="absolute top-6 left-6 text-[10px] font-semibold text-blue-500/80 uppercase tracking-[0.2em] font-mono">Back</span>
                    <p className="text-lg md:text-xl text-neutral-200 leading-relaxed font-light">{cards[currentIndex].back}</p>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 bg-black/40 backdrop-blur-md border border-white/5 px-8 py-4 rounded-full shadow-lg">
              <button 
                onClick={(e) => { e.stopPropagation(); prevCard(); }} 
                disabled={currentIndex === 0}
                className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
              >
                <ChevronLeft size={24} />
              </button>
              
              <span className="text-xs font-mono font-medium text-white tracking-[0.2em] w-20 text-center uppercase">
                {currentIndex + 1} <span className="text-neutral-500 mx-1">/</span> {cards.length}
              </span>

              <button 
                onClick={(e) => { e.stopPropagation(); nextCard(); }} 
                disabled={currentIndex === cards.length - 1}
                className="p-2.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="flex gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); shuffleCards(); }} 
                  className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors font-medium tracking-widest uppercase"
                >
                    <RefreshCw size={14} /> Shuffle Deck
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
