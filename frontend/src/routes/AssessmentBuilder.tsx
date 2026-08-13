import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createAssessment, generateAITests, saveAITests, type AssessmentTestCase } from "../api/assessments";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const supportedLanguages = ["Python", "C", "C++", "Java", "JavaScript"] as const;

const emptyTestRow = (): AssessmentTestCase & { id: string } => ({
  id: crypto.randomUUID(),
  input: "",
  expected_output: "",
  is_hidden: false,
  is_edge_case: false
});

export default function AssessmentBuilder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [timeLimitMins, setTimeLimitMins] = useState(30);
  const [languageSupport, setLanguageSupport] = useState<string[]>(["Python"]);
  const [problemStatement, setProblemStatement] = useState("");
  const [constraints, setConstraints] = useState("");
  const [examples, setExamples] = useState("");
  const [manualTests, setManualTests] = useState<Array<AssessmentTestCase & { id: string }>>([emptyTestRow()]);
  const [aiGeneratedTests, setAiGeneratedTests] = useState<Array<{ input: string; expected_output: string; type: "visible" | "hidden" | "edge" }>>([]);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starterCode, setStarterCode] = useState<Record<string, string>>({});

  const normalizedLanguages = useMemo(
    () => languageSupport.map((language) => language.toLowerCase()).filter(Boolean),
    [languageSupport]
  );

  const toggleLanguage = (language: string) => {
    setLanguageSupport((current) => {
      if (current.includes(language)) {
        return current.filter((item) => item !== language);
      }
      return [...current, language];
    });
  };

  const updateManualRow = (index: number, field: keyof Omit<AssessmentTestCase, "id">, value: string | boolean) => {
    setManualTests((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        return {
          ...row,
          [field]: value
        };
      })
    );
  };

  const addManualRow = () => {
    setManualTests((current) => [...current, emptyTestRow()]);
  };

  const removeManualRow = (index: number) => {
    setManualTests((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleImportAITests = () => {
    const imported = aiGeneratedTests.map((item) => ({
      id: crypto.randomUUID(),
      input: item.input,
      expected_output: item.expected_output,
      is_hidden: item.type === "hidden",
      is_edge_case: item.type === "edge"
    }));

    setManualTests((current) => {
      const filtered = current.filter((r) => r.input.trim() || r.expected_output.trim());
      return [...filtered, ...imported];
    });

    setActiveTab("manual");
    toast.success("AI test cases imported to the manual list.");
  };

  const handleGenerateAITests = async () => {
    if (!problemStatement.trim()) {
      toast.error("Problem statement is required before generating AI tests.");
      return;
    }

    try {
      setAiLoading(true);
      const generated = await generateAITests({
        problem_statement: problemStatement,
        language: normalizedLanguages[0] ?? "python",
        difficulty
      });

      const merged: Array<{ input: string; expected_output: string; type: "visible" | "hidden" | "edge" }> = [];
      const addGenerated = (source: Array<{ input: string; expected_output: string; is_hidden?: boolean; is_edge_case?: boolean }>, type: "visible" | "hidden" | "edge") => {
        for (const item of source) {
          merged.push({
            input: item.input,
            expected_output: item.expected_output,
            type
          });
        }
      };
      addGenerated(generated.visible_tests ?? [], "visible");
      addGenerated(generated.hidden_tests ?? [], "hidden");
      addGenerated(generated.edge_cases ?? [], "edge");
      setAiGeneratedTests(merged);
      setActiveTab("ai");
      toast.success("AI-generated test cases were produced.");
    } catch (error) {
      toast.error("AI test generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!title.trim() || !problemStatement.trim()) {
      toast.error("Assessment title and problem statement are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        time_limit_mins: Number(timeLimitMins) || 30,
        language_support: normalizedLanguages,
        questions: [
          {
            problem_statement: problemStatement.trim(),
            constraints: constraints.trim(),
            examples: examples.trim() ? { example_1: examples.trim() } : ({} as Record<string, string>),
            starter_code: starterCode,
            test_cases: (manualTests.length ? manualTests : [emptyTestRow()]).filter((row) => row.input.trim() || row.expected_output.trim()).map((row) => ({
              input: row.input.trim(),
              expected_output: row.expected_output.trim(),
              is_hidden: row.is_hidden,
              is_edge_case: row.is_edge_case
            }))
          }
        ]
      };

      await createAssessment(payload);
      toast.success("Assessment created successfully.");
      navigate("/recruiter/dashboard");
    } catch (error) {
      toast.error("Assessment creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Assessment Builder</h2>
        <p className="mt-1 text-sm text-slate-600">Create coding challenges with test cases and AI-assisted generation.</p>
      </div>

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Assessment Details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" required />
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Difficulty</span>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Time Limit (minutes)</span>
              <input type="number" min={5} value={timeLimitMins} onChange={(event) => setTimeLimitMins(Number(event.target.value) || 30)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </label>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Supported Languages</span>
            <div className="flex flex-wrap gap-3">
              {supportedLanguages.map((language) => (
                <label key={language} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <input type="checkbox" checked={languageSupport.includes(language)} onChange={() => toggleLanguage(language)} className="h-4 w-4" />
                  {language}
                </label>
              ))}
            </div>
          </div>

          {languageSupport.length > 0 && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <span className="mb-1 block text-sm font-medium text-slate-700">Starter Code (Optional)</span>
              <p className="text-xs text-slate-500">Provide starter code templates that candidates will see when starting the challenge in each supported language.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {languageSupport.map((lang) => {
                  const langKey = lang.toLowerCase();
                  return (
                    <label key={lang} className="block rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">{lang} Starter Code</span>
                      <textarea
                        value={starterCode[langKey] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStarterCode((prev) => ({ ...prev, [langKey]: val }));
                        }}
                        className="min-h-24 w-full rounded-md border border-slate-300 bg-white font-mono px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        placeholder={`// Starter code for ${lang}...`}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-900">Problem Statement</h3>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Problem Statement</span>
            <textarea value={problemStatement} onChange={(event) => setProblemStatement(event.target.value)} className="min-h-36 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Constraints</span>
            <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Examples</span>
            <textarea value={examples} onChange={(event) => setExamples(event.target.value)} className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Input: 5 -> Output: 10" />
          </label>
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Test Cases</h3>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => setActiveTab("manual")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
                Add Manually
              </button>
              <button type="button" onClick={() => setActiveTab("ai")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${activeTab === "ai" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
                Generate with AI
              </button>
            </div>
          </div>

          {activeTab === "manual" ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 font-semibold text-slate-600">Input</th>
                      <th className="px-3 py-2 font-semibold text-slate-600">Expected Output</th>
                      <th className="px-3 py-2 font-semibold text-slate-600">Hidden?</th>
                      <th className="px-3 py-2 font-semibold text-slate-600">Edge Case?</th>
                      <th className="px-3 py-2 font-semibold text-slate-600">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualTests.map((row, index) => (
                      <tr key={row.id} className="border-t border-slate-200">
                        <td className="px-3 py-2"><input value={row.input} onChange={(event) => updateManualRow(index, "input", event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></td>
                        <td className="px-3 py-2"><input value={row.expected_output} onChange={(event) => updateManualRow(index, "expected_output", event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></td>
                        <td className="px-3 py-2"><input type="checkbox" checked={row.is_hidden} onChange={(event) => updateManualRow(index, "is_hidden", event.target.checked)} className="h-4 w-4" /></td>
                        <td className="px-3 py-2"><input type="checkbox" checked={row.is_edge_case} onChange={(event) => updateManualRow(index, "is_edge_case", event.target.checked)} className="h-4 w-4" /></td>
                        <td className="px-3 py-2"><button type="button" onClick={() => removeManualRow(index)} className="text-sm font-medium text-red-600 hover:text-red-700">Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button type="button" variant="secondary" onClick={addManualRow}>Add Row</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button type="button" className="min-w-44" disabled={aiLoading} onClick={handleGenerateAITests}>
                {aiLoading ? <Spinner label="Generating" /> : "Generate Test Cases"}
              </Button>

              {aiGeneratedTests.length > 0 && (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 font-semibold text-slate-600">Input</th>
                          <th className="px-3 py-2 font-semibold text-slate-600">Expected Output</th>
                          <th className="px-3 py-2 font-semibold text-slate-600">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiGeneratedTests.map((row, index) => (
                          <tr key={`${row.type}-${index}`} className="border-t border-slate-200">
                            <td className="px-3 py-2">{row.input}</td>
                            <td className="px-3 py-2">{row.expected_output}</td>
                            <td className="px-3 py-2 capitalize">{row.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button type="button" onClick={handleImportAITests}>
                    Import to Manual List
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <Button type="button" disabled={submitting} onClick={handleCreateAssessment}>
            {submitting ? <Spinner label="Creating" /> : "Create Assessment"}
          </Button>
        </div>
      </div>
    </section>
  );
}
