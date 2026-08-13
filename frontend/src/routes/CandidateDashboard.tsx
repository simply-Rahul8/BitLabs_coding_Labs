import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { approveCandidateInvitation, getCandidateInvitations, type CandidateInvitation } from "../api/assessments";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<CandidateInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await getCandidateInvitations();
      setInvitations(data);
    } catch (error) {
      toast.error("Unable to load assigned assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvitations();
  }, []);

  const handleApprove = async (invitationId: string) => {
    try {
      setApprovingId(invitationId);
      const res = await approveCandidateInvitation(invitationId);
      toast.success("Assessment approved! Your test link has been generated.");
      setInvitations((prev) =>
        prev.map((item) =>
          item.invitation_id === invitationId
            ? { ...item, status: "active", token: res.token, test_url: res.test_url }
            : item
        )
      );
    } catch (error) {
      toast.error("Failed to approve assessment.");
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading assigned assessments" />
      </div>
    );
  }

  const pendingList = invitations.filter((item) => item.status === "pending");
  const activeList = invitations.filter((item) => item.status === "active");
  const completedList = invitations.filter((item) => item.status === "completed");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Candidate Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review your assigned assessments, approve pending test invites, and view past scores.
        </p>
      </div>

      {/* Pending Approval Section */}
      {pendingList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-amber-800">
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900">
              Pending Assessments ({pendingList.length}) — Action Required
            </h3>
          </div>

          <div className="grid gap-4">
            {pendingList.map((item) => (
              <div key={item.invitation_id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <Badge status="draft">pending approval</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-700">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                      <span>Difficulty: <strong className="capitalize text-slate-800">{item.difficulty}</strong></span>
                      <span>Time Limit: <strong className="text-slate-800">{item.time_limit_mins} mins</strong></span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={approvingId === item.invitation_id}
                    onClick={() => handleApprove(item.invitation_id)}
                  >
                    {approvingId === item.invitation_id ? (
                      <Spinner label="Approving" />
                    ) : (
                      "Approve Assessment & Generate Link"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active / Approved Assessments Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Active Assessments</h3>
        {activeList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            {pendingList.length > 0
              ? "Approve your pending assessment above to generate your test link."
              : "No active assessments ready to take. When a recruiter invites you, it will appear here."}
          </div>
        ) : (
          <div className="grid gap-4">
            {activeList.map((item) => (
              <div key={item.invitation_id} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      <Badge status="active">ready to take</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{item.description}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                      <span>Difficulty: <strong className="capitalize text-slate-800">{item.difficulty}</strong></span>
                      <span>Time Limit: <strong className="text-slate-800">{item.time_limit_mins} mins</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="button" onClick={() => navigate(`/assessment/${item.token}`)}>
                      Start Assessment →
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Assessments Section */}
      {completedList.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Completed Assessments</h3>
          <div className="grid gap-4">
            {completedList.map((item) => (
              <div key={item.invitation_id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                      <Badge status="completed">submitted</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-500">Score</div>
                    <div className="text-2xl font-bold text-brand-600">
                      {item.score !== null && item.score !== undefined ? `${item.score} / 100` : "Submitted"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
