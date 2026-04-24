/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { getDashboardStatus } from "@/services/api/status-api";
import {
  TrendingUp,
  Users,
  FileText,
  Award,
  Clock,
  Activity,
  Target,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  Zap,
  Shield,
  Eye,
  ThumbsUp,
  Settings,
  UserCircle,
} from "lucide-react";

// Type definitions for API responses
interface AdminDashboardData {
  totalUsers: number;
  pendingVerifications: number;
  activeRfps: number;
  totalBids: number;
  recentActivities: ActivityItem[];
  topPerformers: PerformerItem[];
}

interface SupplierDashboardData {
  activeBids: number;
  newRfpsCount: number;
  wonBidsCount: number;
  winRate: number;
  recentRfps: RFPItem[];
  recommendedRfps: RFPItem[];
  upcomingDeadlines: DeadlineItem[];
}

interface BuyerDashboardData {
  openRfpsCount: number;
  totalBidsReceived: number;
  activeSuppliers: number;
  avgBidAmount: number;
  recentRfps: RFPItem[];
  recentBids: BidItem[];
  upcomingDeadlines: DeadlineItem[];
}

interface ActivityItem {
  id: string;
  action: string;
  time: string;
  status: string;
}

interface PerformerItem {
  id: string;
  name: string;
  bids: number;
  winRate: number;
}

interface RFPItem {
  id: string;
  title: string;
  deadline: string;
  bidsCount: number;
  budget?: number | null;
  daysLeft?: number;
}

interface BidItem {
  id: string;
  supplierName: string;
  amount: number | null;
  time: string;
  rfpTitle?: string;
}

interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  daysLeft: number;
}

