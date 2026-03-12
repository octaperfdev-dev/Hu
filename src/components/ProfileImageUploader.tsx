import React from 'react';
import { Camera } from 'lucide-react';

interface ProfileImageUploaderProps {
  photoUrl: string;
  fullName: string;
  onUpload: (file: File) => void;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ photoUrl, fullName, onUpload }) => {
  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff&size=256`;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="relative w-32 h-32 group">
      <img
        src={photoUrl || defaultImage}
        alt={fullName}
        className="w-full h-full object-cover rounded-3xl border-4 border-white shadow-lg"
      />
      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
        <Camera className="text-white" size={24} />
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
};
