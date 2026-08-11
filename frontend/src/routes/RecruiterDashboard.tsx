import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

export default function RecruiterDashboard() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Recruiter dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Review assessments, candidates, and coding results.</p>
        </div>
        <Button>Create assessment</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["Draft assessments", "Active tests", "Completed submissions"].map((title, index) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-700">{title}</h3>
              <Badge status={index === 0 ? "draft" : index === 1 ? "active" : "completed"} />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-950">0</p>
          </article>
        ))}
      </div>
    </section>
  );
}
