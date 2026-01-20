import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MOCK_POSTS, MOCK_SHOPS } from '../constants';
import { ForumPost, UserRole, Comment, Shop } from '../types';
import api from '../services/api'; 
import { showAlert } from '../utils/alerts'; 
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
  Sparkles,
  Image as ImageIcon,
  Video,
  MoreHorizontal,
  Edit2,
  X
} from 'lucide-react';
import { generateMechanicAdvice } from '../services/geminiService';

interface ForumProps {
  currentRole: UserRole;
  onShopSelect: (shop: Shop) => void;
}

type SortType = 'hot' | 'new' | 'top';

export const Forum: React.FC<ForumProps> = ({ currentRole, onShopSelect }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  
  // Create Post State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{url: string, type: 'image' | 'video'}[]>([]);
  
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | number | null>(null);
  
  // Edit Post State
  const [editingPostId, setEditingPostId] = useState<string | number | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const [newCommentContent, setNewCommentContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('hot');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/forum');
      setPosts(data);
    } catch (error) {
      console.error('Failed to load forum posts', error);
      setPosts(MOCK_POSTS); // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        setNewMediaFiles([...newMediaFiles, ...files]);
        
        // Create previews with type detection
        const newPreviews = files.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image' as 'image' | 'video'
        }));
        setMediaPreviews([...mediaPreviews, ...newPreviews]);
    }
  };

  const removeMedia = (index: number) => {
    const newFiles = [...newMediaFiles];
    newFiles.splice(index, 1);
    setNewMediaFiles(newFiles);
    
    const newPreviews = [...mediaPreviews];
    // Revoke URL to avoid memory leaks
    if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index].url);
        newPreviews.splice(index, 1);
        setMediaPreviews(newPreviews);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !newPostTitle.trim()) return;
    
    console.log('🚀 Starting post creation...');
    console.log('📁 Media files to upload:', newMediaFiles.length);
    
    try {
        // Upload media files to server first
        const uploadedImages: string[] = [];
        let uploadedVideo: string | undefined;
        
        for (const file of newMediaFiles) {
            console.log(`📤 Uploading file: ${file.name} (${file.type})`);
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const { data: uploadResult } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                console.log('✅ Upload result:', uploadResult);
                
                if (file.type.startsWith('video')) {
                    uploadedVideo = uploadResult.url;
                    console.log('🎥 Video uploaded:', uploadedVideo);
                } else {
                    uploadedImages.push(uploadResult.url);
                    console.log('🖼️ Image uploaded:', uploadResult.url);
                }
            } catch (uploadError: any) {
                console.error('❌ Failed to upload file:', file.name, uploadError);
                console.error('❌ Error response:', uploadError.response?.data);
                showAlert.error(
                    uploadError.response?.data?.message || uploadError.message,
                    `Failed to upload ${file.name}`
                );
            }
        }
        
        console.log('📊 Upload summary - Images:', uploadedImages.length, 'Video:', uploadedVideo ? 'YES' : 'NO');
        
        // Parse hashtags from input (comma or space separated, strip # if user added it)
        const parsedTags = newPostTags
            .split(/[,\s]+/)
            .map(t => t.replace(/^#/, '').trim())
            .filter(t => t.length > 0);
        const finalTags = parsedTags.length > 0 ? parsedTags : ['General'];

        console.log('📨 Sending post to backend:', {
            title: newPostTitle,
            content: newPostContent,
            tags: finalTags,
            images: uploadedImages,
            video: uploadedVideo
        });

        const { data } = await api.post('/forum', {
            title: newPostTitle,
            content: newPostContent,
            tags: finalTags,
            images: uploadedImages,
            video: uploadedVideo
        });

        console.log('✅ Backend response:', data);

        const newPost: ForumPost = {
            id: data.id,
            author: data.author?.name || 'You', 
            authorRole: data.author?.role || currentRole,
            title: data.title,
            content: data.content,
            likes: 0,
            comments: [],
            tags: data.tags || [],
            createdAt: new Date().toISOString(),
            images: uploadedImages,
            video: uploadedVideo,
            isEdited: false
        };

        console.log('📹 New post created with video:', uploadedVideo);
        console.log('📦 Full newPost object:', newPost);

        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setNewPostTitle('');
        setNewPostTags('');
        setNewMediaFiles([]);
        setMediaPreviews([]);
        setAiResponse(null);
        
        console.log('✨ Post creation complete!');
        // fetchPosts(); // Optional refresh
    } catch (error) {
        console.error('❌ Failed to create post', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack);
        }
    }
  };

  const startEditing = (post: ForumPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const saveEdit = async (postId: string | number) => {
    try {
        // Optimistic update
        setPosts(posts.map(p => 
            p.id === postId 
            ? { ...p, content: editContent, isEdited: true, updatedAt: new Date().toISOString() } 
            : p
        ));
        setEditingPostId(null);

        await api.put(`/forum/${postId}`, { content: editContent });
    } catch (error) {
        console.error('Failed to update post', error);
        fetchPosts(); // Revert on fail
    }
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const handleDeletePost = async (postId: string | number) => {
    // Optimistic delete
    setPosts(posts.filter(p => p.id !== postId));
    
    try {
        await api.delete(`/forum/${postId}`);
    } catch (error) {
        console.error('Failed to delete post', error);
        fetchPosts(); // Revert on failure
    }
  };

  const toggleComments = (postId: string | number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setNewCommentContent('');
    }
  };

  const handleLike = async (postId: string | number) => {
    // Optimistic
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, likes: p.likes + 1 } : p 
    ));

    try {
        await api.post(`/forum/${postId}/like`);
    } catch (error) {
        console.error('Failed to like post', error);
        fetchPosts(); 
    }
  };

  const handlePostComment = async (postId: string | number) => {
    if (!newCommentContent.trim()) return;

    try {
        const { data } = await api.post(`/forum/${postId}/comments`, {
            content: newCommentContent
        });

        const newComment: Comment = {
            id: data.id,
            author: data.author || 'You', 
            role: data.role || currentRole,
            content: data.content,
            date: new Date().toISOString(),
            shopId: data.shopId
        };

        const updatedPosts = posts.map(post => {
            if (post.id === postId) {
                return { ...post, comments: [...post.comments, newComment] };
            }
            return post;
        });

        setPosts(updatedPosts);
        setNewCommentContent('');
    } catch (error) {
        console.error('Failed to post comment', error);
    }
  };

  const handleShopLinkClick = async (shopId: string) => {
    const mockShop = MOCK_SHOPS.find(s => String(s.id) === String(shopId));
    if (mockShop) {
      onShopSelect(mockShop);
      return;
    }

    try {
        // Try fetch or just call onShopSelect with minimal info if backend fetch isn't ready
        // Ideally we fetch full shop details
        onShopSelect({ id: shopId } as any); 
    } catch(e) {
        console.error('Nav error', e);
    }
  };
  
  // Format relative time (e.g. "2 hours ago")
  const formatTimeAgo = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return date.toLocaleDateString();
  };

  if (loading && posts.length === 0) {
      return <div className="flex justify-center p-12"><span className="loading loading-spinner text-primary"></span></div>;
  }

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
            
            {/* Hashtags Input */}
            <input 
              className="input input-bordered w-full mt-3 bg-slate-800 border-white/10 text-sm" 
              placeholder="Add hashtags (comma or space separated, e.g. brakes, toyota, DIY)"
              value={newPostTags}
              onChange={(e) => setNewPostTags(e.target.value)}
            />
            
            {/* Media Previews */}
            {mediaPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {mediaPreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                            {preview.type === 'video' ? (
                                <video 
                                    src={preview.url} 
                                    className="w-24 h-20 object-cover rounded-lg border border-white/10" 
                                    muted 
                                    playsInline
                                    onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                                    onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                                />
                            ) : (
                                <img src={preview.url} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                            )}
                            <button 
                                onClick={() => removeMedia(idx)}
                                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                 {/* Hidden File Input */}
                 <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                 />
                 
                 <button 
                    className="btn btn-sm btn-ghost gap-2 text-slate-400 hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                 >
                    <ImageIcon className="w-4 h-4" /> Photo/Video
                 </button>

                <button 
                  className="btn btn-sm btn-ghost gap-1 text-slate-400 hover:text-blue-400"
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

          {/* Search/Sort Bar (Compact) */}
          <div className="flex items-center justify-between">
             <div className="join">
                <button className={`btn btn-sm join-item ${sortBy === 'hot' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setSortBy('hot')}>Hot</button>
                <button className={`btn btn-sm join-item ${sortBy === 'new' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setSortBy('new')}>New</button>
                <button className={`btn btn-sm join-item ${sortBy === 'top' ? 'btn-neutral' : 'btn-ghost'}`} onClick={() => setSortBy('top')}>Top</button>
             </div>
             
             {selectedTag && (
                <div className="badge badge-lg gap-2 pr-1">
                    #{selectedTag} 
                    <button onClick={() => setSelectedTag(null)} className="hover:bg-white/20 rounded-full p-0.5"><X className="w-3 h-3"/></button>
                </div>
             )}
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {displayedPosts.map((post) => {
              const hasShopResponse = post.comments.some(c => c.role === UserRole.SHOP);
              const isEditing = editingPostId === post.id;
              
              return (
                <div 
                  key={post.id} 
                  className={`glass-card rounded-2xl border transition-all ${
                    hasShopResponse ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                post.authorRole === UserRole.SHOP ? 'bg-primary/20 text-primary' : 'bg-slate-700'
                            }`}>
                                <span className="font-bold uppercase">{post.author.charAt(0)}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight text-white">{post.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="font-medium text-slate-300">{post.author}</span>
                                    <span>•</span>
                                    <span>{formatTimeAgo(post.createdAt)}</span>
                                    {post.isEdited && (
                                        <span className="italic text-slate-500 ml-1">(Edited)</span>
                                    )}
                                    {post.authorRole === UserRole.SHOP && (
                                        <span className="badge badge-xs badge-primary gap-1 ml-1">Shop</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Post Actions Dropdown (Only for author, mocked check) */}
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm">
                                <MoreHorizontal className="w-4 h-4" />
                            </label>
                            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-slate-800 rounded-box w-52 z-10 border border-white/10">
                                <li><a onClick={() => startEditing(post)}><Edit2 className="w-4 h-4" /> Edit Post</a></li>
                                <li><a onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /> Delete Post</a></li>
                            </ul>
                        </div>
                    </div>
                  
                    {/* Content */}
                    {isEditing ? (
                        <div className="mb-4">
                            <textarea 
                                className="textarea textarea-bordered w-full h-32 bg-slate-900"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)} 
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={() => saveEdit(post.id)}>Save Changes</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                    )}
                  
                    {/* Media Grid */}
                    {((post.images && post.images.length > 0) || post.image || post.video) && (
                        <div className={`grid gap-2 mb-4 overflow-hidden rounded-xl ${
                            (post.images?.length || 0) > 1 ? 'grid-cols-2' : 'grid-cols-1'
                        }`}>
                            {post.images && post.images.length > 0 ? (
                                post.images.map((img, idx) => (
                                    <img 
                                        key={idx} 
                                        src={img.startsWith('http') ? img : `http://localhost:5000${img}`} 
                                        alt="Post attachment" 
                                        className="w-full h-80 object-cover hover:scale-105 transition-transform duration-500" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                                        }}
                                    />
                                ))
                            ) : post.image ? (
                                <img 
                                    src={post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`} 
                                    alt="Main attachment" 
                                    className="w-full h-80 object-cover" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                                    }}
                                />
                            ) : null}
                            
                            {post.video && (
                                <video 
                                    src={post.video.startsWith('http') ? post.video : `http://localhost:5000${post.video}`}
                                    controls 
                                    className="w-full h-96 object-contain bg-black rounded-xl"
                                    playsInline
                                    preload="metadata"
                                >
                                    Your browser does not support video playback.
                                </video>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map(tag => (
                                <span key={tag} className="text-xs text-primary font-medium hover:underline cursor-pointer" onClick={() => setSelectedTag(tag)}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <button 
                            className="btn btn-ghost btn-sm gap-2 hover:bg-white/5 flex-1"
                            onClick={() => handleLike(post.id)}
                        >
                            <ThumbsUp className={`w-4 h-4 ${post.likes > 0 ? 'text-blue-400 fill-blue-400' : ''}`} /> 
                            {post.likes > 0 ? `${post.likes} Likes` : 'Like'}
                        </button>
                        <button 
                            className="btn btn-ghost btn-sm gap-2 hover:bg-white/5 flex-1"
                            onClick={() => toggleComments(post.id)}
                        >
                            <MessageSquare className="w-4 h-4" /> 
                            {post.comments.length > 0 ? `${post.comments.length} Comments` : 'Comment'}
                        </button>
                        <button className="btn btn-ghost btn-sm gap-2 hover:bg-white/5 flex-1">
                            <ArrowRight className="w-4 h-4 -rotate-45" /> Share
                        </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {expandedPostId === post.id && (
                    <div className="bg-black/20 p-5 border-t border-white/5 animate-fade-in">
                      {/* Comment Input */}
                      <div className="flex gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center">
                            <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                className="w-full bg-slate-800 rounded-2xl px-4 py-2 text-sm border-none focus:ring-1 focus:ring-white/20 pr-10"
                                placeholder="Write a comment..."
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                            />
                            <button 
                                className="absolute right-2 top-1.5 p-1 text-primary hover:bg-white/10 rounded-full"
                                onClick={() => handlePostComment(post.id)}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-4">
                        {post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-3 group">
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                                    comment.role === UserRole.SHOP ? 'bg-primary/20 text-primary' : 'bg-slate-700'
                                }`}>
                                    {comment.role === UserRole.SHOP ? <ShieldCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="bg-slate-800 rounded-2xl px-4 py-2 inline-block">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm text-white">{comment.author}</span>
                                            {comment.role === UserRole.SHOP && (
                                                <span className="badge badge-xs badge-success h-3 text-[9px] px-1">Shop</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-300">{comment.content}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 ml-2">
                                        <span className="text-xs text-slate-500">{formatTimeAgo(comment.date)}</span>
                                        <button className="text-xs font-bold text-slate-500 hover:text-white">Like</button>
                                        <button className="text-xs font-bold text-slate-500 hover:text-white">Reply</button>
                                        {comment.role === UserRole.SHOP && comment.shopId && (
                                            <button 
                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                                onClick={() => handleShopLinkClick(comment.shopId!)}
                                            >
                                                Visit Shop <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
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
          <div className="glass-card rounded-2xl p-5 border border-white/5 sticky top-24">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-400" />
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
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

            <div className="divider my-4"></div>

            {/* Shop Answered (Compact) */}
            <h4 className="font-bold text-sm text-slate-400 mb-3">Shop Verified Answers</h4>
            <div className="space-y-3">
              {shopAnsweredPosts.slice(0, 3).map(post => (
                <div 
                  key={post.id}
                  className="group cursor-pointer"
                  onClick={() => {
                      // Scroll to post if rendered, usually simple anchor link logic or context
                      // For now just expand
                      setExpandedPostId(post.id); 
                  }}
                >
                    <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Response</span>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};