import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, storage, handleFirestoreError, OperationType, doc, updateDoc, ref, uploadBytes, getDownloadURL } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Hash, 
  Shield, 
  Edit3, 
  Save, 
  X,
  Camera,
  Heart,
  Activity,
  Award
} from 'lucide-react';
import { useAuth } from '../App';
import { User } from '../types';
import { ProfileImageUploader } from '../components/ProfileImageUploader';

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(!user?.profileCompleted);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        indexNumber: user.indexNumber,
        dob: user.dob,
        gender: user.gender,
        class: user.class,
        address: user.address,
        parentName: user.parentName,
        parentContact: user.parentContact,
        photoUrl: user.photoUrl
      });
    }
  }, [user]);

  const handleImageUpload = async (file: File) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoUrl: downloadURL }));
      
      // Also update Firestore immediately for the photo
      await updateDoc(doc(db, 'users', user.id), { photoUrl: downloadURL });
      login({ ...user, photoUrl: downloadURL });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Make sure Firebase Storage is enabled.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      // Ensure profileCompleted is set to true when saving
      const updatedData = { ...formData, profileCompleted: true };
      
      // Remove undefined values to prevent Firebase errors
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key as keyof typeof updatedData] === undefined) {
          delete updatedData[key as keyof typeof updatedData];
        }
      });

      await updateDoc(userRef, updatedData);
      
      const updatedUser = { ...user, ...updatedData };
      login(updatedUser);
      setIsEditing(false);
      navigate('/dashboard');
    } catch (err) {
      console.error("Error saving profile:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header / Cover */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />
        </div>
      </div>

      {/* Profile Info Card */}
      <div className="relative -mt-24 px-4 md:px-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Section */}
            <div className="relative group">
              <ProfileImageUploader 
                photoUrl={formData.photoUrl || ''} 
                fullName={user.fullName} 
                onUpload={handleImageUpload} 
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Name & Basic Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{user.fullName}</h1>
                  <p className="text-slate-500 font-medium flex items-center gap-2">
                    <Shield size={16} className="text-blue-500" />
                    {user.role === 'admin' ? 'System Administrator' : `Student • Class ${user.class}`}
                  </p>
                </div>
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      {!user.profileCompleted ? null : (
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                        >
                          <X size={18} />
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all disabled:opacity-70"
                      >
                        <Save size={18} />
                        {loading ? 'Saving...' : user.profileCompleted ? 'Save Changes' : 'Continue'}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all"
                    >
                      <Edit3 size={18} />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold">
                  <Award size={16} />
                  {user.points} Health Points
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold">
                  <Activity size={16} />
                  Active Profile
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-12 border-t border-slate-100">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserIcon size={20} className="text-blue-500" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{user.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Index Number</label>
                    <p className="text-slate-900 font-medium flex items-center gap-2">
                      <Hash size={14} className="text-slate-400" />
                      {user.indexNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={formData.dob}
                        onChange={(e) => setFormData({...formData, dob: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {user.dob || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                    {isEditing ? (
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-slate-900 font-medium">{user.gender || 'N/A'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class / Grade</label>
                    <p className="text-slate-900 font-medium">{user.class || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                  {isEditing ? (
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 mt-1" />
                      {user.address || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency / Parent Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart size={20} className="text-red-500" />
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent / Guardian Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.parentName}
                        onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-slate-900 font-bold">{user.parentName || 'N/A'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.parentContact}
                        onChange={(e) => setFormData({...formData, parentContact: e.target.value})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <p className="text-blue-600 font-bold flex items-center gap-2">
                        <Phone size={14} />
                        {user.parentContact || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl">
                  <h4 className="text-sm font-bold text-blue-900 mb-2">Health Privacy Note</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Your health information is securely stored and only accessible by authorized school medical staff and administrators. You can update your personal details, but medical records are managed by the school clinic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
