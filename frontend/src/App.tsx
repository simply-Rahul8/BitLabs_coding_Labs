import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearToken, getCurrentUser, getStoredToken, type UserOut } from "./api/auth";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Spinner from "./components/ui/Spinner";
import AssessmentBuilder from "./routes/AssessmentBuilder";
import AuthPage from "./routes/AuthPage";
import CandidateDashboard from "./routes/CandidateDashboard";
import PracticeArena from "./routes/PracticeArena";
import RecruiterDashboard from "./routes/RecruiterDashboard";
import TakeAssessment from "./routes/TakeAssessment";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTakeAssessment = location.pathname.startsWith("/assessment/");

  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<UserOut | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(!!getStoredToken());

  // Listen to token changes in localStorage or state
  const syncAuth = useCallback(() => {
    const currentToken = getStoredToken();
    setToken(currentToken);
    if (currentToken) {
      setLoadingProfile(true);
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          clearToken();
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoadingProfile(false));
    } else {
      setUser(null);
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    syncAuth();
  }, [location.pathname, syncAuth]);

  const handleLogout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    navigate("/auth");
  }, [navigate]);

  // 1. Assessment taking URL (public candidate access via token)
  if (isTakeAssessment) {
    return (
      <Routes>
        <Route path="/assessment/:token" element={<TakeAssessment />} />
      </Routes>
    );
  }

  // 2. Not logged in or token invalid
  if (!token) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // 3. Loading profile
  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Loading workspace..." />
      </div>
    );
  }

  const role = (user?.role || "candidate").toLowerCase() as "recruiter" | "candidate";

  // 4. Authenticated layout
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role={role} email={user?.email} onLogout={handleLogout} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="min-w-0 flex-1 px-6 py-6">
          <Routes>
            {role === "candidate" ? (
              <>
                <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
                <Route path="/practice" element={<PracticeArena />} />
                <Route path="*" element={<Navigate to="/candidate/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
                <Route path="/recruiter/assessments/new" element={<AssessmentBuilder />} />
                <Route path="/practice" element={<PracticeArena />} />
                <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
                <Route path="*" element={<Navigate to="/recruiter/dashboard" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}
