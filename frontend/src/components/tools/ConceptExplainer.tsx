import { useState } from "react";
import { Lightbulb, Loader2, Play, CheckCircle2, Copy, BookOpen } from "lucide-react";
import { fetchApi } from "@/lib/api";

export function ConceptExplainer() {
  const [concept, setConcept] = useState("");
  const [isBeginner, setIsBeginner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanationData, setExplanationData] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!concept) return;
    setLoading(true);
    setError("");
    setExplanationData(null);
    setCopied(false);

    try {
      const res = await fetchApi("/concept/explain", {
        method: "POST",
        body: JSON.stringify({
          concept_name: concept,
          beginner_mode: isBeginner,
          chat_session_id: "concept-session-1" // Mock
        })
      });
      setExplanationData(res);
    } catch (err: any) {
      setError(err.message || "Failed to explain concept.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
      if (!explanationData) return;
      navigator.clipboard.writeText(explanationData.explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto">
      {/* Config Panel */}
      <div className="p-6 border-b border-white/5 bg-[#050505]/40 backdrop-blur-xl shrink-0 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>

        <h2 className="text-xl font-medium flex items-center gap-3 text-white mb-6 font-display tracking-tight">
          <Lightbulb className="text-blue-500/80" strokeWidth={1.5} />
          Concept Explainer
        </h2>
        
        <div className="flex flex-wrap items-end gap-4 max-w-4xl relative z-10">
          <div className="space-y-1.5 flex-1 min-w-[250px]">
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Target Concept</label>
            <input 
              type="text" 
              placeholder="What do you want to break down?"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-neutral-700"
            />
          </div>
          <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-3 rounded-sm h-[42px] transition-colors hover:border-white/20">
            <input 
                type="checkbox" 
                id="beginnerToggle"
                checked={isBeginner}
                onChange={(e) => setIsBeginner(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-blue-500 focus:ring-blue-500/20 bg-black/50 accent-blue-500"
            />
            <label htmlFor="beginnerToggle" className="text-xs font-medium text-neutral-300 cursor-pointer tracking-wide select-none">
              Explain in simple terms
            </label>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={!concept || loading}
            className="btn-hover-effect bg-white text-black px-8 py-2.5 rounded-sm text-xs font-semibold tracking-widest uppercase flex items-center gap-2 transition-all disabled:opacity-50 h-[42px]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Analyze
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center relative z-10 w-full max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 w-full">
            {error}
          </div>
        )}

        {!explanationData && !loading && (
           <div className="flex flex-col items-center justify-center text-center opacity-40 py-20">
             <Lightbulb size={64} className="text-neutral-600 mb-6" strokeWidth={1} />
             <h3 className="text-xl font-normal text-white mb-2 font-display">Deep Dive</h3>
             <p className="text-neutral-500 max-w-md font-light">The explainer breaks down complex topics into digestible components and cites exactly where the information came from in your documents.</p>
           </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center animate-enter py-20 mt-10">
             <div className="relative">
               <div className="w-16 h-16 rounded-full border border-white/10"></div>
               <div className="w-16 h-16 rounded-full border border-blue-500 border-t-transparent animate-spin absolute inset-0"></div>
             </div>
             <p className="text-neutral-400 mt-6 font-medium animate-pulse tracking-widest uppercase text-xs">Deconstructing concept via source texts...</p>
          </div>
        )}

        {explanationData && (
          <div className="w-full max-w-3xl animate-enter space-y-6 pb-20">
            {/* Main Explanation Card */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                <div className="bg-white/2 p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
                           <span className="px-2 py-1 bg-emerald-500/10 rounded-sm text-[10px] uppercase tracking-widest text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
                               <CheckCircle2 size={12} /> Grounded
                           </span>
                           {isBeginner && (
                               <span className="px-2 py-1 bg-blue-500/10 rounded-sm text-[10px] uppercase tracking-widest text-blue-400 border border-blue-500/20 font-mono">
                                   Beginner Mode
                               </span>
                           )}
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-display font-medium text-white tracking-tight leading-tight">{concept}</h1>
                    </div>
                    
                    <button 
                        onClick={handleCopy}
                        className="btn-hover-effect shrink-0 p-3 text-neutral-400 hover:text-white bg-black/40 border border-white/10 rounded-lg transition-colors shadow-sm"
                        title="Copy to clipboard"
                    >
                        {copied ? <CheckCircle2 size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" /> : <Copy size={20} />}
                    </button>
                </div>
                
                <div className="p-6 md:p-8 prose prose-invert prose-p:leading-relaxed prose-p:text-neutral-300 prose-headings:font-display prose-headings:font-medium prose-a:text-blue-400 max-w-none">
                    <p className="text-neutral-300 text-lg leading-relaxed whitespace-pre-wrap font-light">
                        {explanationData.explanation}
                    </p>
                </div>
            </div>

            {/* Sources Citations */}
            {explanationData.raw_tutor_response?.source_nodes && explanationData.raw_tutor_response.source_nodes.length > 0 && (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 shadow-lg">
                    <h3 className="text-[10px] font-semibold text-neutral-500 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] font-mono">
                        <BookOpen size={14} /> Source Citations
                    </h3>
                    
                    <div className="space-y-4">
                        {explanationData.raw_tutor_response.source_nodes.map((node: any, idx: number) => (
                            <div key={idx} className="p-5 bg-black/40 border border-white/5 hover:border-blue-500/30 rounded-lg transition-colors group">
                                <p className="text-sm text-neutral-400 leading-relaxed font-light italic mb-4">"{node.text}"</p>
                                <div className="flex flex-wrap gap-4 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                                   <span className="flex items-center gap-1.5"><span className="text-blue-500/80">File:</span> <span className="text-neutral-300">{node.metadata?.file_name || 'Unknown'}</span></span>
                                   <span className="flex items-center gap-1.5"><span className="text-blue-500/80">Page:</span> <span className="text-neutral-300">{node.metadata?.page_label || 'Unknown'}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
