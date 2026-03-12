import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, doc, getDoc, orderBy } from '../firebase';
import { 
  Heart, 
  Brain, 
  TrendingUp, 
  Apple, 
  Award, 
  QrCode, 
  ChevronRight, 
  Activity, 
  ShieldCheck, 
  Users, 
  Zap,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Play,
  Star,
  Sparkles,
  Microscope,
  HelpCircle,
  ExternalLink,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  Ruler,
  Github,
  Scale as ScaleIcon
} from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { Globe } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Module } from '../types';

const MOCK_BMI_DATA = [
  { name: 'Jan', bmi: 18.5 },
  { name: 'Feb', bmi: 19.2 },
  { name: 'Mar', bmi: 19.0 },
  { name: 'Apr', bmi: 19.5 },
  { name: 'May', bmi: 19.8 },
  { name: 'Jun', bmi: 20.2 },
];

const FeatureCard = ({ icon: Icon, title, description, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    whileHover={{ y: -10, scale: 1.02 }}
    className="bg-white/30 backdrop-blur-xl p-8 rounded-[32px] border border-white/50 shadow-xl shadow-slate-200/20 group"
  >
    <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
      <Icon size={28} className="text-white" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const StepItem = ({ number, title, description, icon: Icon }: any) => (
  <div className="flex gap-6 items-start">
    <div className="relative">
      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-lg z-10 relative">
        {number}
      </div>
      {number !== 5 && <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-200" />}
    </div>
    <div className="pt-1">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={18} className="text-blue-500" />
        <h4 className="font-bold text-slate-900">{title}</h4>
      </div>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  </div>
);

export default function Home() {
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [breakfastItems, setBreakfastItems] = useState<any[]>([]);
  const [vegetables, setVegetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scanned Student State
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [isScannedModalOpen, setIsScannedModalOpen] = useState(false);
  const [scannedLoading, setScannedLoading] = useState(false);

  const handleScan = async (decodedText: string) => {
    try {
      // Extract ID from URL or use as is if it's just an ID
      const parts = decodedText.split('/');
      const studentId = parts[parts.length - 1];
      
      if (!studentId) return;

      setIsScannedModalOpen(true);
      setScannedLoading(true);

      const [studentDoc, healthSnapshot, activitySnapshot] = await Promise.all([
        getDoc(doc(db, 'users', studentId)),
        getDocs(query(collection(db, 'health_records'), where('userId', '==', studentId), orderBy('date', 'desc'))),
        getDocs(query(collection(db, 'activities'), where('userId', '==', studentId), orderBy('date', 'desc')))
      ]);

      if (studentDoc.exists()) {
        const studentData = { id: studentDoc.id, ...studentDoc.data() };
        const healthData = healthSnapshot.docs.map(d => d.data());
        const activitiesData = activitySnapshot.docs.map(d => d.data());
        
        setScannedStudent({
          ...studentData,
          healthRecords: healthData,
          activities: activitiesData
        });
      } else {
        setScannedStudent(null);
      }
    } catch (err) {
      console.error("Error fetching scanned student:", err);
      setScannedStudent(null);
    } finally {
      setScannedLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesSnapshot, usersSnapshot, breakfastSnapshot, vegSnapshot] = await Promise.all([
          getDocs(collection(db, 'modules')),
          getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
          getDocs(collection(db, 'breakfast_items')),
          getDocs(collection(db, 'vegetables'))
        ]);
        
        const modulesData = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Module));
        
        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const leaderboardData = usersData
          .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
          .map((u: any, i) => ({
            rank: i + 1,
            name: u.fullName,
            points: u.points || 0,
            avatar: u.photoUrl || `https://picsum.photos/seed/${u.username}/400/400`
          }));
          
        const breakfastData = breakfastSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const vegData = vegSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setModules(modulesData);
        setLeaderboard(leaderboardData);
        setBreakfastItems(breakfastData);
        setVegetables(vegData);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'home_page_data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayModules = modules.length > 0 ? modules.slice(0, 4) : [
    { title: 'Exercise Tutorials', imageUrl: 'https://picsum.photos/seed/fitness/400/300', description: 'Step-by-step guides for daily student workouts.', category: 'Fitness' },
    { title: 'Healthy Food Guide', imageUrl: 'https://picsum.photos/seed/food/400/300', description: 'Learn about balanced diets and nutrition.', category: 'Nutrition' },
    { title: 'Nutrition Tips', imageUrl: 'https://picsum.photos/seed/nutrition/400/300', description: 'Quick tips for maintaining energy levels.', category: 'Wellness' },
    { title: 'Daily Fitness', imageUrl: 'https://picsum.photos/seed/sports/400/300', description: 'Fun activities to keep you moving daily.', category: 'Fitness' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-500 selection:text-white overflow-x-hidden relative">
      {/* Global Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-emerald-400/10 rounded-full blur-[100px]" />
      </div>
      {/* Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50 mx-4 md:mx-8 lg:mx-auto max-w-7xl bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl shadow-slate-200/20">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Heart className="text-white" size={18} />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">Health Guard</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Jaffna Hindu College</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors uppercase tracking-wide">Features</a>
            <a href="#how-it-works" className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors uppercase tracking-wide">How it Works</a>
            <a href="#leaderboard" className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors uppercase tracking-wide">Leaderboard</a>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Login
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-8">
              <Zap size={14} />
              JAFFNA HINDU COLLEGE • AI-POWERED STUDENT WELLNESS
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 tracking-tight">
              Smart Student <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Health Monitoring</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-xl">
              AI-powered health tracking, nutrition guidance, and fitness analytics designed to build a healthier future for schools.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Student Login <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="px-8 py-4 bg-white/30 backdrop-blur-md text-slate-900 border border-white/50 rounded-2xl font-bold hover:bg-white/50 transition-all shadow-lg shadow-slate-200/20 flex items-center gap-3"
              >
                <QrCode size={20} />
                Scan Health Passport
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white/30 backdrop-blur-md text-slate-900 border border-white/50 rounded-2xl font-bold hover:bg-white/50 transition-all shadow-lg shadow-slate-200/20"
              >
                Admin Access
              </button>
            </div>
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                    <Users size={16} className="text-slate-500" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Joined by <span className="text-slate-900 font-bold">3,000+</span> students this month
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="bg-white/30 backdrop-blur-xl p-8 rounded-[48px] shadow-2xl shadow-blue-200/20 border border-white/50 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Activity size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Health Analytics</h4>
                    <p className="text-xs text-slate-400">Live Prediction Engine</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                  Active
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_BMI_DATA}>
                    <defs>
                      <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="bmi" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorBmi)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avg BMI</p>
                  <p className="text-lg font-bold text-slate-900">19.4</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Growth</p>
                  <p className="text-lg font-bold text-emerald-600">+2.4%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-lg font-bold text-blue-600">Normal</p>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-400 rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600 rounded-full blur-3xl opacity-10" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features for Modern Schools</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Everything you need to monitor, analyze, and improve student health in one unified platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={TrendingUp} 
              title="Health Records" 
              description="Monitor height, weight, and BMI trends automatically to ensure students are developing healthily."
              delay={0.1}
            />
            <FeatureCard 
              icon={Brain} 
              title="AI Insights" 
              description="Predict possible health risks using advanced AI analysis of historical BMI and activity data."
              delay={0.2}
            />
            <FeatureCard 
              icon={Apple} 
              title="Smart Nutrition" 
              description="Personalized healthy food suggestions based on individual BMI, age, and activity levels."
              delay={0.3}
            />
            <FeatureCard 
              icon={Activity} 
              title="Sports & Activities" 
              description="Track sports participation and fitness activities with automated points and rewards."
              delay={0.4}
            />
            <FeatureCard 
              icon={Award} 
              title="Health Leaderboards" 
              description="Motivate students with healthy competition and achievement badges for fitness goals."
              delay={0.5}
            />
            <FeatureCard 
              icon={QrCode} 
              title="Health Passport" 
              description="A secure digital health profile for every student with unique QR code verification."
              delay={0.6}
            />
            <FeatureCard 
              icon={MessageSquare} 
              title="Community" 
              description="Engage with peers, share tips, and celebrate health achievements together."
              delay={0.7}
            />
            <FeatureCard 
              icon={HelpCircle} 
              title="Student Queries" 
              description="Direct support channel for students to ask health and wellness related questions."
              delay={0.8}
            />
            <FeatureCard 
              icon={Microscope} 
              title="STEM Innovation" 
              description="Integrate health data with STEM learning for advanced student research projects."
              delay={0.9}
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">Simple Steps to a <br />Healthier School</h2>
            <div className="space-y-10">
              <StepItem 
                number={1} 
                title="Register Profile" 
                description="Create a digital health profile for each student with basic demographic data."
                icon={Users}
              />
              <StepItem 
                number={2} 
                title="Track Metrics" 
                description="Regularly record height, weight, and BMI to build a comprehensive health history."
                icon={Scale}
              />
              <StepItem 
                number={3} 
                title="AI Analysis" 
                description="Our AI engine analyzes patterns to identify risks and growth trajectories."
                icon={Brain}
              />
              <StepItem 
                number={4} 
                title="Personalized Plans" 
                description="Students receive tailored nutrition and activity recommendations."
                icon={Sparkles}
              />
              <StepItem 
                number={5} 
                title="Build Habits" 
                description="Gamification and community features encourage long-term healthy lifestyle choices."
                icon={Award}
              />
            </div>
          </div>
          <div className="relative">
            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold">Secure Data Storage</h4>
                  <p className="text-slate-400 text-sm">Encrypted & Privacy-Focused</p>
                </div>
              </div>
              <div className="space-y-6">
                {[
                  "End-to-end encryption for health records",
                  "Authorized access only for school staff",
                  "GDPR & Student Privacy compliant",
                  "Automated secure backups"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={14} />
                    </div>
                    <span className="text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-sm italic text-slate-400">"The system has transformed how we monitor student wellness, making data-driven care accessible for every teacher."</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-full" />
                  <div>
                    <p className="text-sm font-bold">Dr. Robert Chen</p>
                    <p className="text-xs text-slate-500">School Health Officer</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20" />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 px-6 bg-blue-600">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <div>
            <p className="text-5xl font-bold text-white mb-2">3,000+</p>
            <p className="text-blue-100 font-medium">Students Monitored</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-white mb-2">15,000+</p>
            <p className="text-blue-100 font-medium">Activities Logged</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-white mb-2">19.2</p>
            <p className="text-blue-100 font-medium">Average School BMI</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-white mb-2">94%</p>
            <p className="text-blue-100 font-medium">Participation Rate</p>
          </div>
        </div>
      </section>

      {/* Health Education Section */}
      <section className="py-32 px-6 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Health Learning Center</h2>
              <p className="text-slate-500">Expert-curated resources for a better lifestyle.</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all">
              View All Modules <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayModules.map((item: any, i: number) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white/30 backdrop-blur-xl rounded-[32px] overflow-hidden border border-white/50 shadow-xl shadow-slate-200/20 group"
              >
                <div className="h-48 overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed line-clamp-2">{item.description}</p>
                  <button 
                    onClick={() => item.link && window.open(item.link, '_blank')}
                    className="w-full py-3 bg-white/30 backdrop-blur-md border border-white/50 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {item.link ? <ExternalLink size={14} /> : null}
                    View Module
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Selling Section */}
      <section className="py-32 px-6 bg-white/50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 mb-16">Live Selling</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-bold mb-8">Fresh Veggies & Fruits</h3>
              <div className="grid grid-cols-2 gap-4">
                {vegetables.map((v: any) => (
                  <div key={v.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                    <img src={v.imageUrl} alt={v.name} className="w-full h-32 object-cover rounded-xl mb-2" />
                    <p className="font-bold">{v.name}</p>
                    <p className="text-sm text-slate-500">Rs {v.price} / {v.quantity} left</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-8">Ready Breakfast</h3>
              <div className="grid grid-cols-2 gap-4">
                {breakfastItems.map((b: any) => (
                  <div key={b.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                    <img src={b.imageUrl} alt={b.name} className="w-full h-32 object-cover rounded-xl mb-2" />
                    <p className="font-bold">{b.name}</p>
                    <p className="text-sm text-slate-500">Rs {b.price} / {b.quantity} left</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Preview */}
      <section className="py-32 px-6 bg-transparent overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="space-y-6">
              {[
                { user: 'Coach Mike', text: 'Great job to Grade 10 for completing the 5km challenge! 🏃‍♂️', likes: 42, comments: 8 },
                { user: 'Student Council', text: 'New healthy snacks available in the cafeteria from tomorrow! 🍎', likes: 128, comments: 24 },
                { user: 'Health Dept', text: 'Remember to stay hydrated during the summer sports meet. 💧', likes: 85, comments: 5 },
              ].map((post, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/30 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{post.user}</p>
                      <p className="text-[10px] text-slate-400">2 hours ago</p>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">{post.text}</p>
                  <div className="flex items-center gap-6 text-slate-400">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Heart size={16} /> {post.likes}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <MessageSquare size={16} /> {post.comments}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Star size={16} /> Save
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Engage with the <br />Health Community</h2>
            <p className="text-slate-500 mb-10 leading-relaxed">Share tips, celebrate achievements, and participate in school-wide health challenges. Building healthy habits is better together.</p>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Join the Community
            </button>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section id="leaderboard" className="py-32 px-6 bg-transparent relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Top Health Champions</h2>
            <p className="text-slate-500">Celebrating the most active and health-conscious students.</p>
          </div>
          <div className="bg-white/30 backdrop-blur-xl rounded-[40px] p-8 border border-white/50 shadow-xl shadow-slate-200/20">
            <div className="space-y-4">
              {leaderboard.length > 0 ? leaderboard.map((student, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-600' : 
                      i === 1 ? 'bg-slate-200 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      #{student.rank}
                    </div>
                    <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-xl object-cover" />
                    <span className="font-bold text-slate-900">{student.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-600 font-bold">{student.points}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-slate-400">
                  No leaderboard data available.
                </div>
              )}
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
            >
              View Full Leaderboard
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-24 pb-12 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Heart className="text-white" size={24} />
                </div>
                <span className="text-xl font-bold tracking-tight">Health Guard</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Empowering schools with AI-driven health intelligence to build a healthier, more active generation of students.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Contact</h4>
              <ul className="space-y-4 text-slate-400 text-sm font-medium">
                <li>Jaffna Hindu College</li>
                <li>Jaffna, Sri Lanka</li>
                <li>principal@jhc.lk</li>
                <li>(+94) 021 222 2431</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-xs">
              © 2026 Health Guard. Developed by <a href="https://github.com/Ramesh-Karu" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Ramesh Karu</a>. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="https://github.com/Ramesh-Karu" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <Github size={16} className="text-slate-400" />
              </a>
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <Users size={16} className="text-slate-400" />
              </div>
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <Globe size={16} className="text-slate-400" />
              </div>
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <ShieldCheck size={16} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </footer>
      {isScannerOpen && <QRScanner onClose={() => setIsScannerOpen(false)} onScan={handleScan} />}

      {/* Scanned Student Modal */}
      {isScannedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
          >
            <button 
              onClick={() => setIsScannedModalOpen(false)} 
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            {scannedLoading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500">Loading student data...</p>
              </div>
            ) : scannedStudent ? (
              <div className="p-8">
                <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg bg-white border border-slate-100">
                    <img 
                      src="https://image2url.com/r2/default/images/1773243015309-8d00926d-bd9c-4a4d-931d-e00cbf039414.jpg" 
                      alt={scannedStudent.fullName}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">{scannedStudent.fullName}</h2>
                    <div className="flex flex-wrap gap-4 text-slate-600">
                      <span className="flex items-center gap-1"><Users size={18} /> Class {scannedStudent.class} {scannedStudent.division}</span>
                      <span className="flex items-center gap-1"><Award size={18} /> {scannedStudent.points || 0} Points</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={18} /> {scannedStudent.indexNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Date of Birth</p>
                    <p className="font-bold text-slate-900">{scannedStudent.dob ? new Date(scannedStudent.dob).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Gender</p>
                    <p className="font-bold text-slate-900 capitalize">{scannedStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Health Status</p>
                    <p className="font-bold text-emerald-600">{scannedStudent.healthRecords?.[0]?.category || 'Normal'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Blood Group</p>
                    <p className="font-bold text-red-600">{scannedStudent.bloodGroup || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* BMI Analysis */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Activity className="text-blue-500" /> BMI Analysis
                    </h3>
                    {scannedStudent.healthRecords && scannedStudent.healthRecords.length > 0 ? (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-white p-4 rounded-xl shadow-sm">
                            <div className="text-sm text-slate-500 mb-1">Latest BMI</div>
                            <div className="text-2xl font-bold text-slate-900">{scannedStudent.healthRecords[0].bmi.toFixed(1)}</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl shadow-sm">
                            <div className="text-sm text-slate-500 mb-1">Height</div>
                            <div className="text-2xl font-bold text-slate-900">{scannedStudent.healthRecords[0].height} cm</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl shadow-sm">
                            <div className="text-sm text-slate-500 mb-1">Weight</div>
                            <div className="text-2xl font-bold text-slate-900">{scannedStudent.healthRecords[0].weight} kg</div>
                          </div>
                        </div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[...scannedStudent.healthRecords].reverse()}>
                              <defs>
                                <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" hide />
                              <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                              />
                              <Area type="monotone" dataKey="bmi" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBmi)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
                        No health records found.
                      </div>
                    )}
                  </div>

                  {/* Sports Activities */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="text-emerald-500" /> Recent Activities
                    </h3>
                    {scannedStudent.activities && scannedStudent.activities.length > 0 ? (
                      <div className="space-y-4">
                        {scannedStudent.activities.slice(0, 5).map((activity: any, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                {activity.type === 'sport' ? <Award size={20} /> : <Activity size={20} />}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{activity.name}</h4>
                                <p className="text-sm text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600">+{activity.points} pts</div>
                              {activity.duration && <div className="text-xs text-slate-500">{activity.duration}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center text-slate-500">
                        No recent activities found.
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Phone className="text-red-500" /> Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <User size={18} className="text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent/Guardian</p>
                        <p className="text-sm font-bold text-slate-900">{scannedStudent.parentName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <Phone size={18} className="text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                        <p className="text-sm font-bold text-slate-900">{scannedStudent.parentContact || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <MapPin size={18} className="text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                        <p className="text-sm font-bold text-slate-900">{scannedStudent.address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Student Not Found</h3>
                <p className="text-slate-500">The scanned QR code does not match any student in our system.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Scale({ size, className }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/>
    </svg>
  );
}

function GlobeIcon({ size, className }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
    </svg>
  );
}
