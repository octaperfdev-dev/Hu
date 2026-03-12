import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy } from '../firebase';
import { 
  Activity, 
  Scale, 
  Ruler, 
  Award, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../App';

export default function StudentTracking() {
  const { user } = useAuth();
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        
        // Fetch Health Records
        const healthQuery = query(collection(db, 'health_records'), where('userId', '==', user.id), orderBy('date', 'desc'));
        const healthSnapshot = await getDocs(healthQuery);
        setHealthHistory(healthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch Activities
        const activityQuery = query(collection(db, 'activities'), where('userId', '==', user.id), orderBy('date', 'desc'));
        const activitySnapshot = await getDocs(activityQuery);
        setActivities(activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch Badges
        const badgeQuery = query(collection(db, 'badges'), where('userId', '==', user.id));
        const badgeSnapshot = await getDocs(badgeQuery);
        setBadges(badgeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'student_tracking_data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  const chartData = [...healthHistory].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bmi: r.bmi,
    weight: r.weight,
    height: r.height
  }));

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Progress Tracker</h1>
        <p className="text-slate-500">Monitor your health and activity journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="text-blue-500" />
            <h3 className="font-bold text-slate-700">Weight</h3>
          </div>
          <p className="text-3xl font-bold">{healthHistory[0]?.weight || 0} kg</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Ruler className="text-blue-500" />
            <h3 className="font-bold text-slate-700">Height</h3>
          </div>
          <p className="text-3xl font-bold">{healthHistory[0]?.height || 0} cm</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Award className="text-blue-500" />
            <h3 className="font-bold text-slate-700">Total Points</h3>
          </div>
          <p className="text-3xl font-bold">{user?.points || 0}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6">My Badges</h3>
        <div className="flex gap-4">
          {badges.length > 0 ? badges.map((b: any, i: number) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-4xl">{b.icon}</span>
              <span className="font-bold text-emerald-800 text-sm">{b.name}</span>
            </div>
          )) : <p className="text-slate-500">No badges earned yet. Keep active!</p>}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6">BMI Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="bmi" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6">Recent Activities</h3>
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <Activity className="text-blue-500" />
                <div>
                  <p className="font-bold">{activity.name}</p>
                  <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="font-bold text-blue-600">+{activity.points} pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
