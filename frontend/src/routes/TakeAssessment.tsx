import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAssessment, getInvitation } from "../api/assessments";
import { runCode, submitSolution, getSubmission, type SubmissionResult } from "../api/submissions";
import CodeEditor from "../components/editor/CodeEditor";
import LanguageSelector from "../components/editor/LanguageSelector";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { languageTemplates, type SupportedLanguage } from "../constants/templates";

export default function TakeAssessment() {
  const { token } = useParams();
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [problemStatement, setProblemStatement] = useState("");
  const [constraints, setConstraints] = useState("");
  const [examples, setExamples] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState(languageTemplates.python);
  const [stdin, setStdin] = useState("");
  const [stdout, setStdout] = useState("Run your code to see output here.");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [resultOpen, setResultOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [processingAsync, setProcessingAsync] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questionStarterCode, setQuestionStarterCode] = useState<Record<string, string> | null>(null);
  const [testCases, setTestCases] = useState<Array<{
    id: string;
    is_hidden: boolean;
    input?: string;
    expected_output?: string;
    passed?: boolean;
    actual?: string;
    run?: boolean;
  }>>([]);
  const [runTestResultSummary, setRunTestResultSummary] = useState<string>("");

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const invitation = await getInvitation(token);
        if (invitation.status === "completed") {
          setSubmitted(true);
          setLoading(false);
          return;
        }
        setAssessmentTitle(invitation.assessment_title || "Assessment");
        setDifficulty(invitation.difficulty || "easy");
        setTimeLeftSeconds((invitation.time_limit_mins || 30) * 60);

        const firstQ = invitation.questions?.[0];
        if (firstQ) {
          setQuestionStarterCode(firstQ.starter_code || null);
          setProblemStatement(firstQ.problem_statement || invitation.assessment_description || "No problem statement available.");
          setConstraints(firstQ.constraints || "No additional constraints were supplied.");
          setTestCases(firstQ.test_cases || []);
          const rawExamples = firstQ.examples;
          let formattedExamples = "No examples were supplied.";
          if (rawExamples) {
            if (typeof rawExamples === "string") {
              formattedExamples = rawExamples;
            } else if (typeof rawExamples === "object") {
              formattedExamples = Object.values(rawExamples).join("\n\n");
            }
          }
          setExamples(formattedExamples || "No examples were supplied.");
        } else {
          setProblemStatement(invitation.assessment_description || "No problem statement available.");
          setConstraints("No additional constraints were supplied.");
          setExamples("No examples were supplied.");
        }
      } catch (error) {
        setNotFound(true);
        toast.error("This assessment link is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAssessment();
  }, [token]);

  useEffect(() => {
    if (questionStarterCode && questionStarterCode[language]) {
      setCode(questionStarterCode[language]);
    } else {
      setCode(languageTemplates[language] || "");
    }
  }, [language, questionStarterCode]);

  useEffect(() => {
    if (!timeLeftSeconds || timeLeftSeconds <= 0) {
      if (timeLeftSeconds <= 0 && timeLeftSeconds !== 0) {
        setIsExpired(true);
      }
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeftSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeftSeconds]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeftSeconds / 60);
    const seconds = timeLeftSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeftSeconds]);

  const handleRunCode = async () => {
    if (!token || isExpired) return;

    try {
      setRunLoading(true);
      setRunTestResultSummary("");
      const result = await runCode({
        source_code: code,
        language,
        stdin,
        invitation_token: token,
      });
      setStdout(result.stdout || result.stderr || "No output");
      if (result.test_results) {
        const tr = result.test_results;
        setRunTestResultSummary(`Passed ${tr.passed} / ${tr.total}`);
        setTestCases((prevCases) => {
          return prevCases.map((c, idx) => {
            const runInfo = tr.results?.[idx];
            if (runInfo) {
              return {
                ...c,
                passed: runInfo.passed,
                actual: runInfo.actual,
                run: true
              };
            }
            return c;
          });
        });
        if (tr.passed === tr.total) {
          toast.success("Code execution successful.");
        } else {
          toast.error("Test cases failed.");
        }
      } else {
        if (result.stdout === "code execution successful") {
          toast.success("Code execution successful.");
        } else {
          toast.error("Test cases failed.");
        }
      }
    } catch (error) {
      toast.error("Execution failed.");
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || isExpired) {
      toast.error("This assessment can no longer be submitted.");
      return;
    }
    setSubmitLoading(true);
    try {
      const response = await submitSolution({
        invitation_token: token,
        source_code: code,
        language,
      });

      if (response.status === 202) {
        setProcessingAsync(true);
        const subId = response.data.submission_id;

        let attempts = 0;
        const maxAttempts = 60; // 90 seconds max
        const pollInterval = 1500; // 1.5 seconds

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          attempts++;
          try {
            const checkRes = await getSubmission(subId);
            if (checkRes.score !== null && checkRes.score !== undefined && checkRes.ai_evaluation) {
              const resultData: SubmissionResult = {
                submission_id: checkRes.id,
                score: checkRes.score,
                test_results: checkRes.test_results ?? {
                  passed: 0,
                  failed: 0,
                  total: 0,
                  results: []
                },
                ai_evaluation: checkRes.ai_evaluation
              };
              setSubmissionResult(resultData);
              setResultOpen(true);
              break;
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
          }
        }
        if (attempts >= maxAttempts) {
          toast.error("Evaluation is taking longer than expected. Please check your dashboard later.");
        }
        setProcessingAsync(false);
      } else {
        setSubmissionResult(response.data);
        setResultOpen(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitLoading(false);
      setProcessingAsync(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-950">
        <Spinner label="Preparing assessment" />
      </div>
    );
  }

  if (!token || notFound) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-950 px-6">
        <div className="max-w-md rounded-xl border border-slate-700 bg-slate-900 p-8 text-center text-slate-200">
          <h2 className="text-2xl font-semibold text-white">404 — Assessment not found</h2>
          <p className="mt-2 text-sm text-slate-400">This assessment link is invalid or missing.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 animate-fade-in">
        <div className="max-w-md text-center text-slate-200">
          <h1 className="text-4xl font-bold text-white mb-4">Thank You!</h1>
          <p className="text-slate-400 text-sm leading-6">
            Your assessment has been successfully submitted. You may now close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-950 p-6 lg:w-[40%] lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-white">{assessmentTitle || "Assessment"}</h1>
              <div className="mt-2 inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200">{difficulty}</div>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200">{formattedTime}</div>
          </div>

          <div className="space-y-6 overflow-y-auto pr-1">
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Problem</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{problemStatement}</p>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Constraints</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{constraints}</p>
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Examples</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{examples}</p>
            </section>
          </div>
        </aside>

        <main className="flex-1 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          <CodeEditor language={language} value={code} onChange={setCode} />

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
            <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">Input</label>
              <textarea value={stdin} onChange={(event) => setStdin(event.target.value)} className="min-h-28 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-900" placeholder="Enter stdin here" />
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Output</span>
              </div>
              <pre className="min-h-28 whitespace-pre-wrap rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100">{stdout}</pre>
            </div>
          </div>

          {/* Test Cases Panel */}
          {testCases.length > 0 && (
            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950 p-4">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">Test Cases</span>
                {runTestResultSummary && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    (() => {
                      const parts = runTestResultSummary.replace("Passed ", "").split(" / ");
                      return parts[0] !== parts[1];
                    })()
                      ? "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                      : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                  }`}>
                    {runTestResultSummary}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {testCases.map((tc, idx) => (
                  <div key={tc.id || idx} className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {tc.is_hidden ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            🔒 Hidden Test Case {idx + 1}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-350">
                            Visible Test Case {idx + 1}
                          </span>
                        )}
                      </div>
                      {tc.run && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          tc.passed
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                            : "bg-rose-950 text-rose-400 border border-rose-900"
                        }`}>
                          {tc.passed ? "Passed" : "Failed"}
                        </span>
                      )}
                    </div>

                    {!tc.is_hidden && (
                      <div className="mt-3 grid gap-3 md:grid-cols-2 text-xs font-mono">
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Input</span>
                          <pre className="rounded bg-slate-950 p-2 border border-slate-800 overflow-x-auto text-slate-300 max-h-24">{tc.input}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Expected Output</span>
                          <pre className="rounded bg-slate-950 p-2 border border-slate-800 overflow-x-auto text-slate-300 max-h-24">{tc.expected_output}</pre>
                        </div>
                        {tc.run && tc.actual && (
                          <div className="col-span-2">
                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Actual Output</span>
                            <pre className={`rounded p-2 border overflow-x-auto max-h-24 ${
                              tc.passed
                                ? "bg-slate-950 border-slate-800 text-slate-200"
                                : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                            }`}>{tc.actual}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">
              {runTestResultSummary && (
                <span className={
                  (() => {
                    const parts = runTestResultSummary.replace("Passed ", "").split(" / ");
                    return parts[0] !== parts[1];
                  })()
                    ? "text-rose-400"
                    : "text-emerald-400"
                }>
                  {(() => {
                    const parts = runTestResultSummary.replace("Passed ", "").split(" / ");
                    const passedCount = parseInt(parts[0], 10);
                    const totalCount = parseInt(parts[1], 10);
                    if (passedCount !== totalCount) {
                      if (totalCount === 1) {
                        return "test 1/1 failed";
                      }
                      return `test cases failed: ${passedCount}/${totalCount} passed`;
                    }
                    return "all test cases passed";
                  })()}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" disabled={runLoading || isExpired} onClick={handleRunCode}>
                {runLoading ? <Spinner label="Running" /> : "Run Code"}
              </Button>
              <Button type="button" disabled={submitLoading || isExpired} onClick={handleSubmit}>
                {submitLoading ? <Spinner label="Submitting" /> : "Submit"}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {resultOpen && submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <div className="text-center">
              <h3 className="text-4xl font-bold text-white">
                {submissionResult.score !== null && submissionResult.score !== undefined ? `${submissionResult.score} / 100` : "Pending"}
              </h3>
            </div>

            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950 p-4">
              <div className="mb-2 text-sm font-medium text-slate-300">Test Results</div>
              <p className="text-sm text-slate-100">passed {submissionResult.test_results?.passed ?? 0} / {submissionResult.test_results?.total ?? 0}</p>

              <div className="mt-4 space-y-2">
                {(submissionResult.test_results?.results || [])
                  .filter((r: any) => !r.is_hidden)
                  .map((r, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4 rounded-md border border-slate-800 bg-slate-900 p-3">
                    <div className="flex-1">
                      <div className="text-xs text-slate-400">Input</div>
                      <pre className="whitespace-pre-wrap text-sm text-slate-100">{r.input}</pre>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400">Expected</div>
                      <pre className="whitespace-pre-wrap text-sm text-slate-100">{r.expected}</pre>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400">Actual</div>
                      <pre className="whitespace-pre-wrap text-sm text-slate-100">{r.actual}</pre>
                    </div>
                    <div className="ml-4 flex-shrink-0 text-sm font-medium">
                      {r.passed ? (
                        <span className="rounded-full bg-emerald-700/20 px-3 py-1 text-emerald-300">Passed</span>
                      ) : (
                        <span className="rounded-full bg-rose-700/20 px-3 py-1 text-rose-300">Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI evaluation handling: hide if ai_score is 0 and strengths indicates "Could not" */}
            {submissionResult.ai_evaluation ? (
              (submissionResult.ai_evaluation.ai_score === 0 && (submissionResult.ai_evaluation.strengths || "").includes("Could not")) ? null : (
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Strengths</h4>
                    <p className="mt-2 text-sm text-slate-200">{submissionResult.ai_evaluation.strengths}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Weaknesses</h4>
                    <p className="mt-2 text-sm text-slate-200">{submissionResult.ai_evaluation.weaknesses}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recommendations</h4>
                    <p className="mt-2 text-sm text-slate-200">{submissionResult.ai_evaluation.recommendations}</p>
                  </div>
                </div>
              )
            ) : null}

            <div className="mt-6 flex justify-center">
              <Button type="button" onClick={() => {
                setResultOpen(false);
                setSubmitted(true);
              }}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {processingAsync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl text-center animate-fade-in">
            <Spinner label="Evaluating submission..." />
            <p className="mt-4 text-sm text-slate-400">
              Running test cases and generating AI feedback. This may take a few seconds...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
