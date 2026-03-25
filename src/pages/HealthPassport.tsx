import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, doc, getDoc, orderBy, onSnapshot } from '../firebase';
import { 
  User, 
  ShieldCheck, 
  QrCode, 
  Printer, 
  Download, 
  History, 
  Award, 
  Activity, 
  Apple, 
  ChevronLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Scale,
  Ruler,
  Brain
} from 'lucide-react';
import { useAuth } from '../App';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LineChart,
  Line
} from 'recharts';
import { HealthPassportCard } from '../components/HealthPassportCard';
import { Skeleton } from '../components/Skeleton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function HealthPassport() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Health_Passport_${student?.fullName || 'Student'}`,
  });

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('l', 'mm', [150, 87]); // Card size in mm
    pdf.addImage(imgData, 'PNG', 0, 0, 150, 87);
    pdf.save(`Health_Passport_${student?.fullName || 'Student'}.pdf`);
  };

  useEffect(() => {
    const targetId = id || user?.id;
    if (!targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribes: (() => void)[] = [];

    // Real-time student profile listener
    const unsubscribeStudent = onSnapshot(doc(db, 'users', targetId), (docSnap) => {
      if (docSnap.exists()) {
        setStudent({ id: docSnap.id, ...docSnap.data() });
      } else {
        setStudent(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${targetId}`));
    unsubscribes.push(unsubscribeStudent);

    // Real-time health records listener
    const hrQuery = query(collection(db, 'health_records'), where('userId', '==', targetId), orderBy('date', 'desc'));
    const unsubscribeHR = onSnapshot(hrQuery, (snapshot) => {
      setHealthHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'health_records'));
    unsubscribes.push(unsubscribeHR);

    // Real-time activities listener
    const actQuery = query(collection(db, 'activities'), where('userId', '==', targetId), orderBy('date', 'desc'));
    const unsubscribeAct = onSnapshot(actQuery, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'activities');
      setLoading(false);
    });
    unsubscribes.push(unsubscribeAct);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [id, user?.id]);

  if (loading) return (
    <div className="space-y-8 pb-12 px-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-[40px]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    </div>
  );

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <User size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Student Not Found</h2>
        <p className="text-slate-500">The health passport you are looking for does not exist or you do not have permission to view it.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  const latestRecord = healthHistory[0];
  const passportUrl = `${window.location.origin}/health-passport/${student?.id}`;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Digital Health Passport</h1>
            <p className="text-slate-500">Official student health record</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handlePrint()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={18} />
            <span className="whitespace-nowrap">Print Report</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
          >
            <Download size={18} />
            <span className="whitespace-nowrap">Download Card</span>
          </button>
        </div>
      </div>

      <div ref={componentRef} className="print:p-8 space-y-8">
        {/* Passport Card for PDF */}
        <div className="hidden print:block">
          <HealthPassportCard ref={cardRef} student={student} passportUrl={passportUrl} />
        </div>
        
        {/* Passport Header Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-6 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] border-4 border-white/20 overflow-hidden shadow-2xl flex-shrink-0 bg-white">
              <img 
                src="https://image2url.com/r2/default/images/1773243015309-8d00926d-bd9c-4a4d-931d-e00cbf039414.jpg" 
                alt={student?.fullName} 
                className="w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 mb-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight break-words text-center md:text-left w-full md:w-auto">{student?.fullName}</h2>
                <span className="px-4 py-1 bg-blue-500/30 backdrop-blur-md rounded-full text-sm font-bold border border-white/20 whitespace-nowrap">
                  {student?.class}
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-slate-300">
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Index Number</p>
                  <p className="font-bold text-white break-all">{student?.indexNumber}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Date of Birth</p>
                  <p className="font-bold text-white">{student?.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Gender</p>
                  <p className="font-bold text-white capitalize">{student?.gender}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl md:bg-transparent md:p-0 md:rounded-none">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Health Status</p>
                  <p className="font-bold text-emerald-400">{latestRecord?.category || 'Normal'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-2xl flex-shrink-0 mt-4 md:mt-0">
              <QRCodeSVG value={passportUrl} size={100} className="md:w-[120px] md:h-[120px]" />
              <p className="text-[10px] font-bold text-slate-400 text-center mt-2 uppercase tracking-widest">Verify Passport</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Health Metrics & History */}
          <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                    <Scale size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">Weight</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{latestRecord?.weight || 0} kg</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                    <Ruler size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">Height</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{latestRecord?.height || 0} cm</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                    <Ruler size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">Hip/Waist</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{latestRecord?.hip || 0} / {latestRecord?.waist || 0} cm</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">Grip</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{latestRecord?.gripStrength || 0} kg</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">BMI</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{latestRecord?.bmi?.toFixed(1) || '0.0'}</p>
              </div>
            </div>

            {/* Growth Charts */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Growth Pattern Analysis
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...healthHistory].reverse()}>
                    <defs>
                      <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="bmi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBmi)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award size={20} className="text-amber-500" />
                Activity & Achievement Records
              </h3>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Activity className="text-blue-500" size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{activity.name}</p>
                        <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-600 font-bold">+{activity.points} pts</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activity.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights & Nutrition */}
          <div className="space-y-8">
            {/* Contact Info */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Emergency Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent/Guardian</p>
                    <p className="text-sm font-bold text-slate-900">{student?.parentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                    <p className="text-sm font-bold text-slate-900">{student?.parentContact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                    <p className="text-sm font-bold text-slate-900">{student?.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-xs">
          <p>This is an official Digital Health Passport issued by Jaffna Hindu College.</p>
          <p className="mt-1">Verification Code: {student?.indexNumber}-{student?.id}-{new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