export const DashboardHome = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const role = user?.role;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStatus();

        if (response && response.success) {
          setDashboardData(response.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("DASHBOARD_STATS_FETCH_FAILED", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-muted-foreground">
          LOADING_DASHBOARD_DATA...
        </p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-foreground mb-4">Failed to synchronize live data</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  // Helper function to format deadline date
  const formatDeadlineDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // 1. ADMIN VIEW
  if (role === "ADMIN" || role === "SUPERADMIN") {
    const data = dashboardData as AdminDashboardData;

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">
                System overview and management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-xs font-mono text-muted-foreground">
                  System: Operational
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={data.totalUsers || 0}
            icon={<Users className="w-5 h-5" />}
            color="blue"
            link="/dashboard/admin/users"
          />
          <StatCard
            title="Pending Verifications"
            value={data.pendingVerifications || 0}
            icon={<Shield className="w-5 h-5" />}
            color="amber"
            link="/dashboard/admin/users"
          />
          <StatCard
            title="Active RFPs"
            value={data.activeRfps || 0}
            icon={<FileText className="w-5 h-5" />}
            color="green"
            link="/dashboard/rfps"
          />
          <StatCard
            title="Total Bids"
            value={data.totalBids || 0}
            icon={<Award className="w-5 h-5" />}
            color="purple"
            link="/dashboard/rfps"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <RecentActivityCard
            activities={
              data.recentActivities?.map((activity) => ({
                ...activity,
                time: formatDate(activity.time),
              })) || []
            }
          />

          {/* Top Performers */}
          <TopPerformersCard performers={data.topPerformers || []} />
        </div>

        {/* Quick Actions */}
        <QuickActionsCard role="admin" />
      </div>
    );
  }

  // 2. SUPPLIER VIEW
  if (role === "SUPPLIER") {
    const data = dashboardData as SupplierDashboardData;
    const isPending = user?.supplier?.status === "PENDING";

    return (
      <div className="space-y-6">
        {/* Welcome Header with Verification Status */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Track your bids and discover new opportunities
              </p>
            </div>
            {isPending ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-destructive/20 rounded-lg border border-destructive/30">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-xs font-mono text-destructive">
                  PENDING VERIFICATION
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-mono text-green-500">
                  VERIFIED ACCOUNT
                </span>
              </div>
            )}
          </div>

          {isPending && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-xl border border-destructive/30">
              <p className="text-sm text-destructive mb-2">
                ⚠️ Your account is pending verification. You can browse RFPs but
                cannot place bids yet.
              </p>
              <Link
                to="/dashboard/onboarding"
                className="text-sm text-destructive hover:text-destructive/80 font-medium"
              >
                Complete Verification →
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Bids"
            value={data.activeBids || 0}
            icon={<Target className="w-5 h-5" />}
            color="blue"
            link="/dashboard/my-bids"
          />
          <StatCard
            title="New RFPs Today"
            value={data.newRfpsCount || 0}
            icon={<FileText className="w-5 h-5" />}
            color="purple"
            link="/dashboard/rfps"
          />
          <StatCard
            title="Won Proposals"
            value={data.wonBidsCount || 0}
            icon={<Award className="w-5 h-5" />}
            color="green"
            link="/dashboard/my-bids"
          />
          <StatCard
            title="Win Rate"
            value={`${data.winRate || 0}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
            link="/dashboard/my-bids"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent RFPs */}
          <RecentRfpsCard
            rfps={
              data.recentRfps?.map((rfp) => ({
                ...rfp,
                deadline: formatDeadlineDate(rfp.deadline),
              })) || []
            }
          />

          {/* Upcoming Deadlines */}
          <UpcomingDeadlinesCard
            deadlines={
              data.upcomingDeadlines?.map((deadline) => ({
                ...deadline,
                date: formatDeadlineDate(deadline.date),
              })) || []
            }
          />
        </div>

        {/* Recommended Opportunities */}
        <RecommendedOpportunitiesCard
          opportunities={
            data.recommendedRfps?.map((opp) => ({
              ...opp,
              deadline: formatDeadlineDate(opp.deadline),
            })) || []
          }
        />

        {/* Quick Actions */}
        <QuickActionsCard role="supplier" />
      </div>
    );
  }

  // 3. BUYER VIEW
  if (role === "BUYER") {
    const data = dashboardData as BuyerDashboardData;

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {user?.buyer?.companyName || "Buyer Console"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage procurement and evaluate suppliers
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Open RFPs"
            value={data.openRfpsCount || 0}
            icon={<FileText className="w-5 h-5" />}
            color="blue"
            link="/dashboard/rfps"
          />
          <StatCard
            title="Total Bids Received"
            value={data.totalBidsReceived || 0}
            icon={<MessageSquare className="w-5 h-5" />}
            color="purple"
            link="/dashboard/rfps"
          />
          <StatCard
            title="Active Suppliers"
            value={data.activeSuppliers || 0}
            icon={<Users className="w-5 h-5" />}
            color="green"
            link="/dashboard/rfps"
          />
          <StatCard
            title="Avg. Bid Amount"
            value={`$${data.avgBidAmount || 0}k`}
            icon={<DollarSign className="w-5 h-5" />}
            color="amber"
            link="/dashboard/rfps"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent RFPs */}
          <RecentRfpsCard
            rfps={
              data.recentRfps?.map((rfp) => ({
                ...rfp,
                deadline: formatDeadlineDate(rfp.deadline),
              })) || []
            }
            isBuyer
          />

          {/* Bid Activity */}
          <BidActivityCard
            bids={
              data.recentBids?.map((bid) => ({
                ...bid,
                time: formatDate(bid.time),
              })) || []
            }
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsCard role="buyer" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 text-center">
      <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
      <p className="text-foreground">UNAUTHORIZED_ACCESS_OR_UNKNOWN_ROLE</p>
    </div>
  );
};

// --- Sub-Components ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  link: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  link,
}) => {
  const colorClasses = {
    blue: "from-primary/20 to-primary/5 border-primary/30",
    green: "from-green-500/20 to-green-500/5 border-green-500/30",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  }[color];

  return (
    <Link
      to={link}
      className={`bg-card border border-border rounded-xl p-5 bg-linear-to-br ${colorClasses} hover:scale-[1.02] transition-all duration-200 block`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center text-${color}-500`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs font-mono text-muted-foreground">{title}</p>
    </Link>
  );
};

const RecentActivityCard: React.FC<{ activities: ActivityItem[] }> = ({
  activities,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Recent Activity
      </h3>
      <Link
        to="/dashboard/admin/logs"
        className="text-xs text-primary hover:text-primary/80"
      >
        View All →
      </Link>
    </div>
    <div className="space-y-3">
      {activities.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No recent activities
        </p>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                activity.status === "success"
                  ? "bg-green-500"
                  : activity.status === "warning"
                    ? "bg-destructive"
                    : "bg-primary"
              }`}
            />
            <div className="flex-1">
              <p className="text-sm text-foreground">{activity.action}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const TopPerformersCard: React.FC<{ performers: PerformerItem[] }> = ({
  performers,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        Top Performers
      </h3>
      <Link
        to="/dashboard/admin/users"
        className="text-xs text-primary hover:text-primary/80"
      >
        View All →
      </Link>
    </div>
    <div className="space-y-3">
      {performers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No performers data
        </p>
      ) : (
        performers.map((performer, idx) => (
          <div
            key={performer.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                #{idx + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {performer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {performer.bids} bids placed
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-500">
                {performer.winRate}%
              </p>
              <p className="text-xs text-muted-foreground">win rate</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const RecentRfpsCard: React.FC<{ rfps: any[]; isBuyer?: boolean }> = ({
  rfps,
  isBuyer,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Recent RFPs
      </h3>
      <Link
        to="/dashboard/rfps"
        className="text-xs text-primary hover:text-primary/80"
      >
        View All →
      </Link>
    </div>
    <div className="space-y-3">
      {rfps.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No RFPs available
        </p>
      ) : (
        rfps.map((rfp) => (
          <div key={rfp.id} className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">{rfp.title}</p>
              <span className="text-xs text-primary">
                {rfp.bidsCount || 0} bids
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Deadline: {rfp.deadline}
              </p>
              {isBuyer ? (
                <Link
                  to={`/dashboard/rfps/${rfp.id}`}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  View Details →
                </Link>
              ) : (
                <Link
                  to={`/dashboard/rfps/${rfp.id}/bid`}
                  className="text-xs text-green-500 hover:text-green-400"
                >
                  Place Bid →
                </Link>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const UpcomingDeadlinesCard: React.FC<{ deadlines: DeadlineItem[] }> = ({
  deadlines,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Calendar className="w-5 h-5 text-amber-500" />
        Upcoming Deadlines
      </h3>
    </div>
    <div className="space-y-3">
      {deadlines.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No upcoming deadlines
        </p>
      ) : (
        deadlines.map((deadline) => (
          <div
            key={deadline.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {deadline.title}
              </p>
              <p className="text-xs text-muted-foreground">{deadline.date}</p>
            </div>
            <div
              className={`px-2 py-1 rounded-lg text-xs font-bold ${
                deadline.daysLeft <= 3
                  ? "bg-destructive/20 text-destructive"
                  : "bg-amber-500/20 text-amber-500"
              }`}
            >
              {deadline.daysLeft} days left
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const BidActivityCard: React.FC<{ bids: BidItem[] }> = ({ bids }) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-purple-500" />
        Recent Bid Activity
      </h3>
    </div>
    <div className="space-y-3">
      {bids.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No recent bids</p>
      ) : (
        bids.map((bid) => (
          <div
            key={bid.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {bid.supplierName}
              </p>
              <p className="text-xs text-muted-foreground">
                Bid amount: ${bid.amount?.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">{bid.time}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const RecommendedOpportunitiesCard: React.FC<{ opportunities: any[] }> = ({
  opportunities,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        Recommended for You
      </h3>
      <Link
        to="/dashboard/rfps"
        className="text-xs text-primary hover:text-primary/80"
      >
        Browse All →
      </Link>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {opportunities.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 col-span-2">
          No recommendations available
        </p>
      ) : (
        opportunities.map((opp) => (
          <div key={opp.id} className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {opp.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Budget: ${opp.budget?.toLocaleString() || 0}
                </p>
              </div>
              <Link
                to={`/dashboard/rfps/${opp.id}`}
                className="text-xs text-green-500 hover:text-green-400"
              >
                Apply →
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {opp.daysLeft} days left
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const QuickActionsCard: React.FC<{ role: string }> = ({ role }) => {
  const actions = {
    admin: [
      {
        label: "Manage Users",
        icon: <Users className="w-4 h-4" />,
        link: "/dashboard/admin/users",
        color: "blue",
      },
      {
        label: "View Audit Logs",
        icon: <Activity className="w-4 h-4" />,
        link: "/dashboard/admin/logs",
        color: "purple",
      },
      {
        label: "System Settings",
        icon: <Settings className="w-4 h-4" />,
        link: "/dashboard/admin/settings",
        color: "slate",
      },
    ],
    buyer: [
      {
        label: "Create New RFP",
        icon: <FileText className="w-4 h-4" />,
        link: "/dashboard/rfps/create",
        color: "green",
      },
      {
        label: "View Active RFPs",
        icon: <Eye className="w-4 h-4" />,
        link: "/dashboard/rfps",
        color: "blue",
      },
      {
        label: "Messages",
        icon: <MessageSquare className="w-4 h-4" />,
        link: "/dashboard/chat",
        color: "purple",
      },
    ],
    supplier: [
      {
        label: "Browse RFPs",
        icon: <Target className="w-4 h-4" />,
        link: "/dashboard/rfps",
        color: "green",
      },
      {
        label: "My Bids",
        icon: <Award className="w-4 h-4" />,
        link: "/dashboard/my-bids",
        color: "blue",
      },
      {
        label: "Profile",
        icon: <UserCircle className="w-4 h-4" />,
        link: "/dashboard/profile",
        color: "purple",
      },
    ],
  };

  const quickActions =
    actions[role as keyof typeof actions] || actions.supplier;

  const colorStyles = {
    blue: "bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary",
    green:
      "bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-500",
    purple:
      "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-500",
    slate: "bg-muted border-border hover:bg-muted/80 text-foreground",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.link}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 group ${
              colorStyles[action.color as keyof typeof colorStyles] ||
              colorStyles.blue
            }`}
          >
            {action.icon}
            <span className="text-sm font-medium group-hover:text-inherit">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
