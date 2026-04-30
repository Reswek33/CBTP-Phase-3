import React, { useEffect, useState } from "react";
import { getAnalyticsOverview, getSystemHealth } from "../../services/api/admin-api";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Users, FileText, Activity, 
  ShieldAlert, RefreshCw, Server, Cpu, Database 
} from "lucide-react";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, healthRes] = await Promise.all([
        getAnalyticsOverview(),
        getSystemHealth()
      ]);
      setData(analyticsRes.data);
      setHealth(healthRes.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-mono animate-pulse">GENERATING_ANALYTICS_REPORT...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <TrendingUp className="w-6 h-6 text-primary" /> Advanced Analytics
            </h2>
            <p className="text-muted-foreground text-sm">Deep dive into platform growth and system performance</p>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-accent rounded-xl transition-all border border-border shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-12 h-12" />
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">User Growth</p>
          <p className="text-3xl font-bold text-foreground">
            {data?.userGrowth?.reduce((a: any, b: any) => a + b.count, 0) || 0}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
            <TrendingUp className="w-3 h-3" /> +12.5% vs last month
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileText className="w-12 h-12" />
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">Total RFPs</p>
          <p className="text-3xl font-bold text-foreground">
            {data?.rfpDistribution?.reduce((a: any, b: any) => a + b._count.id, 0) || 0}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-500 font-bold">
             Market Liquidity High
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="w-12 h-12" />
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">System Health</p>
          <p className="text-3xl font-bold text-emerald-500">99.9%</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <Server className="w-3 h-3" /> UPTIME: {Math.floor(health?.uptime / 3600)}h
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">Error Rate</p>
          <p className="text-3xl font-bold text-amber-500">
            {health?.errorLogs || 0}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            Total logs reviewed in 24h
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth Line Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Monthly User Sign-ups
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.userGrowth}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1}/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RFP Category Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" /> RFP Distribution by Category
          </h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.rfpDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="_count.id"
                  nameKey="category"
                >
                  {data?.rfpDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Trends Bar Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" /> Subscription Revenue (Monthly)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.subscriptionTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1}/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Resources */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-500" /> Infrastructure Resource Usage
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Memory Usage (RSS)</span>
                <span className="font-mono">{Math.round(health?.memoryUsage?.rss / 1024 / 1024)} MB</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-1000" 
                  style={{ width: `${Math.min((health?.memoryUsage?.rss / 512 / 1024 / 1024) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Heap Used</span>
                <span className="font-mono">{Math.round(health?.memoryUsage?.heapUsed / 1024 / 1024)} MB</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                  style={{ width: `${Math.min((health?.memoryUsage?.heapUsed / 256 / 1024 / 1024) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="p-4 bg-muted/20 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Errors</p>
                <p className="text-lg font-bold text-amber-500">{health?.errorLogs}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Critical</p>
                <p className="text-lg font-bold text-destructive">{health?.criticalLogs}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Brief) */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Recent Real-time Activity
          </h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg font-mono">LIVE_STREAM</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 text-[10px] uppercase font-mono text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-border">
              {data?.recentActivity?.map((log: any) => (
                <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-3 font-medium">
                    {log.user?.firstName} {log.user?.lastName} 
                    <span className="ml-2 text-[10px] opacity-50">({log.user?.role})</span>
                  </td>
                  <td className="px-6 py-3 font-mono text-primary/80">{log.action}</td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
