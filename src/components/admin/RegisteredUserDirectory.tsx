import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  X,
  Key,
  Shield,
  ShieldAlert,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth, AuthUser } from "@/lib/auth-context";
import { getApiUrl } from "@/lib/api-config";

const PROTECTED_ADMIN_EMAILS = ["admin@careerconnect.internal", "admin@careerconnect.com"];
const PROTECTED_ADMIN_IDS = [1, 6];

function isProtectedAccount(u?: AuthUser | null): boolean {
  if (!u) return false;
  if (PROTECTED_ADMIN_IDS.includes(u.id)) return true;
  const email = (u.email || "").trim().toLowerCase();
  return PROTECTED_ADMIN_EMAILS.includes(email);
}

interface RegisteredUserDirectoryProps {
  showHeader?: boolean;
  maxItems?: number;
  onDataLoaded?: (users: AuthUser[]) => void;
}

export function RegisteredUserDirectory({
  showHeader = true,
  maxItems,
  onDataLoaded,
}: RegisteredUserDirectoryProps) {
  const { user: currentAdmin, isAuthenticated } = useAuth();

  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserModal, setEditUserModal] = useState<AuthUser | null>(null);
  const [deleteUserModal, setDeleteUserModal] = useState<AuthUser | null>(null);
  const [statusModal, setStatusModal] = useState<{ user: AuthUser; targetStatus: string } | null>(null);
  const [viewUserModal, setViewUserModal] = useState<AuthUser | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "candidate",
    organization: "",
    status: "active",
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    id: 0,
    fullName: "",
    email: "",
    role: "candidate",
    organization: "",
    status: "active",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Load live user directory from backend
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(getApiUrl("/AuthServlet?action=users"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsersList(data.users);
          onDataLoaded?.(data.users);
        } else if (data.error) {
          setFeedback({ type: "error", text: data.error });
        }
      } else {
        setFeedback({ type: "error", text: "Failed to connect to Microsoft SQL Server user directory." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network communication error with Java backend gateway." });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentAdmin?.role === "admin") {
      loadUsers();
    }
  }, [isAuthenticated, currentAdmin]);

  // Handle Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSubmitting(true);

    try {
      const params = new URLSearchParams({
        action: "create-user",
        fullName: addForm.fullName.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        role: addForm.role,
        organization: addForm.organization.trim(),
        status: addForm.status,
      });

      const res = await fetch(getApiUrl("/AuthServlet"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: `User account for "${addForm.fullName}" successfully created in Microsoft SQL Server.`,
        });
        setAddUserOpen(false);
        setAddForm({
          fullName: "",
          email: "",
          password: "",
          role: "candidate",
          organization: "",
          status: "active",
        });
        await loadUsers();
      } else {
        setAddError(data.error || "Failed to create user account.");
      }
    } catch {
      setAddError("Network communication error with server.");
    } finally {
      setAddSubmitting(false);
    }
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSubmitting(true);

    try {
      const params = new URLSearchParams({
        action: "update-user",
        id: editForm.id.toString(),
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        organization: editForm.organization.trim(),
        status: editForm.status,
      });

      const res = await fetch(getApiUrl("/AuthServlet"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: `User #${editForm.id} (${editForm.fullName}) successfully updated in SQL Server.`,
        });
        setEditUserModal(null);
        await loadUsers();
      } else {
        setEditError(data.error || "Failed to update user profile.");
      }
    } catch {
      setEditError("Network communication error while updating user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Toggle Status (Suspend / Reactivate)
  const handleConfirmStatusToggle = async () => {
    if (!statusModal) return;
    setStatusSubmitting(true);

    try {
      const params = new URLSearchParams({
        action: "update-status",
        id: statusModal.user.id.toString(),
        status: statusModal.targetStatus,
      });

      const res = await fetch(getApiUrl("/AuthServlet"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: `Account for "${statusModal.user.fullName}" is now ${statusModal.targetStatus.toUpperCase()}.`,
        });
        setStatusModal(null);
        await loadUsers();
      } else {
        setFeedback({
          type: "error",
          text: data.error || `Failed to update status to ${statusModal.targetStatus}.`,
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error updating status." });
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Handle Delete User
  const handleConfirmDelete = async () => {
    if (!deleteUserModal) return;
    setDeleteSubmitting(true);

    try {
      const params = new URLSearchParams({
        action: "delete-user",
        id: deleteUserModal.id.toString(),
      });

      const res = await fetch(getApiUrl("/AuthServlet"), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: `Account "${deleteUserModal.fullName}" has been permanently purged from SQL Server.`,
        });
        setDeleteUserModal(null);
        await loadUsers();
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Could not delete user account from database.",
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error during deletion request." });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.organization && u.organization.toLowerCase().includes(query)) ||
        u.id.toString().includes(query);

      const matchRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
      const matchStatus = statusFilter === "all" || u.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchQuery && matchRole && matchStatus;
    });
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  const displayedUsers = useMemo(() => {
    if (maxItems) return filteredUsers.slice(0, maxItems);
    return filteredUsers.slice(page * pageSize, page * pageSize + pageSize);
  }, [filteredUsers, maxItems, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  return (
    <div className="space-y-6">
      {/* Optional Top Action Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground">
              User Management
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Search, create, edit, suspend, and delete candidate and employer accounts in Microsoft SQL Server.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={loadingUsers}
              className="rounded-xl text-xs gap-1.5 h-9 bg-white dark:bg-slate-900 border-border shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw className={`size-3.5 ${loadingUsers ? "animate-spin text-primary" : ""}`} />
              <span>Refresh Directory</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setAddError(null);
                setAddUserOpen(true);
              }}
              className="rounded-xl text-xs gap-1.5 h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
            >
              <UserPlus className="size-3.5" />
              <span>Add User</span>
            </Button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, organization, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="pl-10 h-10 text-xs rounded-xl bg-background border-border"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="w-full h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Roles</option>
              <option value="candidate">Candidates</option>
              <option value="employer">Employers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="w-full h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="size-5 animate-spin mx-auto text-primary mb-2" />
                    <span>Querying Microsoft SQL Server records...</span>
                  </td>
                </tr>
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No registered user accounts match the current filters.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((u) => {
                  const isProtected = isProtectedAccount(u);
                  const isCurrentUser = currentAdmin?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 text-primary font-bold grid place-items-center text-xs shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-[9px] py-0 px-1 bg-primary/5 text-primary">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                            <Shield className="size-3" /> Administrator
                          </span>
                        ) : u.role === "employer" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                            <Building2 className="size-3" /> Employer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/25">
                            Candidate
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {u.organization || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.status === "suspended" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                            <UserX className="size-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                            <UserCheck className="size-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                        {u.createdAt ? u.createdAt.substring(0, 10) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewUserModal(u)}
                            className="size-7 p-0 rounded-lg text-slate-500 hover:text-foreground"
                            title="View Account Details"
                          >
                            <Eye className="size-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditError(null);
                              setEditForm({
                                id: u.id,
                                fullName: u.fullName,
                                email: u.email,
                                role: u.role,
                                organization: u.organization || "",
                                status: u.status || "active",
                              });
                              setEditUserModal(u);
                            }}
                            className="size-7 p-0 rounded-lg text-slate-500 hover:text-primary"
                            title="Edit User Profile"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>

                          {/* Suspend / Reactivate */}
                          {!isProtected && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const targetStatus = u.status === "suspended" ? "active" : "suspended";
                                setStatusModal({ user: u, targetStatus });
                              }}
                              className={`size-7 p-0 rounded-lg ${
                                u.status === "suspended"
                                  ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              }`}
                              title={u.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
                            >
                              {u.status === "suspended" ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
                            </Button>
                          )}

                          {/* Delete */}
                          {!isProtected && !isCurrentUser ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteUserModal(u)}
                              className="size-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                              title="Delete Account"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          ) : (
                            <div className="size-7 grid place-items-center text-slate-300 dark:text-slate-700" title="Protected System Account">
                              <Lock className="size-3.5" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (when full directory mode) */}
        {!maxItems && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredUsers.length)} of{" "}
              {filteredUsers.length} records
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="h-8 px-2.5 rounded-lg text-xs"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="px-2 font-medium">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="h-8 px-2.5 rounded-lg text-xs"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ADD USER MODAL */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Add New User</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddUserOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    required
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    placeholder="Candidate or Admin name"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Initial Password</Label>
                  <Input
                    type="password"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Account Role</Label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-background border border-border"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="employer">Employer / Recruiter</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Organization / Company (Optional)</Label>
                <Input
                  value={addForm.organization}
                  onChange={(e) => setAddForm({ ...addForm, organization: e.target.value })}
                  placeholder="e.g. CloudScale Technologies"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddUserOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addSubmitting}
                  className="rounded-xl text-xs h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {addSubmitting ? "Creating..." : "Save to SQL Server"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Edit User Profile #{editForm.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditUserModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-background border border-border"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="employer">Employer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-background border border-border"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Organization</Label>
                <Input
                  value={editForm.organization}
                  onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUserModal(null)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-xl text-xs h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {editSubmitting ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPEND / REACTIVATE CONFIRMATION MODAL */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">
                Confirm Account {statusModal.targetStatus === "suspended" ? "Suspension" : "Reactivation"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to mark <strong>{statusModal.user.fullName}</strong> ({statusModal.user.email}) as{" "}
              <strong>{statusModal.targetStatus.toUpperCase()}</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModal(null)}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={statusSubmitting}
                onClick={handleConfirmStatusToggle}
                className={`rounded-xl text-xs h-9 font-semibold text-white ${
                  statusModal.targetStatus === "suspended"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {statusSubmitting ? "Updating..." : `Yes, ${statusModal.targetStatus.toUpperCase()}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <Trash2 className="size-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">Permanently Delete User Account</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteUserModal.fullName}</strong> ({deleteUserModal.email})?
              This action purges the user from Microsoft SQL Server and cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteUserModal(null)}
                className="rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                className="rounded-xl text-xs h-9 font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deleteSubmitting ? "Purging..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Account Dossier #{viewUserModal.id}</h3>
              <button
                type="button"
                onClick={() => setViewUserModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-bold text-foreground">{viewUserModal.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-foreground">{viewUserModal.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Platform Role:</span>
                <span className="capitalize font-semibold text-primary">{viewUserModal.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Organization:</span>
                <span>{viewUserModal.organization || "None"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Account Status:</span>
                <span className="capitalize font-semibold">{viewUserModal.status || "active"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Account Created:</span>
                <span>{viewUserModal.createdAt || "Recorded in database"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Last Login:</span>
                <span>{viewUserModal.lastLoginAt || "Never logged in"}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewUserModal(null)}
                className="rounded-xl text-xs h-8"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
