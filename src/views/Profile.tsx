import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { logout } from '../lib/firebase';
import { 
  User as UserIcon, Camera, Phone, MapPin, Briefcase, 
  Save, Loader2, CheckCircle2, Shield, LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

type Role = 'farmer' | 'expert' | 'admin';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [profile, setProfile] = useState({
    displayName: '',
    phoneNumber: '',
    location: '',
    role: 'farmer' as Role,
    photoURL: ''
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      }));
      fetchProfile();
    } else {
      // Guest initialization
      setProfile({
        displayName: 'Samson Abreham',
        phoneNumber: '+251 911 223 344',
        location: 'Addis Ababa, Ethiopia',
        role: 'admin',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samson'
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setMsg('You must be signed in to save changes');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      const updateData = {
        ...profile,
        uid: user.uid,
        email: user.email,
        updatedAt: new Date().toISOString()
      };

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...updateData,
          createdAt: new Date().toISOString()
        });
      } else {
        await updateDoc(docRef, updateData);
      }
      setMsg('Profile updated successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setMsg('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-green w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-natural-text tracking-tight">User Profile</h2>
          <p className="text-natural-muted font-medium mt-1">Manage your identity and contact information</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !user}
          className="bg-primary-green hover:bg-primary-green/90 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary-green/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {msg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-2",
            msg.includes('successfully') ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}
        >
          <CheckCircle2 size={18} />
          {msg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-natural-border shadow-sm text-center">
            <div className="relative inline-block mx-auto mb-6">
              <div className="w-32 h-32 rounded-[2rem] bg-natural-bg border-4 border-white shadow-xl overflow-hidden ring-1 ring-natural-border">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-natural-muted">
                    <UserIcon size={48} />
                  </div>
                )}
              </div>
              {user && (
                <button className="absolute -bottom-2 -right-2 bg-accent-tan text-white p-3 rounded-2xl shadow-lg border-2 border-white hover:scale-110 transition-transform">
                  <Camera size={18} />
                </button>
              )}
            </div>
            <h3 className="text-xl font-bold text-natural-text mb-1 uppercase tracking-tight">{profile.displayName || 'Unnamed User'}</h3>
            <p className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full inline-block mt-2",
              profile.role === 'admin' ? "bg-red-100 text-red-600 border border-red-200" :
              profile.role === 'expert' ? "bg-blue-100 text-blue-600 border border-blue-200" :
              "bg-accent-tan/10 text-accent-tan"
            )}>
              {profile.role === 'admin' ? '🛡️ Platform Admin' : 
               profile.role === 'expert' ? '🎓 Agronomy Expert' : 
               '👨‍🌾 Farmer'}
            </p>
            
            <div className="mt-8 pt-8 border-t border-natural-bg grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest mb-1">Status</p>
                <div className={cn(
                  "flex items-center justify-center gap-1.5",
                  profile.role === 'admin' ? "text-red-500" : "text-primary-green"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    profile.role === 'admin' ? "bg-red-500" : "bg-primary-green"
                  )} />
                  <span className="text-xs font-bold">{profile.role === 'admin' ? 'Superuser' : 'Verified'}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-natural-muted uppercase tracking-widest mb-1">Rank</p>
                <div className="flex items-center justify-center gap-1.5 text-accent-tan">
                  {profile.role === 'admin' ? <Shield size={14} className="text-red-500" /> : <div className="text-sm">⭐</div>}
                  <span className="text-xs font-bold">
                    {profile.role === 'admin' ? 'Level 10' : 
                     profile.role === 'expert' ? 'Master' : 'Senior'}
                  </span>
                </div>
              </div>
            </div>

            {user ? (
              <button 
                onClick={logout}
                className="mt-8 w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-100 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-colors active:scale-95"
              >
                <LogOut size={16} />
                Sign Out Account
              </button>
            ) : (
              <div className="mt-8 p-4 bg-primary-green/5 rounded-2xl border border-primary-green/10">
                <p className="text-[10px] font-bold text-primary-green uppercase tracking-wider mb-2">Guest Mode</p>
                <p className="text-xs text-natural-muted mb-4 leading-relaxed font-medium">Authentication is currently disabled per user preference.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-natural-muted uppercase tracking-widest block ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={18} />
                  <input 
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full bg-natural-bg border border-natural-border rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-natural-muted uppercase tracking-widest block ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={18} />
                  <input 
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                    className="w-full bg-natural-bg border border-natural-border rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all"
                    placeholder="+251 900 000 000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-natural-muted uppercase tracking-widest block ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={18} />
                  <input 
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full bg-natural-bg border border-natural-border rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all"
                    placeholder="e.g. North Ridge Estate"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-natural-muted uppercase tracking-widest block ml-1">User Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-muted" size={18} />
                  <select 
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value as any })}
                    className="w-full bg-natural-bg border border-natural-border rounded-2xl px-12 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-green/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="farmer">Farmer / Land Owner</option>
                    <option value="expert">Agronomy Expert</option>
                    <option value="admin">Platform Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-natural-bg">
              <div className="bg-natural-bg/50 p-6 rounded-3xl border border-natural-border">
                <p className="text-xs text-natural-muted leading-relaxed italic">
                  Note: Role changes for 'Expert' and 'Admin' accounts require verification by Agrinovia Technology staff. Current changes are recorded for metadata only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
