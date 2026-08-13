import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { approveCandidateInvitation, getCandidateInvitations, type CandidateInvitation } from "../api/assessments";
import { getProgress, getHistory, type PracticeAttemptRecord } from "../api/practice";
import { getSubmission } from "../api/submissions";
import { clearToken } from "../api/auth";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

type SubmissionDetails = {
  id: string;
  score: number | null;
  ai_evaluation?: {
    strengths: string;
    weaknesses: string;
    recommendations: string;
    ai_score: number;
  } | null;
};

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<CandidateInvitation[]>([]);
  const [solvedCount, setSolvedCount] = useState(0);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<PracticeAttemptRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Modal States for AI Review
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetails | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch invitations
      const invData = await getCandidateInvitations();
      setInvitations(invData);

      // Fetch practice progress
      const progressData = await getProgress();
      setSolvedCount(progressData.total_solved);
      setLastActive(progressData.last_active);

      // Fetch practice history
      const historyData = await getHistory();
      setPracticeHistory(historyData);
    } catch (error) {
      toast.error("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
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

  const handleLogout = () => {
    clearToken();
    navigate("/auth");
    toast.success("Logged out successfully.");
  };

  const handleViewAIReview = async (submissionId: string) => {
    try {
      setIsModalOpen(true);
      setModalLoading(true);
      setSelectedSubmission(null);
      const subData = await getSubmission(submissionId);
      setSelectedSubmission(subData);
    } catch (err) {
      toast.error("Failed to load AI evaluation details.");
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <Spinner label="Loading workspace data..." />
      </div>
    );
  }

  const pendingList = invitations.filter((item) => item.status === "pending");
  const activeList = invitations.filter((item) => item.status === "active");
  const completedList = invitations.filter((item) => item.status === "completed");

  return (
    <div className="bg-white min-h-screen text-slate-800 p-6 max-w-5xl mx-auto space-y-8 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">BitLabs — Candidate Dashboard</h2>
        <button
          onClick={handleLogout}
          className="rounded border border-slate-350 bg-white hover:bg-slate-50 text-slate-700 px-4 py-1.5 text-sm font-semibold shadow-sm transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Problems Solved */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Problems Solved
            </span>
            <span className="text-4xl font-extrabold text-blue-600">{solvedCount}</span>
          </div>
          <span className="text-xs text-slate-400 mt-2 block">Keep coding to level up!</span>
        </div>

        {/* Card 2: Last Active */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Last Active
            </span>
            <span className="text-lg font-bold text-slate-800 block">
              {lastActive ? new Date(lastActive).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              }) : "N/A"}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-2 block">Your last practice session</span>
        </div>

        {/* Card 3: Practice Arena */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Practice Arena
            </span>
            <span className="text-sm text-slate-600 block">Sharpen your code skills with AI feedback.</span>
          </div>
          <button
            onClick={() => navigate("/practice")}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 text-sm font-semibold transition-colors shadow-sm"
          >
            Go Practice →
          </button>
        </div>
      </div>

      {/* Pending Approval Section */}
      {pendingList.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-amber-800">
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">
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

      {/* Active Assessments Section */}
      {activeList.length > 0 && (
        <section className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-slate-900">Active Assessments</h3>
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

                  <Button type="button" onClick={() => navigate(`/assessment/${item.token}`)}>
                    Start Assessment →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ASSESSMENT HISTORY (Completed Assessments) */}
      <section className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-slate-900">My Assessments</h3>
        {completedList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 italic">
            No assessments taken yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Assessment</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">AI Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {completedList.map((item) => (
                  <tr key={item.invitation_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500 capitalize">{item.difficulty}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.score !== null ? `${item.score} / 100` : "Pending"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 border border-slate-200">
                        Submitted
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {item.submission_id ? (
                        <button
                          onClick={() => handleViewAIReview(item.submission_id!)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded px-3 py-1.5 text-xs font-semibold transition-colors border border-blue-200"
                        >
                          View Review
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECENT ACTIVITY (Practice Activity) */}
      <section className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-slate-900">Practice Activity</h3>
        {practiceHistory.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 italic">
            Start practicing to see your history here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 font-semibold text-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Language</th>
                  <th className="px-6 py-3">Result</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {practiceHistory.slice(0, 20).map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700 capitalize">
                      {att.language}
                    </td>
                    <td className="px-6 py-4">
                      {att.is_correct ? (
                        <span className="inline-flex items-center gap-1 rounded bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          ✗ Needs Work
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(att.attempted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm max-w-xl mx-auto mt-6">
        <h4 className="text-xl font-bold text-slate-900 mb-2">Ready to practice?</h4>
        <p className="text-slate-600 text-sm mb-5">
          Access the open coding playground and test your code against sandbox execution.
        </p>
        <button
          onClick={() => navigate("/practice")}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-6 py-2 text-sm font-semibold transition-colors shadow-md"
        >
          Open Practice Arena
        </button>
      </div>

      {/* AI REVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>🤖</span> AI Evaluation Summary
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {modalLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Spinner label="AI is loading evaluation detail..." />
                </div>
              ) : selectedSubmission ? (
                <div className="space-y-4">
                  {/* Score banner */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">AI Evaluated Score</span>
                      <div className="flex items-baseline gap-0.5 mt-0.5">
                        <span className={`text-4xl font-extrabold ${
                          selectedSubmission.ai_evaluation?.ai_score && selectedSubmission.ai_evaluation.ai_score >= 70
                            ? "text-green-600"
                            : selectedSubmission.ai_evaluation?.ai_score && selectedSubmission.ai_evaluation.ai_score >= 40
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}>
                          {selectedSubmission.ai_evaluation?.ai_score ?? 0}
                        </span>
                        <span className="text-slate-400 text-xs font-semibold">/100</span>
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                        Review Done
                      </span>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Strengths</h5>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.ai_evaluation?.strengths || "No specific feedback generated."}
                    </p>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Weaknesses</h5>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.ai_evaluation?.weaknesses || "No critical issues detected."}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Recommendations</h5>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.ai_evaluation?.recommendations || "Continue practicing!"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8 text-sm italic">
                  Could not load evaluation.
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded text-sm transition-colors border border-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
