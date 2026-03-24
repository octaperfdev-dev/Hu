import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy, limit, onSnapshot } from '../firebase';
import { Skeleton } from '../components/Skeleton';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Award, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Plus,
  Heart,
  Scale,
  Ruler,
  CheckCircle2,
  Zap,
  MessageSquare
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../App';
import { HealthRecord, Activity as ActivityType } from '../types';

const StatCard = ({ icon: Icon, label, value, trend, trendValue, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
          trend === 'up' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
  </motion.div>
);

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [foodPurchases, setFoodPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    let unsubscribes: (() => void)[] = [];

    if (user.role === 'admin') {
      // Admin real-time listeners
      const usersUnsubscribe = onSnapshot(query(collection(db, 'users'), where('role', '==', 'student')), (snapshot) => {
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch health records, activities, and food purchases in parallel
        Promise.all([
          getDocs(collection(db, 'health_records')),
          getDocs(collection(db, 'activities')),
          getDocs(collection(db, 'food_purchases'))
        ]).then(([hrSnapshot, actSnapshot, fpSnapshot]) => {
          const allHealthRecords = hrSnapshot.docs.map(doc => doc.data());
          const allActivities = actSnapshot.docs.map(doc => doc.data());
          const allFoodPurchases = fpSnapshot.docs.map(doc => doc.data());
          setFoodPurchases(allFoodPurchases);

          // Calculate analytics
          const totalStudents = students.length;
          const bmiCategories: Record<string, number> = {};
          allHealthRecords.forEach((record: any) => {
            if (record.category) {
              bmiCategories[record.category] = (bmiCategories[record.category] || 0) + 1;
            }
          });
          const bmiStats = Object.entries(bmiCategories).map(([category, count]) => ({ category, count }));
          
          const classBmiMap: Record<string, { total: number, count: number }> = {};
          students.forEach((student: any) => {
            if (student.class) {
              const studentRecords = allHealthRecords.filter((r: any) => r.userId === student.id);
              if (studentRecords.length > 0) {
                const latestRecord: any = studentRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                if (latestRecord.bmi) {
                  if (!classBmiMap[student.class]) classBmiMap[student.class] = { total: 0, count: 0 };
                  classBmiMap[student.class].total += latestRecord.bmi;
                  classBmiMap[student.class].count++;
                }
              }
            }
          });
          const classStats = Object.entries(classBmiMap).map(([className, data]) => ({
            class: className,
            avgBmi: data.total / data.count
          }));

          setAnalytics({
            totalStudents,
            bmiStats,
            classStats,
            activityStats: [{ type: 'sport', count: allActivities.filter((a: any) => a.type === 'sport').length }],
            foodParticipationToday: allFoodPurchases.filter((p: any) => p.date === new Date().toISOString().split('T')[0]).length,
            totalPointsAwarded: allFoodPurchases.reduce((sum: number, p: any) => sum + (p.pointsAwarded || 0), 0)
          });
        }).catch(err => handleFirestoreError(err, OperationType.GET, 'admin_dashboard_data'));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
      unsubscribes.push(usersUnsubscribe);
    } else {
      // Student real-time listeners
      const hrUnsubscribe = onSnapshot(query(collection(db, 'health_records'), where('userId', '==', user.id), orderBy('date', 'desc')), (snapshot) => {
        setHealthHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HealthRecord[]);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'health_records'));
      const actUnsubscribe = onSnapshot(query(collection(db, 'activities'), where('userId', '==', user.id), orderBy('date', 'desc')), (snapshot) => {
        setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityType[]);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'activities'));
      
      unsubscribes.push(hrUnsubscribe, actUnsubscribe);

      if (user.class) {
        const annUnsubscribe = onSnapshot(query(collection(db, 'announcements'), where('class', '==', user.class)), (snapshot) => {
          setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'announcements'));
        unsubscribes.push(annUnsubscribe);
      }
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  if (user?.role === 'admin') {
    const COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#ef4444'];
    
    return (
      <div className="space-y-8 px-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500">Real-time school health analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={Users} 
            label="Total Students" 
            value={analytics?.totalStudents || 0} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Activity} 
            label="Avg. BMI" 
            value={analytics?.classStats?.[0]?.avgBmi?.toFixed(1) || '0.0'} 
            trend="down" 
            trendValue="2.4%" 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Award} 
            label="Sports Participation" 
            value={analytics?.activityStats?.find((s: any) => s.type === 'sport')?.count || 0} 
            trend="up" 
            trendValue="12%" 
            color="bg-amber-500" 
          />
          <StatCard 
            icon={TrendingUp} 
            label="Health Score Avg" 
            value="84" 
            trend="up" 
            trendValue="5.2%" 
            color="bg-violet-500" 
          />
          <StatCard 
            icon={Heart} 
            label="Food Participation Today" 
            value={analytics?.foodParticipationToday || 0} 
            color="bg-emerald-500" 
          />
          <StatCard 
            icon={Award} 
            label="Total Points Awarded" 
            value={analytics?.totalPointsAwarded || 0} 
            color="bg-amber-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">BMI Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.bmiStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {analytics?.bmiStats?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {analytics?.bmiStats?.map((entry: any, index: number) => (
                <div key={entry.category} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-medium text-slate-500">{entry.category}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Average BMI by Class</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.classStats || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="avgBmi" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  const latestRecord = healthHistory[0];
  const chartData = [...healthHistory].reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bmi: r.bmi,
    weight: r.weight,
    height: r.height
  }));

  return (
    <div className="space-y-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hello, {user?.fullName}! 👋</h1>
          <p className="text-slate-500">Here's your health summary for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/profile'}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            View Profile
            <ChevronRight size={18} />
          </button>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <Calendar size={18} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Scale} 
          label="Current Weight" 
          value={`${latestRecord?.weight || 0} kg`} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Ruler} 
          label="Current Height" 
          value={`${latestRecord?.height || 0} cm`} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Activity} 
          label="Latest BMI" 
          value={latestRecord?.bmi?.toFixed(1) || '0.0'} 
          trend={latestRecord?.category === 'Normal' ? 'up' : 'down'} 
          trendValue={latestRecord?.category || 'N/A'} 
          color="bg-amber-500" 
        />
        <StatCard 
          icon={Award} 
          label="Health Points" 
          value={user?.points || 0} 
          color="bg-violet-500" 
        />
      </div>

      {/* Gamification Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg">
          <p className="text-blue-100 text-sm font-bold uppercase">Current Level</p>
          <h2 className="text-3xl font-bold mt-1">Level {Math.floor((user?.points || 0) / 100) + 1}</h2>
          <p className="text-blue-100 text-sm mt-2">{100 - ((user?.points || 0) % 100)} points to next level</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase">Daily Streak</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">5 Days</h2>
          </div>
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
            <Zap size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-bold uppercase mb-4">Badges</p>
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">🥇</div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">🏃</div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">🍎</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">BMI Trend</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg">Weight</button>
                <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-lg">Height</button>
              </div>
            </div>
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
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activities</h3>
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
                    <p className="text-xs text-slate-400 capitalize">{activity.type}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400">No activities recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Class Announcements</h3>
              </div>
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement, i) => (
                  <div key={i} className="p-3 bg-blue-50/50 rounded-xl border border-blue-50">
                    <p className="text-sm font-bold text-blue-900">{announcement.title}</p>
                    <p className="text-xs text-blue-700 mt-1 line-clamp-2">{announcement.content}</p>
                    <p className="text-[10px] text-blue-500 mt-2 font-medium">From: {announcement.teacherName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
            <h3 className="text-xl font-bold mb-2">Health Tip</h3>
            <p className="text-blue-100 text-sm mb-6">
              Drinking 8 glasses of water daily helps maintain energy levels.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Health Goals</h3>
            <div className="space-y-6">
              {[
                { label: 'Daily Steps', current: 6500, target: 10000, color: 'bg-blue-500' },
                { label: 'Water Intake', current: 5, target: 8, color: 'bg-blue-500' },
                { label: 'Sleep Hours', current: 7, target: 8, color: 'bg-amber-500' },
              ].map((goal) => (
                <div key={goal.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{goal.label}</span>
                    <span className="text-slate-500">{goal.current}/{goal.target}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(goal.current / goal.target) * 100}%` }}
                      className={cn("h-full rounded-full", goal.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
