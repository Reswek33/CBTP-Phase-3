/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  updateProfile,
  updateUserName,
  type UserUpdateInput,
} from "@/services/api/user-api";
import React, { useState } from "react";

interface BusinessInfoProps {
  user: any;
  onUserUpdate?: () => void; // Callback to refresh user data
}

export const BusinessInfo: React.FC<BusinessInfoProps> = ({
  user,
  onUserUpdate,
}) => {
  const isSupplier = user.role === "SUPPLIER";
  const isBuyer = user.role === "BUYER";

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    username: user.username || "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    msg: string;
    type: "SUCCESS" | "ERROR" | "IDLE";
  }>({
    msg: "",
    type: "IDLE",
  });

  const handleEditClick = () => {
    setEditData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      username: user.username || "",
    });
    setIsEditing(true);
    setStatus({ msg: "", type: "IDLE" });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setStatus({ msg: "", type: "IDLE" });
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus({ msg: "UPDATING_PROFILE...", type: "IDLE" });

    try {
      // Check if username changed
      let usernameUpdated = false;
      if (editData.username !== user.username) {
        await updateUserName(editData.username);
        usernameUpdated = true;
      }

      // Check if other fields changed
      const profileChanges: UserUpdateInput = {};
      if (editData.firstName !== user.firstName)
        profileChanges.firstName = editData.firstName;
      if (editData.lastName !== user.lastName)
        profileChanges.lastName = editData.lastName;
      if (editData.email !== user.email) profileChanges.email = editData.email;

      if (Object.keys(profileChanges).length > 0) {
        await updateProfile(profileChanges);
      }

      setStatus({
        msg:
          usernameUpdated || Object.keys(profileChanges).length > 0
            ? "PROFILE_UPDATED_SUCCESSFULLY"
            : "NO_CHANGES_DETECTED",
        type: "SUCCESS",
      });

      setIsEditing(false);

      // Refresh user data
      if (onUserUpdate) onUserUpdate();

      setTimeout(() => {
        setStatus({ msg: "", type: "IDLE" });
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "UPDATE_FAILED";
      setStatus({ msg: errorMsg.toUpperCase(), type: "ERROR" });

      setTimeout(() => {
        setStatus({ msg: "", type: "IDLE" });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={styles.card}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>BUSINESS_CORE_SPECIFICATIONS</h3>
        {!isEditing && (
          <button onClick={handleEditClick} style={styles.editBtn}>
            ✎ EDIT_PROFILE
          </button>
        )}
      </div>

      {isEditing ? (
        <div style={styles.editForm}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>FIRST_NAME</label>
            <input
              type="text"
              style={styles.input}
              value={editData.firstName}
              onChange={(e) =>
                setEditData({ ...editData, firstName: e.target.value })
              }
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>LAST_NAME</label>
            <input
              type="text"
              style={styles.input}
              value={editData.lastName}
              onChange={(e) =>
                setEditData({ ...editData, lastName: e.target.value })
              }
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>EMAIL</label>
            <input
              type="email"
              style={styles.input}
              value={editData.email}
              onChange={(e) =>
                setEditData({ ...editData, email: e.target.value })
              }
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>USERNAME</label>
            <input
              type="text"
              style={styles.input}
              value={editData.username}
              onChange={(e) =>
                setEditData({ ...editData, username: e.target.value })
              }
              placeholder="Min 4 characters"
            />
            <small style={styles.hint}>
              Username must be at least 4 characters
            </small>
          </div>
          <div style={styles.editActions}>
            <button
              onClick={handleCancel}
              style={styles.cancelEditBtn}
              disabled={loading}
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              style={styles.saveBtn}
              disabled={loading}
            >
              {loading ? "SAVING..." : "SAVE_CHANGES"}
            </button>
          </div>
          {status.msg && (
            <p
              style={{
                ...styles.statusMsg,
                color: status.type === "ERROR" ? "#E53E3E" : "#3182CE",
              }}
            >
              {status.msg}
            </p>
          )}
        </div>
      ) : (
        <div style={styles.infoList}>
          <InfoItem label="Email" value={user.email} />
          <InfoItem label="Username" value={user.username} />
          {isBuyer && (
            <>
              <InfoItem label="Entity" value={user.buyer?.companyName} />
              <InfoItem label="Dept" value={user.buyer?.department} />
              <InfoItem label="Address" value={user.buyer?.address} />
            </>
          )}
          {isSupplier && (
            <>
              <InfoItem label="TIN_ID" value={user.supplier?.taxId} />
              <InfoItem
                label="Reg_No"
                value={user.supplier?.registrationNumber}
              />
              <div style={styles.bioBox}>
                <strong>STRATEGY_BIO:</strong>
                <p>{user.supplier?.bio || "NO_BIO_PROVIDED"}</p>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

const InfoItem = ({ label, value }: { label: string; value: any }) => (
  <div style={styles.infoRow}>
    <span style={styles.label}>{label}:</span>
    <span style={styles.value}>{value || "NULL"}</span>
  </div>
);

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: "#fff",
    padding: "24px",
    border: "2px solid #0F172A",
    boxShadow: "6px 6px 0px #0F172A",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "11px",
    fontWeight: "900",
    color: "#3182ce",
    letterSpacing: "1.5px",
    borderBottom: "1px solid #E2E8F0",
    paddingBottom: "8px",
    textTransform: "uppercase",
  },
  editBtn: {
    backgroundColor: "transparent",
    border: "2px solid #3182CE",
    color: "#3182CE",
    padding: "6px 12px",
    fontSize: "9px",
    fontWeight: "900",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  infoList: { display: "flex", flexDirection: "column", gap: "12px" },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
  },
  label: {
    color: "#718096",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: "10px",
  },
  value: { color: "#0F172A", fontWeight: "800" },
  bioBox: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: "#F8FAFC",
    border: "1px dashed #CBD5E0",
    fontSize: "11px",
  },
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  input: {
    padding: "10px",
    border: "2px solid #0F172A",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: "700",
  },
  hint: {
    fontSize: "9px",
    color: "#718096",
    marginTop: "2px",
  },
  editActions: {
    display: "flex",
    gap: "12px",
    marginTop: "10px",
  },
  cancelEditBtn: {
    flex: 1,
    padding: "10px",
    backgroundColor: "transparent",
    border: "2px solid #718096",
    color: "#718096",
    fontWeight: "900",
    fontSize: "10px",
    cursor: "pointer",
    textTransform: "uppercase",
  },
  saveBtn: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#0F172A",
    color: "#fff",
    border: "none",
    fontWeight: "900",
    fontSize: "10px",
    cursor: "pointer",
    textTransform: "uppercase",
  },
  statusMsg: {
    fontSize: "10px",
    fontWeight: "700",
    textAlign: "center",
    marginTop: "10px",
    padding: "8px",
    backgroundColor: "#F8FAFC",
  },
};
