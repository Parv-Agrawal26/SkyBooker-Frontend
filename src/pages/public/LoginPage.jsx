import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.css";

// ── Google Script Loader ───────────────────────────────────────────────────────
async function handleGoogleCallback(
  response,
  authRef,
  setError,
  setSuccess,
  setLoading,
) {
  setLoading(true);
  setError("");
  try {
    const res = await authApi.googleLogin({ credential: response.credential });
    const token = res.data.token;
    const role = JSON.parse(atob(token.split(".")[1])).role || "PASSENGER";
    const email = JSON.parse(atob(token.split(".")[1])).sub || "";
    authRef.current.login(token, email, role);
    const { navigate, redirectTo } = authRef.current;
    if (role === "ADMIN") navigate("/admin");
    else if (role === "AIRLINE_STAFF") navigate("/staff");
    else navigate(redirectTo);
  } catch (err) {
    setError("Google sign-in failed. Please try again or use email/password.");
  } finally {
    setLoading(false);
  }
}

function loadGoogleScript(callback) {
  if (document.getElementById("google-gsi-script")) {
    if (window.google) callback();
    else
      document
        .getElementById("google-gsi-script")
        .addEventListener("load", callback);
    return;
  }
  const script = document.createElement("script");
  script.id = "google-gsi-script";
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.body.appendChild(script);
}

// ── REPLACE with your actual Google Client ID ──────────────────────────────────
const GOOGLE_CLIENT_ID =
  "696364307002-vaeu51cudrft0sh0dimjacfkk71vf07u.apps.googleusercontent.com";

// ── Frontend Validators ────────────────────────────────────────────────────────
const VALIDATORS = {
  fullName: {
    regex: /^[A-Za-z ]{2,60}$/,
    message: "Full name: 2–60 letters and spaces only",
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Enter a valid email address",
  },
  password: {
    regex:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
    message:
      "Password: 8–20 chars, uppercase, lowercase, digit, special char (@$!%*?&)",
  },
  phone: {
    regex: /^[6-9]\d{9}$/,
    message: "Enter a valid 10-digit Indian mobile number",
  },
  passportNumber: {
    regex: /^[A-Z]{1,2}[0-9]{7}$/,
    message: "Passport: A1234567 or AB1234567",
  },
};

function validate(field, value) {
  if (!value || !value.trim()) return null;
  const v = VALIDATORS[field];
  return v && !v.regex.test(value.trim()) ? v.message : null;
}

