import { 
  MessageSquare, 
  BrainCircuit, 
  Layers, 
  Lightbulb,
  Activity
} from "lucide-react";

interface StudioSidebarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export function StudioSidebar({ activeTool, setActiveTool }: StudioSidebarProps) {
  const tools = [
    { id: "chat", label: "Tutor Chat", icon: <MessageSquare size={18} /> },
    { id: "quiz", label: "Quiz Builder", icon: <BrainCircuit size={18} /> },
    { id: "flashcards", label: "Flashcards", icon: <Layers size={18} /> },
    { id: "concept", label: "Explain Concept", icon: <Lightbulb size={18} /> },
    { id: "progress", label: "Progress", icon: <Activity size={18} /> },
  ];

  return (
    <aside className="w-64 bg-[#050505]/60 backdrop-blur-xl border-l border-white/5 hidden lg:flex flex-col shrink-0 relative z-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="p-6 pb-4 border-b border-white/5 relative z-10">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase font-display">Studio Tools</h2>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-300 text-sm font-medium relative group overflow-hidden ${
                isActive 
                  ? "bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/30" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              {isActive && (
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>
              )}
              <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'group-hover:scale-110'}`}>
                {tool.icon}
              </span>
              <span className="relative z-10 tracking-wide">{tool.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-5 mt-auto border-t border-white/5 bg-black/40 backdrop-blur-md relative z-10">
        <p className="text-[11px] leading-relaxed text-neutral-500 font-light">
          EduNova Studio tools use the uploaded sources to generate <span className="text-neutral-300 font-medium tracking-wide">AI-grounded</span> material.
        </p>
      </div>
    </aside>
  );
}
