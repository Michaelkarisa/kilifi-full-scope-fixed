import { useMemo, useState } from 'react';
import { auth, createStaffLoginFlow, setAuthToken, setRole } from '../api';

const staffFlow = createStaffLoginFlow();

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [authTab, setAuthTab] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPassword2, setShowRegisterPassword2] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPassword2, setShowResetPassword2] = useState(false);
  const [showNationalId, setShowNationalId] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [staffPersonalNumber, setStaffPersonalNumber] = useState('');
  const [staffNationalId, setStaffNationalId] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPassword2, setResetPassword2] = useState('');

  const title = useMemo(() => {
    if (mode === 'register') return 'Create your account';
    if (mode === 'forgot') return 'Request password reset';
    if (mode === 'reset') return 'Set a new password';
    return authTab === 'candidate' ? 'Welcome back' : 'Secure staff access';
  }, [mode, authTab]);

  const subtitle = useMemo(() => {
    if (mode === 'register') return 'Join the recruitment portal to apply, track applications, and manage your profile.';
    if (mode === 'forgot') return 'Enter your email address and we will send a password reset link or token.';
    if (mode === 'reset') return 'Enter the email, reset token, and your new password.';
    if (authTab === 'staff') return 'Enter your personal number and national ID to sign in.';
    return 'Sign in to continue with your applications and profile.';
  }, [mode, authTab]);

  if (!isOpen) return null;

  function extractResponseData(response) { return response?.data ?? {}; }
  function extractToken(response) {
    const data = extractResponseData(response);
    return data?.access_token ?? data?.token ?? null;
  }
  function extractUser(response, fallback = null) {
    const data = extractResponseData(response);
    return data?.user ?? data?.identity ?? fallback;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (authTab === 'staff') {
        const normalizedPN = staffPersonalNumber.trim().toUpperCase();
        if (!normalizedPN) { setError('Personal number is required.'); return; }
        if (!staffNationalId.trim()) { setError('National ID is required.'); return; }

        const response = await staffFlow.login({
          personal_number: normalizedPN,
          password: staffNationalId.trim(),
        });
        const token = extractToken(response);
        const user = extractUser(response);
        if (token) { setAuthToken(token); setRole(user?.role || 'staff'); onSuccess(token, user); }
        else setError('Login response did not include a token.');
        return;
      }

      const response = await auth.login({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        user_type: authTab,
      });
      const token = extractToken(response);
      const user = extractUser(response);
      if (token) { setAuthToken(token); setRole(user?.role || 'candidate'); onSuccess(token, user); }
      else setError('Login response did not include a token.');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (regPassword !== regPassword2) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await auth.register({
        name: regName,
        email: regEmail.trim().toLowerCase(),
        phone: regPhone || undefined,
        password: regPassword,
      });
      const token = extractToken(response);
      const user = extractUser(response);
      if (token) { setAuthToken(token); setRole(user?.role || 'candidate'); onSuccess(token, user); }
      else { setSuccess('Account created successfully. Please sign in.'); setMode('login'); }
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const email = forgotEmail.trim().toLowerCase();
      if (authTab === 'staff') await auth.forgotPassword({ email,user_type: authTab });
      else await auth.forgotPassword({ email, user_type: authTab });
      setSuccess('If that email exists, a reset link has been sent.');
      setResetEmail(email);
      setForgotEmail('');
      setMode('reset');
    } catch (err) {
      setError(err?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const email = resetEmail.trim().toLowerCase();
      if (!email || !resetToken.trim() || !resetPassword || !resetPassword2) {
        setError('Email, reset token, password, and confirmation are required.');
        return;
      }
      if (resetPassword !== resetPassword2) { setError('Passwords do not match.'); return; }
      if (authTab === 'staff') await staffFlow.resetPassword({ email, token: resetToken.trim(), password: resetPassword, password_confirmation: resetPassword2 });
      else await auth.resetPassword({ email, token: resetToken.trim(), password: resetPassword, password_confirmation: resetPassword2 });
      setSuccess('Password reset successful. You can now sign in.');
      setResetToken('');
      setResetPassword('');
      setResetPassword2('');
      setLoginEmail(email);
      setLoginPassword('');
      setMode('login');
    } catch (err) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setLoginEmail(''); setLoginPassword('');
    setStaffPersonalNumber(''); setStaffNationalId('');
    setRegName(''); setRegEmail(''); setRegPhone(''); setRegPassword(''); setRegPassword2('');
    setForgotEmail('');
    setResetEmail(''); setResetToken(''); setResetPassword(''); setResetPassword2('');
    setError(''); setSuccess('');
    setMode('login'); setAuthTab('candidate');
    setShowPassword(false); setShowRegisterPassword(false); setShowRegisterPassword2(false);
    setShowResetPassword(false); setShowResetPassword2(false); setShowNationalId(false);
  }

  function close() { resetForm(); onClose(); }
  function switchMode(nextMode) { setError(''); setSuccess(''); setMode(nextMode); }

  return (
    <>
      <style>{`
        .am-input {
          width: 100%;
          height: 46px;
          border-radius: 12px;
          border: 1.5px solid #cbd5e1;
          background: #fff;
          padding: 0 14px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .am-input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
        }
        .am-input::placeholder { color: #94a3b8; }
      `}</style>

      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5, 16, 34, 0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', zIndex: 1000,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '500px',
            maxHeight: 'calc(100vh - 32px)',
            background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '20px', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            flexShrink: 0, padding: '20px 22px 16px',
            background: authTab === 'candidate'
              ? 'linear-gradient(135deg, #eff6ff, #f8fafc)'
              : 'linear-gradient(135deg, #f1f5f9, #f8fafc)',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <span style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: '999px',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
                  textTransform: 'uppercase', background: '#fff', border: '1px solid #cbd5e1',
                  color: '#475569', marginBottom: '10px',
                }}>
                  {authTab === 'candidate' ? 'Candidate portal' : 'Staff access'}
                </span>
                <h2 style={{ margin: 0, fontSize: '24px', lineHeight: 1.15, fontWeight: 800, color: '#0f172a' }}>
                  {title}
                </h2>
                <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '13.5px', lineHeight: 1.55, fontWeight: 500, maxWidth: '380px' }}>
                  {subtitle}
                </p>
              </div>
              <button
                type="button" onClick={close} aria-label="Close modal"
                style={{
                  flexShrink: 0, border: '1.5px solid #cbd5e1', background: '#fff',
                  borderRadius: '10px', width: '36px', height: '36px', fontSize: '16px',
                  cursor: 'pointer', color: '#64748b', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 22px' }}>

            {/* Candidate / Staff toggle */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
              marginBottom: '14px', background: '#f1f5f9', padding: '5px',
              borderRadius: '14px', border: '1px solid #e2e8f0',
            }}>
              {['candidate', 'staff'].map((tab) => (
                <button
                  key={tab} type="button"
                  onClick={() => {
                    setAuthTab(tab);
                    if (tab === 'staff' && mode === 'register') setMode('login');
                    setStaffPersonalNumber('');
                    setStaffNationalId('');
                    setLoginPassword('');
                    setError(''); setSuccess('');
                  }}
                  style={{
                    border: 'none', borderRadius: '10px', padding: '10px 12px',
                    fontWeight: 700, fontSize: '13.5px', cursor: 'pointer',
                    background: authTab === tab ? '#fff' : 'transparent',
                    color: authTab === tab ? '#0f172a' : '#64748b',
                    boxShadow: authTab === tab ? '0 1px 3px rgba(15,23,42,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'candidate' ? 'Candidate' : 'Staff / Admin'}
                </button>
              ))}
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[
                { key: 'login', label: 'Login' },
                ...(authTab === 'candidate' ? [{ key: 'register', label: 'Register' }] : []),
                { key: 'forgot', label: 'Forgot password' },
                { key: 'reset', label: 'Reset password' },
              ].map(({ key, label }) => (
                <button
                  key={key} type="button" onClick={() => switchMode(key)}
                  style={{
                    border: mode === key ? 'none' : '1.5px solid #cbd5e1',
                    background: mode === key ? '#0f172a' : '#fff',
                    color: mode === key ? '#fff' : '#334155',
                    borderRadius: '999px', padding: '8px 14px',
                    fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Error / Success banners */}
            {error && (
              <div style={{
                marginBottom: '14px', padding: '11px 14px', borderRadius: '12px',
                background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
                fontSize: '13.5px', fontWeight: 600,
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                marginBottom: '14px', padding: '11px 14px', borderRadius: '12px',
                background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
                fontSize: '13.5px', fontWeight: 600,
              }}>{success}</div>
            )}

            {/* ── Login form ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={formStyle}>
                {authTab === 'staff' ? (
                  <>
                    <Field label="Personal number">
                      <input
                        className="am-input"
                        type="text"
                        placeholder="e.g. PN-00123"
                        value={staffPersonalNumber}
                        onChange={(e) => {
                          setStaffPersonalNumber(e.target.value);
                          setError(''); setSuccess('');
                        }}
                        required
                      />
                    </Field>
                    <Field label="National ID">
                      <PasswordField
                        show={showNationalId}
                        onToggle={() => setShowNationalId((v) => !v)}
                        placeholder="Enter your national ID"
                        value={staffNationalId}
                        onChange={(e) => setStaffNationalId(e.target.value)}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Email address">
                      <input
                        className="am-input"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Password">
                      <PasswordField
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </Field>
                  </>
                )}

                <PrimaryButton
                  loading={loading}
                  disabled={loading}
                  label={
                    loading ? 'Signing in…'
                    : authTab === 'staff' ? 'Login as staff'
                    : 'Login as candidate'
                  }
                />
              </form>
            )}

            {/* ── Register form (candidate only) ── */}
            {mode === 'register' && authTab === 'candidate' && (
              <form onSubmit={handleRegister} style={formStyle}>
                <Field label="Full name">
                  <input className="am-input" placeholder="Enter your full name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                </Field>
                <Field label="Email address">
                  <input className="am-input" type="email" placeholder="you@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </Field>
                <Field label="Phone number (optional)">
                  <input className="am-input" placeholder="Optional" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                </Field>
                <Field label="Password">
                  <PasswordField show={showRegisterPassword} onToggle={() => setShowRegisterPassword((v) => !v)} placeholder="Create a password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                </Field>
                <Field label="Confirm password">
                  <PasswordField show={showRegisterPassword2} onToggle={() => setShowRegisterPassword2((v) => !v)} placeholder="Re-enter your password" value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)} />
                </Field>
                <PrimaryButton loading={loading} disabled={loading} label={loading ? 'Creating account…' : 'Create account'} />
              </form>
            )}

            {/* ── Forgot password form ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} style={formStyle}>
                <Field label="Email address">
                  <input className="am-input" type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                </Field>
                <PrimaryButton loading={loading} disabled={loading} label={loading ? 'Submitting…' : 'Send reset request'} />
              </form>
            )}

            {/* ── Reset password form ── */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} style={formStyle}>
                <Field label="Email address">
                  <input className="am-input" type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                </Field>
                <Field label="Reset token">
                  <input className="am-input" placeholder="Enter reset token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
                </Field>
                <Field label="New password">
                  <PasswordField show={showResetPassword} onToggle={() => setShowResetPassword((v) => !v)} placeholder="Enter new password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                </Field>
                <Field label="Confirm new password">
                  <PasswordField show={showResetPassword2} onToggle={() => setShowResetPassword2((v) => !v)} placeholder="Confirm new password" value={resetPassword2} onChange={(e) => setResetPassword2(e.target.value)} />
                </Field>
                <PrimaryButton loading={loading} disabled={loading} label={loading ? 'Resetting…' : 'Reset password'} />
              </form>
            )}

            {/* Footer hint */}
            <p style={{
              marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0',
              fontSize: '12.5px', color: '#475569', lineHeight: 1.6, fontWeight: 500,
            }}>
              {authTab === 'candidate'
                ? 'Candidates can register, sign in, request password reset, and manage job applications here.'
                : 'Staff sign in using their personal number and national ID. Contact your administrator if you need assistance.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: '6px' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{label}</span>
      {children}
    </label>
  );
}

function PasswordField({ show, onToggle, placeholder, value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="am-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        style={{ paddingRight: '72px' }}
      />
      <button
        type="button" onClick={onToggle}
        style={{
          position: 'absolute', right: '10px', top: '50%',
          transform: 'translateY(-50%)', border: 'none',
          background: 'transparent', fontWeight: 700,
          fontSize: '12px', cursor: 'pointer', color: '#475569', padding: '4px 6px',
        }}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

function PrimaryButton({ loading, disabled, label }) {
  return (
    <button
      type="submit" disabled={disabled}
      style={{
        height: '48px', borderRadius: '12px', border: 'none',
        background: disabled ? '#e2e8f0' : '#0f172a',
        color: disabled ? '#94a3b8' : '#ffffff',
        fontWeight: 800, fontSize: '14.5px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s', marginTop: '2px',
      }}
    >
      {label}
    </button>
  );
}

const formStyle = { display: 'grid', gap: '13px' };