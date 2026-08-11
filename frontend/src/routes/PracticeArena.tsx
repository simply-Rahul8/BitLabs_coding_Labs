import { useState } from "react";
import CodeEditor from "../components/editor/CodeEditor";
import LanguageSelector from "../components/editor/LanguageSelector";
import Button from "../components/ui/Button";
import { languageTemplates, SupportedLanguage } from "../constants/templates";

export default function PracticeArena() {
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState(languageTemplates.python);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Practice arena</h2>
          <p className="mt-1 text-sm text-slate-600">Write code, switch languages, and prepare for assessments.</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={setLanguage} />
          <Button>Run</Button>
        </div>
      </div>
      <CodeEditor language={language} value={code} onChange={setCode} />
    </section>
  );
}
