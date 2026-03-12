import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy } from '../firebase';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Apple, 
  Lightbulb, 
  ChevronRight,
  Activity,
  User,
  ShieldAlert,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../App';
import { analyzeStudentHealth, getAdminAIInsights, AIAnalysisResult } from '../services/aiService';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';

const InsightCard = ({ icon: Icon, title, children, color = "blue" }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-500`}>
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    </div>
    {children}
  </motion.div>
);

export default function AIInsights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [adminInsights, setAdminInsights] = useState<any>(null);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
          const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const insights = await getAdminAIInsights(students);
          setAdminInsights(insights);
        } else if (user) {
          const healthQ = query(
            collection(db, 'health_records'),
            where('userId', '==', user.id),
            orderBy('date', 'desc')
          );
          const activityQ = query(
            collection(db, 'activities'),
            where('userId', '==', user.id),
            orderBy('date', 'desc')
          );

          const [healthSnapshot, activitySnapshot] = await Promise.all([
            getDocs(healthQ),
            getDocs(activityQ)
          ]);

          const history = healthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const activities = activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          setHealthHistory(history);
          
          const aiAnalysis = await analyzeStudentHealth(user, history, activities);
          setAnalysis(aiAnalysis);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users/health_records/activities');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <p className="text-slate-500 font-medium animate-pulse">AI is analyzing health patterns...</p>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Health Intelligence</h1>
            <p className="text-slate-500">School-wide predictive analytics and insights</p>
          </div>
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold flex items-center gap-2">
            <Brain size={16} />
            AI Engine Active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Students at Risk</p>
              <p className="text-2xl font-bold text-slate-900">{adminInsights?.studentsAtRiskCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Abnormal Growth</p>
              <p className="text-2xl font-bold text-slate-900">{adminInsights?.abnormalGrowthCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Most Improved</p>
              <p className="text-2xl font-bold text-slate-900">{adminInsights?.mostImprovedCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InsightCard icon={AlertTriangle} title="Top Health Risks Detected" color="red">
            <div className="space-y-4">
              {adminInsights?.topRisks?.map((risk: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-sm font-medium text-red-900">{risk}</p>
                </div>
              ))}
            </div>
          </InsightCard>

          <InsightCard icon={BarChart3} title="Class-Level Predictions" color="blue">
            <div className="space-y-4">
              {adminInsights?.classLevelPredictions?.map((p: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900">{p.className}</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Prediction</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{p.prediction}</p>
                  <p className="text-xs text-slate-400 italic">Recommendation: {p.recommendation}</p>
                </div>
              ))}
            </div>
          </InsightCard>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">AI Summary</h3>
          <p className="text-slate-600 leading-relaxed">{adminInsights?.summary}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personal AI Health Insights</h1>
          <p className="text-slate-500">Intelligent analysis of your health patterns</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold flex items-center gap-2">
          <Brain size={16} />
          AI Analysis Complete
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Growth Pattern Detection */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Growth Pattern Analysis</h3>
                  <p className="text-sm text-slate-500">Height & Weight vs Standard Charts</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                {analysis?.growthStatus.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="h-64">
                <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Height vs Age</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthHistory.slice().reverse()}>
                    <defs>
                      <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="height" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHeight)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Weight vs Age</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthHistory.slice().reverse()}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="weight" stroke="#6366f1" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-600 mb-4">{analysis?.growthStatus.description}</p>
              <div className="flex flex-wrap gap-2">
                {analysis?.growthStatus.suggestions.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-500">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Health Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InsightCard icon={AlertTriangle} title="Health Risk Detection" color="amber">
              <div className="space-y-4">
                {analysis?.risks.map((risk, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{risk.type}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        risk.level === 'High' ? 'bg-red-50 text-red-600' :
                        risk.level === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {risk.level} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{risk.description}</p>
                    <p className="text-xs font-bold text-blue-600">Rec: {risk.recommendation}</p>
                  </div>
                ))}
              </div>
            </InsightCard>

            <InsightCard icon={Apple} title="Smart Nutrition" color="emerald">
              <div className="space-y-4">
                {analysis?.nutritionRecommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{rec.food}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {rec.calories} kcal
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{rec.benefits}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Portion: {rec.portion}</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </InsightCard>
          </div>
        </div>

        <div className="space-y-8">
          {/* Daily AI Tips */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-3xl text-white shadow-lg shadow-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Lightbulb size={20} />
              </div>
              <h3 className="text-lg font-bold">Daily AI Tips</h3>
            </div>
            <div className="space-y-4">
              {analysis?.dailyTips.map((tip, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-3 p-4 bg-white/10 rounded-2xl backdrop-blur-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0" />
                  <p className="text-sm font-medium leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">AI Summary</h3>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              "{analysis?.summary}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
