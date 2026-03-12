
import { User } from '../types';

// Mock Database using localStorage
const STORAGE_KEY = 'health_guard_db';

interface DbSchema {
  users: User[];
  health_records: any[];
  activities: any[];
  queries: any[];
  announcements: any[];
  organic_reservations: any[];
  breakfast_reservations: any[];
  modules: any[];
  breakfast_items: any[];
  vegetables: any[];
  classrooms: any[];
  sports: any[];
  attendance: any[];
  badges: any[];
  likes: any[];
  comments: any[];
}

const initialData: DbSchema = {
  users: [
    {
      id: 'admin-1',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'admin',
      email: 'admin@jaffnahindu.com',
      photoUrl: 'https://picsum.photos/seed/admin/400/400',
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
    },
    {
      id: 'coach-1',
      username: 'coach',
      fullName: 'Mr. V. Perera',
      role: 'coach',
      email: 'coach@jaffnahindu.com',
      points: 0,
      createdAt: new Date().toISOString()
    }
  ],
  health_records: [
    {
      id: 'hr-1',
      userId: 'student-1',
      height: 165,
      weight: 55,
      bmi: 20.2,
      category: 'Normal',
      date: '2024-03-01',
      createdAt: new Date().toISOString()
    },
    {
      id: 'hr-2',
      userId: 'student-1',
      height: 165,
      weight: 58,
      bmi: 21.3,
      category: 'Normal',
      date: '2024-03-10',
      createdAt: new Date().toISOString()
    }
  ],
  activities: [
    {
      id: 'act-1',
      userId: 'student-1',
      type: 'sport',
      name: 'Cricket Practice',
      date: '2024-03-11',
      duration: '2 hours',
      points: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: 'act-2',
      userId: 'student-1',
      type: 'habit',
      name: 'Drank 2L Water',
      date: '2024-03-12',
      points: 20,
      createdAt: new Date().toISOString()
    }
  ],
  queries: [
    {
      id: 'q-1',
      studentId: 'student-1',
      studentName: 'K. Rathnam',
      studentClass: '10-A',
      subject: 'Nutrition Advice',
      message: 'What should I eat before my cricket match?',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Annual Sports Meet 2024',
      content: 'The annual sports meet will be held on the 25th of March. All students are encouraged to participate.',
      authorId: 'admin-1',
      date: '2024-03-10',
      createdAt: new Date().toISOString()
    }
  ],
  organic_reservations: [],
  breakfast_reservations: [],
  modules: [
    {
      id: 'mod-1',
      title: 'Exercise Tutorials',
      description: 'Step-by-step guides for daily student workouts.',
      imageUrl: 'https://picsum.photos/seed/fitness/400/300',
      category: 'Fitness',
      link: '/modules/fitness',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mod-2',
      title: 'Healthy Food Guide',
      description: 'Learn about balanced diets and nutrition.',
      imageUrl: 'https://picsum.photos/seed/food/400/300',
      category: 'Nutrition',
      link: '/modules/nutrition',
      createdAt: new Date().toISOString()
    }
  ],
  breakfast_items: [
    {
      id: 'bf-1',
      name: 'Healthy Breakfast Pack',
      description: 'Includes oats, fruits, and nuts.',
      price: 250,
      stock: 50,
      imageUrl: 'https://picsum.photos/seed/breakfast/400/400',
      createdAt: new Date().toISOString()
    }
  ],
  vegetables: [
    {
      id: 'veg-1',
      name: 'Organic Carrots',
      description: 'Freshly harvested from the school garden.',
      price: 150,
      stock: 20,
      imageUrl: 'https://picsum.photos/seed/carrot/400/400',
      createdAt: new Date().toISOString()
    }
  ],
  classrooms: [
    { id: 'c-1', name: '10-A', teacherId: 'teacher-1' }
  ],
  sports: [
    { id: 's-1', name: 'Cricket' },
    { id: 's-2', name: 'Football' }
  ],
  attendance: [],
  badges: [],
  likes: [],
  comments: []
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
