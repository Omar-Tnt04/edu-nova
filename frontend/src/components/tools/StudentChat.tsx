import { useState, useRef, useEffect } from "react";
import { askTutor, SourceItem } from "@/lib/api";
import { Send, User as UserIcon, Bot, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type ChatMessage = {
  sender_type: "user" | "assistant" | "error";
  content: string;
  meta?: {
    difficulty?: string;
    topic?: string | null;
    stage?: string;
    grounded?: boolean;
    session_id?: string | null;
    sources?: SourceItem[];
    question?: string;
  };
};

interface StudentChatProps {
  sessionId: string;
  onSessionIdChange: (sessionId: string) => void;
  onDemoModeComplete?: (payload: {
    topic: string;
    difficulty: "beginner" | "intermediate" | "exam";
  }) => void;
  demoHandoffStatus?: "idle" | "to_quiz" | "to_flashcards" | "complete";
  hasActiveDocument?: boolean | null;
}

const STAGES: Array<{ label: string; value: "guide" | "hint1" | "hint2" | "answer" }> = [
  { label: "Guide", value: "guide" },
  { label: "Hint 1", value: "hint1" },
  { label: "Hint 2", value: "hint2" },
  { label: "Answer", value: "answer" },
];

const STAGE_ORDER: Array<"guide" | "hint1" | "hint2" | "answer"> = ["guide", "hint1", "hint2", "answer"];
const DEMO_ASSISTANT_DELAY_MS = 950;
const DEMO_USER_GAP_MS = 700;

function stageLabel(stage?: string): string {
  switch ((stage || "").toLowerCase()) {
    case "guide":
      return "Guide";
    case "hint1":
      return "Hint 1";
    case "hint2":
      return "Hint 2";
    case "answer":
      return "Answer";
    default:
      return "Unknown";
  }
}

export function StudentChat({
  sessionId,
  onSessionIdChange,
  onDemoModeComplete,
  demoHandoffStatus = "idle",
  hasActiveDocument = null,
}: StudentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(-1);
  const [demoStatus, setDemoStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [actionError, setActionError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Advanced Inputs
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "exam">("beginner");
  const [stage, setStage] = useState<"guide" | "hint1" | "hint2" | "answer">("guide");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  const latestUserQuestion = [...messages].reverse().find((m) => m.sender_type === "user")?.content || "";

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const requestTutorStage = async (question: string, selectedStage: "guide" | "hint1" | "hint2" | "answer") => {
    const res = await askTutor({
      question,
      session_id: sessionId,
      topic: topic || "general",
      difficulty,
      stage: selectedStage,
    });

    if (res.session_id && res.session_id !== sessionId) {
      onSessionIdChange(res.session_id);
    }

    setMessages((prev) => [
      ...prev,
      {
        sender_type: "assistant",
        content: res.response || "No response text returned.",
        meta: {
          difficulty: res.difficulty || difficulty,
          topic: res.topic || topic || "general",
          stage: res.stage || selectedStage,
          grounded: Boolean(res.grounded),
          session_id: res.session_id || sessionId,
          sources: Array.isArray(res.sources) ? res.sources : [],
          question,
        },
      },
    ]);
  };

  const getIterationStageOptions = (currentStage?: string): Array<"guide" | "hint1" | "hint2" | "answer"> => {
    const normalized = (currentStage || "").toLowerCase() as "guide" | "hint1" | "hint2" | "answer";
    if (!STAGE_ORDER.includes(normalized)) {
      return STAGE_ORDER;
    }

    const currentIndex = STAGE_ORDER.indexOf(normalized);
    const afterCurrent = STAGE_ORDER.slice(currentIndex + 1);
    if (afterCurrent.length > 0) {
      return afterCurrent;
    }

    return ["guide", "hint1"];
  };

  const getIterationTimelineForQuestion = (question: string): Array<"guide" | "hint1" | "hint2" | "answer"> => {
    const stages = messages
      .filter((m) => m.sender_type === "assistant" && m.meta?.question === question && m.meta?.stage)
      .map((m) => (m.meta?.stage || "").toLowerCase())
      .filter((s): s is "guide" | "hint1" | "hint2" | "answer" => STAGE_ORDER.includes(s as any));

    const orderedUnique: Array<"guide" | "hint1" | "hint2" | "answer"> = [];
    for (const s of stages) {
      if (!orderedUnique.includes(s)) {
        orderedUnique.push(s);
      }
    }
    return orderedUnique;
  };

  const handleQuickStage = async (selectedStage: "guide" | "hint1" | "hint2" | "answer") => {
    if (loading || demoLoading) {
      return;
    }

    const inlineQuestion = input.trim();
    const baseQuestion = inlineQuestion || latestUserQuestion;
    if (!baseQuestion) {
      setActionError("Type a question first, then use one-click Guide/Hint/Answer buttons.");
      return;
    }

    setActionError("");
    setStage(selectedStage);

    if (inlineQuestion) {
      setMessages((prev) => [...prev, { sender_type: "user", content: inlineQuestion }]);
      setInput("");
    }

    setLoading(true);
    try {
      await requestTutorStage(baseQuestion, selectedStage);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender_type: "error", content: err.message || "Failed to connect to Tutor Engine." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionStageAction = async (
    question: string,
    selectedStage: "guide" | "hint1" | "hint2" | "answer"
  ) => {
    if (loading || demoLoading) {
      return;
    }

    setActionError("");
    setStage(selectedStage);
    setLoading(true);
    try {
      await requestTutorStage(question, selectedStage);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender_type: "error", content: err.message || "Failed to connect to Tutor Engine." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    if (loading || demoLoading) {
      return;
    }

    const inlineQuestion = input.trim();
    const demoQuestion = inlineQuestion || latestUserQuestion || `Help me understand ${topic || "this topic"} step by step.`;
    const demoTopic = topic.trim() || "General Concepts";

    setActionError("");
    if (inlineQuestion) {
      setMessages((prev) => [...prev, { sender_type: "user", content: inlineQuestion }]);
      setInput("");
    }

    setDemoStatus("running");
    setDemoStepIndex(-1);
    setDemoLoading(true);
    try {
      const demoScript: Array<{ stage: "guide" | "hint1" | "hint2" | "answer"; userFollowup?: string }> = [
        { stage: "guide", userFollowup: "Can I get the first hint?" },
        { stage: "hint1", userFollowup: "I still need another hint." },
        { stage: "hint2", userFollowup: "Got it. Please show the final answer." },
        { stage: "answer" },
      ];

      for (let i = 0; i < demoScript.length; i++) {
        const step = demoScript[i];
        setDemoStepIndex(i);
        setStage(step.stage);
        await requestTutorStage(demoQuestion, step.stage);
        await sleep(DEMO_ASSISTANT_DELAY_MS);

        if (step.userFollowup) {
          setMessages((prev) => [...prev, { sender_type: "user", content: step.userFollowup! }]);
          await sleep(DEMO_USER_GAP_MS);
        }
      }

      setDemoStatus("done");
      onDemoModeComplete?.({ topic: demoTopic, difficulty });
    } catch (err: any) {
      setDemoStatus("error");
      setMessages((prev) => [
        ...prev,
        { sender_type: "error", content: err.message || "Demo mode failed while contacting Tutor Engine." },
      ]);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || demoLoading) return;

    const userMsg = input.trim();
    setInput("");
    setActionError("");

    setMessages((prev) => [...prev, { sender_type: "user", content: userMsg }]);
    setLoading(true);

    try {
      await requestTutorStage(userMsg, stage);
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
            onChange={(e) => setDifficulty(e.target.value as "beginner" | "intermediate" | "exam")}
            className="bg-black/40 border border-white/10 rounded-sm px-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors text-white appearance-none font-mono tracking-wide"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="exam">Exam Prep</option>
          </select>
        </div>

        <div className="flex p-1 bg-black/40 rounded-lg border border-white/10 gap-1">
          {STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStage(s.value)}
              className={`px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase rounded-md transition-all ${stage === s.value ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-full flex flex-wrap items-center gap-2 pt-1">
          {STAGES.map((s) => (
            <button
              key={`quick-${s.value}`}
              onClick={() => handleQuickStage(s.value)}
              disabled={loading || demoLoading}
              className="px-3 py-1.5 rounded-sm border border-white/15 text-[10px] uppercase tracking-[0.18em] text-neutral-300 hover:text-white hover:border-blue-500/60 hover:bg-blue-500/10 transition-all disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={handleDemoMode}
            disabled={loading || demoLoading}
            className="px-3 py-1.5 rounded-sm border border-emerald-500/35 text-[10px] uppercase tracking-[0.18em] text-emerald-300 hover:text-white hover:bg-emerald-500/15 transition-all disabled:opacity-50"
          >
            {demoLoading ? "Running Demo..." : "Demo Mode"}
          </button>
          <span className="text-[10px] text-neutral-500 uppercase tracking-[0.16em]">
            One-click stage actions + scripted demo
          </span>
        </div>

        <div className="w-full flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Demo Script</span>
          {STAGE_ORDER.map((step, idx) => {
            const isActive = demoStatus === "running" && idx === demoStepIndex;
            const isDone = demoStatus === "done" || idx < demoStepIndex;
            const isError = demoStatus === "error" && idx === demoStepIndex;

            return (
              <div key={`demo-step-${step}`} className="flex items-center gap-2">
                {idx > 0 && <span className="text-[10px] text-neutral-600">→</span>}
                <span
                  className={`px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.14em] border transition-all ${isActive
                      ? "border-blue-500/50 text-blue-300 bg-blue-500/10"
                      : isDone
                        ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                        : isError
                          ? "border-red-500/45 text-red-300 bg-red-500/10"
                          : "border-white/10 text-neutral-500 bg-black/25"
                    }`}
                >
                  {stageLabel(step)}
                </span>
              </div>
            );
          })}
          <span className={`text-[10px] uppercase tracking-[0.16em] ${demoStatus === "running"
              ? "text-blue-300"
              : demoStatus === "done"
                ? "text-emerald-300"
                : demoStatus === "error"
                  ? "text-red-300"
                  : "text-neutral-600"
            }`}>
            {demoStatus === "running"
              ? `running ${stageLabel(STAGE_ORDER[Math.max(demoStepIndex, 0)])}`
              : demoStatus === "done"
                ? "completed"
                : demoStatus === "error"
                  ? "failed"
                  : "ready"}
          </span>
        </div>

        {demoStatus === "done" && (
          <div className="w-full flex items-center gap-2 pt-1">
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Demo Handoff</span>
            <span className={`text-[10px] uppercase tracking-[0.16em] ${demoHandoffStatus === "to_quiz"
                ? "text-blue-300"
                : demoHandoffStatus === "to_flashcards"
                  ? "text-violet-300"
                  : demoHandoffStatus === "complete"
                    ? "text-emerald-300"
                    : "text-neutral-600"
              }`}>
              {demoHandoffStatus === "to_quiz"
                ? "auto-switching to quiz"
                : demoHandoffStatus === "to_flashcards"
                  ? "auto-switching to flashcards"
                  : demoHandoffStatus === "complete"
                    ? "handoff complete"
                    : "waiting"}
            </span>
          </div>
        )}

        {actionError && (
          <div className="w-full text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-md px-3 py-2">
            {actionError}
          </div>
        )}

        {hasActiveDocument === false && (
          <div className="w-full text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
            No active document uploaded. Add a PDF in the Sources panel to get grounded answers.
          </div>
        )}
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-lg ${msg.sender_type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-black/60 border-blue-500/30 backdrop-blur-md'
                    }`}>
                    {msg.sender_type === 'error' ? <AlertCircle size={18} className="text-red-400" /> : <Bot size={18} className="text-blue-500" strokeWidth={1.5} />}
                  </div>
                )}

                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-6 shadow-2xl relative ${msg.sender_type === "user"
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
                        {msg.meta.stage}
                      </span>
                      {msg.meta.grounded && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 rounded-sm text-[10px] uppercase font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono tracking-widest">
                          <CheckCircle2 size={12} /> Grounded
                        </span>
                      )}
                      {!msg.meta.grounded && (
                        <span className="px-2.5 py-1 bg-amber-500/10 rounded-sm text-[10px] uppercase font-semibold text-amber-300 border border-amber-500/30 font-mono tracking-widest">
                          Low confidence
                        </span>
                      )}
                    </div>
                  )}

                  {msg.meta?.session_id && msg.sender_type === "assistant" && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                      session: {msg.meta.session_id}
                    </p>
                  )}

                  {(msg.meta?.sources?.length || 0) > 0 && msg.sender_type === "assistant" && (
                    <div className="mt-4 border border-white/10 rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-white/5 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">
                        Sources
                      </div>
                      <div className="divide-y divide-white/10">
                        {msg.meta?.sources?.map((source, sourceIdx) => (
                          <div key={`${source.file || "source"}-${sourceIdx}`} className="px-3 py-2 text-xs text-neutral-300 flex flex-wrap gap-3">
                            <span>Page: {source.page ?? "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.sender_type === "assistant" && msg.meta?.question && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Next Iteration</span>
                      {getIterationStageOptions(msg.meta.stage).map((stageOption) => {
                        const stageLabel = STAGES.find((s) => s.value === stageOption)?.label || stageOption;
                        return (
                          <button
                            key={`next-${i}-${stageOption}`}
                            onClick={() => handleQuestionStageAction(msg.meta!.question!, stageOption)}
                            disabled={loading || demoLoading}
                            className="px-2.5 py-1 rounded-sm border border-white/15 text-[10px] uppercase tracking-[0.14em] text-neutral-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                          >
                            {stageLabel}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          setInput("Can you explain this further with another example?");
                          setTimeout(() => {
                            const inputEl = document.querySelector<HTMLInputElement>('input[placeholder^="Ask your tutor"]');
                            inputEl?.focus();
                          }, 0);
                        }}
                        className="px-2.5 py-1 rounded-sm border border-blue-500/30 text-[10px] uppercase tracking-[0.14em] text-blue-300 hover:text-white hover:bg-blue-500/15 transition-all"
                      >
                        Follow-up
                      </button>
                    </div>
                  )}

                  {msg.sender_type === "user" && (
                    <div className="mt-4 pt-4 border-t border-black/10 flex flex-wrap items-center gap-2">
                      {STAGES.map((s) => (
                        <button
                          key={`msg-${i}-${s.value}`}
                          onClick={() => handleQuestionStageAction(msg.content, s.value)}
                          disabled={loading || demoLoading}
                          className="px-2.5 py-1 rounded-sm border border-black/20 text-[10px] uppercase tracking-[0.14em] text-black/80 hover:text-black hover:bg-black/5 transition-all disabled:opacity-50"
                        >
                          {s.label}
                        </button>
                      ))}
                      <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">
                        One-click for this question
                      </span>

                      {getIterationTimelineForQuestion(msg.content).length > 0 && (
                        <div className="w-full mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-[0.14em] text-black/60">Path:</span>
                          <span className="px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.12em] border border-black/15 text-black/70">
                            Q
                          </span>
                          {getIterationTimelineForQuestion(msg.content).map((s) => (
                            <div key={`timeline-${i}-${s}`} className="flex items-center gap-2">
                              <span className="text-[10px] text-black/40">→</span>
                              <span className="px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.12em] border border-black/15 text-black/70">
                                {stageLabel(s)}
                              </span>
                            </div>
                          ))}
                        </div>
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

            {(loading || demoLoading) && (
              <div className="flex gap-4 justify-start animate-enter">
                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center shrink-0 border border-blue-500/30 backdrop-blur-md shadow-lg">
                  <Bot size={18} className="text-blue-500" strokeWidth={1.5} />
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl rounded-tl-sm p-6 flex items-center gap-4 shadow-2xl backdrop-blur-md">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                  <span className="text-neutral-400 text-sm font-mono tracking-widest uppercase text-[10px]">
                    {demoLoading
                      ? `Running demo sequence: ${stageLabel(STAGE_ORDER[Math.max(demoStepIndex, 0)])}`
                      : "Analyzing sources & formulating response..."}
                  </span>
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
            disabled={loading || demoLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || demoLoading}
            className="absolute right-2 top-2 bottom-2 w-12 btn-hover-effect bg-white disabled:bg-white/10 disabled:text-neutral-600 disabled:border-transparent text-black rounded-full flex items-center justify-center transition-all shadow-sm group-focus-within:bg-blue-500 group-focus-within:text-white"
          >
            <Send size={18} className={input.trim() && !loading && !demoLoading ? "translate-x-0.5" : ""} strokeWidth={2} />
          </button>
        </form>
        <p className="text-center text-[10px] text-neutral-600 mt-4 font-mono tracking-widest uppercase">
          Session {sessionId.slice(0, 8)}... active. AI answers are grounded in your uploaded documents.
        </p>
      </div>
    </div>
  );
}
