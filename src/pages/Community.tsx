import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, orderBy, getDocs, addDoc, doc, updateDoc, increment, deleteDoc, where, onSnapshot } from '../firebase';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Send,
  X,
  Smile
} from 'lucide-react';
import { useAuth } from '../App';
import { Post, Comment } from '../types';

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ content: '', imageUrl: '', videoUrl: '' });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    // Real-time posts listener
    const postsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(postsQuery, async (snapshot) => {
      try {
        // Fetch likes for current user to mark posts as liked
        const likesSnapshot = await getDocs(query(collection(db, 'likes'), where('userId', '==', user.id)));
        const likedPostIds = new Set(likesSnapshot.docs.map(doc => doc.data().postId));

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isLiked: likedPostIds.has(doc.id)
        }));
        
        setPosts(data as any);
      } catch (err) {
        console.error("Error in posts snapshot:", err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'announcements');
      setLoading(false);
    });

    return () => unsubscribePosts();
  }, [user]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newPost,
        authorId: user?.id,
        authorName: (user as any)?.fullName || 'Unknown',
        authorPhoto: (user as any)?.photoUrl || '',
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewPost({ content: '', imageUrl: '', videoUrl: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const likeQuery = query(collection(db, 'likes'), where('postId', '==', postId), where('userId', '==', user?.id));
      const likeSnapshot = await getDocs(likeQuery);

      const postRef = doc(db, 'announcements', postId);

      if (likeSnapshot.empty) {
        // Add like
        await addDoc(collection(db, 'likes'), {
          postId,
          userId: user?.id,
          createdAt: new Date().toISOString()
        });
        await updateDoc(postRef, { likesCount: increment(1) });
      } else {
        // Remove like
        const likeDocId = likeSnapshot.docs[0].id;
        await deleteDoc(doc(db, 'likes', likeDocId));
        await updateDoc(postRef, { likesCount: increment(-1) });
      }

      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
          };
        }
        return p;
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `announcements/${postId}`);
    }
  };

  const fetchComments = (postId: string) => {
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(data as any);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'comments');
    });
  };

  useEffect(() => {
    let unsubscribe: () => void;
    if (selectedPost) {
      unsubscribe = fetchComments(selectedPost.id);
    }
    return () => unsubscribe?.();
  }, [selectedPost]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim()) return;
    try {
      await addDoc(collection(db, 'comments'), {
        postId: selectedPost.id,
        authorId: user?.id,
        authorName: (user as any)?.fullName || 'Unknown',
        authorPhoto: (user as any)?.photoUrl || '',
        content: newComment,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'announcements', selectedPost.id), {
        commentsCount: increment(1)
      });

      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Feed</h1>
          <p className="text-slate-500">Share your health journey with others</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Posts List */}
      <div className="space-y-6 pb-20">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                  <img src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{post.authorName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-6 pb-4">
              <p className="text-slate-700 leading-relaxed">{post.content}</p>
            </div>

            {post.imageUrl && (
              <div className="aspect-video bg-slate-100">
                <img src={post.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            {/* Post Actions */}
            <div className="p-6 flex items-center gap-6 border-t border-slate-50">
              <button 
                onClick={() => handleLike(post.id)}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold transition-all",
                  post.isLiked ? "text-red-500" : "text-slate-500 hover:text-red-500"
                )}
              >
                <Heart size={20} className={post.isLiked ? "fill-red-500" : ""} />
                {post.likesCount}
              </button>
              <button 
                onClick={() => { setSelectedPost(post); fetchComments(post.id); }}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-500 transition-all"
              >
                <MessageCircle size={20} />
                {post.commentsCount}
              </button>
              <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-500 transition-all">
                <Share2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Post Modal (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Create Announcement</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="p-8 space-y-6">
              <textarea 
                placeholder="What's on your mind?"
                required
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
              <div className="space-y-4">
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Image URL (optional)"
                    value={newPost.imageUrl}
                    onChange={(e) => setNewPost({...newPost, imageUrl: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all">
                Post Announcement
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Comments Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Comments</h2>
              <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    <img src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-slate-900">{comment.authorName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-slate-600">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-10 text-slate-400">No comments yet. Be the first!</div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button type="submit" className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
