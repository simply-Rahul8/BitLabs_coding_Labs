import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getAssessments, getResults, inviteCandidate, type AssessmentRecord } from "../api/assessments";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);
  const [results, setResults] = useState<Array<{ candidate_email: string; score: number | null; status: string; submitted_at?: string | null }>>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [expiresHours, setExpiresHours] = useState(48);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const data = await getAssessments();
      setAssessments(data);
    } catch (error) {
      toast.error("Unable to load assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAssessments();
  }, []);

  const openResults = async (assessment: AssessmentRecord) => {
    setSelectedAssessment(assessment);
    setResultsOpen(true);
    setResultsLoading(true);
    try {
      const data = await getResults(assessment.id);
      setResults(data);
    } catch (error) {
      toast.error("Unable to load candidate results.");
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedAssessment) return;

    if (!candidateEmail.trim()) {
      toast.error("Please enter a candidate email.");
      return;
    }

    try {
      setInviteSubmitting(true);
      const response = await inviteCandidate(selectedAssessment.id, {
        candidate_email: candidateEmail.trim(),
        expires_hours: expiresHours
      });
      const fullUrl = `http://localhost:5173/assessment/${response.token}`;
      setInviteLink(fullUrl);
      toast.success("Invitation created successfully.");
    } catch (error) {
      toast.error("Failed to send invitation.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">BitLabs — Recruiter Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Review assessments, candidate results, and invitations.</p>
        </div>
        <Button type="button" onClick={() => navigate("/recruiter/assessments/new")}>New Assessment</Button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <Spinner label="Loading assessments" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Difficulty</th>
                  <th className="px-4 py-3 font-semibold">Time Limit</th>
                  <th className="px-4 py-3 font-semibold">Languages</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 font-medium text-slate-900">{assessment.title}</td>
                    <td className="px-4 py-4">
                      <Badge status={assessment.difficulty === "hard" ? "completed" : assessment.difficulty === "medium" ? "active" : "draft"}>{assessment.difficulty}</Badge>
                    </td>
                    <td className="px-4 py-4">{assessment.time_limit_mins} min</td>
                    <td className="px-4 py-4">{assessment.language_support.join(", ") || "—"}</td>
                    <td className="px-4 py-4">{new Date(assessment.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={() => openResults(assessment)}>
                          View Results
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setInviteOpen(true);
                            setInviteLink(null);
                          }}
                        >
                          Invite Candidate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultsOpen && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{selectedAssessment.title} — Results</h3>
              <Button type="button" variant="secondary" onClick={() => setResultsOpen(false)}>Close</Button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              {resultsLoading ? (
                <Spinner label="Loading results" />
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Candidate ID</th>
                        <th className="px-3 py-2 font-semibold">Score</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                        <th className="px-3 py-2 font-semibold">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-slate-500">No candidate submissions yet.</td>
                        </tr>
                      ) : (
                        results.map((result, index) => (
                          <tr key={`${result.candidate_email}-${index}`} className="border-t border-slate-200">
                            <td className="px-3 py-3 text-slate-800">{result.candidate_email}</td>
                            <td className="px-3 py-3">{result.score !== null && result.score !== undefined ? `${result.score} / 100` : "Pending"}</td>
                            <td className="px-3 py-3">{result.score !== null && result.score !== undefined ? "Submitted" : "Pending"}</td>
                            <td className="px-3 py-3">{result.submitted_at ? new Date(result.submitted_at).toLocaleString() : "Pending"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {inviteOpen && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Invite Candidate</h3>
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Close</Button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Candidate email</label>
                <input
                  value={candidateEmail}
                  onChange={(event) => setCandidateEmail(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="candidate@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Expires in (hours)</label>
                <input
                  type="number"
                  min={1}
                  value={expiresHours}
                  onChange={(event) => setExpiresHours(Number(event.target.value || 48))}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <Button type="button" className="w-full" disabled={inviteSubmitting} onClick={handleInvite}>
                {inviteSubmitting ? <Spinner label="Creating invite" /> : "Send Invite"}
              </Button>

              {inviteLink && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="mb-2 text-sm font-medium text-emerald-800">Invite URL</div>
                  <div className="break-all text-sm text-emerald-700">{inviteLink}</div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={async () => {
                        await navigator.clipboard.writeText(inviteLink);
                        toast.success("Invite link copied.");
                      }}
                    >
                      Copy link
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
