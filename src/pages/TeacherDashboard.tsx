import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, onSnapshot } from '../firebase';
import { Users, Activity, AlertTriangle, TrendingUp, Award, Clock, QrCode } from 'lucide-react';
import { useAuth } from '../App';
import QRScanner from '../components/QRScanner';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Real-time students listener
    const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentsQ, async (snapshot) => {
      try {
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const studentIds = students.map(s => s.id);

        if (studentIds.length > 0) {
          // Fetch health records and activities
          // Note: For large datasets, you might want to filter these by userId in the query
          // but for now we'll fetch all and filter client-side as per original logic
          const [healthSnapshot, activitySnapshot] = await Promise.all([
            getDocs(collection(db, 'health_records')),
            getDocs(collection(db, 'activities'))
          ]);

          const healthRecords = healthSnapshot.docs
            .map(doc => doc.data())
            .filter(record => studentIds.includes(record.userId));

          const categories = healthRecords.reduce((acc: any, curr: any) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
          }, {});

          const bmiStats = Object.entries(categories).map(([category, count]) => ({ category, count }));

          const activities = activitySnapshot.docs
            .map(doc => doc.data())
            .filter(activity => studentIds.includes(activity.userId));

          const types = activities.reduce((acc: any, curr: any) => {
            acc[curr.type] = (acc[curr.type] || 0) + 1;
            return acc;
          }, {});

          const activityStats = Object.entries(types).map(([type, count]) => ({ type, count }));

          setStats({
            totalStudents: students.length,
            bmiStats,
            activityStats
          });
        } else {
          setStats({ totalStudents: 0, bmiStats: [], activityStats: [] });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'analytics');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeStudents();
  }, [user]);

  if (loading) return <div className="p-8">Loading...</div>;

  const totalStudents = stats?.totalStudents || 0;
  const bmiStats = stats?.bmiStats || [];
  const activityStats = stats?.activityStats || [];

  const overweightObese = bmiStats
    .filter((s: any) => s.category === 'Overweight' || s.category === 'Obese')
    .reduce((acc: number, curr: any) => acc + curr.count, 0);

  const totalActivities = activityStats.reduce((acc: number, curr: any) => acc + curr.count, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teacher Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview for {user?.class}</p>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <QrCode size={18} />
            Scan Passbook
          </button>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Assigned Class</p>
            <p className="text-2xl font-bold text-blue-600">{user?.class}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Students</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalStudents}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Health Alerts</p>
              <h3 className="text-2xl font-bold text-slate-900">{overweightObese}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">Students overweight or obese</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Activity className="text-emerald-500" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Activities Logged</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalActivities}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">Total class activities</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-500" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Participation</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {totalStudents > 0 ? Math.round((totalActivities / totalStudents) * 100) : 0}%
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500">Average engagement rate</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Class BMI Distribution</h3>
          <div className="space-y-4">
            {bmiStats.map((stat: any) => (
              <div key={stat.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{stat.category}</span>
                  <span className="text-slate-500">{stat.count} students</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      stat.category === 'Normal' ? 'bg-emerald-500' : 
                      stat.category === 'Underweight' ? 'bg-blue-400' : 
                      stat.category === 'Overweight' ? 'bg-orange-400' : 'bg-red-500'
                    }`} 
                    style={{ width: `${(stat.count / totalStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {bmiStats.length === 0 && <p className="text-slate-500 text-sm">No BMI data available.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Activity Types</h3>
          <div className="space-y-4">
            {activityStats.map((stat: any) => (
              <div key={stat.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 capitalize">{stat.type}</span>
                  <span className="text-slate-500">{stat.count} sessions</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-indigo-500" 
                    style={{ width: `${(stat.count / totalActivities) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {activityStats.length === 0 && <p className="text-slate-500 text-sm">No activities logged yet.</p>}
          </div>
        </div>
      </div>
      {isScannerOpen && <QRScanner onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
}
