import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, onAuthStateChanged, signOut, doc, getDoc, onSnapshot } from './firebase';
import { 
  UserCircle,
  LayoutDashboard, 
  Users, 
  Activity, 
  Trophy, 
  MessageSquare, 
  HelpCircle, 
  Apple, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Plus,
  ChevronRight,
  Heart,
  TrendingUp,
  Award,
  Brain,
  QrCode,
  Microscope,
  BookOpen,
  Calendar,
  Leaf,
  ShoppingCart,
  ShieldCheck,
  Github,
  Coffee
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Types
import { User } from './types';

// Utils
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (user: any) => void;
  logout: () => void;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import HealthRecords from './pages/HealthRecords';
import Activities from './pages/Activities';
import Leaderboard from './pages/Leaderboard';
import Community from './pages/Community';
import Queries from './pages/Queries';
import Nutrition from './pages/Nutrition';
import AIInsights from './pages/AIInsights';
import HealthPassport from './pages/HealthPassport';
import STEMInnovation from './pages/STEMInnovation';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Modules from './pages/Modules';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherStudents from './pages/TeacherStudents';
import TeacherHealthRecords from './pages/TeacherHealthRecords';
import TeacherActivities from './pages/TeacherActivities';
import TeacherAnalytics from './pages/TeacherAnalytics';
import TeacherAnnouncements from './pages/TeacherAnnouncements';
import TeacherQueries from './pages/TeacherQueries';
import AdminTeachers from './pages/AdminTeachers';
import AdminClassrooms from './pages/AdminClassrooms';
import AdminSports from './pages/AdminSports';
import CoachDashboard from './pages/CoachDashboard';
import CoachAttendance from './pages/CoachAttendance';
import CoachActivities from './pages/CoachActivities';
import BreakfastClubAdmin from './pages/BreakfastClubAdmin';
import BreakfastMarketplace from './pages/BreakfastMarketplace';
import MyBreakfastReservations from './pages/MyBreakfastReservations';
import VegetableMarketplace from './pages/VegetableMarketplace';
import MyReservations from './pages/MyReservations';
import UserManagement from './pages/UserManagement';
import ChangePassword from './pages/ChangePassword';
import OrganicClubAdmin from './pages/OrganicClubAdmin';
import OrganicAdminDashboard from './pages/OrganicAdminDashboard';
import BreakfastAdminDashboard from './pages/BreakfastAdminDashboard';
import AdminHealthUpdate from './pages/AdminHealthUpdate';
import StudentTracking from './pages/StudentTracking';
import DeveloperMenu from './components/DeveloperMenu';

const SidebarItem = ({ icon: Icon, label, path, onClick }: any) => (
  <NavLink
    to={path}
    onClick={onClick}
    className={({ isActive }) => cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      isActive 
        ? "bg-blue-500 text-white shadow-lg shadow-blue-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    {({ isActive }) => (
      <>
        <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
        <span className="font-medium">{label}</span>
        {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
      </>
    )}
  </NavLink>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarItemClick = () => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Organic Admin Dashboard', path: '/organic-admin-dashboard', roles: ['organic-admin'] },
    { icon: LayoutDashboard, label: 'Breakfast Admin Dashboard', path: '/breakfast-admin-dashboard', roles: ['breakfast-admin'] },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'student'] },
    { icon: LayoutDashboard, label: 'Teacher Dashboard', path: '/teacher/dashboard', roles: ['teacher'] },
    { icon: LayoutDashboard, label: 'Coach Dashboard', path: '/coach/dashboard', roles: ['coach'] },
    { icon: Calendar, label: 'Attendance', path: '/coach/attendance', roles: ['coach'] },
    { icon: Activity, label: 'Record Activity', path: '/coach/activities', roles: ['coach'] },
    { icon: TrendingUp, label: 'My Progress', path: '/tracking', roles: ['student'] },
    { icon: Leaf, label: 'Marketplace', path: '/marketplace', roles: ['admin', 'student', 'teacher'] },
    { icon: ShoppingCart, label: 'My Reservations', path: '/my-reservations', roles: ['admin', 'student', 'teacher'] },
    { icon: Coffee, label: 'Breakfast Club', path: '/breakfast', roles: ['admin', 'student', 'teacher'] },
    { icon: Coffee, label: 'My Breakfast', path: '/my-breakfast', roles: ['admin', 'student', 'teacher'] },
    { icon: ShieldCheck, label: 'Organic Admin', path: '/organic-admin', roles: ['admin'] },
    { icon: ShieldCheck, label: 'Breakfast Admin', path: '/breakfast-admin', roles: ['admin'] },
    { icon: Users, label: 'User Management', path: '/admin/users', roles: ['admin'] },
    { icon: UserCircle, label: 'Profile', path: '/profile', roles: ['admin', 'student', 'teacher', 'coach'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['admin'] },
    { icon: Users, label: 'Teachers', path: '/admin/teachers', roles: ['admin'] },
    { icon: BookOpen, label: 'Classrooms', path: '/admin/classrooms', roles: ['admin'] },
    { icon: Activity, label: 'Health Update', path: '/admin/health-update', roles: ['admin'] },
    { icon: Award, label: 'Sports Management', path: '/admin/sports', roles: ['admin'] },
    { icon: Users, label: 'My Students', path: '/teacher/students', roles: ['teacher'] },
    { icon: Activity, label: 'Health Records', path: '/teacher/health-records', roles: ['teacher'] },
    { icon: Activity, label: 'Activities', path: '/activities', roles: ['admin', 'student'] },
    { icon: Activity, label: 'Activity Tracking', path: '/teacher/activities', roles: ['teacher'] },
    { icon: TrendingUp, label: 'Class Analytics', path: '/teacher/analytics', roles: ['teacher'] },
    { icon: MessageSquare, label: 'Announcements', path: '/teacher/announcements', roles: ['teacher'] },
    { icon: HelpCircle, label: 'Student Queries', path: '/teacher/queries', roles: ['teacher'] },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', roles: ['admin', 'student'] },
    { icon: Apple, label: 'Nutrition', path: '/nutrition', roles: ['admin', 'student'] },
    { icon: Brain, label: 'AI Insights', path: '/ai-insights', roles: ['admin', 'student'] },
    { icon: QrCode, label: 'Health Passport', path: '/health-passport', roles: ['admin', 'student'] },
    { icon: MessageSquare, label: 'Community', path: '/community', roles: ['admin', 'student'] },
    { icon: HelpCircle, label: 'Queries', path: '/queries', roles: ['admin', 'student'] },
    { icon: Microscope, label: 'STEM Innovation', path: '/stem-innovation', roles: ['admin'] },
    { icon: BookOpen, label: 'Modules', path: '/modules', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'student'));

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans relative">
      {/* Global Background Gradients for Glass Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-emerald-400/10 rounded-full blur-[100px]" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 0, 
          opacity: isSidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed h-[calc(100vh-32px)] z-30 overflow-hidden m-4 rounded-3xl",
          "bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-slate-200/20",
          !isSidebarOpen && "w-0 border-none p-0"
        )}
      >
        <div className="flex flex-col h-full p-6 w-[280px]">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">Health Guard</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jaffna Hindu College</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 -mr-2 thin-scrollbar">
            {filteredItems.map((item) => (
              <SidebarItem
                key={item.path}
                {...item}
                onClick={handleSidebarItemClick}
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <button
              onClick={logout}
              className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-white/50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn("flex-1 flex flex-col overflow-hidden transition-all duration-300", isSidebarOpen && "md:ml-[300px]")}>
        {/* Header */}
        <header className="h-16 mt-4 mx-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl flex items-center justify-between px-4 md:px-8 flex-shrink-0 shadow-xl shadow-blue-900/5 z-10 relative">
          <div className="flex items-center gap-4 z-10">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/50 rounded-lg text-slate-500 transition-colors"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search health data..." 
                className="pl-10 pr-4 py-2 bg-white/50 border border-white/60 rounded-xl w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Center Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Heart className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight leading-none">Health Guard</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Jaffna Hindu College</span>
            </div>
          </div>

          <div className="flex items-center gap-6 z-10">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                <img 
                  src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.fullName}&background=3b82f6&color=fff`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error("Failed to parse cached user:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const userObj = { ...userData, id: firebaseUser.uid };
            setUser(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
          } else {
            setUser(null);
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
  if (user.role === 'student' && !user.profileCompleted && location.pathname !== '/profile') {
    return <Navigate to="/profile" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" />;
    return <Navigate to="/dashboard" />;
  }

  return <Layout />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          
          {/* Protected Routes with Persistent Layout */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'student']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/community" element={<Community />} />
            <Route path="/queries" element={<Queries />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/health-passport" element={<HealthPassport />} />
            <Route path="/health-records" element={<HealthRecords />} />
          </Route>
          
          <Route path="/health-passport/:id" element={<HealthPassport />} />

          <Route element={<ProtectedRoute allowedRoles={['admin', 'student', 'teacher']} />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Teacher Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/health-records" element={<TeacherHealthRecords />} />
            <Route path="/teacher/activities" element={<TeacherActivities />} />
            <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
            <Route path="/teacher/queries" element={<TeacherQueries />} />
          </Route>

          {/* Coach Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['coach']} />}>
            <Route path="/coach/dashboard" element={<CoachDashboard />} />
            <Route path="/coach/attendance" element={<CoachAttendance />} />
            <Route path="/coach/activities" element={<CoachActivities />} />
          </Route>

          {/* Organic Marketplace Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'student', 'teacher']} />}>
            <Route path="/marketplace" element={<VegetableMarketplace />} />
            <Route path="/my-reservations" element={<MyReservations />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/tracking" element={<StudentTracking />} />
          </Route>

          {/* Breakfast Club Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'student', 'teacher']} />}>
            <Route path="/breakfast" element={<BreakfastMarketplace />} />
            <Route path="/my-breakfast" element={<MyBreakfastReservations />} />
          </Route>

          {/* Organic Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['organic-admin']} />}>
            <Route path="/organic-admin-dashboard" element={<OrganicAdminDashboard />} />
          </Route>

          {/* Breakfast Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['breakfast-admin']} />}>
            <Route path="/breakfast-admin-dashboard" element={<BreakfastAdminDashboard />} />
          </Route>

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/organic-admin" element={<OrganicClubAdmin />} />
            <Route path="/breakfast-admin" element={<BreakfastClubAdmin />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/students" element={<Students />} />
            <Route path="/admin/teachers" element={<AdminTeachers />} />
            <Route path="/admin/classrooms" element={<AdminClassrooms />} />
            <Route path="/admin/sports" element={<AdminSports />} />
            <Route path="/admin/health-update" element={<AdminHealthUpdate />} />
            <Route path="/stem-innovation" element={<STEMInnovation />} />
            <Route path="/modules" element={<Modules />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <DeveloperMenu />
      </Router>
    </AuthProvider>
  );
}
