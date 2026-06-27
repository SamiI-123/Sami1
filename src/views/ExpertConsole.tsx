import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Sprout, ShieldAlert, FileSpreadsheet, 
  MessageSquare, Bell, Droplets, Thermometer, Wind, 
  AlertTriangle, TrendingUp, CheckCircle2, ChevronRight, 
  Send, Download, Sparkles, RefreshCw, Layers, ShieldCheck, 
  Microscope, Database, Plus, Search, Trash2, Sliders, 
  MapPin, Eye, BookOpen, Activity, AlertCircle, Check, 
  Info, Sparkle, User, Calendar, ArrowUpRight
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, query, limit, orderBy, 
  addDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

// Interface Definitions
interface FarmData {
  id: string;
  name: string;
  cropType: string;
  size: number;
  ownerId: string;
  ownerName: string;
  location: { city: string; country: string; lat: number; lng: number };
  healthScore: number;
}

interface AlertData {
  id: string;
  farmId: string;
  farmName: string;
  type: string;
  severity: 'critical' | 'warning' | 'stable';
  message: string;
  timestamp: string;
}

interface CropImage {
  id: string;
  url: string;
  date: string;
  caption: string;
  resolution: string;
}

interface DiseaseAnalysis {
  id: string;
  diseaseName: string;
  confidence: number;
  aiFindings: string;
  severity: 'high' | 'medium' | 'low';
  imageUrl: string;
  status: 'pending_expert' | 'verified' | 'override';
  expertNotes?: string;
  farmId: string;
}

interface RecommendationRecord {
  id: string;
  farmId: string;
  farmName: string;
  type: 'fertilizer' | 'irrigation' | 'treatment';
  advice: string;
  chemicalFormula?: string;
  dosage?: string;
  timestamp: string;
  expertName: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: 'farmer' | 'expert';
  text: string;
  timestamp: string;
}

