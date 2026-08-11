import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import AssessmentBuilder from "./routes/AssessmentBuilder";
import CandidateDashboard from "./routes/CandidateDashboard";
import PracticeArena from "./routes/PracticeArena";
import RecruiterDashboard from "./routes/RecruiterDashboard";
import TakeAssessment from "./routes/TakeAssessment";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="Recruiter" onLogout={() => undefined} />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/candidate/dashboard" replace />} />
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/assessments/new" element={<AssessmentBuilder />} />
            <Route path="/assessment/:token" element={<TakeAssessment />} />
            <Route path="/practice" element={<PracticeArena />} />
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
