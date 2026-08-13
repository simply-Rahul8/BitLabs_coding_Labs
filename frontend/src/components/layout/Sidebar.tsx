import { NavLink } from "react-router-dom";

type SidebarProps = {
  role: "recruiter" | "candidate";
};

export default function Sidebar({ role }: SidebarProps) {
  const links =
    role === "candidate"
      ? [
          { to: "/candidate/dashboard", label: "Candidate Dashboard" },
          { to: "/practice", label: "Practice Arena" },
        ]
      : [
          { to: "/recruiter/dashboard", label: "Recruiter Dashboard" },
          { to: "/recruiter/assessments/new", label: "New Assessment" },
        ];

  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white p-4 lg:block">
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                "block rounded-md px-3 py-2 text-sm font-medium transition",
                isActive ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              ].join(" ")
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
