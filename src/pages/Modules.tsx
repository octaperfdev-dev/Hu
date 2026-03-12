import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, orderBy, getDocs, addDoc, deleteDoc, doc } from '../firebase';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  BookOpen, 
  Layout, 
  Image as ImageIcon,
  Type,
  AlignLeft,
  Link as LinkIcon,
  Tag
} from 'lucide-react';
import { useAuth } from '../App';
import { Module } from '../types';

export default function Modules() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    category: 'Education'
  });

  const fetchModules = async () => {
    try {
      const q = query(collection(db, 'modules'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(data as any);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'modules'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setFormData({ title: '', description: '', imageUrl: '', link: '', category: 'Education' });
      fetchModules();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'modules');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    try {
      await deleteDoc(doc(db, 'modules', id));
      fetchModules();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `modules/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Modules</h1>
          <p className="text-slate-500">Manage educational content for the home page</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Create Module
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6">New Module Details</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Module Title</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Exercise Tutorials"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  <option value="Education">Education</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Wellness">Wellness</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
              <div className="relative">
                <AlignLeft className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  required
                  rows={3}
                  placeholder="Briefly describe what this module covers..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="url" 
                  placeholder="https://picsum.photos/..."
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">External Link (Optional)</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="url" 
                  placeholder="https://youtube.com/..."
                  value={formData.link}
                  onChange={e => setFormData({...formData, link: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Create Module
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((module) => (
          <motion.div 
            layout
            key={module.id}
            className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm group"
          >
            <div className="h-48 overflow-hidden relative">
              <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                {module.category}
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-slate-900 mb-2">{module.title}</h4>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed line-clamp-2">{module.description}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => module.link && window.open(module.link, '_blank')}
                  className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  View
                </button>
                <button 
                  onClick={() => handleDelete(module.id)}
                  className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && modules.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No modules yet</h3>
          <p className="text-slate-500">Create your first learning module to display on the home page.</p>
        </div>
      )}
    </div>
  );
}
