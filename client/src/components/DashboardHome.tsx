/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { getDashboardStatus } from "@/services/api/status-api";
import {
  getAdminDashboardStats,
  getAnalyticsOverview,
} from "@/services/api/admin-api";
import { motion } from "framer-motion";
import { DashboardSkeleton } from "./ui/SkeletonLoader";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
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
  totalSuppliers?: number;
  totalBuyers?: number;
  pendingVerifications: number;
  activeRfps: number;
  totalBids: number;
  activeSubscriptions?: number;
  totalRevenue?: number;
  recentActivities: ActivityItem[];
  topPerformers: PerformerItem[];
  recentTransactions?: any[];
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
  totalBudget: number;
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
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const role = user?.role;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch base stats
        const response = await getDashboardStatus();
        let combinedData = response.data;

        // If admin, fetch additional monitoring stats
        if (role === "ADMIN" || role === "SUPERADMIN") {
          try {
            const [adminStats, analytics] = await Promise.all([
              getAdminDashboardStats(),
              getAnalyticsOverview(),
            ]);

            if (adminStats.success) {
              combinedData = {
                ...combinedData,
                ...adminStats.data.metrics,
                recentTransactions: adminStats.data.recentTransactions,
              };
            }
            setAnalyticsData(analytics.data);
          } catch (adminErr) {
            console.error("ADMIN_STATS_FETCH_FAILED", adminErr);
          }
        }

        if (response && response.success) {
          setDashboardData(combinedData);
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
  }, [user, role]);

  if (loading) {
    return (
      <div className="animate-in fade-in duration-500">
        <DashboardSkeleton />
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Welcome Header */}
        <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden group shadow-xl shadow-primary/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <motion.h1
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className="text-3xl font-black text-foreground tracking-tight"
              >
                Control <span className="text-primary">Center</span>
              </motion.h1>
              <p className="text-muted-foreground font-medium">
                System health is{" "}
                <span className="text-emerald-500 font-bold">Optimal</span>. All
                services are operational.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-6 py-3 bg-background/50 backdrop-blur-md border border-border rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Live Monitoring
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Users"
            value={data.totalUsers || 0}
            icon={<Users className="w-5 h-5" />}
            color="blue"
            link="/dashboard/admin/users"
          />
          <StatCard
            title="Active Subscriptions"
            value={data.activeSubscriptions || 0}
            icon={<Zap className="w-5 h-5" />}
            color="purple"
            link="/dashboard/admin/subscriptions"
          />
          <StatCard
            title="Total Revenue"
            value={`${(data.totalRevenue || 0).toLocaleString()} ETB`}
            icon={<DollarSign className="w-5 h-5" />}
            color="emerald"
            link="/dashboard/admin/transactions"
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
            color="blue"
            link="/dashboard/rfps"
          />
        </div>

        {/* Analytics Section */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> User Growth
                (Last 6 Months)
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.userGrowth}>
                    <defs>
                      <linearGradient
                        id="dashColor"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#334155"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#dashColor)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Revenue Growth
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.subscriptionTrends}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#334155"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

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

          {/* Recent Transactions */}
          {data.recentTransactions && (
            <div className="lg:col-span-2">
              <RecentTransactionsCard transactions={data.recentTransactions} />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <QuickActionsCard role="admin" />
      </motion.div>
    );
  }

  // Helper for Onboarding Progress
  const getOnboardingProgress = () => {
    if (role === "SUPPLIER") {
      let score = 0;
      if (user?.supplier?.status === "VERIFIED") score += 50;
      if (dashboardData.activeBids > 0) score += 50;
      return score;
    }
    if (role === "BUYER") {
      let score = 0;
      if (dashboardData.openRfpsCount > 0) score += 100;
      return score;
    }
    return 0;
  };

  // 2. SUPPLIER VIEW
  if (role === "SUPPLIER") {
    const data = dashboardData as SupplierDashboardData;
    const isPending = user?.supplier?.status === "PENDING";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Welcome Header with Onboarding */}
        <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden group shadow-xl shadow-primary/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-4 mb-2">
                <motion.h1
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  className="text-3xl font-black text-foreground tracking-tight"
                >
                  Welcome back,{" "}
                  <span className="text-primary">{user?.firstName}!</span> 👋
                </motion.h1>
                {isPending ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-destructive/20 rounded-lg border border-destructive/30">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-[10px] font-bold text-destructive uppercase">
                      PENDING
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-bold text-green-500 uppercase">
                      VERIFIED
                    </span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground font-medium">
                You have{" "}
                <span className="text-foreground font-bold">
                  {data.activeBids} active bids
                </span>{" "}
                requiring attention today.
              </p>
            </div>

            <div className="bg-background/50 backdrop-blur-md border border-border p-5 rounded-2xl w-full md:w-72 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Setup Progress
                </span>
                <span className="text-xs font-bold text-primary">
                  {getOnboardingProgress()}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getOnboardingProgress()}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-medium">
                {getOnboardingProgress() < 100
                  ? "Complete your profile to unlock full features."
                  : "You're all set! Ready for more bids?"}
              </p>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="p-6 bg-destructive/10 rounded-3xl border border-destructive/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Action Required: Verification Pending
                </p>
                <p className="text-xs text-muted-foreground">
                  Complete your onboarding to start bidding on RFPs.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/onboarding"
              className="px-6 py-3 bg-destructive text-white rounded-xl font-bold hover:bg-destructive/90 transition-colors text-center"
            >
              Complete Onboarding →
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentRfpsCard
            rfps={
              data.recentRfps?.map((rfp) => ({
                ...rfp,
                deadline: formatDeadlineDate(rfp.deadline),
              })) || []
            }
          />
          <UpcomingDeadlinesCard
            deadlines={
              data.upcomingDeadlines?.map((deadline) => ({
                ...deadline,
                date: formatDeadlineDate(deadline.date),
              })) || []
            }
          />
        </div>

        <RecommendedOpportunitiesCard
          opportunities={
            data.recommendedRfps?.map((opp) => ({
              ...opp,
              deadline: formatDeadlineDate(opp.deadline),
            })) || []
          }
        />

        <QuickActionsCard role="supplier" />
      </motion.div>
    );
  }

  // 3. BUYER VIEW
  if (role === "BUYER") {
    const data = dashboardData as BuyerDashboardData;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Welcome Header with Onboarding */}
        <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden group shadow-xl shadow-primary/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all duration-700" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <motion.h1
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className="text-3xl font-black text-foreground tracking-tight"
              >
                {user?.buyer?.companyName || "Buyer Console"}
              </motion.h1>
              <p className="text-muted-foreground font-medium">
                You have{" "}
                <span className="text-foreground font-bold">
                  {data.openRfpsCount} open RFPs
                </span>{" "}
                active in the market.
              </p>
            </div>

            <div className="bg-background/50 backdrop-blur-md border border-border p-5 rounded-2xl w-full md:w-72 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Setup Progress
                </span>
                <span className="text-xs font-bold text-primary">
                  {getOnboardingProgress()}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getOnboardingProgress()}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-medium">
                {getOnboardingProgress() < 100
                  ? "Start a new RFP to complete your setup."
                  : "Strategic procurement is in progress!"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Open RFPs"
            value={data.openRfpsCount || 0}
            icon={<FileText className="w-5 h-5" />}
            color="blue"
            link="/dashboard/rfps"
          />
          <StatCard
            title="Bids Received"
            value={data.totalBidsReceived || 0}
            icon={<Target className="w-5 h-5" />}
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
            title="Budget (Active)"
            value={`${(data.totalBudget || 0).toLocaleString()} ETB`}
            icon={<DollarSign className="w-5 h-5" />}
            color="emerald"
            link="/dashboard/rfps"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentRfpsCard
              rfps={
                data.recentRfps?.map((rfp) => ({
                  ...rfp,
                  deadline: formatDeadlineDate(rfp.deadline),
                })) || []
              }
              isBuyer={true}
            />
          </div>
          <UpcomingDeadlinesCard
            deadlines={
              data.upcomingDeadlines?.map((deadline) => ({
                ...deadline,
                date: formatDeadlineDate(deadline.date),
              })) || []
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BidActivityCard
              bids={
                data.recentBids?.map((bid) => ({
                  ...bid,
                  time: formatDate(bid.time),
                })) || []
              }
            />
          </div>
          <QuickActionsCard role="buyer" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 text-center">
      <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
      <p className="text-foreground">UNAUTHORIZED_ACCESS_OR_UNKNOWN_ROLE</p>
    </div>
  );
};

