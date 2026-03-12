export const FOOD_CATEGORIES = [
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥦' },
  { id: 'protein', name: 'Protein', icon: '🍗' },
  { id: 'dairy', name: 'Dairy', icon: '🥛' },
  { id: 'snacks', name: 'Healthy Snacks', icon: '🥜' },
];

export const FOOD_ITEMS = [
  {
    id: 'apple',
    category: 'fruits',
    name: 'Apple',
    calories: '52 kcal',
    nutrition: 'Fiber, Vitamin C, Potassium',
    benefits: 'Good for heart health and weight loss.',
    serving: '1 medium apple (182g)',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6bcd6?w=400&h=300&fit=crop'
  },
  {
    id: 'banana',
    category: 'fruits',
    name: 'Banana',
    calories: '89 kcal',
    nutrition: 'Potassium, Vitamin B6, Vitamin C',
    benefits: 'Provides quick energy and supports digestion.',
    serving: '1 medium banana (118g)',
    image: 'https://images.unsplash.com/photo-1571771894821-ad9902d73647?w=400&h=300&fit=crop'
  },
  {
    id: 'spinach',
    category: 'vegetables',
    name: 'Spinach',
    calories: '23 kcal',
    nutrition: 'Iron, Vitamin K, Vitamin A',
    benefits: 'Strengthens bones and improves eye health.',
    serving: '1 cup raw (30g)',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop'
  },
  {
    id: 'eggs',
    category: 'protein',
    name: 'Eggs',
    calories: '155 kcal',
    nutrition: 'Protein, Vitamin D, Choline',
    benefits: 'Excellent source of high-quality protein.',
    serving: '2 large eggs (100g)',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop'
  },
  {
    id: 'milk',
    category: 'dairy',
    name: 'Milk',
    calories: '42 kcal',
    nutrition: 'Calcium, Vitamin D, Protein',
    benefits: 'Essential for strong bones and teeth.',
    serving: '1 glass (240ml)',
    image: 'https://images.unsplash.com/photo-1563636619-e9107da5a1bb?w=400&h=300&fit=crop'
  }
];

export const EXERCISES = [
  {
    id: 'stretching',
    title: 'Morning Stretching',
    description: 'A quick 5-minute routine to wake up your body.',
    benefits: 'Improves flexibility and blood flow.',
    difficulty: 'Beginner',
    ageGroup: 'All Ages',
    videoUrl: 'https://www.youtube.com/embed/g_tea8ZNk5A',
    points: 10
  },
  {
    id: 'posture',
    title: 'Posture Correction',
    description: 'Exercises to fix rounded shoulders and forward head.',
    benefits: 'Reduces back pain and improves confidence.',
    difficulty: 'Intermediate',
    ageGroup: '10+ years',
    videoUrl: 'https://www.youtube.com/embed/RQCMe6u6f-8',
    points: 15
  },
  {
    id: 'hiit',
    title: 'School Fitness Workout',
    description: 'High-intensity interval training for students.',
    benefits: 'Boosts metabolism and cardiovascular health.',
    difficulty: 'Advanced',
    ageGroup: '12+ years',
    videoUrl: 'https://www.youtube.com/embed/ml6cT4AZdqI',
    points: 25
  }
];

export const SPORTS_TYPES = [
  'Cricket', 'Football', 'Athletics', 'Swimming', 'Basketball', 'Volleyball', 'Yoga', 'Running'
];

export const SCORING_RULES = {
  exercise: 10,
  sport: 20,
  quiz: 15,
  habit: 5
};
