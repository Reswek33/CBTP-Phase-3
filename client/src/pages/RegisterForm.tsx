/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { postRegister } from "../services/api/auth-api";

const registerInputSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["BUYER", "SUPPLIER"]),
    companyName: z.string().optional(),
    businessName: z.string().optional(),
    taxId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "BUYER" && !data.companyName) return false;
      if (data.role === "SUPPLIER" && !data.businessName) return false;
      return true;
    },
    {
      message: "Required based on your role",
      path: ["companyName"],
    },
  );

type RegisterFormData = z.infer<typeof registerInputSchema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { role: "BUYER" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setServerError(null);
    try {
      await postRegister(data);
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "REGISTRATION_FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.gridOverlay} />

      <div style={styles.authCard}>
        <div style={styles.cardHeader}>
          <div style={styles.headerTitle}>
            <span style={{ color: "#3182ce" }}>//</span>{" "}
            NEW_OPERATOR_REGISTRATION
          </div>
          <div style={styles.headerBadge}>SECURE_ONBOARDING</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
          {serverError && (
            <div style={styles.errorAlert}>[!] ERROR: {serverError}</div>
          )}

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>FIRST_NAME</label>
              <input {...register("firstName")} style={styles.input} />
              {errors.firstName && (
                <span style={styles.errorText}>{errors.firstName.message}</span>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>LAST_NAME</label>
              <input {...register("lastName")} style={styles.input} />
              {errors.lastName && (
                <span style={styles.errorText}>{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>USERNAME</label>
              <input {...register("username")} style={styles.input} />
              {errors.username && (
                <span style={styles.errorText}>{errors.username.message}</span>
              )}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>ROLE_SELECTION</label>
              <select {...register("role")} style={styles.select}>
                <option value="BUYER">BUYER (PROCUREMENT)</option>
                <option value="SUPPLIER">SUPPLIER (BIDDING)</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>EMAIL_ADDRESS</label>
            <input type="email" {...register("email")} style={styles.input} />
            {errors.email && (
              <span style={styles.errorText}>{errors.email.message}</span>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>ACCESS_KEY (PASSWORD)</label>
            <input
              type="password"
              {...register("password")}
              style={styles.input}
            />
            {errors.password && (
              <span style={styles.errorText}>{errors.password.message}</span>
            )}
          </div>

          <div style={styles.divider}>COMPLIANCE_DATA</div>

          {selectedRole === "BUYER" ? (
            <div style={styles.field}>
              <label style={styles.label}>LEGAL_COMPANY_NAME *</label>
              <input
                {...register("companyName")}
                placeholder="Enter legal entity name"
                style={styles.input}
              />
              {errors.companyName && (
                <span style={styles.errorText}>
                  {errors.companyName.message}
                </span>
              )}
            </div>
          ) : (
            <>
              <div style={styles.field}>
                <label style={styles.label}>REGISTERED_BUSINESS_NAME *</label>
                <input
                  {...register("businessName")}
                  placeholder="Enter business name"
                  style={styles.input}
                />
                {errors.businessName && (
                  <span style={styles.errorText}>
                    {errors.businessName.message}
                  </span>
                )}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>TAX_ID_OR_TIN</label>
                <input {...register("taxId")} style={styles.input} />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "COMMITTING_DATA..." : "EXECUTE_REGISTRATION"}
          </button>
        </form>

        <div style={styles.cardFooter}>
          <span style={{ color: "#475569" }}>EXISTING_ACCOUNT?</span>
          <Link to="/login" style={styles.link}>
            ACCESS_PORTAL
          </Link>
        </div>
      </div>

      <Link to="/" style={styles.backLink}>
        &larr; RETURN_TO_ROOT
      </Link>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#020617",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'JetBrains Mono', monospace",
    position: "relative",
    color: "#fff",
    padding: "40px 20px",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
    opacity: 0.1,
    pointerEvents: "none",
  },
  authCard: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    border: "2px solid #1e293b",
    zIndex: 10,
    boxShadow: "20px 20px 0px #0f172a",
  },
  cardHeader: {
    padding: "20px",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
  },
  headerTitle: { fontSize: "12px", fontWeight: "800", letterSpacing: "1px" },
  headerBadge: {
    fontSize: "9px",
    backgroundColor: "#3182ce",
    padding: "2px 8px",
    fontWeight: "900",
  },
  form: {
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "1px",
  },
  input: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    padding: "10px",
    color: "#fff",
    fontFamily: "inherit",
    fontSize: "14px",
    outline: "none",
  },
  select: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    padding: "10px",
    color: "#fff",
    fontFamily: "inherit",
    fontSize: "13px",
    outline: "none",
  },
  divider: {
    fontSize: "10px",
    color: "#3182ce",
    fontWeight: "900",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "5px",
    marginTop: "10px",
  },
  button: {
    marginTop: "10px",
    padding: "14px",
    backgroundColor: "#fff",
    color: "#020617",
    border: "none",
    fontSize: "13px",
    fontWeight: "900",
    cursor: "pointer",
    letterSpacing: "1px",
  },
  errorText: { color: "#ef4444", fontSize: "10px", fontWeight: "700" },
  errorAlert: {
    padding: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "1px solid #ef4444",
    fontSize: "11px",
  },
  cardFooter: {
    padding: "20px",
    borderTop: "1px solid #1e293b",
    textAlign: "center",
    fontSize: "12px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  link: { color: "#3182ce", textDecoration: "none", fontWeight: "800" },
  backLink: {
    marginTop: "20px",
    color: "#475569",
    textDecoration: "none",
    fontSize: "11px",
    zIndex: 10,
  },
};
