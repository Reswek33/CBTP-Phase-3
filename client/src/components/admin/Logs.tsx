/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { getActivityLogs, type LogFilters } from "../../services/api/admin-api";
import {
  Activity,
  Server,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
  AlertCircle,
  User,
  Clock,
  FileText,
  CheckCircle,
  Edit,
  Trash2,
  Download,
  RefreshCw,
} from "lucide-react";

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
  };
}

interface SystemLog {
  id: string;
  level: string;
  message: string;
  context: string;
  payload: any;
  userId: string | null;
  createdAt: string;
}

interface LogsData {
  success: boolean;
  message: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  activityLogs?: ActivityLog[];
  systemLogs?: SystemLog[];
  activityCount?: number;
  systemCount?: number;
}

const AdminLogDashboard: React.FC = () => {
  const [logs, setLogs] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LogFilters>({
    page: 1,
    limit: 15,
    logType: "activity",
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs(filters);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("create") || actionLower.includes("register")) {
      return <CheckCircle className="w-3.5 h-3.5" />;
    }
    if (actionLower.includes("delete") || actionLower.includes("remove")) {
      return <Trash2 className="w-3.5 h-3.5" />;
    }
    if (actionLower.includes("update") || actionLower.includes("edit")) {
      return <Edit className="w-3.5 h-3.5" />;
    }
    if (actionLower.includes("verify") || actionLower.includes("approve")) {
      return <CheckCircle className="w-3.5 h-3.5" />;
    }
    if (actionLower.includes("upload")) {
      return <FileText className="w-3.5 h-3.5" />;
    }
    if (actionLower.includes("login") || actionLower.includes("logout")) {
      return <User className="w-3.5 h-3.5" />;
    }
    return <Activity className="w-3.5 h-3.5" />;
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("create") || actionLower.includes("register")) {
      return "text-green-500 bg-green-500/10 border-green-500/20";
    }
    if (actionLower.includes("delete") || actionLower.includes("remove")) {
      return "text-destructive bg-destructive/10 border-destructive/20";
    }
    if (actionLower.includes("update") || actionLower.includes("edit")) {
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
    if (actionLower.includes("verify") || actionLower.includes("approve")) {
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    }
    if (actionLower.includes("upload")) {
      return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    }
    if (actionLower.includes("login") || actionLower.includes("logout")) {
      return "text-cyan-500 bg-cyan-500/10 border-cyan-500/20";
    }
    if (actionLower.includes("error") || actionLower.includes("fail")) {
      return "text-destructive bg-destructive/10 border-destructive/20";
    }
    return "text-muted-foreground bg-muted/50 border-border";
  };

  const getSystemLevelIcon = (level: string) => {
    switch (level) {
      case "INFO":
        return <Info className="w-3.5 h-3.5" />;
      case "WARN":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case "ERROR":
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  const getSystemLevelColor = (level: string) => {
    switch (level) {
      case "INFO":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "WARN":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "ERROR":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  const formatActionMessage = (action: string) => {
    // Make action messages more readable
    return action
      .replace(/_/g, " ")
      .replace(/SUPPLIER/g, "Supplier")
      .replace(/BUYER/g, "Buyer")
      .replace(/ADMIN/g, "Admin")
      .replace(/VERIFIED/g, "Verified")
      .replace(/PENDING/g, "Pending")
      .replace(/APPROVED/g, "Approved");
  };

  const formatSystemMessage = (message: string) => {
    // Truncate long messages
    if (message.length > 200) {
      return message.substring(0, 200) + "...";
    }
    return message;
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log("Export logs");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Audit & System Logs
            </h2>
            <p className="text-muted-foreground text-sm">
              Monitor user activities and system health across the platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground">
                  ACTIVITY LOGS
                </span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {logs?.activityCount || 0}
              </span>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground">
                  SYSTEM LOGS
                </span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {logs?.systemCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Log Type Filter */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              Log Category
            </label>
            <select
              value={filters.logType}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  logType: e.target.value as any,
                  page: 1,
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="activity">📊 User Activity Logs</option>
              <option value="system">⚙️ System Events Logs</option>
            </select>
          </div>

          {/* Severity Filter (System Logs Only) */}
          {filters.logType === "system" && (
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-2">
                Severity Level
              </label>
              <select
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    level: e.target.value as any,
                    page: 1,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="INFO">ℹ️ Info</option>
                <option value="WARN">⚠️ Warning</option>
                <option value="ERROR">❌ Error</option>
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2">
              From Date
            </label>
            <input
              type="date"
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value, page: 1 })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  {filters.logType === "activity" ? "Action" : "Context"}
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  {filters.logType === "activity" ? "User" : "Level"}
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading logs...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filters.logType === "activity" ? (
                logs?.activityLogs?.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getActionColor(log.action)}`}
                        >
                          {formatActionMessage(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {log.user?.firstName?.charAt(0)}
                            {log.user?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {log.user?.firstName} {log.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.user?.email}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            @{log.user?.username} • {log.user?.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        ID: {log.userId.substring(0, 8)}...
                      </code>
                    </td>
                  </tr>
                ))
              ) : (
                logs?.systemLogs?.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-muted-foreground" />
                        <code className="text-xs font-mono text-foreground bg-muted/50 px-2 py-1 rounded">
                          {log.context}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getSystemLevelColor(log.level)}`}
                      >
                        {getSystemLevelIcon(log.level)}
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">
                          {formatSystemMessage(log.message)}
                        </p>
                        {log.userId && (
                          <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                            User ID: {log.userId.substring(0, 8)}...
                          </code>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs?.pagination && logs.pagination.totalPages > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(logs.pagination.page - 1) * logs.pagination.limit + 1}{" "}
              to{" "}
              {Math.min(
                logs.pagination.page * logs.pagination.limit,
                logs.pagination.total,
              )}{" "}
              of {logs.pagination.total} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFilters({ ...filters, page: (filters.page || 1) - 1 })
                }
                disabled={filters.page === 1}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-foreground px-3 py-1 bg-muted rounded-lg">
                Page {filters.page} of {logs.pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setFilters({ ...filters, page: (filters.page || 1) + 1 })
                }
                disabled={filters.page === logs.pagination.totalPages}
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

export default AdminLogDashboard;
