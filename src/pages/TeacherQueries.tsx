import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, updateDoc, doc, orderBy } from '../firebase';
import { HelpCircle, CheckCircle, Clock, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../App';

export default function TeacherQueries() {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchQueries();
    }
  }, [user]);

  const fetchQueries = async () => {
    try {
      // Assuming queries are linked to the teacher's class or all queries for now
      // Here we fetch all queries for simplicity, but in a real app you'd filter by class
      const q = query(
        collection(db, 'queries'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQueries(data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'queries');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim() || !user) return;
    try {
      const queryRef = doc(db, 'queries', id);
      await updateDoc(queryRef, {
        reply: replyText,
        status: 'resolved',
        repliedBy: user.id,
        repliedAt: new Date().toISOString()
      });
      
      setReplyText('');
      setActiveQuery(null);
      fetchQueries();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'queries');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Student Queries</h1>
        <p className="text-slate-500 mt-1">Answer health-related questions from your students</p>
      </div>

      <div className="space-y-6">
        {queries.map((query: any) => (
          <motion.div 
            key={query.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{query.subject}</h3>
                <p className="text-sm text-slate-500">From: {query.studentName} • {new Date(query.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                query.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {query.status === 'resolved' ? <CheckCircle size={14} /> : <Clock size={14} />}
                {query.status === 'resolved' ? 'Resolved' : 'Pending'}
              </span>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-4 text-slate-700">
              {query.message}
            </div>

            {query.status === 'resolved' ? (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-1">Your Reply:</p>
                <p className="text-blue-800">{query.reply}</p>
              </div>
            ) : (
              activeQuery === query.id ? (
                <div className="mt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setActiveQuery(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleReply(query.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Send size={16} />
                      Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setActiveQuery(query.id)}
                  className="text-blue-500 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                >
                  <MessageSquare size={16} />
                  Reply to Student
                </button>
              )
            )}
          </motion.div>
        ))}
        {queries.length === 0 && !loading && (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
            <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Queries</h3>
            <p className="text-slate-500">Your students haven't asked any questions yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