// --- Sub-Components --- (Rest of the components remain the same)
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
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link
        to={link}
        className={`bg-card border border-border rounded-2xl p-6 bg-linear-to-br ${colorClasses} hover:shadow-xl transition-all duration-300 block relative overflow-hidden group`}
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
          {icon}
        </div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary`}
          >
            {icon}
          </div>
        </div>
        <p className="text-4xl font-black text-foreground mb-1 tracking-tight">
          {value}
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </Link>
    </motion.div>
  );
};

const RecentActivityCard: React.FC<{ activities: ActivityItem[] }> = ({
  activities,
}) => (
  <div className="bg-card border border-border rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
        <Activity className="w-6 h-6 text-primary" />
        Live Pulse
      </h3>
      <Link
        to="/dashboard/admin/logs"
        className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
      >
        View Logs
      </Link>
    </div>
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-medium">
            Monitoring system pulses...
          </p>
        </div>
      ) : (
        activities.map((activity, idx) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={activity.id}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
          >
            <div
              className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] ${
                activity.status === "success"
                  ? "bg-emerald-500 shadow-emerald-500/20"
                  : activity.status === "warning"
                    ? "bg-amber-500 shadow-amber-500/20"
                    : "bg-primary shadow-primary/20"
              }`}
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {activity.action}
              </p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                {activity.time}
              </p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  </div>
);

