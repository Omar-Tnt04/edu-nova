import React, { useState } from 'react';
import { BrainCircuit, Play, CheckCircle2, XCircle, Award, Loader2, RefreshCw, X, ArrowRight, Lightbulb, AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export function QuizTool() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizState, setQuizState] = useState('setup'); // 'setup', 'playing', 'review'
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);


  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setError("");
    setQuizData(null);
    setAnswers({});
    setSubmitted(false);
    setQuizState('playing'); // Set quiz state to playing after generation
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(0);

    try {
      const res = await fetchApi("/quiz", {
        method: "POST",
        body: JSON.stringify({
          topic,
          difficulty,
          question_count: count,
          chat_session_id: "quiz-session-1" // Mock
        })
      });
      setQuizData(res);
      setQuestions(res.quiz); // Assuming res.quiz contains the array of questions
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz.");
      setQuizState('setup'); // Go back to setup on error
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    let currentScore = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct_answer) {
        currentScore++;
      }
    });
    setScore(currentScore);
    return currentScore;
  };

  const handleSelect = (option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: option
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // End of quiz, calculate score and go to review
      calculateScore();
      setQuizState('review');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto">
      {/* Config Panel */}
      <div className="p-6 border-b border-white/5 bg-[#050505]/40 backdrop-blur-xl shrink-0 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
        
        <h2 className="text-xl font-medium flex items-center gap-3 text-white mb-6 font-display tracking-tight">
          <BrainCircuit className="text-blue-500/80" strokeWidth={1.5} />
          Quiz Generator
        </h2>
        
        <div className="flex flex-wrap items-end gap-4 max-w-4xl">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Topic</label>
            <input 
              type="text" 
              placeholder="e.g. Photosynthesis"
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
            <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-[0.2em] font-mono">Questions</label>
            <input 
              type="number" 
              min={1} max={10}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={!topic || loading || quizState !== 'setup'}
            className="btn-hover-effect bg-white text-black px-8 py-2.5 rounded-sm text-xs font-semibold tracking-widest uppercase flex items-center gap-2 transition-all disabled:opacity-50 h-[42px]"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Generate
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center overflow-hidden relative z-10 w-full max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 w-full">
            <AlertCircle size={18} className="inline-block mr-2 -mt-0.5" />
            {error}
          </div>
        )}

        {quizState === 'setup' && !loading && (
           <div className="flex flex-col items-center justify-center text-center opacity-40 mt-20">
             <BrainCircuit size={64} className="text-neutral-600 mb-6" strokeWidth={1} />
             <h3 className="text-xl font-normal text-white mb-2 font-display">Knowledge Check</h3>
             <p className="text-neutral-500 max-w-sm font-light">Generate a custom test based purely on the documents currently indexed in your knowledge base.</p>
           </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center animate-enter mt-20">
             <div className="relative">
               <div className="w-16 h-16 rounded-full border border-white/10"></div>
               <div className="w-16 h-16 rounded-full border border-blue-500 border-t-transparent animate-spin absolute inset-0"></div>
             </div>
             <p className="text-neutral-400 mt-6 font-medium animate-pulse tracking-widest uppercase text-xs">Synthesizing Questions...</p>
          </div>
        )}

        {quizState === 'playing' && currentQuestion && (
          <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-enter">
            {/* Progress Bar */}
            <div className="bg-white/5 h-1.5 w-full">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
              />
            </div>

            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-[0.2em] border border-white/10 px-2 py-1 rounded-sm">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-mono text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-sm">
                  {difficulty}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl text-white font-normal mb-8 leading-relaxed font-display">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((opt: string, idx: number) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-300 flex items-start gap-4 group ${
                        isSelected 
                          ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                          : "bg-[#111] border-white/5 hover:border-white/20 hover:bg-[#161616]"
                      }`}
                    >
                      <div className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mt-0.5 transition-colors ${
                        isSelected ? "border-blue-500 text-blue-400" : "border-neutral-600 text-transparent group-hover:border-neutral-400"
                      }`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <span className={`text-base leading-relaxed ${isSelected ? "text-white" : "text-neutral-300"}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-white/5 bg-black/40 flex justify-between items-center backdrop-blur-md">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-sm font-semibold tracking-widest uppercase text-neutral-500 hover:text-white disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              
              <button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className="btn-hover-effect px-8 py-2.5 bg-white text-black text-xs font-semibold tracking-widest uppercase rounded-sm disabled:opacity-30 transition-all flex items-center gap-2"
              >
                {currentQuestionIndex === questions.length - 1 ? "Submit" : "Next"}
                {currentQuestionIndex !== questions.length - 1 && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {quizState === 'review' && (
          <div className="w-full max-w-3xl animate-enter mb-10 pb-10">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 mb-8 text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500"></div>
               <Award size={48} className="mx-auto text-blue-500 mb-4" strokeWidth={1} />
               <h2 className="text-3xl font-normal text-white mb-2 font-display">Quiz Complete</h2>
               <p className="text-neutral-400 mb-6 font-light">Score: <span className="text-2xl text-white font-medium ml-2">{score} / {questions.length}</span></p>
               
               <button 
                  onClick={() => setQuizState('setup')}
                  className="btn-hover-effect bg-white text-black px-8 py-2.5 rounded-sm font-semibold text-xs tracking-widest uppercase inline-flex items-center gap-2"
               >
                 <RefreshCw size={16} /> New Quiz
               </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => {
                const isCorrect = selectedAnswers[idx] === q.correct_answer;
                return (
                  <div key={idx} className={`border rounded-xl p-6 relative overflow-hidden ${
                    isCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                  }`}>
                    {/* Minimal decorative line indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}></div>

                    <div className="flex items-start gap-4 ml-2">
                       <div className="mt-1 shrink-0">
                          {isCorrect ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />}
                       </div>
                       <div>
                         <p className="text-lg text-white mb-4 leading-relaxed font-normal">{q.question}</p>
                         
                         <div className="space-y-2 mb-4">
                            <div className="text-sm">
                               <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mr-2">Your Answer:</span>
                               <span className={isCorrect ? "text-emerald-400" : "text-red-400"}>{selectedAnswers[idx]}</span>
                            </div>
                            {!isCorrect && (
                               <div className="text-sm">
                                  <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mr-2">Correct Answer:</span>
                                  <span className="text-emerald-400">{q.correct_answer}</span>
                               </div>
                            )}
                         </div>

                         <div className="bg-black/30 border border-white/5 rounded-lg p-4 backdrop-blur-sm">
                            <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest mb-2 flex items-center gap-2"><Lightbulb size={12} className="text-amber-500"/> Explanation</p>
                            <p className="text-sm text-neutral-300 leading-relaxed font-light">{q.explanation}</p>
                         </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
