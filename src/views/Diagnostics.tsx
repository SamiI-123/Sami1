import React, { useState, useRef, useEffect } from 'react';
import { analyzeCropDisease } from '../services/geminiService';
import { 
  ShieldAlert, Upload, Image as ImageIcon, Sparkles, 
  CheckCircle2, AlertCircle, RefreshCw, Loader2, Camera, X, SwitchCamera, History, Clock, FileDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { exportReportToPDF, exportToCSV, exportHistoryToPDF } from '../lib/exportUtils';

export default function Diagnostics() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingPastReport, setViewingPastReport] = useState<any | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCameras();
    if (user) {
      loadHistory();
    }
    return () => {
      stopCamera();
    };
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'ai_reports'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs: any[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setHistory(docs);
    } catch (err: any) {
      console.error("Error loading history:", err);
      if (err.message?.includes('permission-denied')) {
        console.error("Permissions error: Check security rules for ai_reports list");
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveReport = async (findings: string, imgData: string) => {
    if (!user) {
      console.warn("User not logged in, analysis not saved to history.");
      return;
    }
    try {
      await addDoc(collection(db, 'ai_reports'), {
        ownerId: user.uid,
        findings,
        imageUrl: imgData,
        status: 'completed',
        createdAt: serverTimestamp(),
      });
      await loadHistory();
    } catch (err: any) {
      console.error("Error saving report:", err);
      // If image too large or permission denied
      if (err.message?.includes('value-too-large') || err.message?.includes('exceeds the limit')) {
        alert("Image too large to save in history. Analysis shown above but not saved.");
      } else if (err.message?.includes('permission-denied')) {
        console.error("Permissions error: Check security rules for ai_reports create");
      }
    }
  };

  const checkCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (err) {
      console.warn("Could not enumerate devices:", err);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(newMode), 100);
    }
  };

  const startCamera = async (mode = facingMode) => {
    setIsCameraActive(true);
    setCameraError(null);
    try {
      // First attempt with constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false 
      });
      setupStream(stream);
    } catch (err) {
      console.warn("First camera attempt failed, trying fallback:", err);
      try {
        // Fallback: any video source
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        });
        setupStream(stream);
      } catch (fallbackErr) {
        console.error("Camera access error:", fallbackErr);
        setCameraError("Could not access camera. Please check permissions.");
        setIsCameraActive(false);
      }
    }
  };

  const setupStream = (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.error("Video play error:", e));
      };
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Visual feedback
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);

      // Check if video dimensions are available
      const width = video.videoWidth || video.clientWidth;
      const height = video.videoHeight || video.clientHeight;

      if (width === 0 || height === 0) {
        setCameraError("Camera signal weak or not ready.");
        return;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImage(dataUrl);
          setReport(null);
          // Small delay before stopping to let flash finish
          setTimeout(stopCamera, 200);
        } catch (err) {
          console.error("Capture failed:", err);
          setCameraError("Failed to capture image data.");
        }
      }
    } else {
      setCameraError("Capture interface not initialized.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setReport(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    setViewingPastReport(null); // Clear viewing past report if scanning new
    try {
      const result = await analyzeCropDisease(image);
      const finalReport = result || "No diagnosis could be made.";
      setReport(finalReport);
      // Save to history
      await saveReport(finalReport, image);
    } catch (err) {
      console.error(err);
      setReport("An error occurred during analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm h-fit">
          <h3 className="text-xl font-bold text-natural-text mb-3 flex items-center gap-3">
            <ShieldAlert className="text-accent-tan" size={28} />
            Agrinovia Diagnostics
          </h3>
          <p className="text-natural-muted font-medium mb-10 pb-6 border-b border-natural-bg text-sm">
            Upload proximity drone shots for instant disease identification and health assessment.
          </p>

          <div className="space-y-8">
            <div 
              className={cn(
                "relative aspect-video rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-natural-bg shadow-inner",
                (image || viewingPastReport) ? "border-transparent" : "border-natural-border"
              )}
            >
              {isCameraActive ? (
                <div className="absolute inset-0 flex flex-col bg-black">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Flash Overlay */}
                  <div className={cn(
                    "absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none z-20",
                    isFlashing ? "opacity-100" : "opacity-0"
                  )} />

                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-30">
                    <button 
                      onClick={captureImage}
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all hover:scale-110"
                      title="Capture photo"
                    >
                      <div className="w-12 h-12 border-4 border-primary-green rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary-green rounded-full"></div>
                      </div>
                    </button>
                    {hasMultipleCameras && (
                      <button 
                        onClick={toggleCamera}
                        className="absolute left-6 bottom-4 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors"
                        title="Switch camera"
                      >
                        <SwitchCamera size={24} />
                      </button>
                    )}
                    <button 
                      onClick={stopCamera}
                      className="absolute right-6 bottom-4 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors"
                      title="Close camera"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              ) : (viewingPastReport || image) ? (
                <>
                  <img src={viewingPastReport?.imageUrl || image || ''} alt="Analysis Target" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-primary-green/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <div className="flex gap-4">
                      <button 
                        onClick={() => { setImage(null); setViewingPastReport(null); setReport(null); }}
                        className="bg-white text-primary-green px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-transform"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={() => startCamera()}
                        className="bg-accent-tan text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        <Camera size={18} />
                        New Photo
                      </button>
                     </div>
                  </div>
                </>
              ) : (
                <div className="p-8 w-full h-full flex flex-col items-center justify-center group relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
                    <button 
                      onClick={() => startCamera()}
                      className="flex flex-col items-center justify-center gap-5 p-10 border-4 border-accent-tan border-dashed rounded-[2.5rem] bg-accent-tan/5 hover:bg-accent-tan/10 hover:border-accent-tan transition-all group/camera shadow-xl shadow-accent-tan/5 active:scale-95"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-accent-tan border-2 border-natural-border shadow-md transition-transform group-hover/camera:scale-110 group-hover/camera:rotate-6">
                        <Camera size={40} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-natural-text uppercase tracking-widest mb-1">Open Camera</p>
                        <p className="text-xs text-natural-muted font-medium">Take a live photo of your crop</p>
                      </div>
                    </button>

                    <label className="flex flex-col items-center justify-center gap-5 p-10 border-4 border-natural-border border-dashed rounded-[2.5rem] bg-white hover:bg-primary-green/5 hover:border-primary-green transition-all cursor-pointer group/upload active:scale-95">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary-green border-2 border-natural-border shadow-md transition-transform group-hover/upload:scale-110 group-hover/upload:-rotate-6">
                        <Upload size={40} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-natural-text uppercase tracking-widest mb-1">Upload File</p>
                        <p className="text-xs text-natural-muted font-medium">Use photo from gallery</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        accept="image/*"
                      />
                    </label>
                  </div>
                  {cameraError && (
                    <p className="absolute bottom-4 text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {cameraError}
                    </p>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <button
              onClick={runAnalysis}
              disabled={(!image && !viewingPastReport) || loading || isCameraActive}
              className="w-full bg-primary-green disabled:bg-natural-border text-white font-bold py-5 rounded-[1.5rem] shadow-xl shadow-primary-green/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} className="text-accent-tan" />}
              {loading ? "Processing..." : (viewingPastReport ? "Re-Analyze Past Photo" : "Run Analysis")}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm relative min-h-[500px] overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <ShieldAlert size={120} className="text-primary-green" />
          </div>

          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
               <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-8 border-natural-bg rounded-full"></div>
                  <div className="absolute inset-0 border-8 border-t-accent-tan rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Activity size={48} className="text-primary-green animate-pulse" />
                  </div>
               </div>
               <h4 className="text-xl font-bold text-natural-text">Agrinovia AI Engine active</h4>
               <p className="text-sm text-natural-muted mt-3 font-medium max-w-xs mx-auto">Cross-referencing leaf morphology with our pest & disease knowledge base.</p>
            </div>
          ) : (report || viewingPastReport) ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-natural-bg">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-green mb-1">Diagnostic Report</h4>
                    <p className="text-xs text-natural-muted font-bold">
                      {viewingPastReport?.createdAt?.toDate ? viewingPastReport.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}
                    </p>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => exportReportToPDF(viewingPastReport?.findings || report || '', 'agrinovia_report')}
                      className="p-3 bg-natural-bg rounded-2xl text-natural-muted hover:text-accent-tan transition-all"
                      title="Export PDF"
                    >
                      <FileDown size={20} />
                    </button>
                    <div className="bg-[#E9EDC6] p-3 rounded-2xl">
                      <CheckCircle2 className="text-primary-green" size={24} />
                    </div>
                 </div>
              </div>
              <div className="prose prose-sm max-w-none prose-p:text-natural-text prose-strong:text-primary-green prose-headings:text-primary-green prose-headings:font-bold prose-headings:font-serif markdown-body">
                 <ReactMarkdown>{viewingPastReport?.findings || report || ''}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
               <div className="w-20 h-20 bg-natural-bg rounded-full flex items-center justify-center mb-6 text-natural-border border border-natural-border">
                  <ShieldAlert size={40} />
               </div>
               <h4 className="text-xl font-bold text-natural-border">Awaiting Data</h4>
               <p className="text-sm text-natural-muted mt-2 font-medium max-w-xs mx-auto">Upload and scan an image to receive detailed health diagnostics from plantevelage and AI.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-natural-border shadow-sm">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-natural-bg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-tan/10 rounded-2xl flex items-center justify-center text-accent-tan">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-natural-text">Previous Analyses</h3>
              <p className="text-xs text-natural-muted font-medium mt-1">Review your past crop health diagnostics.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => exportHistoryToPDF(history, 'agrinovia_history')}
              className="flex items-center gap-2 px-4 py-2 bg-natural-bg rounded-xl text-[10px] font-black uppercase tracking-widest text-natural-muted hover:text-accent-tan transition-all"
              title="Export Full History as PDF"
            >
              <FileDown size={14} />
              Export History (PDF)
            </button>
            <button 
              onClick={loadHistory}
            className="p-3 text-natural-muted hover:text-primary-green transition-colors"
            title="Refresh History"
          >
            <RefreshCw size={20} className={cn(loadingHistory && "animate-spin")} />
          </button>
        </div>
      </div>

      {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <Loader2 className="animate-spin text-natural-muted mb-4" size={32} />
            <p className="text-xs font-black uppercase tracking-widest text-natural-muted">Loading your records...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((record) => (
              <div 
                key={record.id}
                onClick={() => {
                  setViewingPastReport(record);
                  setReport(null);
                  setImage(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={cn(
                  "group flex gap-4 p-5 rounded-3xl border border-natural-border bg-white cursor-pointer transition-all hover:shadow-lg hover:shadow-primary-green/5 hover:-translate-y-1",
                  viewingPastReport?.id === record.id && "ring-2 ring-primary-green border-primary-green bg-primary-green/5"
                )}
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-natural-bg border border-natural-border shrink-0">
                  <img src={record.imageUrl} alt="Past Analysis" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={12} className="text-accent-tan" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-natural-muted">
                      {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString() : 'Pending...'}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-natural-text line-clamp-2 leading-tight group-hover:text-primary-green transition-colors">
                    {record.findings.split('\n')[0].replace(/[#*]/g, '') || "Untitled Analysis"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-natural-bg/50 rounded-[2rem] border-2 border-dashed border-natural-border">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-natural-border border border-natural-border">
              <History size={24} />
            </div>
            <p className="text-sm font-bold text-natural-text">No history found</p>
            <p className="text-xs text-natural-muted mt-1">Start your first analysis to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
