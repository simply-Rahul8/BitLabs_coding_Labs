import Editor, { OnChange } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { languageTemplates, SupportedLanguage } from "../../constants/templates";

type CodeEditorProps = {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  heightClass?: string;
};

export default function CodeEditor({ language, value, onChange, readOnly = false, heightClass = "h-[520px]" }: CodeEditorProps) {
  const previousLanguage = useRef(language);

  useEffect(() => {
    if (previousLanguage.current === language) {
      return;
    }

    const prevTemplate = languageTemplates[previousLanguage.current];
    const nextTemplate = languageTemplates[language];
    if (value === prevTemplate) {
      onChange(nextTemplate);
    } else if (value !== nextTemplate) {
      const shouldReplace = window.confirm(
        `Replace the current code with the ${language} starter template?`
      );
      if (shouldReplace) {
        onChange(nextTemplate);
      }
    }

    previousLanguage.current = language;
  }, [language, onChange, value]);

  const handleChange: OnChange = (nextValue) => {
    onChange(nextValue ?? "");
  };

  return (
    <div className={`${heightClass} overflow-hidden rounded-lg border border-slate-800 bg-slate-950`}>
      <Editor
        height="100%"
        language={language === "cpp" ? "cpp" : language}
        value={value}
        theme="vs-dark"
        onChange={handleChange}
        options={{
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          wordBasedSuggestions: "off",
          parameterHints: { enabled: false },
          snippetSuggestions: "none",
          readOnly
        }}
      />
    </div>
  );
}
