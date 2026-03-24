import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Lock, User, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { auth, db, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, doc, getDoc, setDoc, query, collection, where, getDocs, createUserWithEmailAndPassword, deleteDoc, writeBatch } from '../firebase';
import { useAuth } from '../App';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let loginEmail = username;
      let userData: any = null;
      let userId = '';

      // If it's not an email, look up the systemEmail by username
      if (!username.includes('@')) {
        const normalizedUsername = username.toLowerCase().trim();
        const q = query(collection(db, 'users'), where('username', '==', normalizedUsername));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError('Invalid username or password.');
          setLoading(false);
          return;
        }
        
        const userDoc = snapshot.docs[0];
        userData = userDoc.data();
        loginEmail = userData.systemEmail || `${userData.username}@school.internal`;
        
        if (!loginEmail) {
          setError('Account not properly configured for username login.');
          setLoading(false);
          return;
        }
      }

      // Sign in with Firebase Auth
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, loginEmail, password);
        userId = result.user.uid;
      } catch (err: any) {
        console.error("Firebase Auth Error:", err);
        
        // Lazy Auth: If user not found in Auth, but exists in Firestore with authCreated: false
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // We already have userData if they logged in with username
          // If they logged in with email, we need to find them
          if (!userData) {
            const q = query(collection(db, 'users'), where('email', '==', loginEmail));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              userData = snapshot.docs[0].data();
              userId = snapshot.docs[0].id;
            }
          }

          if (userData && userData.authCreated === false && userData.tempPassword === password) {
            try {
              console.log("Lazy Auth: Creating account for", loginEmail);
              const createResult = await createUserWithEmailAndPassword(auth, loginEmail, password);
              userId = createResult.user.uid;
              
              // Move Firestore data to the new UID and mark as authCreated
              const oldDocRef = doc(db, 'users', userId); // This is wrong, the old doc has a random ID
              // Wait, I need the document ID of the existing Firestore doc
              const q = query(collection(db, 'users'), where('username', '==', userData.username));
              const snapshot = await getDocs(q);
              const existingDocId = snapshot.docs[0].id;
              
              // Update existing document with new UID if necessary, or just update it
              // Actually, it's better to keep the same document ID if possible, but createUser generates a new UID.
              // So we should probably delete the old doc and create a new one with the Auth UID, 
              // or just update the old one and link it.
              // The app uses doc(db, 'users', userId) in many places, so we MUST use the Auth UID.
              
              const { tempPassword, authCreated, ...rest } = userData;
              const batch = writeBatch(db);
              
              // Create new user document with Auth UID
              batch.set(doc(db, 'users', userId), {
                ...rest,
                authCreated: true,
                uid: userId
              });
              
              // Delete the temporary document
              if (existingDocId !== userId) {
                batch.delete(doc(db, 'users', existingDocId));
              }

              // Migrate linked records (health_records, activities, etc.)
              const collectionsToMigrate = ['health_records', 'activities', 'badges', 'organic_reservations', 'breakfast_reservations', 'likes'];
              
              for (const colName of collectionsToMigrate) {
                const qMigrate = query(collection(db, colName), where('userId', '==', existingDocId));
                const snapshotMigrate = await getDocs(qMigrate);
                snapshotMigrate.docs.forEach(recordDoc => {
                  batch.update(recordDoc.ref, { userId: userId });
                });
              }

              await batch.commit();
              
              userData = { ...rest, authCreated: true, uid: userId };
              result = createResult;
            } catch (createErr) {
              console.error("Lazy Auth creation failed:", createErr);
              setError('Account creation failed. Please contact support.');
              setLoading(false);
              return;
            }
          } else {
            setError('Invalid username or password.');
            setLoading(false);
            return;
          }
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many failed login attempts. Please try again later.');
          setLoading(false);
          return;
        } else {
          setError('Failed to sign in. Please check your credentials.');
          setLoading(false);
          return;
        }
      }

      // If we haven't fetched userData yet (because they logged in with email), fetch it now
      if (!userData) {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          // Fallback if user document doesn't exist
          userData = {
            uid: userId,
            email: result.user.email,
            fullName: result.user.displayName || 'User',
            role: 'student',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, userData);
        }
      }
      
      login({ ...userData, id: userId });
      
      if (userData.role === 'student' && userData.passwordChanged === false) navigate('/change-password');
      else if (userData.role === 'teacher') navigate('/teacher/dashboard');
      else if (userData.role === 'coach') navigate('/coach/dashboard');
      else if (userData.role === 'organic-admin') navigate('/organic-admin-dashboard');
      else if (userData.role === 'breakfast-admin') navigate('/breakfast-admin-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      let userData;
      if (!userDoc.exists()) {
        // Create new user document
        userData = {
          uid: result.user.uid,
          email: result.user.email,
          fullName: result.user.displayName || 'User',
          role: 'student', // Default role
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, userData);
      } else {
        userData = userDoc.data();
      }

      login({ ...userData, id: result.user.uid });
      
      // Navigate based on role
      if (userData.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (userData.role === 'coach') {
        navigate('/coach/dashboard');
      } else if (userData.role === 'organic-admin') {
        navigate('/organic-admin-dashboard');
      } else if (userData.role === 'breakfast-admin') {
        navigate('/breakfast-admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative">
      <Link 
        to="/" 
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Home
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mx-auto mb-6"
          >
            <Heart className="text-white" size={32} />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Health Guard</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Jaffna Hindu College</p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Welcome Back</h2>
          
          <form onSubmit={handleUsernameLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Username or Email" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600">Sign In</button>
          </form>

          <div className="my-6 text-center text-slate-400 text-sm">OR</div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