const TopPerformersCard: React.FC<{ performers: PerformerItem[] }> = ({
  performers,
}) => (
  <div className="bg-card border border-border rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
        <Award className="w-6 h-6 text-amber-500" />
        Elite Partners
      </h3>
    </div>
    <div className="space-y-4">
      {performers.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-medium">
            No performance data yet
          </p>
        </div>
      ) : (
        performers.map((performer, idx) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            key={performer.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-border transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary">
                0{idx + 1}
              </div>
              <div>
                <p className="text-sm font-black text-foreground">
                  {performer.name}
                </p>
                <p className="text-xs text-muted-foreground font-bold">
                  {performer.bids} SUCCESSFUL BIDS
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-500 font-black text-lg">
                <TrendingUp className="w-4 h-4" />
                {performer.winRate}%
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                Win Velocity
              </p>
            </div>
          </motion.div>
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
                Bid amount: {(bid.amount || 0).toLocaleString()} ETB
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

const RecentTransactionsCard: React.FC<{ transactions: any[] }> = ({
  transactions,
}) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-emerald-500" />
        Recent Transactions
      </h3>
      <Link
        to="/dashboard/admin/transactions"
        className="text-xs text-primary hover:text-primary/80"
      >
        Audit All →
      </Link>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="pb-2 font-medium">User</th>
            <th className="pb-2 font-medium text-right">Amount</th>
            <th className="pb-2 font-medium text-center">Status</th>
            <th className="pb-2 font-medium text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="py-8 text-center text-muted-foreground"
              >
                No recent transactions
              </td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 text-left">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {tx.user?.firstName} {tx.user?.lastName}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {tx.plan?.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right font-mono font-bold text-emerald-500">
                  {parseFloat(tx.amount).toLocaleString()} {tx.currency}
                </td>
                <td className="py-3 text-center">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      tx.status === "SUCCESS"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-amber-500/20 text-amber-500"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="py-3 text-right text-xs text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
