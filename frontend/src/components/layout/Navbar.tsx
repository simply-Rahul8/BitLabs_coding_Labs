import Button from "../ui/Button";

type NavbarProps = {
  role: string;
  email?: string;
  onLogout: () => void;
};

export default function Navbar({ role, email, onLogout }: NavbarProps) {
  const formattedRole = role.toLowerCase() === "recruiter" ? "Recruiter" : "Candidate";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">BitLabs</p>
          <h1 className="text-base font-bold text-slate-900">Coding Lab</h1>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="hidden text-xs text-slate-500 sm:inline">{email}</span>}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
            {formattedRole}
          </span>
          <Button variant="secondary" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
