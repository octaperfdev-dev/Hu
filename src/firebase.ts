import { initializeApp, deleteApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updatePassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let auth: any;
let db: any;
let storage: any;

try {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API Key is missing. Check your environment variables.");
  }
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export {
  auth,
  db,
  storage,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment,
  ref,
  uploadBytes,
  getDownloadURL,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  initializeApp,
  deleteApp,
  getAuth,
  firebaseConfig
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error during ${operationType} at ${path}:`, error);
}

export async function seedDatabase(onProgress?: (progress: number) => void) {
  console.log('Starting database seeding...');
  
  if (!db) {
    throw new Error('Firestore is not initialized. Please check your Firebase configuration.');
  }

  const { mockDb } = await import('./lib/mockDb');
  const collections = [
    'users', 
    'health_records', 
    'activities', 
    'queries', 
    'announcements', 
    'organic_reservations', 
    'breakfast_reservations', 
    'modules',
    'breakfast_items',
    'vegetables',
    'classrooms',
    'sports',
    'attendance',
    'badges',
    'likes',
    'comments'
  ];
  
  let totalItems = 0;
  for (const colName of collections) {
    const items = mockDb.getCollection(colName as any);
    console.log(`Collection ${colName} has ${items.length} items`);
    totalItems += items.length;
  }

  console.log(`Total items to seed: ${totalItems}`);

  if (totalItems === 0) {
    console.log('No items to seed.');
    onProgress?.(100);
    return;
  }

  let processedItems = 0;
  for (const colName of collections) {
    const data = mockDb.getCollection(colName as any);
    for (const item of data) {
      try {
        const { id, ...rest } = item;
        if (!id) {
          console.warn(`Skipping item in ${colName} because it has no id`, item);
          continue;
        }
        await setDoc(doc(db, colName, id), rest);
        processedItems++;
        onProgress?.(Math.round((processedItems / totalItems) * 100));
      } catch (err) {
        console.error(`Error seeding item in ${colName}:`, err);
        throw err; // Re-throw to be caught by the UI
      }
    }
  }
  console.log('Seeding complete!');
}
