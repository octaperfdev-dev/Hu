import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, getDocs, query, where } from '../firebase';
import { Users, Activity, Calendar, Award, CheckCircle, QrCode } from 'lucide-react';
import { useAuth } from '../App';
import QRScanner from '../components/QRScanner';

export default function CoachDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all activities
      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activitiesData = activitiesSnapshot.docs.map(doc => doc.data());

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Group activities by sport (name)
      const sportsMap = new Map();
      const athletesList: any[] = [];

      activitiesData.forEach((activity: any) => {
        const sportName = activity.name;
        if (!sportsMap.has(sportName)) {
          sportsMap.set(sportName, { sport: sportName, athletes: new Set(), activities: 0 });
        }
        
        const sportStats = sportsMap.get(sportName);
        sportStats.activities += 1;
        sportStats.athletes.add(activity.userId);

        // Add to athletes list if not already there for this sport
        const athleteUser = usersData.find(u => u.id === activity.userId);
        if (athleteUser) {
          const existingEntry = athletesList.find(a => a.id === athleteUser.id && a.sportName === sportName);
          if (!existingEntry) {
            athletesList.push({
              id: athleteUser.id,
              fullName: (athleteUser as any).fullName || 'Unknown',
              sportName: sportName
            });
          }
        }
      });

      const statsData = Array.from(sportsMap.values()).map(s => ({
        ...s,
        athletes: s.athletes.size
      }));

      setStats(statsData as any);
      setAthletes(athletesList as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'activities/users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Coach Dashboard</h1>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <QrCode size={18} />
          Scan Passbook
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((s: any) => (
          <div key={s.sport} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">{s.sport}</h3>
            <div className="flex justify-between mt-4">
              <div>
                <p className="text-sm text-slate-500">Athletes</p>
                <p className="text-2xl font-bold">{s.athletes}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Activities</p>
                <p className="text-2xl font-bold">{s.activities}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-4">My Athletes</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-sm border-b border-slate-200">
              <th className="p-2">Name</th>
              <th className="p-2">Sport</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a: any) => (
              <tr key={a.id} className="border-b border-slate-100">
                <td className="p-2 font-medium">{a.fullName}</td>
                <td className="p-2">{a.sportName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isScannerOpen && <QRScanner onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
}
