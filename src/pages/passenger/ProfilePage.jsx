import React, { useEffect, useState } from 'react';
import { authProfileApi } from '../../api/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({});
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      const res = await authProfileApi.getProfile();
      setProfile(res.data);
      setForm(res.data);
    } catch {
      setError('Could not load profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const { fullName, phone, gender, nationality, passportNumber } = form;
      await authProfileApi.updateProfile({ fullName, phone, gender, nationality, passportNumber });
      setProfile(form);
      setEditing(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    }
  }

  const fields = [
    { key: 'fullName',       label: 'Full Name' },
    { key: 'email',          label: 'Email',           readOnly: true },
    { key: 'phone',          label: 'Phone Number' },
    { key: 'gender',         label: 'Gender' },
    { key: 'nationality',    label: 'Nationality' },
    { key: 'passportNumber', label: 'Passport Number' },
    { key: 'role',           label: 'Role',            readOnly: true },
    { key: 'provider',       label: 'Login Provider',  readOnly: true },
  ];

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="hero-badge">👤 Account</div>
          <h1>My Profile</h1>
          <p>View and update your personal information.</p>
        </div>
      </div>

      <div className="profile-container">
        {message && <div className="alert-success">{message}</div>}
        {error   && <div className="alert-error">{error}</div>}

        <div className="profile-card">
          <div className="profile-avatar">
            {profile?.fullName?.[0]?.toUpperCase()}
          </div>
          <h2>{profile?.fullName}</h2>
          <span className="profile-role">{profile?.role || 'PASSENGER'}</span>

          {!editing ? (
            <>
              <div className="profile-fields">
                {fields.map(f => (
                  <div key={f.key} className="profile-field">
                    <small>{f.label}</small>
                    <strong>{profile?.[f.key] || '—'}</strong>
                  </div>
                ))}
              </div>
              <button className="edit-btn" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
            </>
          ) : (
            <form onSubmit={handleSave} className="profile-form">
              {fields.map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  <input
                    type="text"
                    value={form[f.key] || ''}
                    readOnly={f.readOnly}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="form-actions">
                <button type="button" className="cancel-edit-btn" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</button>
                <button type="submit" className="save-btn">Save Changes</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
