import { Plus, FileText, CheckCircle2, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { BackendStatus } from "@/components/BackendStatus";

interface Document {
  id: string;
  filename: string;
  status: 'uploading' | 'indexed' | 'error';
  chunks?: number;
  pages?: number;
}

interface SourcesSidebarProps {
  documents: Document[];
  onOpenUpload: () => void;
}

export function SourcesSidebar({ documents, onOpenUpload }: SourcesSidebarProps) {
  return (
    <aside className="w-72 bg-[#050505]/80 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col shrink-0 relative z-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="p-6 pb-6 relative z-10">
        <Link href="/" className="flex flex-col group inline-block focus:outline-none">
            <span className="leading-none uppercase group-hover:opacity-80 transition-opacity text-2xl font-semibold tracking-tight font-display bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">EduNova</span>
            <span className="leading-none uppercase group-hover:text-white transition-colors text-[10px] font-light text-neutral-500 tracking-[0.25em] font-display mt-1.5">Local AI Tutor</span>
        </Link>
      </div>

      <div className="px-5 pb-6 border-b border-white/5 relative z-10">
        <button 
          onClick={onOpenUpload}
          className="btn-hover-effect w-full flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white transition-all py-3 px-4 rounded-sm font-medium tracking-widest uppercase text-xs"
        >
          <Plus size={16} />
          Add Source
        </button>
      </div>

      <BackendStatus />

      <div className="flex-1 overflow-y-auto p-5 space-y-4 relative z-10">
        <div>
          <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-4 px-1 font-display">Active Sources</h3>
          {documents.length === 0 ? (
            <div className="text-center py-10 px-4 border border-white/5 border-dashed rounded-lg bg-white/[0.02]">
              <FileText className="mx-auto text-neutral-700 mb-3" size={24} strokeWidth={1.5} />
              <p className="text-xs text-neutral-500 tracking-wide">No sources indexed yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="bg-black/40 border border-white/5 rounded-lg p-3.5 group hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${doc.status === 'indexed' ? 'text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.6)]' : 'text-neutral-400'}`}>
                      {doc.status === 'indexed' ? <CheckCircle2 size={16} /> : <Loader2 size={16} className="animate-spin text-blue-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-200 truncate group-hover:text-white transition-colors">{doc.filename}</p>
                      <div className="flex gap-3 mt-1.5 text-[11px] text-neutral-500 tracking-widest uppercase font-mono">
                        {doc.pages && <span>{doc.pages} Pgs</span>}
                        {doc.chunks && <span>{doc.chunks} Chks</span>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/50 relative z-10">
        <button 
          onClick={() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="flex items-center justify-center gap-3 w-full text-center text-neutral-500 hover:text-white transition-colors tracking-widest uppercase text-xs font-semibold py-2"
        >
          <LogOut size={16} />
          <span>Exit Tutor</span>
        </button>
      </div>
    </aside>
  );
}
