import Button from "../components/ui/Button";

export default function AssessmentBuilder() {
  return (
    <section className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Assessment builder</h2>
        <p className="mt-1 text-sm text-slate-600">Create coding assessments with questions, languages, and time limits.</p>
      </div>
      <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Assessment title" />
        <textarea className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Instructions" />
        <Button type="button">Save draft</Button>
      </form>
    </section>
  );
}
