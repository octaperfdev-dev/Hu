import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Github, X, User, Database, Loader2, CheckCircle2 } from 'lucide-react';
import { seedDatabase } from '../firebase';

export default function DeveloperMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedSuccess, setSeedSuccess] = useState(false);
  
  const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY || true; // Always true for now as we use config file
  
  const handleSeed = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    setSeedProgress(0);
    setSeedSuccess(false);
    try {
      await seedDatabase((progress) => setSeedProgress(progress));
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (error) {
      console.error("Seeding failed:", error);
      alert("Seeding failed. Check console for details.");
    } finally {
      setIsSeeding(false);
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
                <div className={`w-2 h-2 rounded-full bg-emerald-500`} />
              </div>
              <p className="text-[10px] text-slate-400">
                Firebase is configured via applet config.
              </p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="flex items-center gap-3 w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium disabled:opacity-50"
              >
                {isSeeding ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : seedSuccess ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Database size={20} />
                )}
                {isSeeding ? `Seeding ${seedProgress}%` : seedSuccess ? 'Seeded Successfully!' : 'Seed Database'}
              </button>

              <a 
                href="https://github.com/Ramesh-Karu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all text-slate-700 font-medium"
              >
                <Github size={20} />
                GitHub Profile
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
