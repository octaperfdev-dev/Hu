import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Heart, Activity, Award, User, ShieldCheck } from 'lucide-react';

interface Props {
  student: any;
  passportUrl: string;
}

export const HealthPassportCard = React.forwardRef<HTMLDivElement, Props>(({ student, passportUrl }, ref) => {
  return (
    <div ref={ref} className="w-[600px] h-[350px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
      {/* Futuristic background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      
      <div className="relative z-10 flex gap-6 h-full">
        <div className="w-40 h-full flex flex-col items-center justify-center gap-4">
          <div className="w-32 h-32 rounded-3xl border-4 border-white/20 overflow-hidden shadow-2xl bg-white">
            <img 
              src="https://image2url.com/r2/default/images/1773243015309-8d00926d-bd9c-4a4d-931d-e00cbf039414.jpg" 
              alt={student?.fullName} 
              className="w-full h-full object-contain p-2"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-2xl">
            <QRCodeSVG value={passportUrl} size={80} />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight">{student?.fullName}</h2>
            <div className="flex items-center gap-2 text-blue-100 font-bold text-sm mt-1">
              <ShieldCheck size={16} />
              {student?.class} • Jaffna Hindu College
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Index Number</p>
              <p className="font-bold text-lg">{student?.indexNumber}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Health Points</p>
              <p className="font-bold text-lg text-emerald-300">{student?.points || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-bold opacity-80">
            <Heart size={16} className="text-red-400" />
            <span>Health Passport Active</span>
            <Activity size={16} className="text-blue-300 ml-4" />
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

HealthPassportCard.displayName = 'HealthPassportCard';
