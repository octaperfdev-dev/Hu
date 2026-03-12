import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-8 right-8 z-[100]"
    >
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
        type === 'success' 
          ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
          : 'bg-red-50 border-red-100 text-red-800'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="text-emerald-500" size={20} />
        ) : (
          <XCircle className="text-red-500" size={20} />
        )}
        <span className="font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="ml-2 p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}
