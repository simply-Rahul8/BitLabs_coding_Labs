import Button from "../ui/Button";

type NavbarProps = {
  role: "Recruiter" | "Candidate";
  onLogout: () => void;
};

export default function Navbar({ role, onLogout }: NavbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">BitLabs</p>
          <h1 className="text-lg font-semibold text-slate-950">Coding Lab</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {role}
          </span>
          <Button variant="secondary" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
