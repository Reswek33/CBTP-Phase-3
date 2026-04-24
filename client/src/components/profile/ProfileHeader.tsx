/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

interface ProfileHeaderProps {
  user: any;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const isSupplier = user.role === "SUPPLIER";

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatarLarge}>
          {user.firstName[0]}
          {user.lastName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={styles.title}>
            {user.firstName} {user.lastName}
          </h1>
          <p style={styles.subtitle}>
            ID: {user.id.slice(0, 8)} • ACCESS_LEVEL: {user.role}
          </p>
        </div>
        {isSupplier && (
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor:
                user.supplier?.status === "VERIFIED" ? "#c6f6d5" : "#feebc8",
              color:
                user.supplier?.status === "VERIFIED" ? "#22543d" : "#744210",
            }}
          >
            {user.supplier?.status}
          </span>
        )}
      </div>
    </section>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "#fff",
    padding: "24px",
    border: "2px solid #0F172A",
    boxShadow: "6px 6px 0px #0F172A",
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    position: "relative",
  },
  avatarLarge: {
    width: "70px",
    height: "70px",
    backgroundColor: "#0F172A",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "900",
  },
  title: { margin: 0, fontSize: "22px", fontWeight: "900", color: "#0F172A" },
  subtitle: {
    margin: 0,
    color: "#718096",
    fontSize: "11px",
    fontWeight: "700",
  },
  statusBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: "4px 10px",
    fontSize: "10px",
    fontWeight: "900",
    border: "2px solid #0F172A",
  },
};
