export type UserRole = 'admin' | 'student' | 'teacher' | 'coach' | 'organic-admin' | 'breakfast-admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  passwordChanged?: boolean;
  profileCompleted?: boolean;
  indexNumber?: string;
  dob?: string;
  gender?: string;
  class?: string;
  division?: string;
  address?: string;
  parentName?: string;
  parentContact?: string;
  photoUrl?: string;
  points: number;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  height: number;
  weight: number;
  bmi: number;
  hip?: number;
  waist?: number;
  gripStrength?: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'sport' | 'habit' | 'exercise' | 'quiz';
  name: string;
  date: string;
  duration?: string;
  performance?: string;
  remarks?: string;
  points: number;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface Query {
  id: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'pending' | 'resolved';
  createdAt: string;
  repliedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  category: string;
  createdAt: string;
}

export interface FoodMenuItem {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface FoodPurchase {
  id: string;
  userId: string;
  date: string;
  pointsAwarded: number;
  createdAt: string;
}

export interface StudentFaceData {
  id: string;
  userId: string;
  imageUrls: string[];
  createdAt: string;
}
