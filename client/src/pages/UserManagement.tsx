import { useEffect, useState } from "react";
import { getAllUsers } from "../services/api/admin-api";
import { Link } from "react-router-dom";
import type { User } from "@/schemas/auth-schema";
import {
  Users,
  Shield,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Search,
  Filter,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getOrganizationName = (user: User) => {
    if (user.role === "SUPPLIER") {
      return user.supplier?.businessName || "—";
    }
    if (user.role === "BUYER") {
      return user.buyer?.companyName || "—";
    }
    return "—";
  };

  const getVerificationStatus = (user: User) => {
    if (user.role === "SUPPLIER") {
      return user.supplier?.status || "PENDING";
    }
    if (user.role === "BUYER") {
      return user.buyer?.status || "N/A";
    }
    return "N/A";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-3.5 h-3.5" />;
      case "PENDING":
        return <Clock className="w-3.5 h-3.5" />;
      case "REJECTED":
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "PENDING":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "REJECTED":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      SUPERADMIN: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      ADMIN: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      SUPPLIER: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      BUYER: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    };
    return (
      colors[role as keyof typeof colors] ||
      "text-muted-foreground bg-muted/50 border-border"
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <Shield className="w-3.5 h-3.5" />;
      case "ADMIN":
        return <Shield className="w-3.5 h-3.5" />;
      case "SUPPLIER":
        return <Building2 className="w-3.5 h-3.5" />;
      case "BUYER":
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Users className="w-3.5 h-3.5" />;
    }
  };

  const filteredUsers = users.filter((user) => {
    // Role filter
    if (filter === "PENDING") {
      return user.role === "SUPPLIER" && user.supplier?.status === "PENDING";
    }
    if (filter !== "ALL" && user.role !== filter) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      const username = user.username.toLowerCase();
      const organization = getOrganizationName(user).toLowerCase();

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        username.includes(searchLower) ||
        organization.includes(searchLower)
      );
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const pendingSuppliers = users.filter(
    (u) => u.role === "SUPPLIER" && u.supplier?.status === "PENDING",
  ).length;

  const pendingBuyers = users.filter(
    (u) => u.role === "BUYER" && u.buyer?.status === "PENDING",
  ).length;

  const verifiedSuppliers = users.filter(
    (u) => u.role === "SUPPLIER" && u.supplier?.status === "VERIFIED",
  ).length;

  const verifiedBuyers = users.filter(
    (u) => u.role === "BUYER" && u.buyer?.status === "VERIFIED",
  ).length;

  const stats = {
    total: users.length,
    suppliers: users.filter((u) => u.role === "SUPPLIER").length,
    buyers: users.filter((u) => u.role === "BUYER").length,
    admins: users.filter((u) => u.role === "ADMIN" || u.role === "SUPERADMIN")
      .length,
    pending: pendingBuyers + pendingSuppliers,
    verified: verifiedBuyers + verifiedSuppliers,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_USER_DATA...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              TOTAL USERS
            </span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              SUPPLIERS
            </span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.suppliers}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              BUYERS
            </span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.buyers}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              ADMINS
            </span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              PENDING
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              VERIFIED
            </span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.verified}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, username, or organization..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative sm:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="ALL">All Users</option>
              <option value="PENDING">Pending Verification</option>
              <option value="SUPPLIER">Suppliers Only</option>
              <option value="BUYER">Buyers Only</option>
              <option value="ADMIN">Admins Only</option>
              <option value="SUPERADMIN">Super Admins Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Organization
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No users found</p>
                      {(searchTerm || filter !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilter("ALL");
                          }}
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const status = getVerificationStatus(user);
                  const statusColor = getStatusColor(status);
                  const StatusIcon = getStatusIcon(status);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {user.firstName?.charAt(0)}
                              {user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.firstName} {user.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleColor(user.role)}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground">
                            {getOrganizationName(user)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === "SUPPLIER" || user.role === "BUYER" ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColor}`}
                          >
                            {StatusIcon}
                            {status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border text-muted-foreground bg-muted/50 border-border">
                            <CheckCircle className="w-3.5 h-3.5" />
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm text-foreground">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/dashboard/admin/users/${user.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          {status === "PENDING" && user.role === "SUPPLIER"
                            ? "Review & Verify"
                            : "View Profile"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
