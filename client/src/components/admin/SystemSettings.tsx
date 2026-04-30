import React, { useState } from "react";
import { 
  Settings, Save, Shield, Globe, 
  Mail, Bell, Lock, AlertTriangle,
  RefreshCw, Database, Server
} from "lucide-react";
import { toast } from "sonner";

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "infrastructure", label: "Infrastructure", icon: <Server className="w-4 h-4" /> },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("System settings updated successfully");
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Settings className="w-6 h-6 text-primary" /> System Settings
            </h2>
            <p className="text-muted-foreground text-sm">Configure global platform parameters and environment variables</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                  : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-2xl p-8 space-y-8 shadow-sm">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase font-mono">Platform Name</label>
                    <input 
                      type="text" 
                      defaultValue="Bid-Sync Platform"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase font-mono">Support Email</label>
                    <input 
                      type="email" 
                      defaultValue="support@bidsync.com"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase font-mono">System Maintenance Mode</label>
                  <div className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-700">Maintenance Mode</p>
                      <p className="text-xs text-amber-600/70">Enable this to block access for all users except admins.</p>
                    </div>
                    <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer group">
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Password Policy
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <span className="text-xs">Require Numbers</span>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                      <span className="text-xs">Require Special Chars</span>
                      <input type="checkbox" defaultChecked />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase font-mono">Session Timeout (Minutes)</label>
                  <input 
                    type="number" 
                    defaultValue="60"
                    className="w-40 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-mono" 
                  />
                </div>
              </div>
            )}

            {activeTab === "infrastructure" && (
              <div className="space-y-6">
                <div className="p-6 bg-slate-950 rounded-2xl font-mono text-[11px] text-emerald-400 space-y-1 border border-slate-800 shadow-2xl">
                  <p className="text-slate-500 mb-2"># System Environment Variables</p>
                  <p>NODE_ENV=production</p>
                  <p>DB_DIALECT=postgresql</p>
                  <p>SMTP_HOST=smtp.sendgrid.net</p>
                  <p>REDIS_CACHE=enabled</p>
                  <p>MAX_UPLOAD_SIZE=50MB</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 p-4 bg-muted/50 border border-border rounded-xl hover:bg-muted transition-colors font-bold text-xs">
                    <Database className="w-4 h-4" /> Backup Database Now
                  </button>
                  <button className="flex items-center justify-center gap-2 p-4 bg-muted/50 border border-border rounded-xl hover:bg-muted transition-colors font-bold text-xs">
                    <RefreshCw className="w-4 h-4" /> Flush Cache (Redis)
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-primary" /> Email Templates
                </h4>
                {["Welcome Email", "RFP Awarded", "Payment Successful", "Security Alert"].map((template) => (
                  <div key={template} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-primary/30 transition-all cursor-pointer group">
                    <span className="text-sm">{template}</span>
                    <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
