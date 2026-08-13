import { useEffect, useState } from "react";
import CodeEditor from "../components/editor/CodeEditor";
import { languageTemplates, SupportedLanguage, languageLabels } from "../constants/templates";
import { runCode, getHint, evaluateCode, logProgress, getProgress } from "../api/practice";
import toast from "react-hot-toast";
import Spinner from "../components/ui/Spinner";

export default function PracticeArena() {
  const languages = Object.keys(languageLabels).filter(l => l !== "swift") as SupportedLanguage[];
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState(languageTemplates.python);
  const [stdin, setStdin] = useState("");
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"hint" | "evaluation">("hint");
  const [userQuestion, setUserQuestion] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [isHintLoading, setIsHintLoading] = useState(false);
  
  const [problemDescription, setProblemDescription] = useState("");
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLang = e.target.value as SupportedLanguage;
    const prevTemplate = languageTemplates[language];
    const nextTemplate = languageTemplates[nextLang];

    if (code === prevTemplate) {
      // Swapping silently if unmodified
      setLanguage(nextLang);
      setCode(nextTemplate);
    } else {
      const shouldSwap = window.confirm(
        `Replace current code with ${languageLabels[nextLang]} starter template? This will discard your edits.`
      );
      if (shouldSwap) {
        setLanguage(nextLang);
        setCode(nextTemplate);
      }
    }
  };

  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setStdout("");
      setStderr("");
      setExitCode(null);
      setTimedOut(false);

      const result = await runCode({
        source_code: code,
        language,
        stdin: stdin.trim() || undefined
      });

      setStdout(result.stdout || "");
      setStderr(result.stderr || "");
      setExitCode(result.exit_code);
      setTimedOut(result.timed_out);

      if (result.error) {
        setStderr(result.error);
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
      toast.error("Failed to fetch AI hint.");
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
        stdout: stdout || "(No output produced)",
        problem_description: problemDescription.trim() || undefined
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

  // Basic Markdown Renderer
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    // Sanitize first by stripping <script> tags
    let html = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Code blocks (```block```)
    html = html.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, '<pre class="bg-gray-900 p-2 rounded text-green-400 text-xs overflow-auto font-mono my-2 border border-gray-800">$1</pre>');

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-900 px-1 rounded text-green-400 font-mono font-medium">$1</code>');

    // Bold (**bold**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    return html;
  };

  // Status Bar helpers
  const getStatusText = () => {
    if (isRunning) return "Running...";
    if (isHintLoading || isEvaluateLoading) return "AI Thinking...";
    return "Ready";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden select-none">
      {/* ROW 1: Top Bar (h-12) */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-10 shrink-0">
        <h1 className="font-semibold text-white flex items-center gap-1.5">
          <span>⚡</span> BitLabs Practice Arena
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="rounded border border-indigo-700 bg-indigo-800 text-white px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="python">Python</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
          </select>
          <span className="rounded bg-green-600 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white uppercase">
            Solved: {solvedCount}
          </span>
        </div>
      </header>

      {/* ROW 2: Main Area (flex-1) */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel (w-3/5) */}
        <div className="w-3/5 flex flex-col border-r border-gray-700 bg-gray-900">
          <div className="flex-1 min-h-0 relative">
            <CodeEditor language={language} value={code} onChange={setCode} heightClass="h-full" />
          </div>

          {/* Action Bar (p-2) */}
          <div className="bg-gray-800 p-2 flex gap-2 border-t border-gray-700 shrink-0">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-medium py-1.5 px-4 rounded border border-gray-600 transition-colors"
            >
              {isRunning ? <Spinner label="" /> : "▶ Run"}
            </button>
            <button
              onClick={() => {
                setActiveTab("hint");
                // Focus input field if possible
                const inp = document.getElementById("ai-hint-input");
                if (inp) inp.focus();
              }}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded transition-colors"
            >
              <span>💡</span> Hint
            </button>
            <button
              onClick={handleEvaluate}
              disabled={isEvaluateLoading}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-1.5 px-4 rounded transition-colors"
            >
              {isEvaluateLoading ? <Spinner label="" /> : "✓ Evaluate"}
            </button>
          </div>
        </div>

        {/* Right Panel (w-2/5) */}
        <div className="w-2/5 flex flex-col bg-gray-800 border-l border-gray-700 min-h-0">
          {/* Top Half: Console */}
          <div className="h-1/2 flex flex-col border-b border-gray-700 min-h-0">
            <div className="text-xs text-gray-400 p-2 shrink-0 select-none uppercase tracking-wider font-semibold">
              Console
            </div>
            <div className="flex-1 flex flex-col p-2 space-y-2 min-h-0">
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="stdin input..."
                className="w-full h-16 resize-none p-2 rounded bg-gray-900 text-green-400 font-mono text-sm placeholder-gray-600 border border-gray-750 outline-none focus:border-green-500 shrink-0"
              />
              <div className="flex-1 bg-gray-900 border border-gray-750 rounded p-2 overflow-auto min-h-0">
                <div className="font-mono text-sm">
                  {timedOut ? (
                    <span className="text-yellow-400 font-semibold">Execution timed out</span>
                  ) : exitCode !== null && exitCode !== 0 ? (
                    <pre className="text-red-400 whitespace-pre-wrap">{stderr || `Exit Code: ${exitCode}`}</pre>
                  ) : stderr ? (
                    <pre className="text-red-400 whitespace-pre-wrap">{stderr}</pre>
                  ) : stdout ? (
                    <pre className="text-green-400 whitespace-pre-wrap">{stdout}</pre>
                  ) : (
                    <span className="text-gray-500 italic">Run your code to see output...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Half: AI Panel */}
          <div className="h-1/2 flex flex-col min-h-0 bg-gray-850">
            {/* Tab Bar */}
            <div className="bg-gray-900 border-b border-gray-700 flex shrink-0">
              <button
                onClick={() => setActiveTab("hint")}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === "hint"
                    ? "bg-gray-800 text-blue-400 border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                💡 Hint
              </button>
              <button
                onClick={() => setActiveTab("evaluation")}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === "evaluation"
                    ? "bg-gray-800 text-green-400 border-b-2 border-green-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                📊 Evaluate
              </button>
            </div>

            {/* AI Content Area */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0 flex flex-col">
              {activeTab === "hint" ? (
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  <div className="flex gap-1.5 shrink-0">
                    <input
                      id="ai-hint-input"
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="Ask about your code..."
                      className="bg-gray-700 text-white rounded p-1.5 text-sm flex-1 outline-none border border-gray-650 focus:border-blue-500"
                      onKeyDown={(e) => e.key === "Enter" && handleGetHint()}
                    />
                    <button
                      onClick={handleGetHint}
                      disabled={isHintLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded px-4 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {isHintLoading ? "Asking..." : "Ask"}
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {isHintLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Spinner label="AI is loading hint..." />
                      </div>
                    ) : aiHint ? (
                      <div
                        className="bg-gray-700 rounded p-3 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-650 shadow-inner"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(aiHint) }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                        Ask AI anything about your code
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                  <div className="flex flex-col gap-1.5 shrink-0 p-1 bg-gray-800 rounded border border-gray-700">
                    <input
                      type="text"
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      placeholder="Describe what you're trying to solve (optional)..."
                      className="bg-gray-750 text-white rounded p-1.5 text-sm outline-none border border-gray-650 focus:border-green-500"
                    />
                    <button
                      onClick={handleEvaluate}
                      disabled={isEvaluateLoading}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded py-2 transition-colors disabled:opacity-50 w-full"
                    >
                      {isEvaluateLoading ? "Reviewing..." : "Evaluate My Code"}
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {isEvaluateLoading ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-2">
                        <Spinner label="" />
                        <span className="text-sm text-gray-400 font-medium">AI is reviewing your code...</span>
                      </div>
                    ) : evalResult ? (
                      <div className="bg-gray-700 rounded p-3 border border-gray-650 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-600 pb-2">
                          <div className="flex items-baseline gap-0.5">
                            <span className={`text-3xl font-extrabold ${
                              evalResult.score >= 70
                                ? "text-green-400"
                                : evalResult.score >= 40
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}>
                              {evalResult.score}
                            </span>
                            <span className="text-gray-400 text-xs font-medium">/100</span>
                          </div>
                          <div>
                            {evalResult.is_correct ? (
                              <span className="bg-green-600 px-2 py-0.5 rounded text-xs font-semibold text-white shadow-sm">
                                ✓ Correct
                              </span>
                            ) : (
                              <span className="bg-red-600 px-2 py-0.5 rounded text-xs font-semibold text-white shadow-sm">
                                ✗ Needs Work
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Feedback</p>
                          <p className="text-gray-300 text-sm">{evalResult.feedback}</p>
                        </div>

                        {evalResult.improvements.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Suggested Improvements</p>
                            <ul className="list-disc pl-4 text-sm text-gray-350 space-y-1">
                              {evalResult.improvements.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                        Ready to evaluate? Fill in the details above or click Evaluate.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ROW 3: Status Bar (h-6) */}
      <footer className="h-6 bg-gray-900 border-t border-gray-700 flex items-center justify-between px-3 shrink-0">
        <span className="text-xs text-gray-500 font-medium">
          Language: {languageLabels[language]}
        </span>
        <span className="text-xs text-gray-500 font-medium font-mono">
          {getStatusText()}
        </span>
      </footer>
    </div>
  );
}
