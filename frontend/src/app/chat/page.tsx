"use client";

import { useState } from "react";
import { SourcesSidebar } from "@/components/SourcesSidebar";
import { StudioSidebar } from "@/components/StudioSidebar";
import { UploadModal } from "@/components/UploadModal";

import { StudentChat } from "@/components/tools/StudentChat";
import { QuizTool } from "@/components/tools/QuizTool";
import { FlashcardTool } from "@/components/tools/FlashcardTool";
import { ConceptExplainer } from "@/components/tools/ConceptExplainer";

export default function ChatDashboard() {
  const [activeTool, setActiveTool] = useState("chat");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  const handleUploadSuccess = (res: any) => {
    // In a real app we'd get the actual filename from the file state in the modal, 
    // but for now we'll mock it or extract if possible from response
    const newDoc = {
      id: Math.random().toString(),
      filename: "Uploaded_Source.pdf",
      status: 'indexed',
      pages: res.pages_processed || 0,
      chunks: res.chunks_indexed || 0
    };
    setDocuments(prev => [...prev, newDoc]);
    setIsUploadOpen(false);
  };

  const renderActiveTool = () => {
    switch (activeTool) {
      case "chat": return <StudentChat />;
      case "quiz": return <QuizTool />;
      case "flashcards": return <FlashcardTool />;
      case "concept": return <ConceptExplainer />;
      default: return <StudentChat />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-blue-500/30 relative">
      {/* Background Layer Group matching Landing Page */}
      <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505]/80 to-[#050505]"></div>
          <div className="absolute inset-0 grid-bg opacity-[0.05]" style={{ maskImage: "linear-gradient(to bottom, black, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent)" }}></div>
      </div>

      {/* Outer Shell Wrapper for 3-Pane Layout */}
      <div className="flex w-full h-full relative z-10 backdrop-blur-2xl">
          {/* Left Pane - Sources */}
          <SourcesSidebar documents={documents} onOpenUpload={() => setIsUploadOpen(true)} />
          
          {/* Center Pane - Active Tool */}
          <div className="flex-1 flex flex-col relative bg-transparent min-w-0 border-r border-white/5 shadow-2xl z-20">
            {renderActiveTool()}
          </div>

          {/* Right Pane - Studio Tools */}
          <StudioSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      </div>

      {/* Upload Modal Overlay */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={handleUploadSuccess} 
      />
    </div>
  );
}
