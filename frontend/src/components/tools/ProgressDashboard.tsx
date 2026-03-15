import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, AlertCircle, BarChart3 } from "lucide-react";
import { getProgress, ProgressResponse } from "@/lib/api";

export function ProgressDashboard() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProgress = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getProgress();
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to load progress data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const sortedTopics = useMemo(() => {
    if (!data?.topics) {
      return [];
    }
    return [...data.topics].sort((a, b) => b.mastery_score - a.mastery_score);
  }, [data]);

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto">
      <div className="p-6 border-b border-white/5 bg-[#050505]/40 backdrop-blur-xl shrink-0 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium flex items-center gap-3 text-white mb-2 font-display tracking-tight">
              <Activity className="text-blue-500/80" strokeWidth={1.5} />
              Learning Progress
            </h2>
            <p className="text-xs text-neutral-500 tracking-wide">
              Progress analytics from the tutor engine.
            </p>
          </div>
          <button
            onClick={loadProgress}
            disabled={loading}
            className="btn-hover-effect bg-white text-black px-6 py-2.5 rounded-sm text-xs font-semibold tracking-widest uppercase flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-6xl w-full mx-auto">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border border-white/10 border-t-blue-500 animate-spin" />
            <p className="text-neutral-500 text-xs uppercase tracking-[0.2em] mt-4 font-mono">
              Loading progress data...
            </p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">Total Questions</p>
                <p className="text-3xl text-white mt-2 font-display">{data.total_questions || 0}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">Sessions Tracked</p>
                <p className="text-3xl text-white mt-2 font-display">{data.sessions_tracked || 0}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono">Topics Covered</p>
                <p className="text-3xl text-white mt-2 font-display">{data.topics?.length || 0}</p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
              <h3 className="text-sm text-white mb-4 flex items-center gap-2 uppercase tracking-[0.2em] font-mono">
                <BarChart3 size={14} className="text-blue-400" />
                Topic Mastery
              </h3>

              {sortedTopics.length === 0 ? (
                <p className="text-sm text-neutral-500">No topic progress available yet. Ask tutor questions to build analytics.</p>
              ) : (
                <div className="space-y-4">
                  {sortedTopics.map((topic) => {
                    const mastery = Math.max(0, Math.min(100, Math.round(topic.mastery_score || 0)));
                    return (
                      <div key={topic.topic} className="p-4 bg-black/40 border border-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-white">{topic.topic}</p>
                          <p className="text-xs text-neutral-400 font-mono">{mastery}% mastery</p>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${mastery}%` }} />
                        </div>
                        <div className="mt-3 text-xs text-neutral-500 flex flex-wrap gap-4">
                          <span>Questions: {topic.questions_asked}</span>
                          <span>Answers: {topic.answers_seen}</span>
                          <span>Hints: {topic.hints_used}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
              <h3 className="text-sm text-white mb-4 uppercase tracking-[0.2em] font-mono">Recent Events</h3>
              {!data.recent_events || data.recent_events.length === 0 ? (
                <p className="text-sm text-neutral-500">No recent events yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 border-b border-white/10">
                        <th className="py-2 pr-4 font-medium">Time</th>
                        <th className="py-2 pr-4 font-medium">Session</th>
                        <th className="py-2 pr-4 font-medium">Topic</th>
                        <th className="py-2 pr-4 font-medium">Stage</th>
                        <th className="py-2 pr-4 font-medium">Difficulty</th>
                        <th className="py-2 pr-4 font-medium">Hints</th>
                        <th className="py-2 pr-4 font-medium">Grounded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_events.map((event, idx) => (
                        <tr key={`${event.session_id}-${idx}`} className="border-b border-white/5 text-neutral-300">
                          <td className="py-3 pr-4">{new Date(event.timestamp).toLocaleString()}</td>
                          <td className="py-3 pr-4 font-mono text-xs">{event.session_id.slice(0, 8)}...</td>
                          <td className="py-3 pr-4">{event.topic}</td>
                          <td className="py-3 pr-4">{event.stage}</td>
                          <td className="py-3 pr-4">{event.difficulty}</td>
                          <td className="py-3 pr-4">{event.hints_used_before_answer}</td>
                          <td className="py-3 pr-4">{event.grounded ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
