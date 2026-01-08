import React, { useState } from 'react';
import { MOCK_POSTS, MOCK_SHOPS } from '../constants';
import { ForumPost, UserRole, Comment, Shop } from '../types';
import { MessageSquare, ThumbsUp, Tag, Bot, Send, ShieldCheck, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { generateMechanicAdvice } from '../services/geminiService';

interface ForumProps {
  currentRole: UserRole;
  onShopSelect: (shop: Shop) => void;
}

export const Forum: React.FC<ForumProps> = ({ currentRole, onShopSelect }) => {
  const [posts, setPosts] = useState<ForumPost[]>(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');

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
    <div className="grid lg:grid-cols-3 gap-6 h-full animate-fade-in">
      {/* Feed Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
           <h2 className="text-3xl font-bold">Community Forum</h2>
           {currentRole === UserRole.SHOP && (
             <div className="badge badge-accent gap-1">
               <ShieldCheck className="w-3 h-3" /> Shop Account
             </div>
           )}
        </div>

        {/* Create Post / AI Ask Widget */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-sm uppercase text-base-content/50">
              {currentRole === UserRole.SHOP ? 'Share Advice or Ask Questions' : 'Ask the community or AI'}
            </h3>
            <input 
              className="input input-bordered w-full mb-2" 
              placeholder="Title (e.g., Strange noise when braking)"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <textarea 
              className="textarea textarea-bordered w-full h-24" 
              placeholder={currentRole === UserRole.SHOP ? "Share maintenance tips or ask about industry trends..." : "Describe your car issue..."}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            ></textarea>
            <div className="card-actions justify-end mt-2">
              <button 
                className="btn btn-accent btn-sm gap-2"
                onClick={handleAskAi}
                disabled={isAskingAi || !newPostContent}
              >
                {isAskingAi ? <span className="loading loading-spinner loading-xs"></span> : <Bot className="w-4 h-4" />}
                Ask AI Mechanic
              </button>
              <button 
                className="btn btn-primary btn-sm gap-2"
                onClick={handleCreatePost}
                disabled={!newPostContent || !newPostTitle}
              >
                <Send className="w-4 h-4" /> Post
              </button>
            </div>

            {/* AI Response Area */}
            {aiResponse && (
              <div className="mt-4 p-4 bg-base-200 rounded-lg border border-accent/20">
                 <div className="flex items-center gap-2 mb-2 text-accent font-bold">
                    <Bot className="w-5 h-5" />
                    <span>AI Assistant Analysis</span>
                 </div>
                 <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-start justify-between">
                   <div className="flex items-center gap-2">
                      <div className={`avatar placeholder`}>
                         <div className={`w-8 rounded-full ${post.authorRole === UserRole.SHOP ? 'bg-secondary text-secondary-content' : 'bg-neutral text-neutral-content'}`}>
                            <span className="text-xs">{post.author.charAt(0)}</span>
                         </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight hover:text-primary cursor-pointer">{post.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-base-content/50">
                           <span>{post.author}</span>
                           {post.authorRole === UserRole.SHOP && (
                             <span className="badge badge-xs badge-secondary gap-1 ml-1"><ShieldCheck className="w-2 h-2" /> Shop</span>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
                
                <p className="text-sm mt-3 line-clamp-3">{post.content}</p>
                {post.image && (
                    <img src={post.image} alt="Issue" className="mt-3 rounded-lg w-full h-48 object-cover" />
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200">
                  <div className="flex gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="badge badge-outline badge-xs gap-1">
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-xs gap-1">
                        <ThumbsUp className="w-3 h-3" /> {post.likes}
                    </button>
                    <button 
                        className={`btn btn-xs gap-1 ${expandedPostId === post.id ? 'btn-neutral' : 'btn-ghost'}`}
                        onClick={() => toggleComments(post.id)}
                    >
                        <MessageSquare className="w-3 h-3" /> {post.comments.length} Comments
                        {expandedPostId === post.id ? <ChevronUp className="w-3 h-3 ml-1"/> : <ChevronDown className="w-3 h-3 ml-1"/>}
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {expandedPostId === post.id && (
                  <div className="mt-4 bg-base-200/50 rounded-xl p-4 animate-fade-in">
                      <h4 className="text-sm font-bold mb-3 opacity-70">Discussion</h4>
                      
                      {/* List Comments */}
                      <div className="space-y-3 mb-4">
                        {post.comments.length > 0 ? (
                           post.comments.map(comment => (
                             <div key={comment.id} className={`flex gap-3 ${comment.role === UserRole.SHOP ? 'bg-white border-l-4 border-secondary p-3 rounded shadow-sm' : ''}`}>
                                <div className="mt-1">
                                   {comment.role === UserRole.SHOP ? (
                                      <div className="bg-secondary text-secondary-content p-1 rounded-full">
                                        <ShieldCheck className="w-4 h-4" />
                                      </div>
                                   ) : (
                                      <div className="bg-neutral text-neutral-content p-1 rounded-full">
                                        <UserIcon className="w-4 h-4" />
                                      </div>
                                   )}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm">{comment.author}</span>
                                      {comment.role === UserRole.SHOP && <span className="badge badge-xs badge-secondary">Verified Shop</span>}
                                      <span className="text-xs text-base-content/50">{comment.date}</span>
                                   </div>
                                   <p className="text-sm mt-1">{comment.content}</p>
                                   {comment.role === UserRole.SHOP && comment.shopId && (
                                     <div className="mt-2 text-xs text-secondary font-semibold">
                                       <button 
                                          className="hover:underline cursor-pointer flex items-center gap-1"
                                          onClick={() => handleShopLinkClick(comment.shopId!)}
                                       >
                                          View Shop Profile <ArrowRightIcon className="w-3 h-3" />
                                       </button>
                                     </div>
                                   )}
                                </div>
                             </div>
                           ))
                        ) : (
                           <div className="text-center text-sm text-base-content/50 py-2">No comments yet. Be the first!</div>
                        )}
                      </div>

                      {/* Add Comment */}
                      <div className="flex gap-2">
                         <input 
                            type="text" 
                            className="input input-sm input-bordered flex-1"
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
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block space-y-6">
         <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
               <h3 className="card-title text-lg">Trending Topics</h3>
               <ul className="menu bg-base-100 rounded-box p-0">
                  <li><a>#Brakes</a></li>
                  <li><a>#CheckEngineLight</a></li>
                  <li><a>#TeslaModel3</a></li>
                  <li><a>#OilLeak</a></li>
               </ul>
            </div>
         </div>
         <div className="alert alert-info shadow-sm">
            <Bot className="w-6 h-6" />
            <div className="text-xs">
               <h3 className="font-bold">Beta Feature</h3>
               <p>Use our AI mechanic to get instant preliminary diagnostics before posting.</p>
            </div>
         </div>
         {currentRole === UserRole.SHOP && (
           <div className="card bg-secondary text-secondary-content shadow-sm">
             <div className="card-body">
               <h3 className="font-bold">Shop Tip</h3>
               <p className="text-sm">Active shops in the forum get 3x more profile views. Answer questions to build trust!</p>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

const ArrowRightIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
)