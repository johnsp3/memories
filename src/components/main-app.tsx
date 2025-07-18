'use client';

// Main application component with landing page and blog functionality
import { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { BlogPost } from '@/types/blog';
import { PostList } from '@/components/blog/post-list';
import { PostForm } from '@/components/blog/post-form';
import { SectionErrorBoundary } from '@/components/error-boundary';
import { 
  LogOut, 
  Plus, 
  Search, 
  Home, 
  BookOpen, 
  User
} from 'lucide-react';

export function MainApp() {
  const { user } = useAuthStore();
  const [currentView, setCurrentView] = useState<'home' | 'blog' | 'settings'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSignOut = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setIsFormOpen(true);
  };

  const handleExplorePosts = () => {
    setCurrentView('blog');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleSavePost = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Memories</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setCurrentView('home')}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200",
                  currentView === 'home'
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Home size={20} />
                <span>Home</span>
              </button>
              
              <button
                onClick={() => setCurrentView('blog')}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200",
                  currentView === 'blog'
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <BookOpen size={20} />
                <span>Blog</span>
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.displayName || 'User'}</p>
                  <p className="text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-xl",
                  "text-gray-600 hover:text-red-600 hover:bg-red-50",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">
                  {isLoading ? 'Signing out...' : 'Sign out'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && (
          <HomeView 
            onCreatePost={handleCreatePost} 
            onExplorePosts={handleExplorePosts} 
          />
        )}
        {currentView === 'blog' && (
          <BlogView 
            onEditPost={handleEditPost}
            onCreatePost={handleCreatePost}
            refreshKey={refreshKey}
          />
        )}
        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Post Form Modal */}
      <SectionErrorBoundary 
        title="Form Error"
        message="Unable to load the post form. Please try again."
      >
        <PostForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSavePost}
          existingPost={editingPost}
        />
      </SectionErrorBoundary>
    </div>
  );
}

// Home/Landing Page View
function HomeView({ onCreatePost, onExplorePosts }: { onCreatePost: () => void; onExplorePosts: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-12"
    >
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          Welcome to Memories
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Your personal sanctuary for capturing life&apos;s precious moments. 
          Share your stories with beautiful blog posts, high-quality photos, and stunning 4K/8K videos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button 
            onClick={onCreatePost}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Plus className="inline mr-2" size={20} />
            Create New Post
          </button>
          
          <button 
            onClick={onExplorePosts}
            className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Search className="inline mr-2" size={20} />
            Explore Posts
          </button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon="📝"
          title="Rich Blog Posts"
          description="Create beautiful blog posts with rich text formatting, tags, and advanced search capabilities."
        />
        
        <FeatureCard
          icon="🎥"
          title="4K/8K Video Support"
          description="Upload and share stunning high-resolution videos up to 8K quality with optimized streaming."
        />
        
        <FeatureCard
          icon="📸"
          title="High-Quality Photos"
          description="Showcase your photography with full-resolution image support and elegant galleries."
        />
        
        <FeatureCard
          icon="💬"
          title="Comments & Ratings"
          description="Engage with your content through comments and rating systems for better interaction."
        />
        
        <FeatureCard
          icon="🔍"
          title="Advanced Search"
          description="Find any content instantly with powerful search that looks through all your posts and media."
        />
        
        <FeatureCard
          icon="🔒"
          title="Secure & Private"
          description="Built with security-first approach using Firebase and modern authentication."
        />
      </section>
    </motion.div>
  );
}

// Blog View with full functionality
function BlogView({ onEditPost, onCreatePost, refreshKey }: { onEditPost: (post: BlogPost) => void; onCreatePost: () => void; refreshKey: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SectionErrorBoundary 
        title="Posts Error"
        message="Unable to load blog posts. Please refresh the page."
      >
        <PostList
          onEditPost={onEditPost}
          onCreatePost={onCreatePost}
          refreshKey={refreshKey}
        />
      </SectionErrorBoundary>
    </motion.div>
  );
}

// Settings View (placeholder for now)
function SettingsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-20"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Settings</h2>
      <p className="text-gray-600">Settings panel will be available soon.</p>
    </motion.div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
} 