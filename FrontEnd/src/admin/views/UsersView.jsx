import React, { useState } from "react";
import { Search, Shield, ShieldAlert, Star } from "lucide-react";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";

export default function UsersView({ users, setUsers }) {
  const [search, setSearch] = useState("");
  const [roleModal, setRoleModal] = useState(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBan = (id) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === "banned" ? "active" : "banned";
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const changeRole = (id, role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    setRoleModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
          User Directory
        </h1>
        <p className="text-slate-500 text-sm font-sans">
          Manage system moderators, view reporter points, or temporarily suspend accounts.
        </p>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-emerald-50 overflow-hidden">
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] text-slate-700 placeholder-slate-400 transition-all duration-150"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-sans">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 hidden md:table-cell">Role</th>
                <th className="px-6 py-4 hidden lg:table-cell">Reports Submitted</th>
                <th className="px-6 py-4 hidden lg:table-cell">Eco Points</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-emerald-50/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={u.initials} size="md" />
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-[#16A34A] transition-colors">
                          {u.name}
                        </p>
                        <p className="text-xs text-slate-400 font-sans font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <Badge label={u.role} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell font-bold text-slate-600">
                    {u.reports}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-amber-600 font-bold flex items-center gap-1 font-sans">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{u.points.toLocaleString()}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-sans font-medium">
                    {u.joined}
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={u.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setRoleModal(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Manage Permissions"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleBan(u.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          u.status === "banned"
                            ? "text-[#16A34A] hover:bg-emerald-50"
                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        }`}
                        title={u.status === "banned" ? "Activate Account" : "Suspend Account"}
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 px-4 space-y-1">
              <p className="text-slate-400 font-semibold">No users found matching "{search}"</p>
              <p className="text-slate-400 text-xs">Verify your spelling or clear search input.</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Manager Modal */}
      <Modal
        title={`Change Privileges — ${roleModal?.name}`}
        isOpen={!!roleModal}
        onClose={() => setRoleModal(null)}
        maxWidth="sm"
      >
        {roleModal && (
          <div className="space-y-4 font-sans">
            <p className="text-slate-500 text-sm leading-relaxed">
              Updating user privileges changes their editing abilities on the SmartEco system.
            </p>
            <div className="flex flex-col gap-2">
              {["User", "Moderator", "Admin"].map(r => (
                <button
                  key={r}
                  onClick={() => changeRole(roleModal.id, r)}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm border transition-all text-left flex items-center justify-between cursor-pointer ${
                    roleModal.role === r
                      ? "bg-[#16A34A] text-white border-[#16A34A] shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-[#16A34A] hover:bg-emerald-50/20"
                  }`}
                >
                  <span>{r} Privilege</span>
                  {roleModal.role === r && <span className="text-xs font-bold uppercase tracking-wide">Active</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
