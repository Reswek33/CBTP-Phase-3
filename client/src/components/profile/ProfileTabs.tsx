import React from "react";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface ProfileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div style={styles.tabContainer}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            ...styles.tab,
            ...(activeTab === tab.id ? styles.tabActive : {}),
          }}
        >
          <span style={styles.tabIcon}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  tabContainer: {
    display: "flex",
    gap: "8px",
    borderBottom: "2px solid #E2E8F0",
    paddingBottom: "0",
  },
  tab: {
    padding: "12px 24px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
  },
  tabActive: {
    color: "#3182CE",
    borderBottom: "2px solid #3182CE",
  },
  tabIcon: {
    fontSize: "14px",
  },
};
