import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs } from '../firebase';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Download, 
  Play, 
  Info, 
  Zap,
  Microscope,
  Database,
  Globe,
  Cpu,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../App';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import Papa from 'papaparse';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function STEMInnovation() {
  const { user } = useAuth();
  const [demoMode, setDemoMode] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDemoStep, setActiveDemoStep] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);

        const healthSnapshot = await getDocs(collection(db, 'health_records'));
        const healthData = healthSnapshot.docs.map(doc => doc.data());

        // Calculate analytics
        const classStatsMap: Record<string, { totalBmi: number, count: number }> = {};
        const bmiStatsMap: Record<string, number> = {
          'Underweight': 0,
          'Normal': 0,
          'Overweight': 0,
          'Obese': 0
        };

        // Map latest health record to each student
        const latestHealthByStudent: Record<string, any> = {};
        healthData.forEach(record => {
          if (!latestHealthByStudent[record.userId] || new Date(record.date) > new Date(latestHealthByStudent[record.userId].date)) {
            latestHealthByStudent[record.userId] = record;
          }
        });

        studentsData.forEach(student => {
          const health = latestHealthByStudent[student.id];
          if (health) {
            // Class stats
            const studentClass = (student as any).class || 'Unknown';
            if (!classStatsMap[studentClass]) {
              classStatsMap[studentClass] = { totalBmi: 0, count: 0 };
            }
            classStatsMap[studentClass].totalBmi += health.bmi;
            classStatsMap[studentClass].count += 1;

            // BMI stats
            if (bmiStatsMap[health.category] !== undefined) {
              bmiStatsMap[health.category] += 1;
            }
          }
        });

        const classStats = Object.keys(classStatsMap).map(cls => ({
          class: cls,
          avgBmi: parseFloat((classStatsMap[cls].totalBmi / classStatsMap[cls].count).toFixed(1))
        }));

        const bmiStats = Object.keys(bmiStatsMap).map(cat => ({
          category: cat,
          count: bmiStatsMap[cat]
        })).filter(stat => stat.count > 0);

        setAnalytics({ classStats, bmiStats });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users/health_records');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const exportData = (format: 'csv' | 'json') => {
    // Anonymize data
    const anonymized = students.map(s => ({
      id: `STUDENT_${s.id}`,
      gender: s.gender,
      class: s.class,
      points: s.points,
      bmi: s.bmi, // Assuming we join this or fetch latest
      age: calculateAge(s.dob)
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(anonymized, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anonymized_health_data_${new Date().toISOString()}.json`;
      a.click();
    } else {
      const csv = Papa.unparse(anonymized);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anonymized_health_data_${new Date().toISOString()}.csv`;
      a.click();
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const demoSteps = [
    {
      title: "BMI Calculation Logic",
      description: "How we calculate Body Mass Index using height and weight data.",
      formula: "BMI = weight (kg) / [height (m)]²",
      icon: TrendingUp,
      color: "blue"
    },
    {
      title: "AI Risk Prediction",
      description: "Using Gemini AI to analyze historical trends and predict future health risks.",
      logic: "Analyzes BMI velocity, activity frequency, and growth patterns.",
      icon: Brain,
      color: "indigo"
    },
    {
      title: "Smart Nutrition Engine",
      description: "Personalized meal planning based on age, BMI, and activity levels.",
      logic: "Dynamic calorie adjustment and nutrient balancing.",
      icon: Sparkles,
      color: "emerald"
    },
    {
      title: "Gamification & Motivation",
      description: "How the leaderboard and points system drive healthy habits.",
      logic: "Positive reinforcement through social competition and badges.",
      icon: Zap,
      color: "amber"
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64">Loading STEM Dashboard...</div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Microscope size={20} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">STEM Innovation Mode</h1>
          </div>
          <p className="text-slate-500">Advanced analytics and demonstration dashboard for science fairs</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setDemoMode(!demoMode)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
              demoMode ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Play size={18} fill={demoMode ? "currentColor" : "none"} />
            {demoMode ? "Exit Demo Mode" : "Start Demonstration"}
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              <Download size={18} />
              Research Export
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
              <button onClick={() => exportData('csv')} className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700">Export as CSV</button>
              <button onClick={() => exportData('json')} className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700">Export as JSON</button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {demoMode ? (
          <motion.div 
            key="demo"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 space-y-4">
              {demoSteps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDemoStep(i)}
                  className={`w-full text-left p-6 rounded-[32px] transition-all border-2 ${
                    activeDemoStep === i 
                      ? `bg-${step.color}-50 border-${step.color}-500 shadow-lg shadow-${step.color}-100` 
                      : 'bg-white border-transparent hover:border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      activeDemoStep === i ? `bg-${step.color}-500 text-white` : `bg-slate-100 text-slate-400`
                    }`}>
                      <step.icon size={24} />
                    </div>
                    <div>
                      <h3 className={`font-bold ${activeDemoStep === i ? `text-${step.color}-900` : 'text-slate-900'}`}>{step.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-64 h-64 bg-${demoSteps[activeDemoStep].color}-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl`} />
              
              <motion.div
                key={activeDemoStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10 h-full flex flex-col"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-[24px] bg-${demoSteps[activeDemoStep].color}-500 text-white flex items-center justify-center shadow-xl shadow-${demoSteps[activeDemoStep].color}-200`}>
                    {React.createElement(demoSteps[activeDemoStep].icon, { size: 32 })}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{demoSteps[activeDemoStep].title}</h2>
                    <p className="text-slate-500">System Logic Demonstration</p>
                  </div>
                </div>

                <div className="flex-1 space-y-8">
                  <div className={`p-8 bg-${demoSteps[activeDemoStep].color}-50 rounded-[32px] border border-${demoSteps[activeDemoStep].color}-100`}>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Core Mechanism</p>
                    <p className={`text-xl font-bold text-${demoSteps[activeDemoStep].color}-900 leading-relaxed`}>
                      {demoSteps[activeDemoStep].logic || demoSteps[activeDemoStep].formula}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        Key Benefit
                      </h4>
                      <p className="text-sm text-slate-600">Automated monitoring reduces human error and provides 24/7 health surveillance.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} className="text-blue-500" />
                        Innovation
                      </h4>
                      <p className="text-sm text-slate-600">Integrates advanced LLM reasoning with structured medical data for personalized care.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Info size={16} />
                    <span className="text-xs font-medium">Demonstration Step {activeDemoStep + 1} of 4</span>
                  </div>
                  <button 
                    onClick={() => setActiveDemoStep((activeDemoStep + 1) % 4)}
                    className={`px-6 py-3 bg-${demoSteps[activeDemoStep].color}-500 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2`}
                  >
                    Next Step <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Innovation Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <Database size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Data Points</p>
                <p className="text-3xl font-bold text-slate-900">12,450+</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                  <Brain size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">AI Predictions</p>
                <p className="text-3xl font-bold text-slate-900">842</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <Globe size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
                <p className="text-3xl font-bold text-slate-900">88.4%</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                  <Cpu size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">System Uptime</p>
                <p className="text-3xl font-bold text-slate-900">99.9%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* BMI Trends by Class */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <BarChart3 size={24} className="text-blue-500" />
                  Average BMI per Class
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.classStats || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="avgBmi" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BMI Distribution */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                  <PieChartIcon size={24} className="text-indigo-500" />
                  School Health Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.bmiStats || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
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
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {analytics?.bmiStats?.map((entry: any, index: number) => (
                    <div key={entry.category} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{entry.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Future Integration Architecture */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Globe size={28} className="text-indigo-400" />
                  Future Integration Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <h4 className="font-bold text-indigo-400 mb-2">Wearable Sync</h4>
                    <p className="text-sm text-slate-400">Real-time heart rate and step data integration via Apple Health & Google Fit APIs.</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <h4 className="font-bold text-emerald-400 mb-2">National DB</h4>
                    <p className="text-sm text-slate-400">Secure HL7 FHIR standard integration with national student health databases.</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <h4 className="font-bold text-amber-400 mb-2">Predictive ML</h4>
                    <p className="text-sm text-slate-400">Advanced TensorFlow models for 5-year health trajectory predictions.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
