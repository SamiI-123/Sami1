import React from 'react';
import { 
  Users, MessageSquare, Handshake, Globe, 
  ArrowUpRight, Star, Heart, MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Community() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Forum Section */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-natural-border shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E9EDC6] rounded-2xl flex items-center justify-center text-primary-green">
                   <Users size={24} />
                </div>
                <h3 className="text-2xl font-bold text-natural-text">Exchange Forum</h3>
             </div>
             <button className="bg-primary-green hover:bg-primary-green-dark text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-xl shadow-primary-green/20 transition-all active:scale-95">New Topic</button>
          </div>
          
          <div className="space-y-6">
             {[
               { title: "Dealing with Tomato Blight in rainy seasons?", author: "Sarah J.", tags: ["Health", "Tomatoes"], comments: 12, likes: 45, icon: "S" },
               { title: "Best drone altitude for corn field scanning?", author: "Mike T.", tags: ["Tech", "Drone"], comments: 8, likes: 31, icon: "M" },
               { title: "New cooperative grant for irrigation systems", author: "Ministry of Agri", tags: ["Co-op", "Finance"], comments: 24, likes: 112, icon: "G" },
             ].map((post, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-natural-border shadow-sm hover:shadow-lg hover:shadow-primary-green/5 transition-all group">
                   <div className="flex gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-natural-bg border border-natural-border flex items-center justify-center font-black text-primary-green text-xl shadow-inner">
                        {post.icon}
                      </div>
                      <div className="flex-1">
                         <h4 className="text-lg font-bold text-natural-text group-hover:text-primary-green transition-colors mb-3">{post.title}</h4>
                         <div className="flex flex-wrap gap-2 mb-6">
                            {post.tags.map(tag => (
                               <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-natural-bg text-natural-muted border border-natural-border">{tag}</span>
                            ))}
                         </div>
                         <div className="flex items-center justify-between pt-4 border-t border-natural-bg">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-natural-muted">By {post.author} • 4 hours ago</p>
                            <div className="flex items-center gap-6 text-natural-muted">
                               <div className="flex items-center gap-2 group/stat">
                                  <MessageSquare size={16} className="group-hover/stat:text-primary-green transition-colors" />
                                  <span className="text-xs font-bold font-mono">{post.comments}</span>
                               </div>
                               <div className="flex items-center gap-2 group/stat">
                                  <Heart size={16} className="group-hover/stat:text-red-500 transition-colors" />
                                  <span className="text-xs font-bold font-mono">{post.likes}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-natural-border shadow-sm">
              <h4 className="text-lg font-bold text-natural-text mb-8 flex items-center gap-3">
                 <Globe className="text-accent-tan" size={24} />
                 Top Experts
              </h4>
              <div className="space-y-6">
                 {[
                   { name: "Dr. Elena Vance", role: "Plant Pathologist", rating: 4.9 },
                   { name: "Marcus Thorne", role: "Precision Agri Expert", rating: 4.8 },
                   { name: "Julian Rossi", role: "Soil Scientist", rating: 4.7 },
                 ].map((expert, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                       <div className="w-12 h-12 rounded-2xl bg-natural-bg border border-natural-border overflow-hidden transition-transform group-hover:scale-110" />
                       <div className="flex-1">
                          <p className="text-sm font-bold text-natural-text uppercase leading-tight">{expert.name}</p>
                          <p className="text-[10px] text-natural-muted font-black tracking-widest uppercase mt-0.5">{expert.role}</p>
                       </div>
                       <div className="flex items-center gap-1.5 text-accent-tan">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-black font-mono">{expert.rating}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-primary-green rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-primary-green/20">
              <div className="relative z-10">
                 <h4 className="text-2xl font-bold mb-3 tracking-tight text-white">Join your local Co-op</h4>
                 <p className="text-sm text-white/80 mb-8 leading-relaxed font-medium">Connect with 200+ members in Sector B for shared aerial resources, IoT insights and bulk supply orders.</p>
                 <button className="flex items-center gap-3 bg-accent-tan text-white font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl text-xs hover:bg-white hover:text-primary-green transition-all shadow-lg active:scale-95">
                    Explore Network
                    <ArrowUpRight size={18} />
                 </button>
              </div>
              <Handshake className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 rotate-12" />
           </div>
        </div>
      </div>
    </div>
  );
}
