import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, updatePassword, doc, updateDoc } from '../firebase';
import { useAuth } from '../App';
import { Lock, AlertCircle } from 'lucide-react';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          passwordChanged: true
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Change Password</h2>
        <p className="text-slate-500 text-sm mb-6 text-center">Please change your password to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600">Update Password</button>
        </form>
      </div>
    </div>
  );
}
