import { useState } from 'react';
import { useToast, Btn, Card, CardHeader, TF } from './shared';
import { auth } from '../../api';

function ChangePasswordPanel({ token, user }) {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [saving, setSaving] = useState(false);
  const [toastNode, showToast] = useToast();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.current_password || !form.password || !form.password_confirmation) {
      showToast('All fields are required.', 'error'); return;
    }
    if (form.password !== form.password_confirmation) {
      showToast('New passwords do not match.', 'error'); return;
    }
    if (form.password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error'); return;
    }
    setSaving(true);
    try {
      const userType = user?.role || user?.user_type || '';
      await auth.changePassword({ ...form, user_type: userType }, token);
      showToast('Password changed successfully. Please sign in again.');
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (e) {
      showToast(e.message || 'Failed to change password.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="klf-fade">
      {toastNode}
      <Card style={{ maxWidth: 480 }}>
        <CardHeader title="Change Password" subtitle="Update your account password" />
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <TF label="Current Password" name="current_password" type="password"
            value={form.current_password} onChange={e => set('current_password', e.target.value)}
            required placeholder="Enter your current password" />
          <TF label="New Password" name="password" type="password"
            value={form.password} onChange={e => set('password', e.target.value)}
            required placeholder="Minimum 8 characters" />
          <TF label="Confirm New Password" name="password_confirmation" type="password"
            value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)}
            required placeholder="Repeat new password" />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Change Password'}</Btn>
            <Btn variant="ghost" onClick={() => setForm({ current_password: '', password: '', password_confirmation: '' })}>Clear</Btn>
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
            After changing your password you will need to sign in again with your new credentials.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ChangePasswordPanel;
