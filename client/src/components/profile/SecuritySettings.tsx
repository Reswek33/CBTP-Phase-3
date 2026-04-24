/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { updateCredentials } from "@/services/api/auth-api";
import type { User } from "@/schemas/auth-schema";

interface SecuritySettingsProps {
  user: User;
}
export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ user }) => {
  const [securityData, setSecurityData] = useState({
    username: user?.username || "",
    tempPassword: "",
    newPassword: "",
  });
  const [securityStatus, setSecurityStatus] = useState<{
    msg: string;
    type: "IDLE" | "SUCCESS" | "ERROR" | "LOADING";
  }>({ msg: "", type: "IDLE" });

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatus({ msg: "EXECUTING_UPDATE...", type: "LOADING" });

    try {
      const payload: any = { tempPassword: securityData.tempPassword };
      if (securityData.username !== user?.username)
        payload.username = securityData.username;
      if (securityData.newPassword)
        payload.newPassword = securityData.newPassword;

      await updateCredentials(payload);

      setSecurityStatus({
        msg: "CREDENTIALS_REWRITTEN_SUCCESSFULLY",
        type: "SUCCESS",
      });
      setSecurityData((prev) => ({
        ...prev,
        tempPassword: "",
        newPassword: "",
      }));

      setTimeout(() => {
        setSecurityStatus({ msg: "", type: "IDLE" });
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "UPDATE_REJECTED";
      setSecurityStatus({ msg: errorMsg.toUpperCase(), type: "ERROR" });

      setTimeout(() => {
        setSecurityStatus({ msg: "", type: "IDLE" });
      }, 3000);
    }
  };

  return (
    <section style={styles.card}>
      <h3 style={styles.sectionTitle}>SECURITY_TUNNEL</h3>
      <form onSubmit={handleSecurityUpdate} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>IDENT_HANDLE (Username)</label>
          <input
            style={styles.input}
            value={securityData.username}
            onChange={(e) =>
              setSecurityData({ ...securityData, username: e.target.value })
            }
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>CURRENT_ACCESS_KEY (Required)</label>
          <input
            type="password"
            required
            style={styles.input}
            value={securityData.tempPassword}
            onChange={(e) =>
              setSecurityData({
                ...securityData,
                tempPassword: e.target.value,
              })
            }
            placeholder="Required for any change"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>NEW_ENCRYPTION_KEY (Optional)</label>
          <input
            type="password"
            style={styles.input}
            value={securityData.newPassword}
            onChange={(e) =>
              setSecurityData({
                ...securityData,
                newPassword: e.target.value,
              })
            }
            placeholder="Leave blank to keep current"
          />
        </div>
        <button
          type="submit"
          disabled={securityStatus.type === "LOADING"}
          style={styles.submitBtn}
        >
          {securityStatus.type === "LOADING"
            ? "SYNCHRONIZING..."
            : "EXECUTE_CREDENTIAL_CHANGE"}
        </button>

        {securityStatus.msg && (
          <p
            style={{
              ...styles.metaText,
              marginTop: "10px",
              color: securityStatus.type === "ERROR" ? "#E53E3E" : "#3182CE",
            }}
          >
            {securityStatus.msg}
          </p>
        )}
      </form>
    </section>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "#fff",
    padding: "24px",
    border: "2px solid #0F172A",
    boxShadow: "6px 6px 0px #0F172A",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "11px",
    fontWeight: "900",
    color: "#3182ce",
    letterSpacing: "1.5px",
    borderBottom: "1px solid #E2E8F0",
    paddingBottom: "8px",
    textTransform: "uppercase",
  },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: {
    color: "#718096",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "10px",
  },
  input: {
    padding: "10px",
    border: "2px solid #0F172A",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: "700",
  },
  submitBtn: {
    padding: "12px",
    backgroundColor: "#0F172A",
    color: "#fff",
    border: "none",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "11px",
    letterSpacing: "1px",
  },
  metaText: { fontSize: "10px", fontWeight: "700", textTransform: "uppercase" },
};
