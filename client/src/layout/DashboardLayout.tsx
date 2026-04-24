/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Navigate,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { getMe } from "../services/api/auth-api";
import {
  getNotification,
  updateIsRead,
  clearNotifications,
} from "../services/api/notification-api";
import { getUnreadMessageCount } from "../services/api/chat-api";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Shield,
  Users,
  Activity,
  UserCircle,
  LogOut,
  Bell,
  CheckCircle,
  Trash2,
  Menu,
  X,
  ChevronRight,
  Award,
  Target,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import { ModeToggle } from "@/components/Toggle";

interface NotificationItem {
  id: string;
  userId: string;
  content: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  subItems?: NavItem[];
  badge?: string;
  highlight?: boolean;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // State Management
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [toasts, setToasts] = useState<
    { id: number; content: string; type?: string }[]
  >([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread message count
  const fetchUnreadMessageCount = async () => {
    try {
      const response = await getUnreadMessageCount();
      setUnreadMessageCount(response.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread message count", err);
    }
  };

  // Fetch notifications
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getNotification();
        if (response.status) {
          setNotifications(response.data);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    if (isAuthenticated) {
      fetchHistory();
      fetchUnreadMessageCount();
    }
  }, [isAuthenticated]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("force_logout", () => handleLogout());
    socket.on("new_notification", (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      showToast(notif.content, "info");
    });

    socket.on("new_message", (message) => {
      // Only increment count if not on chat page or message is not from current user
      if (!location.pathname.includes("/chat")) {
        setUnreadMessageCount((prev) => prev + 1);
        showToast(
          `New message from ${message.sender?.firstName || "Someone"}`,
          "info",
        );
      }
    });

    socket.on("messages_read", ({ conversationId }) => {
      console.log(conversationId);
      fetchUnreadMessageCount();
    });

    socket.on("profile_sync", (data) => {
      showToast(`Profile sync: ${data.status}`, "success");
      getMe().catch(() => {});
    });

    // Refresh unread count when coming back to dashboard
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        fetchUnreadMessageCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.off("force_logout");
      socket.off("new_notification");
      socket.off("new_message");
      socket.off("messages_read");
      socket.off("profile_sync");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, location.pathname, isAuthenticated]);

  // Refresh unread count when navigating away from chat
  useEffect(() => {
    if (!location.pathname.includes("/chat")) {
      fetchUnreadMessageCount();
    }
  }, [location.pathname]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  const showToast = (content: string, type: string = "info") => {
    const toastId = Date.now();
    setToasts((prev) => [{ id: toastId, content, type }, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 5000);
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await updateIsRead(id);
    } catch (err) {
      console.error("Failed to mark as read", err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
      showToast("Failed to mark as read", "error");
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await Promise.all(unreadIds.map((id) => updateIsRead(id)));
      showToast("All notifications marked as read", "success");
    } catch (err) {
      console.error("Failed to mark all as read", err);
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: unreadIds.includes(n.id) ? false : n.isRead,
        })),
      );
      showToast("Failed to mark all as read", "error");
    }
  };

  const handleClearAllNotifications = async () => {
    if (notifications.length === 0) return;
    setIsClearing(true);
    try {
      await clearNotifications();
      setNotifications([]);
      showToast("All notifications cleared", "success");
    } catch (err) {
      console.error("Failed to clear notifications", err);
      showToast("Failed to clear notifications", "error");
    } finally {
      setIsClearing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleMenu = (menuPath: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuPath)
        ? prev.filter((p) => p !== menuPath)
        : [...prev, menuPath],
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-mono text-sm">
            INITIALIZING_SESSION...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user?.role;
  const isPending =
    (role === "SUPPLIER" && user?.supplier?.status === "PENDING") ||
    (role === "BUYER" && user?.buyer?.status === "PENDING");
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Navigation items based on role
  const navigationItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ["BUYER", "SUPPLIER", "ADMIN", "SUPERADMIN"],
    },
    {
      label: "RFPs",
      path: "/dashboard/rfps",
      icon: <FileText className="w-4 h-4" />,
      roles: ["BUYER", "SUPPLIER"],
      subItems:
        role === "BUYER"
          ? [
              {
                label: "My RFPs",
                path: "/dashboard/rfps",
                icon: <FileText className="w-3 h-3" />,
              },
              {
                label: "Create New",
                path: "/dashboard/rfps/create",
                icon: <FileText className="w-3 h-3" />,
              },
            ]
          : [
              {
                label: "Browse RFPs",
                path: "/dashboard/rfps",
                icon: <Target className="w-3 h-3" />,
              },
              {
                label: "My Bids",
                path: "/dashboard/my-bids",
                icon: <Award className="w-3 h-3" />,
              },
            ],
    },
    {
      label: "Messages",
      path: "/dashboard/chat",
      icon: <MessageSquare className="w-4 h-4" />,
      roles: ["BUYER", "SUPPLIER", "ADMIN"],
      badge: unreadMessageCount > 0 ? `${unreadMessageCount}` : undefined,
      highlight: unreadMessageCount > 0,
    },
    {
      label: "Onboarding",
      path: "/dashboard/onboarding",
      icon: <Shield className="w-4 h-4" />,
      roles: ["SUPPLIER", "BUYER"],
      highlight: isPending,
    },
    {
      label: "Admin",
      path: "/dashboard/admin",
      icon: <Shield className="w-4 h-4" />,
      roles: ["ADMIN", "SUPERADMIN"],
      subItems: [
        {
          label: "User Directory",
          path: "/dashboard/admin/users",
          icon: <Users className="w-3 h-3" />,
        },
        {
          label: "System Audit",
          path: "/dashboard/admin/logs",
          icon: <Activity className="w-3 h-3" />,
        },
        {
          label: "Audit Trail",
          path: "/dashboard/admin/audit",
          icon: <BarChart3 className="w-3 h-3" />,
        },
      ],
    },
    {
      label: "Profile",
      path: "/dashboard/profile",
      icon: <UserCircle className="w-4 h-4" />,
      roles: ["BUYER", "SUPPLIER", "ADMIN", "SUPERADMIN"],
    },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(role || ""),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              bg-card border border-border rounded-lg px-4 py-3 min-w-70 shadow-lg
              ${toast.type === "error" ? "border-destructive/50" : "border-primary/50"}
              animate-slide-in-right
            `}
          >
            <p className="text-sm text-foreground">{toast.content}</p>
          </div>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        ref={mobileMenuRef}
        className={`
          fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-40
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col
        `}
      >
        {/* Logo - Fixed at top */}
        <div className="shrink-0 p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Award className="text-primary-foreground w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-sidebar-foreground">
                Bid<span className="text-primary">Sync</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                v2.0.0 • {role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable middle section */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <div key={item.path}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.path)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                      transition-all duration-200 group
                      ${
                        location.pathname === item.path ||
                        location.pathname.startsWith(item.path + "/")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded">
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && (
                        <span className="ml-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMenus.includes(item.path) ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {expandedMenus.includes(item.path) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`
                            flex items-center space-x-3 px-3 py-2 rounded-lg
                            transition-all duration-200
                            ${
                              location.pathname === subItem.path
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            }
                          `}
                        >
                          {subItem.icon}
                          <span className="text-xs">{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group
                    ${
                      location.pathname === item.path
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }
                  `}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="ml-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer with Logout - Fixed at bottom */}
        <div className="shrink-0 p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
          <div className="mt-4 text-center">
            <p className="text-[9px] text-muted-foreground font-mono">
              SECURE_SESSION v2.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center space-x-2 text-xs font-mono">
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">dashboard</span>
              {location.pathname
                .split("/")
                .slice(2)
                .map((segment, index, arr) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    <span
                      className={
                        index === arr.length - 1
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {segment}
                    </span>
                  </React.Fragment>
                ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4 ml-auto lg:ml-0">
              {/* Help Button */}
              <button className="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Theme Toggle */}
              <ModeToggle />

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-popover border border-border rounded-xl shadow-2xl z-50">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-popover-foreground">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-destructive/20 text-destructive rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="p-1.5 hover:bg-accent rounded-lg transition-colors group"
                            title="Mark all as read"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAllNotifications}
                            disabled={isClearing}
                            className="p-1.5 hover:bg-accent rounded-lg transition-colors group"
                            title="Clear all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-border">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() =>
                              !notif.isRead && handleMarkAsRead(notif.id)
                            }
                            className={`
                              relative transition-all duration-200 cursor-pointer
                              ${
                                !notif.isRead
                                  ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-primary"
                                  : "hover:bg-accent/50 opacity-75"
                              }
                            `}
                          >
                            {/* Unread indicator dot */}
                            {!notif.isRead && (
                              <div className="absolute top-4 left-3 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            )}

                            <div
                              className={`p-4 ${!notif.isRead ? "pl-8" : "pl-4"}`}
                            >
                              {notif.link ? (
                                <Link
                                  to={notif.link}
                                  onClick={() => setShowNotifications(false)}
                                  className="block"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="shrink-0">
                                      {!notif.isRead ? (
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                          <Bell className="w-4 h-4 text-primary" />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                          <Bell className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`
                                          text-sm leading-relaxed
                                          ${!notif.isRead ? "text-popover-foreground font-medium" : "text-muted-foreground"}
                                        `}
                                      >
                                        {notif.content}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(
                                            notif.createdAt,
                                          ).toLocaleString()}
                                        </p>
                                        {!notif.isRead && (
                                          <span className="text-[9px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                            NEW
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              ) : (
                                <div className="flex items-start gap-3">
                                  <div className="shrink-0">
                                    {!notif.isRead ? (
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-primary" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`
                                        text-sm leading-relaxed
                                        ${!notif.isRead ? "text-popover-foreground font-medium" : "text-muted-foreground"}
                                      `}
                                    >
                                      {notif.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(
                                          notif.createdAt,
                                        ).toLocaleString()}
                                      </p>
                                      {!notif.isRead && (
                                        <span className="text-[9px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                          NEW
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer with mark all read if there are unread notifications */}
                    {unreadCount > 0 && notifications.length > 0 && (
                      <div className="p-3 border-t border-border bg-muted/30">
                        <button
                          onClick={markAllAsRead}
                          className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-3 pl-4 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {role}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-sm">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Banner */}
          {isPending && !location.pathname.includes("onboarding") && (
            <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 lg:px-8 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-500">
                  ⚠️ Verification required to access full features
                </span>
                <Link
                  to="/dashboard/onboarding"
                  className="text-amber-500 hover:text-amber-400 font-medium text-sm"
                >
                  Complete Verification →
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
