import React, { useState } from 'react';
import api from '../api';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const { data } = await api.post('/api/auth/login', {
        username,
        password,
      });

      onLogin(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Login failed. Please check credentials or backend availability.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      {/* ---------- Header ---------- */}
      <header className="login-header">
        <div className="login-brand">
          <div className="login-brand-logo">S</div>
          <span className="brand-name">SCAALABLE</span>
          <span className="brand-product">Web Dialer + CRM</span>
        </div>

        <div className="header-right">
          <span className="system-status">
            <span className="status-dot"></span>
            All systems operational
          </span>
          <span>Support &amp; Docs</span>
        </div>
      </header>

      {/* ---------- Main Container ---------- */}
      <main className="login-main">
        <div className="login-container">
          {/* Left Promo Panel */}
          <section className="login-promo">
            <div>
              <div className="promo-tagline">ENTERPRISE CRM &amp; VOIP SUITE</div>
              <h1 className="promo-title">
                Accelerate outbound conversations &amp; pipeline growth.
              </h1>
              <p className="promo-description">
                Unified high-velocity web dialer integrated with intelligent lead distribution, real-time pipeline visibility, and automated multi-channel follow-ups.
              </p>

              <div className="promo-features">
                <div className="promo-feature">
                  <div className="feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <h3>Smart Web Dialer</h3>
                    <p>One-click calling, local presence match, and call outcome logging.</p>
                  </div>
                </div>

                <div className="promo-feature">
                  <div className="feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h3>Automated Lead Distribution</h3>
                    <p>Skill-based assignment with round-robin load distribution.</p>
                  </div>
                </div>

                <div className="promo-feature">
                  <div className="feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div>
                    <h3>Real-time Analytics</h3>
                    <p>Live call disposition tracking and agent productivity metrics.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="promo-footer">
              <span>99.98% Telephony Uptime</span>
              <span>•</span>
              <span>Enterprise Grade Security</span>
            </div>
          </section>

          {/* Right Form Panel */}
          <section className="login-form-panel">
            <div className="login-form-content">
              <h2>Welcome back</h2>
              <p className="login-subtitle">
                Sign in to your Web Dialer + CRM workspace
              </p>

              {error && <div className="error-box">{error}</div>}

              <form onSubmit={submit}>
                {/* Username */}
                <div className="login-field">
                  <label htmlFor="username">Username or Email</label>
                  <div className="login-input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="login-field">
                  <div className="password-label-row">
                    <label htmlFor="password">Password</label>
                    <button
                      type="button"
                      className="forgot-password"
                      onClick={() => setError('Password reset is not available yet. Please contact administrator.')}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="login-input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {showPassword ? (
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <label className="remember-row">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span>Remember this device for 30 days</span>
                </label>

                {/* Submit Button */}
                <button type="submit" className="workspace-button" disabled={busy}>
                  {busy ? 'Signing in...' : 'Sign in to Workspace'}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </form>

              {/* SSO Divider */}
              <div className="sso-divider">
                <span></span>
                <p>OR CONTINUE WITH ENTERPRISE SSO</p>
                <span></span>
              </div>

              <div className="sso-buttons">
                <button type="button" className="sso-button">
                  <img src="/images/google.svg" alt="Google" className="sso-logo" />
                  Google
                </button>
                <button type="button" className="sso-button">
                  <img src="/images/microsoft.svg" alt="Microsoft" className="sso-logo" />
                  Microsoft 365
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="login-footer">
        <div className="security-items">
          <span>256-bit SSL Encryption</span>
          <span>•</span>
          <span>SOC 2 Type II Certified</span>
        </div>
        <div className="footer-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>© 2026 SCAALABLE Inc.</span>
        </div>
      </footer>
    </div>
  );
}