import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, addDoc, orderBy } from '../firebase';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../App';

export default function TeacherAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const q = query(
        collection(db, 'announcements'), 
        where('authorId', '==', user?.id),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'announcements'), {
        ...formData,
        authorId: user?.id,
        authorName: user?.fullName,
        authorRole: user?.role,
        class: user?.class || 'All',
        createdAt: new Date().toISOString()
      });
      
      setShowAddModal(false);
      setFormData({ title: '', content: '' });
      fetchAnnouncements();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'announcements');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Class Announcements</h1>
          <p className="text-slate-500 mt-1">Post updates and health tips for {user?.class}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      <div className="space-y-6">
        {announcements.map((announcement: any) => (
          <motion.div 
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-900">{announcement.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={16} />
                {new Date(announcement.createdAt).toLocaleDateString()}
              </div>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{announcement.content}</p>
          </motion.div>
        ))}
        {announcements.length === 0 && !loading && (
          <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Announcements Yet</h3>
            <p className="text-slate-500">Post your first announcement to share with the class.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">New Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Upcoming Health Checkup"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32"
                  placeholder="Write your message here..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Post
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
