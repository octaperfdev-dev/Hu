
import { User } from '../types';

// Mock Database using localStorage
const STORAGE_KEY = 'health_guard_db';

interface DbSchema {
  users: User[];
  healthRecords: any[];
  activities: any[];
  queries: any[];
  announcements: any[];
  reservations: any[];
  breakfastReservations: any[];
  marketplaceItems: any[];
}

const initialData: DbSchema = {
  users: [
    {
      id: 'admin-1',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'admin',
      email: 'admin@jaffnahindu.com',
      photoUrl: 'https://image2url.com/r2/default/images/1773243015309-8d00926d-bd9c-4a4d-931d-e00cbf039414.jpg',
      points: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'teacher-1',
      username: 'teacher',
      fullName: 'Mr. S. Kumar',
      role: 'teacher',
      email: 'kumar@jaffnahindu.com',
      class: '10-A',
      points: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'student-1',
      username: 'student',
      fullName: 'K. Rathnam',
      role: 'student',
      email: 'rathnam@jaffnahindu.com',
      class: '10-A',
      points: 150,
      createdAt: new Date().toISOString()
    }
  ],
  healthRecords: [],
  activities: [],
  queries: [],
  announcements: [],
  reservations: [],
  breakfastReservations: [],
  marketplaceItems: []
};

class MockDb {
  private data: DbSchema;

  constructor() {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = initialData;
        this.save();
      }
    } catch (e) {
      console.error("Failed to initialize MockDb from localStorage:", e);
      this.data = initialData;
    }
  }

  private save() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.error("Failed to save MockDb to localStorage:", e);
    }
  }

  getCollection(name: keyof DbSchema) {
    return this.data[name] || [];
  }

  getDocument(collection: keyof DbSchema, id: string) {
    return this.data[collection].find((item: any) => item.id === id || item.uid === id);
  }

  addDocument(collection: keyof DbSchema, doc: any) {
    const newDoc = { ...doc, id: doc.id || Math.random().toString(36).substr(2, 9) };
    this.data[collection].push(newDoc);
    this.save();
    return newDoc;
  }

  updateDocument(collection: keyof DbSchema, id: string, updates: any) {
    const index = this.data[collection].findIndex((item: any) => item.id === id || item.uid === id);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  }

  deleteDocument(collection: keyof DbSchema, id: string) {
    this.data[collection] = this.data[collection].filter((item: any) => item.id !== id && item.uid !== id);
    this.save();
  }
}

export const mockDb = new MockDb();

// Mock Auth
class MockAuth {
  private currentUser: any = null;
  private listeners: ((user: any) => void)[] = [];

  constructor() {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to initialize MockAuth from localStorage:", e);
    }
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async signIn(username: string) {
    const user = mockDb.getCollection('users').find((u: any) => u.username === username);
    if (user) {
      this.currentUser = { ...user, uid: user.id };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
        }
      } catch (e) {
        console.error("Failed to save auth_user to localStorage:", e);
      }
      this.notify();
      return this.currentUser;
    }
    throw new Error('User not found');
  }

  async signOut() {
    this.currentUser = null;
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
      }
    } catch (e) {
      console.error("Failed to remove auth_user from localStorage:", e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  get authUser() {
    return this.currentUser;
  }
}

export const mockAuth = new MockAuth();
