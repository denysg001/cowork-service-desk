import { NavLink, Outlet } from "react-router-dom";

export function AdminPage() {
  const links = ["users", "companies", "rooms", "categories", "suppliers", "audit", "settings"];
  return (
    <div className="grid grid-cols-[220px_1fr] gap-4">
      <nav className="space-y-1">
        {links.map((link) => <NavLink className="block rounded px-3 py-2 text-sm hover:bg-muted" key={link} to={`/admin/${link}`}>{link}</NavLink>)}
      </nav>
      <Outlet />
    </div>
  );
}
