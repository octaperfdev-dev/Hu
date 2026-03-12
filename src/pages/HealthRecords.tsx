import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy } from '../firebase';
import { 
  Calendar, 
  ChevronLeft, 
  Scale, 
  Ruler, 
  Activity, 
  TrendingUp,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { HealthRecord } from '../types';

export default function HealthRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        if (!user?.id) return;
        const q = query(collection(db, 'health_records'), where('userId', '==', user.id), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HealthRecord[];
        setRecords(data);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'health_records');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [user]);

  const chartData = [...records].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
    bmi: r.bmi,
    weight: r.weight,
    height: r.height
  }));

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-xl text-slate-500 transition-all border border-transparent hover:border-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health History</h1>
          <p className="text-slate-500">Complete timeline of your growth and measurements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-8">Weight & Height Progress</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-8">BMI Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="bmi" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" />
            Measurement Timeline
          </h3>
        </div>
        <div className="divide-y divide-slate-50">
          {records.map((record) => (
            <div key={record.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{new Date(record.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-xs text-slate-500">Recorded on {new Date(record.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-8 md:gap-12">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</p>
                  <p className="font-bold text-slate-900">{record.weight} kg</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Height</p>
                  <p className="font-bold text-slate-900">{record.height} cm</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">BMI</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{record.bmi.toFixed(1)}</p>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      record.category === 'Normal' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {record.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="p-10 text-center text-slate-400">No health records found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
