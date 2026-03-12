import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, onSnapshot } from '../firebase';
import { 
  HelpCircle, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Plus, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../App';
import { Query } from '../types';

export default function Queries() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newQuery, setNewQuery] = useState({ subject: '', message: '' });
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let q;
    if (user.role === 'student') {
      q = query(
        collection(db, 'queries'),
        where('studentId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'queries'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setQueries(data as any);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'queries');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'queries'), {
        ...newQuery,
        studentId: user?.id,
        studentName: (user as any)?.fullName || 'Unknown',
        studentClass: (user as any)?.class || 'N/A',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewQuery({ subject: '', message: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'queries');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery || !replyText.trim()) return;
    try {
      await updateDoc(doc(db, 'queries', selectedQuery.id), {
        reply: replyText,
        status: 'resolved',
        repliedAt: new Date().toISOString()
      });
      setReplyText('');
      setSelectedQuery(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `queries/${selectedQuery.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Queries</h1>
          <p className="text-slate-500">Ask questions and get guidance from school health experts</p>
        </div>
        {user?.role === 'student' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Ask Question
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {queries.map((query) => (
          <motion.div 
            key={query.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-2xl flex-shrink-0",
                  query.status === 'resolved' ? "bg-blue-50 text-blue-500" : "bg-amber-50 text-amber-500"
                )}>
                  {query.status === 'resolved' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900">{query.subject}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      query.status === 'resolved' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {query.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{query.message}</p>
                  {user?.role === 'admin' && (
                    <p className="text-xs text-slate-400 mt-2 font-medium">From: {query.studentName} ({query.studentClass})</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{new Date(query.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedQuery(query)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            {query.reply && (
              <div className="px-6 pb-6 pt-0">
                <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-blue-500">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Admin Reply</p>
                  <p className="text-sm text-slate-600">{query.reply}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {queries.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <HelpCircle size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No health queries found.</p>
          </div>
        )}
      </div>

      {/* Ask Question Modal (Student) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Ask Health Question</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitQuery} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nutrition Advice, Injury Report"
                  required
                  value={newQuery.subject}
                  onChange={(e) => setNewQuery({...newQuery, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Message</label>
                <textarea 
                  placeholder="Explain your concern in detail..."
                  required
                  value={newQuery.message}
                  onChange={(e) => setNewQuery({...newQuery, message: e.target.value})}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all">
                Submit Query
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Reply Modal (Admin) */}
      {selectedQuery && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Reply to Query</h2>
              <button onClick={() => setSelectedQuery(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Question</p>
                <h3 className="font-bold text-slate-900 mb-1">{selectedQuery.subject}</h3>
                <p className="text-sm text-slate-600">{selectedQuery.message}</p>
              </div>
              <form onSubmit={handleReply} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Your Reply</label>
                  <textarea 
                    placeholder="Provide guidance or answer..."
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all">
                  Send Reply
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
