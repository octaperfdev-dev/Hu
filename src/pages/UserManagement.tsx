import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, doc, setDoc, deleteDoc, onSnapshot, updateDoc, initializeApp, deleteApp, getAuth, createUserWithEmailAndPassword, firebaseConfig } from '../firebase';
import { Search, Plus, Trash2, FileDown, FileUp, X, UserPlus, Edit2 } from 'lucide-react';
import { useAuth } from '../App';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { User } from '../types';
import Toast from '../components/Toast';

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    role: 'student'
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data as any);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tempApp = initializeApp(firebaseConfig, 'temp-create-user-' + Date.now());
      const tempAuth = getAuth(tempApp);
      
      const normalizedUsername = formData.username.toLowerCase().trim();
      const systemEmail = `${normalizedUsername}@school.internal`;
      const userCredential = await createUserWithEmailAndPassword(tempAuth, systemEmail, formData.password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        username: normalizedUsername,
        systemEmail: systemEmail,
        fullName: formData.fullName,
        role: formData.role,
        passwordChanged: false,
        profileCompleted: false,
        createdAt: new Date().toISOString()
      });
      
      await deleteApp(tempApp);
      
      setIsModalOpen(false);
      setFormData({ email: '', username: '', password: '', fullName: '', role: 'student' });
      setToast({ message: 'User created successfully', type: 'success' });
    } catch (err: any) {
      console.error("Error creating user:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes('auth/email-already-in-use')) {
        setToast({ message: 'Username or email is already taken.', type: 'error' });
      } else if (errorMessage.includes('auth/weak-password')) {
        setToast({ message: 'Password should be at least 6 characters.', type: 'error' });
      } else {
        setToast({ message: 'Error creating user. Please try again.', type: 'error' });
      }
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        fullName: editingUser.fullName,
        role: editingUser.role
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
      setToast({ message: 'User updated successfully', type: 'success' });
    } catch (err) {
      setToast({ message: 'Error updating user', type: 'error' });
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setToast({ message: 'User deleted successfully', type: 'success' });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setToast({ message: `Error deleting user: ${errorMessage}`, type: 'error' });
        handleFirestoreError(err, OperationType.DELETE, 'users');
      }
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users.csv';
    link.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      
      const processUsers = async (usersToImport: any[]) => {
        for (const row of usersToImport) {
          if (row.username && row.fullName && row.password) {
            try {
              const tempApp = initializeApp(firebaseConfig, 'temp-import-user-' + Date.now());
              const tempAuth = getAuth(tempApp);
              
              const normalizedUsername = row.username.toLowerCase().trim();
              const systemEmail = `${normalizedUsername}@school.internal`;
              const userCredential = await createUserWithEmailAndPassword(tempAuth, systemEmail, row.password);
              
              await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: row.email || '',
                username: normalizedUsername,
                systemEmail: systemEmail,
                fullName: row.fullName,
                role: row.role || 'student',
                passwordChanged: false,
                profileCompleted: false,
                createdAt: new Date().toISOString()
              });
              
              await deleteApp(tempApp);
            } catch (err) {
              console.error('Error importing user:', err);
            }
          }
        }
        setToast({ message: 'Import completed', type: 'success' });
      };

      if (file.name.endsWith('.csv')) {
        Papa.parse(data as string, {
          header: true,
          complete: (results) => { processUsers(results.data); }
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        processUsers(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]));
      }
    };
    
    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl"
            />
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50">
            <FileDown size={18} /> Export CSV
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer">
            <FileUp size={18} /> Import File
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleImportFile} className="hidden" />
          </label>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 font-bold">{u.fullName}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4 capitalize">{u.role}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => { setEditingUser(u); setIsEditModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Add New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input type="text" placeholder="Full Name" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="text" placeholder="Username" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="email" placeholder="Email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
                <option value="organic-admin">Organic Admin</option>
                <option value="breakfast-admin">Breakfast Admin</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">Add User</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <input type="text" placeholder="Full Name" required value={editingUser.fullName} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
                <option value="organic-admin">Organic Admin</option>
                <option value="breakfast-admin">Breakfast Admin</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="px-6 py-2.5 text-slate-600 font-bold">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
