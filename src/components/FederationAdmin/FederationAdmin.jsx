'use client';
import { useState, useEffect, useCallback } from 'react';
import config from '@/lib/config';
import './FederationAdmin.css';

const LS_JWT = 'esc_fed_jwt';
const LS_USER = 'esc_fed_user';

const absUrl = (u) => (u ? (u.startsWith('http') ? u : `${config.API_URL}${u}`) : null);

export default function FederationAdmin() {
  const [ready, setReady] = useState(false);       // restored session from localStorage?
  const [jwt, setJwt] = useState(null);
  const [user, setUser] = useState(null);
  const [fed, setFed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Edit form
  const [form, setForm] = useState({ name: '', president: '', email: '', phone: '', website: '' });
  const [flagFile, setFlagFile] = useState(null);
  const [flagPreview, setFlagPreview] = useState(null);

  // Restore session
  useEffect(() => {
    try {
      const j = localStorage.getItem(LS_JWT);
      const u = localStorage.getItem(LS_USER);
      if (j && u) { setJwt(j); setUser(JSON.parse(u)); }
    } catch {}
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem(LS_JWT); localStorage.removeItem(LS_USER); } catch {}
    setJwt(null); setUser(null); setFed(null); setNotice(''); setError('');
    setForm({ name: '', president: '', email: '', phone: '', website: '' });
    setFlagFile(null); setFlagPreview(null);
  }, []);

  // Load own federation
  useEffect(() => {
    if (!jwt || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch(`${config.API_URL}/api/federations/mine`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.status === 401) { logout(); return; }
        const j = await res.json();
        if (cancelled) return;
        const f = j.data;
        if (!f) {
          setFed(null);
          setError('No federation is linked to your account. Please contact the ESC administrator.');
        } else {
          setFed(f);
          setForm({
            name: f.name || '', president: f.president || '', email: f.email || '',
            phone: f.phone || '', website: f.website || '',
          });
          setFlagPreview(absUrl(f.flag?.url));
        }
      } catch {
        if (!cancelled) setError('Failed to load federation data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jwt, user, logout]);

  const login = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email.trim(), password }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j?.error?.message || 'Invalid email or password.'); return; }
      try {
        localStorage.setItem(LS_JWT, j.jwt);
        localStorage.setItem(LS_USER, JSON.stringify(j.user));
      } catch {}
      setJwt(j.jwt); setUser(j.user); setPassword('');
    } catch {
      setError('Login failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const onFlag = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('The flag must be an image file.'); return; }
    setError('');
    setFlagFile(file);
    setFlagPreview(URL.createObjectURL(file));
  };

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!fed) return;
    setError(''); setNotice(''); setLoading(true);
    try {
      // 1. Text fields
      const res = await fetch(`${config.API_URL}/api/federations/${fed.documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ data: { ...form } }),
      });
      if (res.status === 401) { logout(); return; }
      const j = await res.json();
      if (!res.ok) { setError(j?.error?.message || 'Failed to save changes.'); return; }

      // 2. Flag (if replaced) — uploaded server-side, no Upload permission needed
      if (flagFile) {
        const fd = new FormData();
        fd.append('flag', flagFile);
        const fr = await fetch(`${config.API_URL}/api/federations/${fed.documentId}/flag`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${jwt}` },
          body: fd,
        });
        if (fr.status === 401) { logout(); return; }
        if (!fr.ok) { setError('Details saved, but the flag could not be uploaded.'); return; }
      }

      setNotice('Changes saved ✓');
      setFlagFile(null);
    } catch {
      setError('Failed to save. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return <div className="fa-wrap"><div className="fa-card"><p className="fa-muted">Loading…</p></div></div>;

  // Login screen
  if (!jwt) {
    return (
      <div className="fa-wrap">
        <form className="fa-card" onSubmit={login}>
          <h1 className="fa-title">Federation Portal</h1>
          <p className="fa-muted">Log in to update your federation's information.</p>
          <label className="fa-label">Email</label>
          <input className="fa-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          <label className="fa-label">Password</label>
          <input className="fa-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="fa-error">{error}</p>}
          <button className="fa-btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</button>
        </form>
      </div>
    );
  }

  // Edit screen
  return (
    <div className="fa-wrap">
      <div className="fa-card">
        <div className="fa-header">
          <h1 className="fa-title">{fed?.name || 'My Federation'}</h1>
          <button className="fa-logout" onClick={logout}>Log out</button>
        </div>

        {error && <p className="fa-error">{error}</p>}

        {fed && (
          <form onSubmit={save}>
            <div className="fa-flag-row">
              <div className="fa-flag-preview">
                {flagPreview ? <img src={flagPreview} alt="Flag" /> : <span className="fa-muted">no flag</span>}
              </div>
              <label className="fa-file-btn">
                Replace flag
                <input type="file" accept="image/*" onChange={onFlag} hidden />
              </label>
            </div>

            <label className="fa-label">Federation name</label>
            <input className="fa-input" value={form.name} onChange={setField('name')} />

            <label className="fa-label">President</label>
            <input className="fa-input" value={form.president} onChange={setField('president')} />

            <label className="fa-label">Email</label>
            <input className="fa-input" type="email" value={form.email} onChange={setField('email')} />

            <label className="fa-label">Phone</label>
            <input className="fa-input" value={form.phone} onChange={setField('phone')} />

            <label className="fa-label">Website</label>
            <input className="fa-input" value={form.website} onChange={setField('website')} placeholder="https://…" />

            {notice && <p className="fa-notice">{notice}</p>}

            <button className="fa-btn" type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
            <p className="fa-hint">You can edit only the flag, name, president and contact details. Code, region and country are managed by the ESC administrator.</p>
          </form>
        )}
      </div>
    </div>
  );
}
