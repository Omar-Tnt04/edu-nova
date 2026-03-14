import Link from "next/link";
import { BookOpen, Map, Settings, MessageSquare, LogOut } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          EduNova
        </h2>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <BookOpen size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/chat" className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <MessageSquare size={20} />
          <span>Tutor Chat</span>
        </Link>
        <div className="pt-4 mt-4 border-t border-gray-800">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Coming Soon</p>
          <div className="flex items-center gap-3 px-3 py-2 text-gray-600 cursor-not-allowed">
            <Map size={20} />
            <span>Weak Topics</span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-gray-600 cursor-not-allowed">
            <Settings size={20} />
            <span>AI Quizzes</span>
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
