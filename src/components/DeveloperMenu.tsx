import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Github, User, X, Database, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import { seedDatabase, db, doc, updateDoc } from '../firebase';
import { migrateMockToFirestore, clearFirestoreData, migrateSqliteToFirestore } from '../lib/migration';
import { useAuth } from '../App';

export default function DeveloperMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('DeveloperMenu Init - Firebase API Key exists:', !!import.meta.env.VITE_FIREBASE_API_KEY);
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState(0);
  const { user } = useAuth();
  const [isSqliteMigrating, setIsSqliteMigrating] = useState(false);
  const [sqliteProgress, setSqliteProgress] = useState(0);

  const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  const missingVars = requiredEnvVars.filter(v => !import.meta.env[v]);

  const handleSeed = async () => {
    console.log('Seed button clicked. Firebase configured:', isFirebaseConfigured);
    
    if (missingVars.length > 0) {
      alert(`Missing Firebase environment variables: ${missingVars.join(', ')}. Please add them to your Vercel project settings.`);
      return;
    }

    if (!confirm('This will seed the database with initial data. Continue?')) return;

    setIsSeeding(true);
    setSeedProgress(0);
    try {
      console.log('Calling seedDatabase...');
      await seedDatabase((progress) => {
        console.log(`Seeding progress: ${progress}%`);
        setSeedProgress(progress);
      });
      alert('Database seeded successfully!');
    } catch (error: any) {
      console.error('Seeding error details:', error);
      let errorMsg = error.message || 'Unknown error';
      if (error.code === 'permission-denied') {
        errorMsg = 'Permission Denied. Ensure you are an Admin in Firestore and your email is authorized.';
      }
      alert(`Error seeding database: ${errorMsg}. Check console for details.`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleMigrate = async () => {
    if (missingVars.length > 0) {
      alert(`Missing Firebase environment variables: ${missingVars.join(', ')}. Please add them to your Vercel project settings.`);
      return;
    }
    if (!confirm('This will migrate data from local storage to Firestore. Continue?')) return;
    setIsMigrating(true);
    setMigrateProgress(0);
    try {
      await migrateMockToFirestore((progress) => setMigrateProgress(progress));
      alert('Migration complete!');
    } catch (error) {
      console.error('Migration error:', error);
      alert('Error during migration.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSqliteMigrate = async () => {
    if (missingVars.length > 0) {
      alert(`Missing Firebase environment variables: ${missingVars.join(', ')}. Please add them to your Vercel project settings.`);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in as an admin to migrate SQLite data. Please log in first.');
      return;
    }
    if (!confirm('This will migrate data from SQLite (Server) to Firestore. Continue?')) return;
    setIsSqliteMigrating(true);
    setSqliteProgress(0);
    try {
      await migrateSqliteToFirestore((progress) => setSqliteProgress(progress));
    } finally {
      setIsSqliteMigrating(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-slate-900 flex items-center justify-center shadow-lg hover:bg-white/40 transition-all"
      >
        {isOpen ? <X size={16} /> : <Code size={16} />}
      </motion.button>

      {/* Transparent Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-72 bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Rameshnathan Karuvoolan</h3>
                <p className="text-xs text-slate-500">Developer</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-500 uppercase tracking-wider">System Status</span>
                <div className={`w-2 h-2 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <p className="text-[10px] text-slate-400">
                {isFirebaseConfigured 
                  ? 'Firebase is configured and ready.' 
                  : `Missing: ${missingVars.join(', ')}`}
              </p>
            </div>
            
            <div className="space-y-2">
              <a 
                href="https://github.com/Ramesh-Karu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all text-slate-700 font-medium"
              >
                <Github size={20} />
                GitHub Profile
              </a>

              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="flex items-center gap-3 w-full p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all text-slate-700 font-medium disabled:opacity-50 relative overflow-hidden"
              >
                <Database size={20} className="relative z-10" />
                <span className="relative z-10">
                  {isSeeding ? `Seeding (${seedProgress}%)` : 'Seed Database'}
                </span>
                {isSeeding && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${seedProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-blue-500/10 z-0"
                  />
                )}
              </button>

              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="flex items-center gap-3 w-full p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all text-slate-700 font-medium disabled:opacity-50 relative overflow-hidden"
              >
                <RefreshCw size={20} className={`relative z-10 ${isMigrating ? 'animate-spin' : ''}`} />
                <span className="relative z-10">
                  {isMigrating ? `Migrating (${migrateProgress}%)` : 'Migrate Mock to Firestore'}
                </span>
                {isMigrating && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${migrateProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-emerald-500/10 z-0"
                  />
                )}
              </button>

              <button
                onClick={handleSqliteMigrate}
                disabled={isSqliteMigrating}
                className="flex items-center gap-3 w-full p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all text-slate-700 font-medium disabled:opacity-50 relative overflow-hidden"
              >
                <Database size={20} className={`relative z-10 ${isSqliteMigrating ? 'animate-spin' : ''}`} />
                <span className="relative z-10">
                  {isSqliteMigrating ? `Migrating (${sqliteProgress}%)` : 'Migrate SQLite to Firestore'}
                </span>
                {isSqliteMigrating && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${sqliteProgress}%` }}
                    className="absolute inset-y-0 left-0 bg-indigo-500/10 z-0"
                  />
                )}
              </button>

              <button
                onClick={clearFirestoreData}
                className="flex items-center gap-3 w-full p-3 bg-red-50/50 rounded-xl hover:bg-red-50 transition-all text-red-600 font-medium"
              >
                <Trash2 size={20} />
                Clear Firestore
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