export default function ExpertConsole() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'crop' | 'iot' | 'recommendations' | 'communication' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  
  // App data states
  const [farms, setFarms] = useState<FarmData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<DiseaseAnalysis[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<FarmData | null>(null);

  // Crop Analysis section state
  const [selectedAnalysis, setSelectedAnalysis] = useState<DiseaseAnalysis | null>(null);
  const [expertSignOffNotes, setExpertSignOffNotes] = useState('');
  const [droneImages, setDroneImages] = useState<CropImage[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // IoT Monitoring States
  const [iotTelemetry, setIotTelemetry] = useState({
    moisture: 42,
    nitrogen: 140,
    phosphorus: 55,
    potassium: 210,
    temperature: 24.8,
    humidity: 61,
  });
  const [moistureAlertThreshold, setMoistureAlertThreshold] = useState(35);
  const [tempAlertThreshold, setTempAlertThreshold] = useState(32);

  // Recommendations Form & History
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [newRecommendation, setNewRecommendation] = useState({
    farmId: '',
    type: 'fertilizer' as 'fertilizer' | 'irrigation' | 'treatment',
    advice: '',
    chemicalFormula: '',
    dosage: ''
  });

  // Farmer communication states
  const [activeChatFarmer, setActiveChatFarmer] = useState('Farmer Abebe');
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({
    'Farmer Abebe': [
      { id: '1', senderName: 'Farmer Abebe', senderRole: 'farmer', text: 'Dr. Helen, the Arabica canopy seems a bit yellow on Section C. Is this rust?', timestamp: '09:12 AM' },
      { id: '2', senderName: 'Dr. Helen Kassaye', senderRole: 'expert', text: 'Hi Abebe. It could be early-stage leaf rust. I am checking the multi-spectral drone scan right now.', timestamp: '09:20 AM' },
    ],
    'Farmer Martha': [
      { id: '1', senderName: 'Farmer Martha', senderRole: 'farmer', text: 'Hello, our irrigation pump was down for 2 days. The sensor shows 28% moisture. Should I over-irrigate today?', timestamp: 'Yesterday' },
      { id: '2', senderName: 'Dr. Helen Kassaye', senderRole: 'expert', text: 'Do not over-saturate suddenly. Gradually increase flow to 45% to protect the root system.', timestamp: 'Yesterday' },
    ]
  });
  const [messageInput, setMessageInput] = useState('');
  
  // Notification Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastRegion, setBroadcastRegion] = useState('All Regions');
  const [pastBroadcasts, setPastBroadcasts] = useState<any[]>([]);

  // UI Toast System
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const triggerToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Synchronize dynamic mock or real Firestore data
  const loadExpertData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Farms
      let fetchedFarms: FarmData[] = [];
      try {
        const querySnap = await getDocs(collection(db, 'farms'));
        querySnap.forEach((docSnap) => {
          const d = docSnap.data();
          fetchedFarms.push({
            id: docSnap.id,
            name: d.name || 'Unnamed Farm',
            cropType: d.cropType || 'Arabica Coffee',
            size: Number(d.size) || 12.4,
            ownerId: d.ownerId || 'u2',
            ownerName: d.ownerName || 'Abebe Bikila',
            location: d.location || { city: 'Jimma', country: 'Ethiopia', lat: 7.67, lng: 36.83 },
            healthScore: d.healthScore || Math.floor(Math.random() * 20) + 75
          });
        });
      } catch (err) {
        console.warn("Farms firestore read failed, loading robust default set:", err);
      }

      if (fetchedFarms.length === 0) {
        fetchedFarms = [
          { id: 'f1', name: 'Jimma Highland Organic Estate', cropType: 'Arabica Specialty', size: 14.5, ownerId: 'u2', ownerName: 'Abebe Bikila', location: { city: 'Jimma', country: 'Ethiopia', lat: 7.67, lng: 36.83 }, healthScore: 82 },
          { id: 'f2', name: 'Sidama Growers Cooperative', cropType: 'Specialty Sidamo', size: 32.0, ownerId: 'u4', ownerName: 'Chala Dejene', location: { city: 'Hawassa', country: 'Ethiopia', lat: 7.05, lng: 38.48 }, healthScore: 94 },
          { id: 'f3', name: 'Harar Sunny Slopes Farm', cropType: 'Harar Peaberry', size: 8.2, ownerId: 'u2', ownerName: 'Abebe Bikila', location: { city: 'Harar', country: 'Ethiopia', lat: 9.31, lng: 42.12 }, healthScore: 68 }
        ];
      }
      setFarms(fetchedFarms);
      setSelectedFarm(fetchedFarms[0]);

      // 2. Fetch or Mock Alerts
      const mockAlerts: AlertData[] = [
        { id: 'a1', farmId: 'f1', farmName: 'Jimma Highland Organic Estate', type: 'Pathogen Disease', severity: 'critical', message: 'Foliage decay indicator spike on Coffee Leaf Rust model (42% probability).', timestamp: '2h ago' },
        { id: 'a2', farmId: 'f3', farmName: 'Harar Sunny Slopes Farm', type: 'Nutrient Deficiency', severity: 'warning', message: 'Nitrogen level measured at critical low boundary of 110 ppm.', timestamp: '1d ago' },
        { id: 'a3', farmId: 'f2', farmName: 'Sidama Growers Cooperative', type: 'Irrigation Deficit', severity: 'stable', message: 'Moisture recovery confirmed at optimum level 54%.', timestamp: '3d ago' }
      ];
      setAlerts(mockAlerts);

      // 3. Fetch/Mock Disease Analyses (AI Reports)
      let fetchedReports: DiseaseAnalysis[] = [];
      try {
        const querySnap = await getDocs(collection(db, 'ai_reports'));
        querySnap.forEach((docSnap) => {
          const d = docSnap.data();
          fetchedReports.push({
            id: docSnap.id,
            diseaseName: d.findings?.split(' Severity')[0] || 'Coffee Leaf Rust',
            confidence: d.confidence || 87,
            aiFindings: d.findings || 'Canopy shows symptoms of orange powdery spore patches.',
            severity: d.findings?.toLowerCase().includes('high') ? 'high' : d.findings?.toLowerCase().includes('medium') ? 'medium' : 'low',
            imageUrl: d.imageUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
            status: d.status === 'completed' ? 'verified' : 'pending_expert',
            farmId: d.farmId || 'f1'
          });
        });
      } catch (err) {}

      if (fetchedReports.length === 0) {
        fetchedReports = [
          { id: 'rep1', diseaseName: 'Coffee Leaf Rust (Hemileia vastatrix)', confidence: 91, aiFindings: 'Leaf canopy displays diagnostic yellow-orange pustules. Foliage decay rating shows 40% infestation density in Sector C.', severity: 'high', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop', status: 'pending_expert', farmId: 'f1' },
          { id: 'rep2', diseaseName: 'Cercospora Leaf Spot', confidence: 78, aiFindings: 'Circular gray/brown lesions with dark reddish-brown borders on leaves. AI suggests high moisture pooling.', severity: 'medium', imageUrl: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?q=80&w=600&auto=format&fit=crop', status: 'verified', expertNotes: 'Verified symptoms. thin out the canopy shade to decrease local leaf humidity.', farmId: 'f1' },
          { id: 'rep3', diseaseName: 'Coffee Berry Borer Damage', confidence: 85, aiFindings: 'Boreholes detected on fresh green berries. High cluster density observed in southern flight quadrant.', severity: 'high', imageUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=600&auto=format&fit=crop', status: 'pending_expert', farmId: 'f2' }
        ];
      }
      setRecentAnalyses(fetchedReports);
      setSelectedAnalysis(fetchedReports[0]);

      // 4. Drone Images
      const mockImages: CropImage[] = [
        { id: 'img1', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop', date: '2026-06-25', caption: 'Spectral Canopy Close-up - Sector C', resolution: '4K Ultra-Spec' },
        { id: 'img2', url: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?q=80&w=600&auto=format&fit=crop', date: '2026-06-24', caption: 'Thermal Heat Map - Block 4 Water Stress', resolution: 'FLIR Dynamic' },
        { id: 'img3', url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?q=80&w=600&auto=format&fit=crop', date: '2026-06-26', caption: 'High-Res Orthomosaic Mosaic Overview', resolution: '120MP Composite' }
      ];
      setDroneImages(mockImages);

      // 5. Recommendations History
      const mockRecs: RecommendationRecord[] = [
        { id: 'rec1', farmId: 'f1', farmName: 'Jimma Highland Organic Estate', type: 'treatment', advice: 'Apply copper-hydroxide organic spray strictly in dry windless conditions.', chemicalFormula: 'Cu(OH)2 Organic dispersion', dosage: '2.5 kg/hectare', timestamp: '2 days ago', expertName: 'Dr. Helen Kassaye' },
        { id: 'rec2', farmId: 'f2', farmName: 'Sidama Growers Cooperative', type: 'fertilizer', advice: 'Slight nitrogen deficiency observed. Broadcast slow-release compost or organic bone meal.', chemicalFormula: 'N-P-K Organic 4-3-2', dosage: '150 kg/hectare', timestamp: '5 days ago', expertName: 'Dr. Helen Kassaye' }
      ];
      setRecommendations(mockRecs);

      // 6. Past Broadcasts
      setPastBroadcasts([
        { id: 'b1', text: 'WARNING: Humid front heading to Jimma Region. Increased Leaf Rust hazard warning active.', region: 'Jimma Zone', timestamp: 'Today, 08:00 AM' },
        { id: 'b2', text: 'COOP REMINDER: Verify NPK sensor batteries before applying fertilizer recommendations.', region: 'All Regions', timestamp: '3 days ago' }
      ]);

    } catch (e) {
      console.error("Error hydrating expert dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpertData();
  }, []);

  // Update Telemetry when farm changes
  useEffect(() => {
    if (selectedFarm) {
      // Simulate unique metrics per farm for premium feel
      if (selectedFarm.id === 'f1') {
        setIotTelemetry({ moisture: 42, nitrogen: 135, phosphorus: 52, potassium: 212, temperature: 24.8, humidity: 62 });
      } else if (selectedFarm.id === 'f2') {
        setIotTelemetry({ moisture: 54, nitrogen: 165, phosphorus: 68, potassium: 245, temperature: 21.2, humidity: 73 });
      } else {
        setIotTelemetry({ moisture: 31, nitrogen: 110, phosphorus: 44, potassium: 185, temperature: 28.5, humidity: 51 });
      }
    }
  }, [selectedFarm]);

  // Expert Sign-Off / Override Logic
  const handleExpertVerify = async (status: 'verified' | 'override') => {
    if (!selectedAnalysis) return;
    try {
      // Optimistic local state update
      setRecentAnalyses(prev => prev.map(item => 
        item.id === selectedAnalysis.id 
          ? { ...item, status, expertNotes: expertSignOffNotes } 
          : item
      ));

      // Attempt to sync back to Firestore ai_reports if available
      try {
        await setDoc(doc(db, 'ai_reports', selectedAnalysis.id), {
          status: status === 'verified' ? 'completed' : 'override',
          expertNotes: expertSignOffNotes,
          expertSignature: user?.displayName || 'Dr. Helen Kassaye',
          reviewedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore sync bypassed, state kept locally:", fsErr);
      }

      // Automatically craft recommendation advice when verified
      if (expertSignOffNotes.trim() !== '') {
        const customRecId = 'rec_gen_' + Math.random().toString(36).substring(2, 9);
        const autoRec: RecommendationRecord = {
          id: customRecId,
          farmId: selectedAnalysis.farmId,
          farmName: farms.find(f => f.id === selectedAnalysis.farmId)?.name || 'Highland Organic',
          type: 'treatment',
          advice: expertSignOffNotes,
          dosage: 'Standard Dosage',
          timestamp: 'Just now',
          expertName: user?.displayName || 'Dr. Helen Kassaye'
        };
        setRecommendations(prev => [autoRec, ...prev]);
      }

      triggerToast('success', `Analysis state updated to: ${status === 'verified' ? 'Expert Verified' : 'Overridden'}.`);
      setSelectedAnalysis(prev => prev ? { ...prev, status, expertNotes: expertSignOffNotes } : null);
      setExpertSignOffNotes('');
    } catch (err: any) {
      triggerToast('error', `Failed to register verification: ${err.message}`);
    }
  };

  // Submit Advice
  const handleAddRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecommendation.farmId || !newRecommendation.advice) {
      triggerToast('error', 'Please select a target farm and provide advice details.');
      return;
    }

    const farmObj = farms.find(f => f.id === newRecommendation.farmId);
    const recId = 'rec_' + Math.random().toString(36).substring(2, 9);
    
    const recData: RecommendationRecord = {
      id: recId,
      farmId: newRecommendation.farmId,
      farmName: farmObj?.name || 'Assigned Farm',
      type: newRecommendation.type,
      advice: newRecommendation.advice,
      chemicalFormula: newRecommendation.chemicalFormula || 'N/A',
      dosage: newRecommendation.dosage || 'Per instructions',
      timestamp: 'Just now',
      expertName: user?.displayName || 'Dr. Helen Kassaye'
    };

    try {
      setRecommendations(prev => [recData, ...prev]);
      
      // Sync to hypothetical recommendations database collection
      try {
        await setDoc(doc(db, 'expert_recommendations', recId), {
          ...recData,
          createdAt: serverTimestamp()
        });
      } catch (fsE) {}

      setNewRecommendation({ farmId: '', type: 'fertilizer', advice: '', chemicalFormula: '', dosage: '' });
      triggerToast('success', 'Professional agronomy advisory has been broadcasted to the target farmer.');
    } catch (e: any) {
      triggerToast('error', `Submission failed: ${e.message}`);
    }
  };

  // Chat Messenger send message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const activeHistory = chatHistories[activeChatFarmer] || [];
    const newMsg: ChatMessage = {
      id: String(activeHistory.length + 1),
      senderName: user?.displayName || 'Dr. Helen Kassaye',
      senderRole: 'expert',
      text: messageInput,
      timestamp: 'Just now'
    };

    setChatHistories({
      ...chatHistories,
      [activeChatFarmer]: [...activeHistory, newMsg]
    });
    setMessageInput('');
    triggerToast('success', 'Response transmitted successfully.');

    // Simulate responsive answer from farmer after 2 seconds
    setTimeout(() => {
      setChatHistories(prev => {
        const history = prev[activeChatFarmer] || [];
        return {
          ...prev,
          [activeChatFarmer]: [
            ...history,
            {
              id: String(history.length + 1),
              senderName: activeChatFarmer,
              senderRole: 'farmer',
              text: 'Understood, Dr. Helen. I will deploy this guidance on the farm immediately.',
              timestamp: 'Just now'
            }
          ]
        };
      });
    }, 2000);
  };

  // Broadcast System
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    const newBroadcast = {
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      text: broadcastMessage,
      region: broadcastRegion,
      timestamp: 'Just now'
    };

    setPastBroadcasts(prev => [newBroadcast, ...prev]);
    setBroadcastMessage('');
    triggerToast('success', `Global advisory broadcasted to regional sector: ${broadcastRegion}.`);
  };

  // PDF Generator Simulator
  const handleGeneratePDF = (reportType: string) => {
    triggerToast('info', `Assembling dynamic diagnostic PDF report data for ${reportType}...`);
    setTimeout(() => {
      // Create mockup download trigger
      const dummyContent = `AGRINOVIA TECHNOLOGY DIAGNOSTIC SYSTEM\nExpert Advisory Report\nDate: 2026-06-27\nExpert Sign-off: Dr. Helen Kassaye\n\nTarget: ${selectedFarm?.name || 'All Regions'}\nTelemetry Rating:\n- Health score: ${selectedFarm?.healthScore || 'N/A'}%\n- NPK Levels: N:${iotTelemetry.nitrogen} P:${iotTelemetry.phosphorus} K:${iotTelemetry.potassium}\n- Soil Moisture Index: ${iotTelemetry.moisture}%\n\nVerified Disease Pathogen: ${selectedAnalysis?.diseaseName || 'None Detected'}\nAdvisory Action Notes: ${selectedAnalysis?.expertNotes || 'Proceed with standard seasonal organic composting.'}\n\nAgrinovia Expert Advisory Board. All rights reserved.`;
      
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Agrinovia_Expert_Advisory_${selectedFarm?.name.replace(/\s+/g, '_') || 'General'}.txt`;
      link.click();
      triggerToast('success', 'Diagnostic Report generated and downloaded successfully!');
    }, 1500);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-1 md:px-4">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-natural-border/30">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 bg-blue-50/70 px-4 py-1.5 rounded-full inline-block mb-3 border border-blue-100 shadow-xs">
            🎓 CERTIFIED EXPERT ADVOCATE CONSOLE
          </span>
          <h2 className="text-3xl font-black text-natural-text tracking-tight flex items-center gap-3">
            Agronomy Advisory Panel
            <span className="text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
              Level 3 Verified
            </span>
          </h2>
          <p className="text-natural-muted font-medium italic text-sm mt-1">
            Analyze advanced drone multi-spectral captures, override AI model predictions, calibrate soil telemetry metrics, and transmit direct treatment advice to local farmers.
          </p>
        </div>
        
        {/* Sync Indicator */}
        <div className="shrink-0">
          <button 
            onClick={loadExpertData}
            className="px-5 py-2.5 bg-white border border-natural-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-natural-bg/50 transition-colors flex items-center gap-2 shadow-xs"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Recalibrate Diagnostic Nodes
          </button>
        </div>
      </div>

      {/* Dynamic Toast System */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border shadow-md",
              toast.type === 'success' 
                ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                : toast.type === 'error'
                ? "bg-red-50 text-red-800 border-red-100"
                : "bg-blue-50 text-blue-800 border-blue-100"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : toast.type === 'error' ? <AlertTriangle size={16} className="text-red-600" /> : <Info size={16} className="text-blue-600" />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Navigation Row */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-natural-border shadow-xs overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'crop', label: 'Crop Analysis', icon: Microscope },
          { id: 'iot', label: 'IoT Telemetry Matrix', icon: Droplets },
          { id: 'recommendations', label: 'Expert Recommendations', icon: FileSpreadsheet },
          { id: 'communication', label: 'Farmer Communication', icon: MessageSquare },
          { id: 'reports', label: 'Historic Reports & PDF', icon: BookOpen }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTab(btn.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
              activeTab === btn.id 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" 
                : "text-natural-muted hover:text-natural-text hover:bg-natural-bg/50 font-bold"
            )}
          >
            <btn.icon size={14} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Frame */}
      {loading ? (
        <div className="bg-white border border-natural-border rounded-3xl p-24 text-center space-y-4">
          <RefreshCw className="animate-spin text-blue-600 mx-auto" size={32} />
          <h4 className="text-xs font-black uppercase tracking-widest text-natural-text">Re-calibrating Regional Agricultural Models</h4>
          <p className="text-[10px] text-natural-muted">Establishing secure telemetry synchronizations...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-natural-border shadow-sm p-6 md:p-8 min-h-[500px]">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Quick Health Summary Headers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Active Support Region Card */}
                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Expert Region Coverage</p>
                    <h3 className="text-2xl font-black text-natural-text">Ethiopia Central</h3>
                    <p className="text-xs font-medium text-natural-muted">Jimma, Harar, Sidama Zones</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl border border-blue-200 flex items-center justify-center text-blue-600">
                    <MapPin size={24} />
                  </div>
                </div>

                {/* Response SLA Counter */}
                <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-natural-border flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-natural-muted tracking-wider">Average Advisory SLA</p>
                    <h3 className="text-2xl font-black text-natural-text">42 Minutes</h3>
                    <p className="text-xs font-medium text-emerald-600 font-bold">&#8595; 5 minutes faster than benchmark</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl border border-natural-border flex items-center justify-center text-emerald-600">
                    <Activity size={24} />
                  </div>
                </div>

                {/* Dynamic Weather & Canopy Climate */}
                <div className="bg-gradient-to-br from-amber-50/30 to-orange-50/10 p-6 rounded-2xl border border-orange-100 flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-orange-600 tracking-wider">Atmospheric Threat Coefficient</p>
                    <h3 className="text-2xl font-black text-natural-text">Moderate (34%)</h3>
                    <p className="text-xs font-medium text-natural-muted">Temp: 24.8°C | Humidity: 62%</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl border border-orange-200 flex items-center justify-center text-orange-600">
                    <AlertTriangle size={24} />
                  </div>
                </div>

              </div>

              {/* Main Content Split: Assigned Farms & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. ASSIGNED FARMS LIST (Interactive context selector) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-natural-text flex items-center gap-2">
                        <Sprout size={16} className="text-blue-600" />
                        Assigned Coffee Farm Jurisdictions
                      </h3>
                      <p className="text-[11px] text-natural-muted">Select a farm to automatically update diagnostics context and telemetry parameters.</p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md">{farms.length} ACTIVE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {farms.map((farm) => {
                      const isSelected = selectedFarm?.id === farm.id;
                      return (
                        <div 
                          key={farm.id}
                          onClick={() => setSelectedFarm(farm)}
                          className={cn(
                            "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4",
                            isSelected 
                              ? "bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500/20" 
                              : "bg-white border-natural-border hover:bg-natural-bg/30"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-natural-text group-hover:text-blue-600 transition-colors">{farm.name}</h4>
                              <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider mt-0.5">{farm.location.city}, {farm.location.country}</p>
                            </div>
                            <span className={cn(
                              "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase",
                              farm.healthScore >= 90 ? "bg-emerald-100 text-emerald-800" : farm.healthScore >= 75 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                            )}>
                              {farm.healthScore}% Health
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[11px] text-natural-muted pt-3 border-t border-natural-bg">
                            <span>Crop: <strong className="text-natural-text">{farm.cropType}</strong></span>
                            <span>Size: <strong className="text-natural-text">{farm.size} Hectares</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Context Helper */}
                  {selectedFarm && (
                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sparkle size={14} className="text-blue-600 animate-pulse" />
                        <span className="text-[11px] text-blue-900 font-semibold">
                          Active telemetry focus is set to: <strong>{selectedFarm.name}</strong>
                        </span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('iot')}
                        className="text-[10px] font-black uppercase text-blue-700 hover:underline flex items-center gap-1"
                      >
                        Launch IoT Matrix &rarr;
                      </button>
                    </div>
                  )}

                  {/* Recent Analyses Queue */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-natural-text flex items-center gap-1.5">
                        <Microscope size={14} className="text-blue-600" />
                        Recent Spectroscopic AI Analyses
                      </h4>
                      <button onClick={() => setActiveTab('crop')} className="text-[10px] font-black text-blue-600 uppercase hover:underline">View All Analyses</button>
                    </div>

                    <div className="space-y-3">
                      {recentAnalyses.slice(0, 2).map((item) => (
                        <div key={item.id} className="bg-white border p-4 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={item.imageUrl} alt="Analysis" className="w-12 h-12 rounded-lg object-cover border" />
                            <div>
                              <p className="text-xs font-black text-natural-text">{item.diseaseName}</p>
                              <p className="text-[10px] text-natural-muted mt-0.5">AI Confidence: {item.confidence}% | Status: 
                                <span className={cn(
                                  "font-bold uppercase tracking-wider ml-1",
                                  item.status === 'verified' ? "text-emerald-600" : "text-amber-500"
                                )}> {item.status.replace('_', ' ')}</span>
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedAnalysis(item);
                              setActiveTab('crop');
                            }}
                            className="p-2 bg-natural-bg rounded-lg hover:bg-blue-50 text-natural-muted hover:text-blue-600 transition-colors"
                          >
                            <ArrowUpRight size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. REGIONAL OUTBREAK & NUTRIENT ALERTS PANEL */}
                <div className="bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-natural-border">
                    <ShieldAlert size={18} className="text-blue-600" />
                    <div>
                      <h3 className="font-extrabold text-sm text-neutral-800">Agronomy Warning Desk</h3>
                      <p className="text-[9px] font-black text-natural-muted uppercase tracking-wider">Active regional hazard triggers</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={cn(
                          "p-4 rounded-xl border bg-white flex items-start gap-3 transition-transform hover:-translate-y-0.5",
                          alert.severity === 'critical' ? "border-red-100" : alert.severity === 'warning' ? "border-amber-100" : "border-emerald-100"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg shrink-0 mt-0.5",
                          alert.severity === 'critical' ? "bg-red-50 text-red-600" : alert.severity === 'warning' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          <AlertCircle size={14} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-natural-muted">{alert.type}</span>
                            <span className="text-[9px] text-natural-muted/60 font-mono">{alert.timestamp}</span>
                          </div>
                          <h4 className="text-xs font-bold text-neutral-800">{alert.farmName}</h4>
                          <p className="text-[11px] text-natural-muted leading-relaxed">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-[11px] text-blue-900 leading-relaxed font-semibold">
                    <p className="font-black text-[9px] text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Sliders size={12} />
                      Expert Protocol
                    </p>
                    Verify spectral drone scans and cross-reference with live humidity parameters prior to triggering chemical treatments.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CROP ANALYSIS (Drone Images, Disease Detection, AI Results) */}
          {activeTab === 'crop' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-natural-text">Canopy & Pathogen Spectroscopics</h3>
                  <p className="text-xs text-natural-muted">Audit computer-vision predictions, assess drone multispectral payloads, and override AI classifications.</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setZoomImage(droneImages[0]?.url)}
                    className="px-4 py-2 bg-natural-bg text-natural-text border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-natural-border/20 flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    Inspect Master Drone Scan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Disease Detection Queue & AI Predictions */}
                <div className="space-y-4 lg:col-span-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-natural-text">Pending Verification List</h4>
                  
                  <div className="space-y-3">
                    {recentAnalyses.map((analysis) => {
                      const isSelected = selectedAnalysis?.id === analysis.id;
                      return (
                        <div 
                          key={analysis.id}
                          onClick={() => {
                            setSelectedAnalysis(analysis);
                            setExpertSignOffNotes(analysis.expertNotes || '');
                          }}
                          className={cn(
                            "p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3",
                            isSelected 
                              ? "bg-blue-50/50 border-blue-400 shadow-xs" 
                              : "bg-white border-natural-border hover:bg-natural-bg/20"
                          )}
                        >
                          <img src={analysis.imageUrl} alt={analysis.diseaseName} className="w-14 h-14 rounded-lg object-cover border shrink-0" />
                          <div className="space-y-0.5 overflow-hidden">
                            <h5 className="font-bold text-xs text-natural-text truncate">{analysis.diseaseName}</h5>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded uppercase",
                                analysis.severity === 'high' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                              )}>
                                {analysis.severity}
                              </span>
                              <span className="text-[10px] text-natural-muted">Conf: {analysis.confidence}%</span>
                            </div>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider block pt-0.5",
                              analysis.status === 'verified' ? "text-emerald-600" : "text-amber-500"
                            )}>
                              {analysis.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Interactive AI Results Overrides & Sign-Off */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedAnalysis ? (
                    <div className="bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl space-y-6">
                      
                      {/* Active Report Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
                        <div>
                          <span className="text-[9px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black">
                            REPORT PATH ID: #{selectedAnalysis.id}
                          </span>
                          <h4 className="text-base font-black text-natural-text mt-1.5">{selectedAnalysis.diseaseName}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-natural-muted font-bold">Model Confidence:</span>
                          <span className="text-sm font-black text-blue-600 bg-white border px-2.5 py-1 rounded-lg">
                            {selectedAnalysis.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic Visual Frame */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="relative rounded-xl overflow-hidden border border-natural-border aspect-video group">
                          <img src={selectedAnalysis.imageUrl} alt="Pathogen" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => setZoomImage(selectedAnalysis.imageUrl)}
                              className="p-2.5 bg-white rounded-full text-natural-text shadow hover:scale-105 transition-transform"
                            >
                              <Search size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Model findings */}
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-black text-natural-muted uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkle size={12} className="text-amber-500" />
                            Computer-Vision Insights
                          </h5>
                          <p className="text-xs text-natural-text leading-relaxed font-medium bg-white p-4 rounded-xl border">
                            {selectedAnalysis.aiFindings}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-natural-muted">
                            <Info size={14} className="text-blue-500" />
                            <span>AI models are calibrated daily against standard local coffee pathogens.</span>
                          </div>
                        </div>

                      </div>

                      {/* Expert Action Panel */}
                      <div className="bg-white p-6 rounded-xl border border-natural-border space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-black uppercase tracking-wider text-natural-text">Specialist Verdict & Advisory Notes</h5>
                          {selectedAnalysis.status === 'verified' && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Signed Off
                            </span>
                          )}
                        </div>

                        <textarea
                          placeholder="Provide custom organic treatment, dosage cycles, shade recommendations, or canopy thinnings for the farmer..."
                          value={expertSignOffNotes}
                          onChange={(e) => setExpertSignOffNotes(e.target.value)}
                          className="w-full bg-natural-bg/30 border border-natural-border rounded-xl p-4 text-xs text-natural-text focus:outline-none focus:border-blue-500/50 min-h-[100px]"
                        />

                        <div className="flex gap-3 justify-end pt-2">
                          <button 
                            type="button"
                            onClick={() => handleExpertVerify('override')}
                            className="px-4 py-2.5 bg-white border text-red-600 font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors"
                          >
                            Override Model Prediction
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => handleExpertVerify('verified')}
                            className="px-5 py-2.5 bg-blue-600 text-white font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/10 flex items-center gap-1.5"
                          >
                            <ShieldCheck size={14} />
                            Certify & Deploy Advisory
                          </button>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-natural-bg/50 border border-natural-border rounded-2xl p-16 text-center text-natural-muted">
                      Select an analysis report from the left queue to verify findings.
                    </div>
                  )}

                  {/* Drone Image Gallery */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-neutral-800">Drone Raw Spectra Gallery</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {droneImages.map((img) => (
                        <div 
                          key={img.id}
                          onClick={() => setZoomImage(img.url)}
                          className="relative rounded-xl overflow-hidden border border-natural-border aspect-square cursor-pointer group bg-neutral-100"
                        >
                          <img src={img.url} alt="Spectra" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] font-black truncate">{img.caption}</p>
                            <p className="text-[8px] opacity-70 mt-0.5">{img.resolution}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: IoT MONITORING (Soil Moisture, NPK, Temp, Humidity, Threshold config) */}
          {activeTab === 'iot' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-natural-text">Soil Telemetry & Macronutrient Matrix</h3>
                  <p className="text-xs text-natural-muted">Assess Nitrogen (N), Phosphorus (P), Potassium (K) cycles and configure automated warning thresholds.</p>
                </div>
                
                {selectedFarm && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border px-3 py-1.5 rounded-lg">
                    Monitoring Farm: <strong>{selectedFarm.name}</strong>
                  </span>
                )}
              </div>

              {/* Dial Counters & NPK Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Moisture Gauge */}
                <div className="bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-natural-muted tracking-wider">Soil Moisture</span>
                    <Droplets className="text-blue-500" size={18} />
                  </div>
                  
                  <div className="text-center py-2">
                    <h3 className="text-3xl font-black text-natural-text">{iotTelemetry.moisture}%</h3>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest mt-1">
                      {iotTelemetry.moisture < moistureAlertThreshold ? '⚠️ DRY IRRIGATION FAULT' : 'OPTIMUM BOUNDARY'}
                    </p>
                  </div>

                  <div className="h-1.5 bg-natural-bg rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        iotTelemetry.moisture < moistureAlertThreshold ? "bg-amber-500" : "bg-blue-500"
                      )} 
                      style={{ width: `${iotTelemetry.moisture}%` }} 
                    />
                  </div>
                </div>

                {/* 2. Temperature Gauge */}
                <div className="bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-natural-muted tracking-wider">Atmospheric Temp</span>
                    <Thermometer className="text-red-500" size={18} />
                  </div>
                  
                  <div className="text-center py-2">
                    <h3 className="text-3xl font-black text-natural-text">{iotTelemetry.temperature}°C</h3>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest mt-1">
                      {iotTelemetry.temperature > tempAlertThreshold ? '⚠️ EXCESSIVE EVAPOTRANSPIRATION' : 'NOMINAL RANGE'}
                    </p>
                  </div>

                  <div className="h-1.5 bg-natural-bg rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${(iotTelemetry.temperature / 40) * 100}%` }} />
                  </div>
                </div>

                {/* 3. Humidity Gauge */}
                <div className="bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-natural-muted tracking-wider">Atmospheric Humidity</span>
                    <Wind className="text-emerald-500" size={18} />
                  </div>
                  
                  <div className="text-center py-2">
                    <h3 className="text-3xl font-black text-natural-text">{iotTelemetry.humidity}%</h3>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-widest mt-1">High Fungus Spread Hazard</p>
                  </div>

                  <div className="h-1.5 bg-natural-bg rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${iotTelemetry.humidity}%` }} />
                  </div>
                </div>

                {/* 4. Combined NPK Telemetry */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/20 border border-indigo-100 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Nutrient Stability (NPK)</span>
                    <Database className="text-indigo-600" size={18} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <span className="text-[9px] font-black text-indigo-600">N</span>
                      <p className="text-xs font-black">{iotTelemetry.nitrogen} ppm</p>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <span className="text-[9px] font-black text-indigo-600">P</span>
                      <p className="text-xs font-black">{iotTelemetry.phosphorus} ppm</p>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <span className="text-[9px] font-black text-indigo-600">K</span>
                      <p className="text-xs font-black">{iotTelemetry.potassium} ppm</p>
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-indigo-800 text-center font-bold uppercase tracking-wider">
                    {iotTelemetry.nitrogen < 120 ? '⚠️ LOW NITROGEN BUFFER' : 'STABLE BUFFER'}
                  </p>
                </div>

              </div>

              {/* Calibration Threshold Controllers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Moisture Threshold Calibration */}
                <div className="bg-white p-6 rounded-2xl border border-natural-border space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-wider text-natural-text flex items-center gap-1.5">
                    <Sliders size={16} className="text-blue-600" />
                    Configure Soil Moisture Warning Guard
                  </h4>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-natural-muted">Current Alert Trigger Threshold:</span>
                      <strong className="text-blue-600 text-sm">{moistureAlertThreshold}% Moisture</strong>
                    </div>

                    <input 
                      type="range" min="20" max="60" 
                      value={moistureAlertThreshold}
                      onChange={(e) => setMoistureAlertThreshold(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-natural-muted font-bold font-mono">
                      <span>20% (Critically Dry)</span>
                      <span>60% (Waterlogged)</span>
                    </div>

                    <p className="text-xs text-natural-muted leading-relaxed font-medium bg-natural-bg p-3.5 rounded-xl border border-natural-border">
                      If soil moisture telemetry packets drop below <span className="text-blue-600 font-bold">{moistureAlertThreshold}%</span>, the system will automatically broadcast a critical priority advisory ticket to <strong>{selectedFarm?.ownerName || 'the local farmer'}</strong>.
                    </p>
                  </div>
                </div>

                {/* Evapotranispiration Temperature Guard */}
                <div className="bg-white p-6 rounded-2xl border border-natural-border space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-wider text-natural-text flex items-center gap-1.5">
                    <Sliders size={16} className="text-red-500" />
                    Calibrate Thermal Stress Guard
                  </h4>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-natural-muted">Evapotranispiration Trigger:</span>
                      <strong className="text-red-600 text-sm">{tempAlertThreshold}°C Ambient</strong>
                    </div>

                    <input 
                      type="range" min="25" max="38" 
                      value={tempAlertThreshold}
                      onChange={(e) => setTempAlertThreshold(Number(e.target.value))}
                      className="w-full accent-red-500 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-natural-muted font-bold font-mono">
                      <span>25°C</span>
                      <span>38°C (Extreme Heat)</span>
                    </div>

                    <p className="text-xs text-natural-muted leading-relaxed font-medium bg-natural-bg p-3.5 rounded-xl border border-natural-border">
                      High thermal stress levels exceeding <span className="text-red-500 font-bold">{tempAlertThreshold}°C</span> cause immediate leaf hydration depletion. Farmers will receive automatic notification warning them to thin out shading canopies.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: RECOMMENDATIONS (Fertilizer, Irrigation, Disease treatment submissions) */}
          {activeTab === 'recommendations' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-natural-text">Submit Agronomic Advice & Prescriptions</h3>
                  <p className="text-xs text-natural-muted">Broadcast direct organic, nitrogen, irrigation, or pathogen protection plans to farmers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Prescribe Recommendation Form */}
                <div className="lg:col-span-1 bg-[#FAF9F6] border border-natural-border p-6 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-800 mb-4 flex items-center gap-1.5">
                    <Plus size={14} className="text-blue-600" />
                    Publish Advisory Ticket
                  </h4>

                  <form onSubmit={handleAddRecommendation} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Target Farm Boundary</label>
                      <select 
                        value={newRecommendation.farmId}
                        onChange={(e) => setNewRecommendation(p => ({ ...p, farmId: e.target.value }))}
                        className="w-full bg-white border border-natural-border p-3 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="">-- Select Target Farm --</option>
                        {farms.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Advisory Type</label>
                      <select 
                        value={newRecommendation.type}
                        onChange={(e) => setNewRecommendation(p => ({ ...p, type: e.target.value as any }))}
                        className="w-full bg-white border border-natural-border p-3 rounded-xl text-xs font-semibold focus:outline-none"
                      >
                        <option value="fertilizer">Fertilizer Advice (NPK / Soil Carbon)</option>
                        <option value="irrigation">Irrigation Advice (Moisture replenishment)</option>
                        <option value="treatment">Disease Treatment (Organic fungicides/borers)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Expert Treatment Plan</label>
                      <textarea 
                        value={newRecommendation.advice}
                        onChange={(e) => setNewRecommendation(p => ({ ...p, advice: e.target.value }))}
                        placeholder="Detail specific treatments, shade trimming cycles, or water replenishment ratios..."
                        className="w-full bg-white border border-natural-border p-3.5 rounded-xl text-xs min-h-[100px] focus:outline-none focus:border-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Chemical or Compost Formula (Optional)</label>
                      <input 
                        type="text"
                        value={newRecommendation.chemicalFormula}
                        onChange={(e) => setNewRecommendation(p => ({ ...p, chemicalFormula: e.target.value }))}
                        placeholder="e.g. Copper Hydroxide Organic, Compost 4-3-2"
                        className="w-full bg-white border border-natural-border p-3 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-1">Recommended Dosage (Optional)</label>
                      <input 
                        type="text"
                        value={newRecommendation.dosage}
                        onChange={(e) => setNewRecommendation(p => ({ ...p, dosage: e.target.value }))}
                        placeholder="e.g. 2.5 kg per Hectare sprayed every 14 days"
                        className="w-full bg-white border border-natural-border p-3 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10"
                    >
                      Deploy Advisor Prescriptions
                    </button>
                  </form>
                </div>

                {/* 2. Advice History & Feed */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-800">Broadcasted Recommendation Archives</h4>

                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-5 bg-white border border-natural-border rounded-2xl space-y-3 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                              rec.type === 'treatment' ? "bg-red-50 text-red-600" : rec.type === 'fertilizer' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {rec.type} ADVISORY
                            </span>
                            <h4 className="text-sm font-bold text-natural-text mt-1.5">{rec.farmName}</h4>
                          </div>
                          <span className="text-[10px] text-natural-muted font-mono">{rec.timestamp}</span>
                        </div>

                        <p className="text-xs text-natural-text leading-relaxed font-semibold">
                          {rec.advice}
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-natural-bg text-[11px] text-natural-muted">
                          <div>
                            Formula/Compost: <strong className="text-neutral-700">{rec.chemicalFormula || 'Organic / Dynamic'}</strong>
                          </div>
                          <div>
                            Target Dosage: <strong className="text-neutral-700">{rec.dosage || 'Soil Saturation Rate'}</strong>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 text-[10px] text-natural-muted font-mono">
                          <span>Signee: <strong>{rec.expertName}</strong></span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Check size={12} /> Received by Farmer
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: FARMER COMMUNICATION (Chat panel & region announcements) */}
          {activeTab === 'communication' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-natural-text">Farmer Communications Desk</h3>
                  <p className="text-xs text-natural-muted">Interact directly with certified coffee growers or transmit regional weather/hazard notifications.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Farmer Selection Sidebar (Messenger style) */}
                <div className="lg:col-span-1 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-800">Active Grower Consults</h4>
                  
                  <div className="space-y-3">
                    {Object.keys(chatHistories).map((farmer) => {
                      const history = chatHistories[farmer] || [];
                      const lastMsg = history[history.length - 1];
                      const isSelected = activeChatFarmer === farmer;

                      return (
                        <div 
                          key={farmer}
                          onClick={() => setActiveChatFarmer(farmer)}
                          className={cn(
                            "p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3",
                            isSelected 
                              ? "bg-blue-50/50 border-blue-400 shadow-xs" 
                              : "bg-white border-natural-border hover:bg-natural-bg/20"
                          )}
                        >
                          <div className="w-10 h-10 rounded-full bg-natural-bg border-2 border-natural-border flex items-center justify-center font-black text-blue-600">
                            {farmer[7]}
                          </div>
                          <div className="space-y-0.5 overflow-hidden flex-1">
                            <div className="flex justify-between items-baseline">
                              <h5 className="font-bold text-xs text-natural-text">{farmer}</h5>
                              <span className="text-[8px] text-natural-muted font-mono">{lastMsg?.timestamp || 'N/A'}</span>
                            </div>
                            <p className="text-[10px] text-natural-muted truncate">{lastMsg?.text || 'No messages'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Broadcast notice board form */}
                  <div className="bg-[#FAF9F6] border border-natural-border p-5 rounded-2xl space-y-4 pt-6">
                    <h5 className="text-[10px] font-black text-natural-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Bell size={12} className="text-orange-500 animate-bounce" />
                      Regional Advisory Broadcaster
                    </h5>

                    <form onSubmit={handleBroadcast} className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-natural-muted block mb-1">Target zone</label>
                        <select 
                          value={broadcastRegion}
                          onChange={(e) => setBroadcastRegion(e.target.value)}
                          className="w-full bg-white border border-natural-border p-2 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          <option value="All Regions">All Coffee Cooperatives</option>
                          <option value="Jimma Zone">Jimma Highland Zone</option>
                          <option value="Sidama District">Sidama Cooperative District</option>
                          <option value="Harar Highlands">Harar Highlands</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-natural-muted block mb-1">Broadcasting Advisory warning</label>
                        <textarea 
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="e.g. Temperature spikes expected tomorrow. Water crops in the early morning to prevent moisture stress..."
                          className="w-full bg-white border border-natural-border p-3 rounded-xl text-xs focus:outline-none min-h-[70px]"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2 bg-orange-600 text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Transmit Broad Warning
                      </button>
                    </form>
                  </div>
                </div>

                {/* Main Interactive Messenger Console */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border rounded-2xl h-[450px] flex flex-col justify-between overflow-hidden shadow-xs">
                    
                    {/* Chat Header */}
                    <div className="p-4 bg-[#FAF9F6] border-b flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-xs">
                          {activeChatFarmer[7]}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-natural-text">{activeChatFarmer}</h4>
                          <span className="text-[9px] text-natural-muted font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                            Connected via Mobile Hub
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded">Expert Consultant</span>
                    </div>

                    {/* Message Log */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#FAF9F6]/20">
                      {(chatHistories[activeChatFarmer] || []).map((msg) => {
                        const isSelf = msg.senderRole === 'expert';
                        return (
                          <div 
                            key={msg.id}
                            className={cn(
                              "flex flex-col max-w-[80%] space-y-1",
                              isSelf ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                          >
                            <span className="text-[9px] text-natural-muted font-bold">{msg.senderName}</span>
                            <div className={cn(
                              "p-3 rounded-2xl text-xs font-semibold leading-relaxed",
                              isSelf ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-natural-text border rounded-tl-none shadow-xs"
                            )}>
                              {msg.text}
                            </div>
                            <span className="text-[8px] text-natural-muted/60 font-mono">{msg.timestamp}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Input Controller */}
                    <div className="p-4 bg-white border-t flex gap-2">
                      <input 
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={`Address advisories to ${activeChatFarmer}...`}
                        className="flex-1 bg-natural-bg/50 border rounded-xl px-4 py-2.5 text-xs text-natural-text focus:outline-none focus:border-blue-500/30 font-medium"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0 shadow-md shadow-blue-600/10"
                      >
                        <Send size={16} />
                      </button>
                    </div>

                  </div>

                  {/* Broadcast History */}
                  <div className="space-y-3 bg-[#FAF9F6] p-4 rounded-xl border border-natural-border">
                    <h5 className="text-[10px] font-black text-natural-muted uppercase tracking-wider">Recent Regional Warnings</h5>
                    <div className="space-y-2">
                      {pastBroadcasts.slice(0, 2).map((b) => (
                        <div key={b.id} className="bg-white p-3 rounded-lg border flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">{b.region}</span>
                            <p className="text-xs text-natural-text mt-0.5">{b.text}</p>
                          </div>
                          <span className="text-[9px] text-natural-muted/60 font-mono">{b.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 6: REPORTS & ANALYTICS (Historic report files, Generate region summary, pdf simulator) */}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider text-natural-text">Historic Agronomic Diagnostic Logs</h3>
                  <p className="text-xs text-natural-muted">Export verified leaf rust indexes, nutrient balances, and regional soil health dossiers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Interactive Dynamic Report Summarizer */}
                <div className="lg:col-span-1 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 border border-blue-100 p-6 rounded-2xl space-y-6">
                  <div className="w-12 h-12 bg-white rounded-xl border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                    <FileSpreadsheet size={24} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-natural-text">Regional Agronomy Dossier</h4>
                    <p className="text-xs text-natural-muted leading-relaxed font-medium">
                      Select any active coffee cooperative farm boundary below to compile and download its comprehensive diagnostics profile.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {farms.map((farm) => (
                      <button 
                        key={farm.id}
                        onClick={() => handleGeneratePDF(farm.name)}
                        className="w-full bg-white border border-natural-border hover:border-blue-400 p-3.5 rounded-xl text-left text-xs font-bold text-natural-text flex justify-between items-center hover:bg-blue-50/30 transition-colors shadow-xs"
                      >
                        <div className="truncate">
                          <span>{farm.name}</span>
                          <p className="text-[10px] text-natural-muted font-normal mt-0.5">{farm.cropType} | Size: {farm.size}ha</p>
                        </div>
                        <Download size={14} className="text-blue-600 shrink-0" />
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleGeneratePDF('All Regions Summary')}
                    className="w-full py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/15 flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    Export Full Regional Audit
                  </button>
                </div>

                {/* Master reports archive table */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-800">Verified Advisory History Log</h4>

                  <div className="bg-[#FAF9F6] border border-natural-border rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-natural-border text-[9px] font-black uppercase tracking-widest text-natural-muted">
                            <th className="p-4 pl-6">Report Identifier</th>
                            <th className="p-4">Farm Association</th>
                            <th className="p-4">Agronomist Assessment</th>
                            <th className="p-4 text-right pr-6">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-natural-border/30">
                          {recentAnalyses.map((rep) => (
                            <tr key={rep.id} className="hover:bg-white/50 transition-colors">
                              <td className="p-4 pl-6 font-mono font-bold text-[11px] text-blue-600">
                                {rep.id.toUpperCase()}
                              </td>
                              <td className="p-4 font-bold text-neutral-800">
                                {farms.find(f => f.id === rep.farmId)?.name || 'Highland Organic'}
                              </td>
                              <td className="p-4 font-semibold text-natural-muted">
                                <div className="max-w-xs truncate" title={rep.aiFindings}>
                                  {rep.diseaseName} ({rep.severity})
                                </div>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <span className={cn(
                                  "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase",
                                  rep.status === 'verified' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                )}>
                                  {rep.status.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-blue-50/20 p-5 rounded-2xl border border-blue-100 flex items-start gap-3 mt-4">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-blue-900">Auditable System Diagnostics</h5>
                      <p className="text-[11px] text-natural-muted leading-relaxed font-medium">
                        All advisor sign-offs, overrides, and recommended prescriptions are secured using standard Firestore cryptography rules. Changes to reports trigger automated audit hashes on regional agricultural servers.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* Image Zoom Overlay Modal */}
      <AnimatePresence>
        {zoomImage && (
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setZoomImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-3xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={zoomImage} alt="Canopy Zoom" className="w-full h-auto rounded-2xl border-4 border-white/10 max-h-[85vh] object-contain" />
              <button 
                onClick={() => setZoomImage(null)}
                className="absolute -top-12 right-0 text-white font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                Close View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
