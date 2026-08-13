import { useEffect, useState } from "react";
import CodeEditor from "../components/editor/CodeEditor";
import { languageTemplates, SupportedLanguage } from "../constants/templates";
import { runCode, getHint, evaluateCode, logProgress, getProgress } from "../api/practice";
import toast from "react-hot-toast";
import Spinner from "../components/ui/Spinner";

export default function PracticeArena() {
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState(languageTemplates.python);
  const [stdin, setStdin] = useState("");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"hint" | "evaluation">("hint");
  const [userQuestion, setUserQuestion] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isEvaluateLoading, setIsEvaluateLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    is_correct: boolean;
    score: number;
    feedback: string;
    improvements: string[];
  } | null>(null);

  const fetchProgress = async () => {
    try {
      const data = await getProgress();
      setSolvedCount(data.total_solved);
    } catch (err) {
      console.error("Unable to load practice progress", err);
    }
  };

  useEffect(() => {
    void fetchProgress();
  }, []);

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setStdout("");
      setStderr("");
      const result = await runCode({
        source_code: code,
        language,
        stdin
      });
      if (result.error) {
        setStderr(result.error);
      } else {
        setStdout(result.stdout);
        setStderr(result.stderr);
      }
    } catch (err) {
      toast.error("Failed to run code. Make sure sandbox is running.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleGetHint = async () => {
    try {
      setIsHintLoading(true);
      setAiHint("");
      const result = await getHint({
        source_code: code,
        language,
        user_question: userQuestion.trim() || undefined
      });
      setAiHint(result.hint);
    } catch (err) {
      setAiHint("AI unavailable. Check your code manually.");
    } finally {
      setIsHintLoading(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      setIsEvaluateLoading(true);
      setEvalResult(null);
      const result = await evaluateCode({
        source_code: code,
        language,
        stdout: stdout || "(No output produced)"
      });
      setEvalResult(result);

      try {
        await logProgress({
          source_code: code,
          language,
          ai_score: result.score,
          is_correct: result.is_correct
        });
        if (result.is_correct) {
          toast.success("Progress saved! ✓");
          void fetchProgress();
        }
      } catch (logErr) {
        console.error("Unable to log progress", logErr);
      }
    } catch (err) {
      toast.error("AI Evaluation failed.");
    } finally {
      setIsEvaluateLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white tracking-wide">BitLabs Practice Arena</h2>
          <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-0.5 text-xs font-semibold text-brand-400">
            Playground
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 rounded-md bg-emerald-950 border border-emerald-800/60 px-3 py-1 text-xs font-medium text-emerald-400 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Solved Today: <strong className="font-bold">{solvedCount}</strong>
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="rounded-md border border-slate-750 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="python">Python</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Column - Editor */}
        <div className="flex flex-col lg:w-3/5 border-r border-slate-900 p-4 space-y-4">
          <div className="flex-1 flex flex-col rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-2 border-b border-slate-800">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Editor</span>
              <span className="text-xs font-mono text-slate-400">{language === "cpp" ? "c++" : language}</span>
            </div>
            <div className="flex-1">
              <CodeEditor language={language} value={code} onChange={setCode} />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 rounded-md bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition-colors disabled:opacity-50 min-w-[120px]"
            >
              {isRunning ? <Spinner label="Running" /> : "Run Code"}
            </button>
            <button
              onClick={() => setActiveTab("hint")}
              className={`rounded-md border px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "hint"
                  ? "bg-blue-600 hover:bg-blue-700 border-blue-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
              }`}
            >
              Get Hint
            </button>
            <button
              onClick={handleEvaluate}
              disabled={isEvaluateLoading}
              className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 min-w-[120px]"
            >
              {isEvaluateLoading ? <Spinner label="Evaluating" /> : "Evaluate"}
            </button>
          </div>
        </div>

        {/* Right Column - Console & AI Split */}
        <div className="flex flex-col lg:w-2/5 p-4 space-y-4">
          {/* Top Panel - Console */}
          <div className="flex flex-col h-1/2 rounded-lg border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Console</span>
            </div>
            <div className="flex flex-1 flex-col p-4 space-y-3 overflow-y-auto">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-400 mb-1">Input (stdin)</span>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  className="rounded-md border border-slate-800 bg-slate-950 font-mono px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-brand-500"
                  rows={2}
                  placeholder="Provide program inputs here..."
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <span className="text-xs font-semibold text-slate-400 mb-1">Output</span>
                <div className="flex-1 rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-sm overflow-auto max-h-[160px]">
                  {stderr ? (
                    <pre className="text-red-400 whitespace-pre-wrap">{stderr}</pre>
                  ) : stdout ? (
                    <pre className="text-slate-100 whitespace-pre-wrap">{stdout}</pre>
                  ) : (
                    <span className="text-slate-600 italic">No output. Run your code to see results.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel - AI coaching (Tabs: Hint | Evaluation) */}
          <div className="flex flex-col h-1/2 rounded-lg border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950">
              <button
                onClick={() => setActiveTab("hint")}
                className={`flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-r border-slate-800/65 ${
                  activeTab === "hint"
                    ? "bg-slate-900 text-blue-400 border-t-2 border-t-blue-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                AI Hint
              </button>
              <button
                onClick={() => setActiveTab("evaluation")}
                className={`flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${
                  activeTab === "evaluation"
                    ? "bg-slate-900 text-emerald-400 border-t-2 border-t-emerald-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                AI Evaluation
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activeTab === "hint" ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="Ask AI anything about your code..."
                      className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleGetHint}
                      disabled={isHintLoading}
                      className="rounded-md bg-blue-600 hover:bg-blue-700 border border-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isHintLoading ? <Spinner label="Asking" /> : "Ask"}
                    </button>
                  </div>

                  {aiHint ? (
                    <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Mentor Feedback</p>
                      <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{aiHint}</p>
                    </div>
                  ) : (
                    !isHintLoading && (
                      <div className="text-center text-slate-500 py-8 text-sm italic">
                        Stuck? Enter a question above or click Ask to get coaching advice.
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <button
                      onClick={handleEvaluate}
                      disabled={isEvaluateLoading}
                      className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isEvaluateLoading ? <Spinner label="Evaluating" /> : "Evaluate My Code"}
                    </button>
                  </div>

                  {evalResult ? (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">AI Score</p>
                          <span className="text-3xl font-extrabold text-white">{evalResult.score}</span>
                          <span className="text-sm text-slate-500 font-medium">/100</span>
                        </div>
                        <div>
                          {evalResult.is_correct ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-800/60 px-3 py-1 text-xs font-semibold text-emerald-400">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-950 border border-rose-800/60 px-3 py-1 text-xs font-semibold text-rose-400">
                              ✗ Needs work
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Feedback</p>
                        <p className="text-sm leading-relaxed text-slate-300">{evalResult.feedback}</p>
                      </div>

                      {evalResult.improvements.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suggested Improvements</p>
                          <ul className="list-disc pl-5 text-sm space-y-1.5 text-slate-300">
                            {evalResult.improvements.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    !isEvaluateLoading && (
                      <div className="text-center text-slate-500 py-8 text-sm italic">
                        Ready to test your code? Click Evaluate My Code.
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
