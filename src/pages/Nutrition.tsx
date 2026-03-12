import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy } from '../firebase';
import { Apple, Search, ChevronRight, Info, Scale, Flame, Heart, X, Brain, Sparkles } from 'lucide-react';
import { FOOD_CATEGORIES, FOOD_ITEMS } from '../constants';
import { useAuth } from '../App';
import { analyzeStudentHealth, AIAnalysisResult } from '../services/aiService';

export default function Nutrition() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (user?.role === 'student') {
        setLoadingAI(true);
        try {
          const healthQ = query(
            collection(db, 'health_records'),
            where('userId', '==', user.id),
            orderBy('date', 'desc')
          );
          const activityQ = query(
            collection(db, 'activities'),
            where('userId', '==', user.id),
            orderBy('date', 'desc')
          );

          const [healthSnapshot, activitySnapshot] = await Promise.all([
            getDocs(healthQ),
            getDocs(activityQ)
          ]);

          const history = healthSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const activities = activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const analysis = await analyzeStudentHealth(user, history, activities);
          setAiAnalysis(analysis);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'health_records/activities');
        } finally {
          setLoadingAI(false);
        }
      }
    };
    fetchAIRecommendations();
  }, [user]);

  const filteredFoods = FOOD_ITEMS.filter(food => {
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-10">
      {/* AI Recommendations */}
      {user?.role === 'student' && (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[40px] p-8 md:p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Brain size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Smart Nutrition Advisor</h2>
                <p className="text-blue-100 text-sm">AI-powered personalized food suggestions</p>
              </div>
            </div>

            {loadingAI ? (
              <div className="flex items-center gap-4 py-8">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-blue-100 font-medium">AI is crafting your nutrition plan...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {aiAnalysis.nutritionRecommendations.slice(0, 3).map((rec, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg">{rec.food}</h4>
                      <Sparkles size={16} className="text-amber-300" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-100 uppercase tracking-wider font-bold">Calories</span>
                        <span className="font-bold">{rec.calories} kcal</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-100 uppercase tracking-wider font-bold">Portion</span>
                        <span className="font-bold">{rec.portion}</span>
                      </div>
                      <p className="text-xs text-blue-50 leading-relaxed pt-2 border-t border-white/10">
                        {rec.benefits}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-blue-100">Add more health records to get personalized AI recommendations.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Healthy Food Explorer</h1>
          <p className="text-slate-500">Discover nutritious foods for a better lifestyle</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search foods..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('All')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap",
            selectedCategory === 'All' ? "bg-blue-500 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
          )}
        >
          <span>All</span>
        </button>
        {FOOD_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap",
              selectedCategory === cat.id ? "bg-blue-500 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Food Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredFoods.map((food) => (
          <motion.div 
            key={food.id}
            layoutId={food.id}
            onClick={() => setSelectedFood(food)}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img 
                src={food.image} 
                alt={food.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{food.category}</span>
                <span className="text-xs font-medium text-slate-400">{food.calories}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">{food.name}</h3>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center">
                      <Heart size={10} className="text-blue-500 fill-blue-500" />
                    </div>
                  ))}
                </div>
                <button className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Food Detail Modal */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              layoutId={selectedFood.id}
              className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedFood(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full text-white transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-64 md:h-full">
                  <img 
                    src={selectedFood.image} 
                    alt={selectedFood.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-10 space-y-8">
                  <div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                      {selectedFood.category}
                    </span>
                    <h2 className="text-3xl font-bold text-slate-900">{selectedFood.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Flame size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Calories</span>
                      </div>
                      <p className="font-bold text-slate-900">{selectedFood.calories}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Scale size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Serving</span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{selectedFood.serving}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Info size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Nutritional Value</h4>
                        <p className="text-sm text-slate-500">{selectedFood.nutrition}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Heart size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Health Benefits</h4>
                        <p className="text-sm text-slate-500">{selectedFood.benefits}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedFood(null)}
                    className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
