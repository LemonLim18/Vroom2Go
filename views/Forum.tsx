import React, { useState, useMemo } from 'react';
import { MOCK_POSTS, MOCK_SHOPS } from '../constants';
import { ForumPost, UserRole, Comment, Shop } from '../types';
import { 
  MessageSquare, 
  ThumbsUp, 
  Tag, 
  Bot, 
  Send, 
  ShieldCheck, 
  User as UserIcon, 
  ChevronDown, 
  ChevronUp,
  Flame,
  Clock,
  TrendingUp,
  Car,
  Filter,
  Search,
  ArrowRight,
  Star,
  Sparkles
} from 'lucide-react';
import { generateMechanicAdvice } from '../services/geminiService';

interface ForumProps {
  currentRole: UserRole;
  onShopSelect: (shop: Shop) => void;
}

type SortType = 'hot' | 'new' | 'top';

export const Forum: React.FC<ForumProps> = ({ currentRole, onShopSelect }) => {
  const [posts, setPosts] = useState<ForumPost[]>(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('hot');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Trending topics extracted from posts
  const trendingTopics = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1 + post.likes;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [posts]);

  // Filtered and sorted posts
  const displayedPosts = useMemo(() => {
    let filtered = posts;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(p => p.tags.includes(selectedTag));
    }
    
    switch (sortBy) {
      case 'hot':
        return [...filtered].sort((a, b) => 
          (b.likes + b.comments.length * 2) - (a.likes + a.comments.length * 2)
        );
      case 'new':
        return [...filtered].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case 'top':
        return [...filtered].sort((a, b) => b.likes - a.likes);
      default:
        return filtered;
    }
  }, [posts, searchTerm, sortBy, selectedTag]);

  // Posts with shop responses (highlighted)
  const shopAnsweredPosts = posts.filter(p => 
    p.comments.some(c => c.role === UserRole.SHOP)
  );

  const handleAskAi = async () => {
    if (!newPostContent.trim()) return;
    setIsAskingAi(true);
    setAiResponse(null);
    const response = await generateMechanicAdvice(newPostContent);
    setAiResponse(response);
    setIsAskingAi(false);
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim() || !newPostTitle.trim()) return;
    
    const newPost: ForumPost = {
      id: `p${Date.now()}`,
      author: currentRole === UserRole.SHOP ? 'My Shop (You)' : 'Me',
      authorRole: currentRole,
      title: newPostTitle,
      content: newPostContent,
      likes: 0,
      comments: [],
      tags: ['New'],
      createdAt: new Date().toISOString(),
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostTitle('');
    setAiResponse(null);
  };

  const toggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setNewCommentContent('');
    }
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
  };

  const handlePostComment = (postId: string) => {
    if (!newCommentContent.trim()) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: currentRole === UserRole.SHOP ? 'My Verified Shop' : 'Me',
      role: currentRole,
      content: newCommentContent,
      date: 'Just now'
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });

    setPosts(updatedPosts);
    setNewCommentContent('');
  };

  const handleShopLinkClick = (shopId: string) => {
    const shop = MOCK_SHOPS.find(s => s.id === shopId);
    if (shop) {
      onShopSelect(shop);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            Community <span className="text-primary">Forum</span>
          </h1>
          <p className="text-slate-400">Ask questions, share knowledge, connect with shops</p>
        </div>
        {currentRole === UserRole.SHOP && (
          <div className="badge badge-primary gap-1 py-3 px-4">
            <ShieldCheck className="w-4 h-4" /> Verified Shop Account
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="join flex-1 min-w-[200px]">
              <div className="flex items-center px-3 bg-slate-800 rounded-l-xl">
                <Search className="w-4 h-4 text-slate-500" />
              </div>
              <input 
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm flex-1 bg-slate-800 rounded-r-xl border-0 focus:outline-none"
              />
            </div>
            <div className="btn-group">
              <button 
                className={`btn btn-sm ${sortBy === 'hot' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSortBy('hot')}
              >
                <Flame className="w-4 h-4" /> Hot
              </button>
              <button 
                className={`btn btn-sm ${sortBy === 'new' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSortBy('new')}
              >
                <Clock className="w-4 h-4" /> New
              </button>
              <button 
                className={`btn btn-sm ${sortBy === 'top' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSortBy('top')}
              >
                <TrendingUp className="w-4 h-4" /> Top
              </button>
            </div>
          </div>

          {/* Active Tag Filter */}
          {selectedTag && (
            <div className="alert bg-slate-800/50">
              <Filter className="w-4 h-4" />
              <span>Filtered by: <strong>#{selectedTag}</strong></span>
              <button className="btn btn-xs btn-ghost" onClick={() => setSelectedTag(null)}>
                Clear
              </button>
            </div>
          )}

          {/* Create Post / AI Ask Widget */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-sm uppercase text-slate-400 mb-4">
              {currentRole === UserRole.SHOP ? 'Share Advice or Respond to Questions' : 'Ask the Community or AI'}
            </h3>
            <input 
              className="input input-bordered w-full mb-3 bg-slate-800 border-white/10" 
              placeholder="Title (e.g., Strange noise when braking)"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <textarea 
              className="textarea textarea-bordered w-full h-24 bg-slate-800 border-white/10" 
              placeholder={currentRole === UserRole.SHOP ? "Share maintenance tips or industry insights..." : "Describe your car issue in detail..."}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            ></textarea>
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <button 
                  className="btn btn-sm btn-ghost gap-1"
                  onClick={handleAskAi}
                  disabled={isAskingAi || !newPostContent}
                >
                  {isAskingAi ? <span className="loading loading-spinner loading-xs"></span> : <Bot className="w-4 h-4" />}
                  Ask AI First
                </button>
              </div>
              <button 
                className="btn btn-primary btn-sm gap-2"
                onClick={handleCreatePost}
                disabled={!newPostContent || !newPostTitle}
              >
                <Send className="w-4 h-4" /> Post
              </button>
            </div>

            {/* AI Response */}
            {aiResponse && (
              <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Mechanic Analysis</span>
                </div>
                <p className="text-sm whitespace-pre-wrap text-slate-300">{aiResponse}</p>
              </div>
            )}
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {displayedPosts.map((post) => {
              const hasShopResponse = post.comments.some(c => c.role === UserRole.SHOP);
              
              return (
                <div 
                  key={post.id} 
                  className={`glass-card rounded-2xl p-5 border transition-all hover:border-primary/20 ${
                    hasShopResponse ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        post.authorRole === UserRole.SHOP ? 'bg-primary/20 text-primary' : 'bg-slate-700'
                      }`}>
                        <span className="font-bold">{post.author.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight hover:text-primary cursor-pointer">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span>{post.author}</span>
                          {post.authorRole === UserRole.SHOP && (
                            <span className="badge badge-xs badge-primary gap-1">
                              <ShieldCheck className="w-2 h-2" /> Shop
                            </span>
                          )}
                          {post.vehicle && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Car className="w-3 h-3" />
                              {post.vehicle.year} {post.vehicle.make} {post.vehicle.model}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {hasShopResponse && (
                      <span className="badge badge-success badge-sm gap-1">
                        <ShieldCheck className="w-3 h-3" /> Shop Verified
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm mt-3 text-slate-300 line-clamp-3">{post.content}</p>
                  
                  {post.image && (
                    <img src={post.image} alt="Issue" className="mt-3 rounded-xl w-full h-48 object-cover" />
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <button 
                          key={tag} 
                          className="badge badge-ghost badge-sm gap-1 hover:badge-primary cursor-pointer"
                          onClick={() => setSelectedTag(tag)}
                        >
                          <Tag className="w-3 h-3" /> {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => handleLike(post.id)}
                      >
                        <ThumbsUp className="w-3 h-3" /> {post.likes}
                      </button>
                      <button 
                        className={`btn btn-xs gap-1 ${expandedPostId === post.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageSquare className="w-3 h-3" /> {post.comments.length}
                        {expandedPostId === post.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {expandedPostId === post.id && (
                    <div className="mt-4 bg-slate-800/50 rounded-xl p-4 animate-fade-in">
                      <h4 className="text-sm font-bold mb-3 text-slate-400">Discussion</h4>
                      
                      <div className="space-y-3 mb-4">
                        {post.comments.length > 0 ? (
                          post.comments.map(comment => (
                            <div 
                              key={comment.id} 
                              className={`flex gap-3 p-3 rounded-xl ${
                                comment.role === UserRole.SHOP 
                                  ? 'bg-green-500/10 border border-green-500/20' 
                                  : 'bg-slate-700/50'
                              }`}
                            >
                              <div className="mt-1">
                                {comment.role === UserRole.SHOP ? (
                                  <div className="bg-green-500 text-white p-1.5 rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                  </div>
                                ) : (
                                  <div className="bg-slate-600 text-white p-1.5 rounded-full">
                                    <UserIcon className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm">{comment.author}</span>
                                  {comment.role === UserRole.SHOP && (
                                    <span className="badge badge-xs badge-success">Verified Shop</span>
                                  )}
                                  <span className="text-xs text-slate-500">{comment.date}</span>
                                </div>
                                <p className="text-sm mt-1 text-slate-300">{comment.content}</p>
                                {comment.role === UserRole.SHOP && comment.shopId && (
                                  <button 
                                    className="mt-2 text-xs text-green-400 font-semibold hover:underline flex items-center gap-1"
                                    onClick={() => handleShopLinkClick(comment.shopId!)}
                                  >
                                    View Shop Profile <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-sm text-slate-500 py-4">
                            No comments yet. Be the first to respond!
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="input input-sm input-bordered flex-1 bg-slate-700 border-white/10"
                          placeholder={currentRole === UserRole.SHOP ? "Offer advice or promote your service..." : "Add a comment..."}
                          value={newCommentContent}
                          onChange={(e) => setNewCommentContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                        />
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handlePostComment(post.id)}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Topics */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-400" />
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map(topic => (
                <button 
                  key={topic}
                  onClick={() => setSelectedTag(topic)}
                  className={`badge badge-lg cursor-pointer transition-all ${
                    selectedTag === topic ? 'badge-primary' : 'badge-ghost hover:badge-primary'
                  }`}
                >
                  #{topic}
                </button>
              ))}
            </div>
          </div>

          {/* Shop Answered Posts */}
          <div className="glass-card rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              Shop Verified Answers
            </h3>
            <div className="space-y-3">
              {shopAnsweredPosts.slice(0, 3).map(post => (
                <button 
                  key={post.id}
                  className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  onClick={() => setExpandedPostId(post.id)}
                >
                  <p className="font-medium text-sm line-clamp-1">{post.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {post.comments.filter(c => c.role === UserRole.SHOP).length} shop response(s)
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Feature Promo */}
          <div className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <span className="font-bold">AI Mechanic</span>
              <span className="badge badge-xs badge-info">Beta</span>
            </div>
            <p className="text-sm text-slate-400">
              Get instant preliminary diagnostics before posting. Our AI can help identify common issues.
            </p>
          </div>

          {/* Shop Tips */}
          {currentRole === UserRole.SHOP && (
            <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-primary" />
                <span className="font-bold">Shop Tip</span>
              </div>
              <p className="text-sm text-slate-300">
                Active shops in the forum get <strong>3x more profile views</strong>. Answer questions to build trust and attract customers!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};