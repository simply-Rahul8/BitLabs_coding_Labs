import { languageLabels, SupportedLanguage } from "../../constants/templates";

type LanguageSelectorProps = {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
};

const languages = Object.keys(languageLabels) as SupportedLanguage[];

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      Language
      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        value={value}
        onChange={(event) => onChange(event.target.value as SupportedLanguage)}
      >
        {languages.map((language) => (
          <option key={language} value={language}>
            {languageLabels[language]}
          </option>
        ))}
      </select>
    </label>
  );
}