function extractError(err) {
  if (!err.response)
    return "Cannot connect to server. Make sure the API gateway (port 8080) and auth service (port 8081) are running.";
  const data = err.response.data;
  if (!data) return `Server error: ${err.response.status}`;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  const firstKey = Object.keys(data)[0];
  return firstKey ? `${firstKey}: ${data[firstKey]}` : "Something went wrong.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const redirectTo = location.state?.from || "/";

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    passportNumber: "",
    role: "PASSENGER",
    staffSecretKey: "",
    adminSecretKey: "",
  });
  const [forgotForm, setForgotForm] = useState({ email: "", otp: "", newPassword: "" });
  const [forgotStage, setForgotStage] = useState("request");

  // ── Use a ref so Google's callback always has the latest navigate/login ───────
  const authRef = useRef({ login, navigate, redirectTo });
  useEffect(() => {
    authRef.current = { login, navigate, redirectTo };
  });

  // ── Load Google script once, reinit on tab change ────────────────────────────
  useEffect(() => {
    loadGoogleScript(() => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        // Use ref-based handler — avoids stale closure
        callback: (response) =>
          handleGoogleCallback(
            response,
            authRef,
            setError,
            setSuccess,
            setLoading,
          ),
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      renderGoogleButton();
    });
  }, [tab]);

  function renderGoogleButton() {
    const container = document.getElementById("google-btn-container");
    if (container && window.google?.accounts?.id) {
      container.innerHTML = "";
      window.google.accounts.id.renderButton(container, {
  type: 'standard',
  theme: 'filled_blue',
  size: 'large',
  text: 'continue_with',
  shape: 'pill',
  logo_alignment: 'left',
  width: 340,
});
    }
  }

  // ── Normal Login ─────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const emailErr = validate("email", loginForm.email);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }
    if (!loginForm.password) {
      setFieldErrors({ password: "Password is required" });
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(loginForm);
      const token = res.data.token;
      const role = JSON.parse(atob(token.split(".")[1])).role || "PASSENGER";
      login(token, loginForm.email, role);
      if (role === "ADMIN") navigate("/admin");
      else if (role === "AIRLINE_STAFF") navigate("/staff");
      else navigate(redirectTo);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errors = {};
    if (!registerForm.fullName.trim())
      errors.fullName = "Full name is required";
    else {
      const e = validate("fullName", registerForm.fullName);
      if (e) errors.fullName = e;
    }
    if (!registerForm.email.trim()) errors.email = "Email is required";
    else {
      const e = validate("email", registerForm.email);
      if (e) errors.email = e;
    }
    if (!registerForm.password.trim()) errors.password = "Password is required";
    else {
      const e = validate("password", registerForm.password);
      if (e) errors.password = e;
    }
    if (registerForm.phone.trim()) {
      const e = validate("phone", registerForm.phone);
      if (e) errors.phone = e;
    }
    if (registerForm.passportNumber.trim()) {
      const e = validate("passportNumber", registerForm.passportNumber);
      if (e) errors.passportNumber = e;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.register({
        fullName: registerForm.fullName,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone || undefined,
        passportNumber: registerForm.passportNumber || undefined,
        role: registerForm.role,
        staffSecretKey:
          registerForm.role === "AIRLINE_STAFF"
            ? registerForm.staffSecretKey
            : undefined,
        adminSecretKey:
          registerForm.role === "ADMIN"
            ? registerForm.adminSecretKey
            : undefined,
      });
      setSuccess("Registration successful! Please login.");
      setTab("login");
      setLoginForm({ email: registerForm.email, password: "" });
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object" && !data.message)
        setFieldErrors(data);
      else setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleRegisterChange(field, value) {
    setRegisterForm((p) => ({ ...p, [field]: value }));
    if (fieldErrors[field])
      setFieldErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
  }

  function handleForgotChange(field, value) {
    setForgotForm((p) => ({ ...p, [field]: value }));
    if (fieldErrors[field])
      setFieldErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errors = {};
    if (!forgotForm.email.trim()) errors.email = "Email is required";
    else {
      const e = validate("email", forgotForm.email);
      if (e) errors.email = e;
    }

    if (forgotStage === "verify") {
      if (!forgotForm.otp.trim()) errors.otp = "OTP is required";
    }

    if (forgotStage === "reset") {
      if (!forgotForm.newPassword.trim()) errors.newPassword = "New password is required";
      else {
        const p = validate("password", forgotForm.newPassword);
        if (p) errors.newPassword = p;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      if (forgotStage === "request") {
        await authApi.forgotPassword({ email: forgotForm.email });
        setSuccess("OTP sent to your email. Enter the code to verify it.");
        setForgotStage("verify");
      } else if (forgotStage === "verify") {
        await authApi.verifyResetOtp({
          email: forgotForm.email,
          otp: forgotForm.otp,
        });
        setSuccess("OTP verified. Now enter your new password.");
        setForgotStage("reset");
      } else {
        await authApi.resetPassword({
          email: forgotForm.email,
          otp: forgotForm.otp,
          newPassword: forgotForm.newPassword,
        });
        setSuccess("Password reset successful. Please log in with your new password.");
        setTab("login");
        setForgotStage("request");
        setForgotForm({ email: "", otp: "", newPassword: "" });
      }
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleLoginChange(field, value) {
    setLoginForm((p) => ({ ...p, [field]: value }));
    if (fieldErrors[field])
      setFieldErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
  }

  const FieldErr = ({ field }) =>
    fieldErrors[field] ? (
      <small className="field-error">{fieldErrors[field]}</small>
    ) : null;

  return (
    <div className="login-page">
      <div className="bg-overlay"></div>

      <div className="auth-container">
        {/* LEFT SIDE */}
        <div className="auth-left">
          <div className="brand-badge">✈ Trusted Airline Booking Platform</div>

          <h1>
            Travel The World
            <span> With Confidence.</span>
          </h1>

          <p>
            Book flights, manage trips, and experience smooth airline booking
            with SkyBooker.
          </p>

          <div className="auth-stats">
            <div className="stat-card">
              <h2>50K+</h2>
              <span>Monthly Travelers</span>
            </div>

            <div className="stat-card">
              <h2>120+</h2>
              <span>Destinations</span>
            </div>

            <div className="stat-card">
              <h2>99%</h2>
              <span>Secure Payments</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-right">
          <div className="login-card">
            <div className="login-header">
              <h2>{tab === "login" ? "Welcome Back" : "Create Account"}</h2>

              <p>
                {tab === "login"
                  ? "Login to continue your journey"
                  : "Join SkyBooker today"}
              </p>
            </div>

            <div className="tabs">
              <button
                className={tab === "login" ? "tab active" : "tab"}
                onClick={() => {
                  setTab("login");
                  setError("");
                  setSuccess("");
                  setFieldErrors({});
                }}
              >
                Login
              </button>

              <button
                className={tab === "register" ? "tab active" : "tab"}
                onClick={() => {
                  setTab("register");
                  setError("");
                  setSuccess("");
                  setFieldErrors({});
                }}
              >
                Register
              </button>
            </div>

            {error && <div className="alert-error">{error}</div>}

            {success && <div className="alert-success">{success}</div>}

            {loading && <div className="loading-bar"></div>}

            {tab === "login" && (
              <>
                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <label>Email Address</label>

                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={(e) =>
                        handleLoginChange("email", e.target.value)
                      }
                      className={fieldErrors.email ? "input-error" : ""}
                      required
                    />

                    <FieldErr field="email" />
                  </div>

                  <div className="form-group">
                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) =>
                        handleLoginChange("password", e.target.value)
                      }
                      className={fieldErrors.password ? "input-error" : ""}
                      required
                    />

                    <FieldErr field="password" />
                  </div>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>

                <div className="forgot-link-row">
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setTab("forgot");
                      setError("");
                      setSuccess("");
                      setFieldErrors({});
                      setForgotStage("request");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="oauth-divider">
                  <span>OR CONTINUE WITH</span>
                </div>

                <div
                  id="google-btn-container"
                  className="google-btn-wrapper"
                ></div>
              </>
            )}

            {tab === "forgot" && (
              <>
                <form onSubmit={handleForgotSubmit} className="auth-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={forgotForm.email}
                      onChange={(e) => handleForgotChange("email", e.target.value)}
                      className={fieldErrors.email ? "input-error" : ""}
                      required
                      disabled={forgotStage !== "request"}
                    />
                    <FieldErr field="email" />
                  </div>

                  {forgotStage === "verify" && (
                    <div className="form-group">
                      <label>OTP Code</label>
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        maxLength={6}
                        value={forgotForm.otp}
                        onChange={(e) => handleForgotChange("otp", e.target.value.replace(/\D/g, ""))}
                        className={fieldErrors.otp ? "input-error" : ""}
                        required
                      />
                      <FieldErr field="otp" />
                    </div>
                  )}

                  {forgotStage === "reset" && (
                    <>
                      <div className="info-text">
                        OTP verified. Enter your new password below.
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          placeholder="Enter new password"
                          value={forgotForm.newPassword}
                          onChange={(e) => handleForgotChange("newPassword", e.target.value)}
                          className={fieldErrors.newPassword ? "input-error" : ""}
                          required
                        />
                        <FieldErr field="newPassword" />
                      </div>
                    </>
                  )}

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {forgotStage === "request"
                      ? loading
                        ? "Sending OTP..."
                        : "Send OTP"
                      : forgotStage === "verify"
                      ? loading
                        ? "Verifying..."
                        : "Verify OTP"
                      : loading
                      ? "Resetting..."
                      : "Reset Password"}
                  </button>
                </form>

                <div className="forgot-link-row">
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setTab("login");
                      setError("");
                      setSuccess("");
                      setFieldErrors({});
                      setForgotStage("request");
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </>
            )}

            {tab === "register" && (
              <>
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-group">
                    <label>Full Name</label>

                    <input
                      type="text"
                      placeholder="John Doe"
                      value={registerForm.fullName}
                      onChange={(e) =>
                        handleRegisterChange("fullName", e.target.value)
                      }
                      className={fieldErrors.fullName ? "input-error" : ""}
                      required
                    />

                    <FieldErr field="fullName" />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>

                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={registerForm.email}
                      onChange={(e) =>
                        handleRegisterChange("email", e.target.value)
                      }
                      className={fieldErrors.email ? "input-error" : ""}
                      required
                    />

                    <FieldErr field="email" />
                  </div>

                  <div className="form-group">
                    <label>Password</label>

                    <input
                      type="password"
                      placeholder="Create strong password"
                      value={registerForm.password}
                      onChange={(e) =>
                        handleRegisterChange("password", e.target.value)
                      }
                      className={fieldErrors.password ? "input-error" : ""}
                      required
                    />

                    <FieldErr field="password" />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>

                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={registerForm.phone}
                      onChange={(e) =>
                        handleRegisterChange(
                          "phone",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      className={fieldErrors.phone ? "input-error" : ""}
                    />

                    <FieldErr field="phone" />
                  </div>

                  <div className="form-group">
                    <label>Passport Number</label>

                    <input
                      type="text"
                      placeholder="A1234567"
                      maxLength={9}
                      value={registerForm.passportNumber}
                      onChange={(e) =>
                        handleRegisterChange(
                          "passportNumber",
                          e.target.value.toUpperCase(),
                        )
                      }
                      className={
                        fieldErrors.passportNumber ? "input-error" : ""
                      }
                    />

                    <FieldErr field="passportNumber" />
                  </div>

                  <div className="form-group">
                    <label>Register As</label>

                    <select
                      value={registerForm.role}
                      onChange={(e) =>
                        handleRegisterChange("role", e.target.value)
                      }
                    >
                      <option value="PASSENGER">Passenger</option>
                      <option value="AIRLINE_STAFF">Airline Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {registerForm.role === "AIRLINE_STAFF" && (
                    <div className="form-group">
                      <label>Staff Secret Key</label>

                      <input
                        type="password"
                        placeholder="Enter staff secret key"
                        value={registerForm.staffSecretKey}
                        onChange={(e) =>
                          handleRegisterChange("staffSecretKey", e.target.value)
                        }
                        required
                      />
                    </div>
                  )}

                  {registerForm.role === "ADMIN" && (
                    <div className="form-group">
                      <label>Admin Secret Key</label>

                      <input
                        type="password"
                        placeholder="Enter admin secret key"
                        value={registerForm.adminSecretKey}
                        onChange={(e) =>
                          handleRegisterChange("adminSecretKey", e.target.value)
                        }
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                <div className="oauth-divider">
                  <span>OR REGISTER WITH</span>
                </div>

                <div
                  id="google-btn-container"
                  className="google-btn-wrapper"
                ></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
