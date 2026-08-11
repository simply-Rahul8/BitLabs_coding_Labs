import Badge from "../components/ui/Badge";

export default function CandidateDashboard() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">Candidate dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Track assigned assessments and recent practice sessions.</p>
      </div>
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">No active assessment assigned</h3>
          <Badge status="draft">waiting</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-600">Assigned tests will appear here when a recruiter shares one.</p>
      </article>
    </section>
  );
}
