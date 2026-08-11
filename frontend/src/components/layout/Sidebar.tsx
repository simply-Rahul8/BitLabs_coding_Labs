import { NavLink } from "react-router-dom";

const links = [
  { to: "/candidate/dashboard", label: "Candidate" },
  { to: "/practice", label: "Practice" },
  { to: "/recruiter/dashboard", label: "Recruiter" },
  { to: "/recruiter/assessments/new", label: "New assessment" }
];

export default function Sidebar() {
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
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
