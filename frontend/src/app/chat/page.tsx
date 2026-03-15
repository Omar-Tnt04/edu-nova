"use client";

import { useEffect, useState } from "react";
import { getPipelineStatus } from "@/lib/api";
import { SourcesSidebar } from "@/components/SourcesSidebar";
import { StudioSidebar } from "@/components/StudioSidebar";
import { UploadModal } from "@/components/UploadModal";

import { StudentChat } from "@/components/tools/StudentChat";
import { QuizTool } from "@/components/tools/QuizTool";
import { FlashcardTool } from "@/components/tools/FlashcardTool";
import { ConceptExplainer } from "@/components/tools/ConceptExplainer";
import { ProgressDashboard } from "@/components/tools/ProgressDashboard";

type UploadedDocument = {
  id: string;
  filename: string;
  status: "indexed" | "uploading" | "error";
  pages: number;
  chunks: number;
};

type UploadResult = {
  filename?: string;
  pages?: number;
  chunks?: number;
};

type DemoHandoffStatus = "idle" | "to_quiz" | "to_flashcards" | "complete";

export default function ChatDashboard() {
  const [activeTool, setActiveTool] = useState("chat");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [sessionId, setSessionId] = useState("session-initial");
  const [demoTopic, setDemoTopic] = useState("");
  const [demoDifficulty, setDemoDifficulty] = useState<"beginner" | "intermediate" | "exam">("beginner");
  const [demoQuizRunId, setDemoQuizRunId] = useState(0);
  const [demoFlashcardsRunId, setDemoFlashcardsRunId] = useState(0);
  const [demoHandoffStatus, setDemoHandoffStatus] = useState<DemoHandoffStatus>("idle");
  const [hasActiveDocument, setHasActiveDocument] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      setSessionId(crypto.randomUUID());
      return;
    }
    setSessionId(`session-${Date.now()}`);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadPipelineStatus = async () => {
      try {
        const status = await getPipelineStatus();
        if (!mounted) {
          return;
        }
        setHasActiveDocument(Boolean(status.has_active_document));
      } catch {
        if (!mounted) {
          return;
        }
        setHasActiveDocument(null);
      }
    };

    void loadPipelineStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUploadSuccess = (res: UploadResult) => {
    const newDoc: UploadedDocument = {
      id: Math.random().toString(),
      filename: res.filename || "Uploaded_Source.pdf",
      status: 'indexed',
      pages: res.pages || 0,
      chunks: res.chunks || 0
    };
    setDocuments(prev => [...prev, newDoc]);
    setHasActiveDocument(true);
    setIsUploadOpen(false);
  };

  const handleDemoModeComplete = (payload: {
    topic: string;
    difficulty: "beginner" | "intermediate" | "exam";
  }) => {
    setDemoHandoffStatus("to_quiz");
    setDemoTopic(payload.topic);
    setDemoDifficulty(payload.difficulty);
    setDemoQuizRunId((prev) => prev + 1);
    setActiveTool("quiz");

    window.setTimeout(() => {
      setDemoHandoffStatus("to_flashcards");
      setDemoFlashcardsRunId((prev) => prev + 1);
      setActiveTool("flashcards");

      window.setTimeout(() => {
        setDemoHandoffStatus("complete");
      }, 1200);
    }, 2400);
  };

  const renderActiveTool = () => {
    switch (activeTool) {
      case "chat":
        return (
          <StudentChat
            sessionId={sessionId}
            onSessionIdChange={setSessionId}
            onDemoModeComplete={handleDemoModeComplete}
            demoHandoffStatus={demoHandoffStatus}
            hasActiveDocument={hasActiveDocument}
          />
        );
      case "quiz":
        return (
          <QuizTool
            sessionId={sessionId}
            demoTopic={demoTopic}
            demoDifficulty={demoDifficulty}
            demoRunId={demoQuizRunId}
          />
        );
      case "flashcards":
        return (
          <FlashcardTool
            sessionId={sessionId}
            demoTopic={demoTopic}
            demoDifficulty={demoDifficulty}
            demoRunId={demoFlashcardsRunId}
          />
        );
      case "concept": return <ConceptExplainer sessionId={sessionId} />;
      case "progress": return <ProgressDashboard />;
      default:
        return (
          <StudentChat
            sessionId={sessionId}
            onSessionIdChange={setSessionId}
            onDemoModeComplete={handleDemoModeComplete}
            demoHandoffStatus={demoHandoffStatus}
            hasActiveDocument={hasActiveDocument}
          />
        );
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
