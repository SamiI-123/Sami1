import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Moon, Sun, Globe, Shield, Database, 
  ChevronRight, Bell, Smartphone, Key, Lock,
  HardDrive, Cloud, AlertCircle, Cpu, Video, Wifi, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Raspberry Pi Configurations
  const [piStreamTunnel, setPiStreamTunnel] = useState(() => localStorage.getItem('pi_stream_tunnel') || 'https://23655e3abc50784a-196-190-62-88.serveousercontent.com');
  const [piStreamLocal, setPiStreamLocal] = useState(() => localStorage.getItem('pi_stream_local') || 'http://172.20.10.6:5001');
  const [piDataTunnel, setPiDataTunnel] = useState(() => localStorage.getItem('pi_data_tunnel') || 'https://23655e3abc50784a-196-190-62-88.serveousercontent.com/data');
  const [piDataLocal, setPiDataLocal] = useState(() => localStorage.getItem('pi_data_local') || 'http://172.20.10.6:5001/data');
  const [piActiveMode, setPiActiveMode] = useState(() => localStorage.getItem('pi_active_mode') || 'tunnel');
  const [piRenderMode, setPiRenderMode] = useState(() => localStorage.getItem('pi_render_mode') || 'image');
  const [piCameraPath, setPiCameraPath] = useState(() => localStorage.getItem('pi_camera_path') || '/video_feed');
  const [piSensorSync, setPiSensorSync] = useState(() => localStorage.getItem('pi_sensor_sync') === 'true');
  const [testResult, setTestResult] = useState('Not tested yet');

  const handleSavePiConfig = (key: string, value: any) => {
    if (key === 'mode') {
      setPiActiveMode(value);
      localStorage.setItem('pi_active_mode', value);
    } else if (key === 'renderMode') {
      setPiRenderMode(value);
      localStorage.setItem('pi_render_mode', value);
    } else if (key === 'cameraPath') {
      setPiCameraPath(value);
      localStorage.setItem('pi_camera_path', value);
    } else if (key === 'streamTunnel') {
      setPiStreamTunnel(value);
      localStorage.setItem('pi_stream_tunnel', value);
    } else if (key === 'streamLocal') {
      setPiStreamLocal(value);
      localStorage.setItem('pi_stream_local', value);
    } else if (key === 'dataTunnel') {
      setPiDataTunnel(value);
      localStorage.setItem('pi_data_tunnel', value);
    } else if (key === 'dataLocal') {
      setPiDataLocal(value);
      localStorage.setItem('pi_data_local', value);
    } else if (key === 'sensorSync') {
      setPiSensorSync(value);
      localStorage.setItem('pi_sensor_sync', value ? 'true' : 'false');
    }
  };

  const testPiDataConnection = async () => {
    const isTunnel = piActiveMode === 'tunnel';
    const endpoint = isTunnel ? piDataTunnel : piDataLocal;
    
    setTestResult('Connecting to ' + endpoint + '...');
    
    try {
      // Create a small timeout so the query doesn't hang forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Fetch directly if HTTPS tunnel, otherwise browsers might block local HTTP
      // Let's call the endpoint
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP status: ${res.status}`);
      }

      const rawText = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        throw new Error('Response received but was not valid JSON format');
      }

      setTestResult(`Success! Sub-surface payload: Moisture: ${parsed.moisture ?? 'N/A'}%, Temp: ${parsed.temperature ?? 'N/A'}°C, Humidity: ${parsed.humidity ?? 'N/A'}%`);
    } catch (e: any) {
      console.warn("Direct test failed, attempting proxy proxy route connection...");
      
      // If direct fetch is blocked by CORS or mixed content warnings on secure domains,
      // we can attempt a server-side proxy request!
      try {
        const proxyUrl = `/api/pi-proxy?url=${encodeURIComponent(endpoint)}`;
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          const parsed = await proxyRes.json();
          setTestResult(`Success (via Proxy)! Payload: Moisture: ${parsed.moisture ?? 'N/A'}%, Temp: ${parsed.temperature ?? 'N/A'}°C, Humidity: ${parsed.humidity ?? 'N/A'}%`);
          return;
        }
      } catch (proxyError: any) {
        console.error("Proxy failure:", proxyError);
      }

      if (e.name === 'AbortError') {
        setTestResult('Failed: Connection timed out. Make sure your Python Flask/streaming app is actively running.');
        return;
      }
      
      setTestResult(`Failed: ${e.message}. (Hint: If testing a local IP http:// address inside an https:// preview, please allow Mixed Content in your browser or stick to the secure tunnel).`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold text-natural-text tracking-tight">System Settings</h2>
        <p className="text-natural-muted font-medium mt-1">Configure platform behavior and security</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'general', label: 'General', icon: Smartphone },
          { id: 'pi', label: 'Pi Integration', icon: Cpu },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'data', label: 'Data & Backup', icon: Database },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary-green text-white shadow-lg shadow-primary-green/20" 
                : "bg-white text-natural-text border border-natural-border hover:bg-natural-bg"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] p-4 border border-natural-border shadow-sm overflow-hidden">
        {activeTab === 'general' && (
          <div className="divide-y divide-natural-bg">
            <ToggleSetting 
              icon={darkMode ? Moon : Sun}
              label="Dark Appearance"
              description="Switch between light and dark visual modes"
              active={darkMode}
              onToggle={() => setDarkMode(!darkMode)}
            />
            <SelectSetting 
              icon={Globe}
              label="Language"
              description="Choose your preferred system language"
              value="English (International)"
              options={["English (International)", "Amharic (Ethiopia)", "Spanish", "French"]}
            />
            <ActionSetting 
              icon={Smartphone}
              label="Mobile Sync"
              description="Last cloud sync: today at 04:30 AM"
              actionLabel="Sync Now"
            />
          </div>
        )}

        {activeTab === 'pi' && (
          <div className="p-8 space-y-8">
            <div className="bg-primary-green/5 border border-primary-green/20 rounded-[2rem] p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-sm font-black uppercase tracking-widest text-primary-green">Active Pipeline Connectivity</h4>
                <p className="text-xs text-natural-muted font-medium">Choose between the secure public tunnel or your local network Wifi IP.</p>
              </div>
              <div className="flex bg-natural-bg p-1.5 rounded-2xl border border-natural-border">
                <button
                  type="button"
                  onClick={() => handleSavePiConfig('mode', 'tunnel')}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all",
                    piActiveMode === 'tunnel' 
                      ? "bg-white text-primary-green border border-natural-border shadow-md" 
                      : "text-natural-muted hover:text-natural-text"
                  )}
                >
                  Public Tunnel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePiConfig('mode', 'local')}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all",
                    piActiveMode === 'local' 
                      ? "bg-white text-primary-green border border-natural-border shadow-md" 
                      : "text-natural-muted hover:text-natural-text"
                  )}
                >
                  Local Wifi IP
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Camera Stream Panel */}
              <div className="bg-natural-bg/30 border border-natural-border p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-green/10 rounded-xl flex items-center justify-center text-primary-green">
                    <Video size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-natural-text">Camera Stream Settings</h4>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">Pi Cam Streaming Source</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-2">Public Tunnel URL</label>
                    <input
                      type="text"
                      value={piStreamTunnel}
                      onChange={(e) => handleSavePiConfig('streamTunnel', e.target.value)}
                      placeholder="e.g. https://23655e3abc50784a-196-190-62-88.serveousercontent.com"
                      className="w-full bg-white border border-natural-border p-4 rounded-xl text-xs font-mono text-natural-text focus:outline-none focus:border-primary-green/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-2">Local IP Address</label>
                    <input
                      type="text"
                      value={piStreamLocal}
                      onChange={(e) => handleSavePiConfig('streamLocal', e.target.value)}
                      placeholder="e.g. http://172.20.10.6:5001"
                      className="w-full bg-white border border-natural-border p-4 rounded-xl text-xs font-mono text-natural-text focus:outline-none focus:border-primary-green/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-2">Streaming Path / Slash Route</label>
                    <input
                      type="text"
                      value={piCameraPath}
                      onChange={(e) => handleSavePiConfig('cameraPath', e.target.value)}
                      placeholder="e.g. /video_feed or /stream.mjpg"
                      className="w-full bg-white border border-natural-border p-4 rounded-xl text-xs font-mono text-natural-text focus:outline-none focus:border-primary-green/50"
                    />
                    <span className="text-[9px] text-natural-muted font-medium mt-1.5 block leading-normal">
                      Specify the stream route (e.g. <code className="bg-white px-1">/video_feed</code> or leave blank for home).
                    </span>
                  </div>

                  <div className="pt-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-2">Stream Source Element</label>
                    <div className="flex bg-white p-1 rounded-xl border border-natural-border">
                      <button
                        type="button"
                        onClick={() => handleSavePiConfig('renderMode', 'image')}
                        className={cn(
                          "flex-1 text-[9px] font-black uppercase tracking-wider py-2.5 rounded-lg transition-all",
                          piRenderMode === 'image' ? "bg-primary-green text-white shadow-sm" : "text-natural-muted"
                        )}
                      >
                        MJPEG (Direct Image)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePiConfig('renderMode', 'iframe')}
                        className={cn(
                          "flex-1 text-[9px] font-black uppercase tracking-wider py-2.5 rounded-lg transition-all",
                          piRenderMode === 'iframe' ? "bg-primary-green text-white shadow-sm" : "text-natural-muted"
                        )}
                      >
                        Embed (Iframe UI)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Sources Panel */}
              <div className="bg-natural-bg/30 border border-natural-border p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-tan/10 rounded-xl flex items-center justify-center text-accent-tan">
                    <Wifi size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-natural-text">Sensor Data Settings</h4>
                    <p className="text-[10px] text-natural-muted font-bold uppercase tracking-wider">DHT Telemetry Gatherer</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-2">Public Data endpoint</label>
                    <input
                      type="text"
                      value={piDataTunnel}
                      onChange={(e) => handleSavePiConfig('dataTunnel', e.target.value)}
                      placeholder="e.g. https://23655e3abc50784a-196-190-62-88.serveousercontent.com/data"
                      className="w-full bg-white border border-natural-border p-4 rounded-xl text-xs font-mono text-natural-text focus:outline-none focus:border-primary-green/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-natural-muted block mb-2">Local Data Endpoint</label>
                    <input
                      type="text"
                      value={piDataLocal}
                      onChange={(e) => handleSavePiConfig('dataLocal', e.target.value)}
                      placeholder="e.g. http://172.20.10.6:5001/data"
                      className="w-full bg-white border border-natural-border p-4 rounded-xl text-xs font-mono text-natural-text focus:outline-none focus:border-primary-green/50"
                    />
                  </div>

                  <div className="pt-4 border-t border-natural-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-natural-text block leading-none">Enable Pi Sync</label>
                        <span className="text-[10px] text-natural-muted font-medium block leading-normal">
                          Fetch active moisture, temperature, and humidity directly from your Raspberry Pi DHT sensor grids!
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleSavePiConfig('sensorSync', !piSensorSync)}
                        className={cn(
                          "w-12 h-7 rounded-full p-1 transition-all relative flex items-center shadow-inner shrink-0",
                          piSensorSync ? "bg-primary-green" : "bg-natural-border"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 bg-white rounded-full shadow transition-all transform",
                          piSensorSync ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test connection results */}
            <div className="bg-white border border-natural-border rounded-[2rem] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Activity className="text-primary-green" size={20} />
                <h4 className="text-xs font-black uppercase tracking-widest text-natural-text">Pipeline Diagnostics</h4>
              </div>

              <div className="text-xs text-natural-muted font-medium space-y-2 leading-relaxed">
                <p>
                  To view the camera stream and pull sensor parameters securely, both endpoints should be running on the respective ports on your Raspberry Pi.
                </p>
                <p className="bg-yellow-50/50 border border-yellow-100 p-3 rounded-xl text-[11px] text-yellow-800">
                  ⚠️ <strong>CORS Note:</strong> If your local Wifi IP Flask server doesn't respond because the browser blocks insecure <code className="font-mono">http://</code> origins inside the secure sandbox, please use the public HTTPS Tunnel (<code className="font-mono">https://...serveousercontent.com</code>), or test with the "Test Sensor Data Endpoint" button below. We have implemented a secure server-side Proxy bypass route in Agrinovia to resolve this automatically!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button
                  type="button"
                  onClick={testPiDataConnection}
                  className="px-6 py-4 bg-primary-green hover:bg-primary-green-dark text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                >
                  Test Sensor Data Connection
                </button>
                <div className={cn(
                  "p-4 rounded-xl text-xs font-mono tracking-tight flex-1 border min-h-[48px] flex items-center",
                  testResult.includes('Success!') || testResult.includes('Success (via Proxy)!')
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : testResult.includes('Failed') || testResult.includes('error')
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-natural-bg text-natural-muted border-natural-border"
                )}>
                  {testResult}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="divide-y divide-natural-bg">
            <ActionSetting 
              icon={Key}
              label="Change Password"
              description="Regular password updates improve account safety"
              actionLabel="Update"
            />
            <ToggleSetting 
              icon={Shield}
              label="Two-Factor Auth"
              description="Secure your account with OTP verification"
              active={true}
            />
            <ActionSetting 
              icon={Lock}
              label="Active Sessions"
              description="View and manage where you are logged in"
              actionLabel="View All"
            />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="divide-y divide-natural-bg">
            <ActionSetting 
              icon={Cloud}
              label="Cloud Backup"
              description="Automatic backup to decentralized storage"
              actionLabel="Configure"
            />
            <ActionSetting 
              icon={HardDrive}
              label="Export Data"
              description="Download your sensor history and reports in CSV/PDF"
              actionLabel="Download"
            />
            <div className="p-8 group hover:bg-red-50/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 shadow-inner">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-natural-text">Delete Account</h4>
                    <p className="text-sm text-natural-muted font-medium">Permanently remove all data and association</p>
                  </div>
                </div>
                <button className="text-red-500 font-black uppercase tracking-widest text-[10px] bg-white border border-red-200 px-6 py-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
           <div className="divide-y divide-natural-bg">
              <ToggleSetting 
                icon={Bell}
                label="Critical Alerts"
                description="Immediately notify for server node failures"
                active={true}
              />
              <ToggleSetting 
                icon={Bell}
                label="Mission Updates"
                description="Receive alerts when drone sessions complete"
                active={true}
              />
           </div>
        )}
      </div>
    </div>
  );
}

function ToggleSetting({ icon: Icon, label, description, active, onToggle }: any) {
  return (
    <div className="p-8 flex items-center justify-between group hover:bg-natural-bg/50 transition-colors">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-natural-bg flex items-center justify-center text-primary-green shadow-inner">
          <Icon size={28} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-natural-text">{label}</h4>
          <p className="text-sm text-natural-muted font-medium">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-14 h-8 rounded-full p-1 transition-all relative shadow-inner",
          active ? "bg-primary-green" : "bg-natural-border"
        )}
      >
        <div className={cn(
          "w-6 h-6 bg-white rounded-full shadow-lg transition-all transform",
          active ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function SelectSetting({ icon: Icon, label, description, value, options }: any) {
  return (
    <div className="p-8 flex items-center justify-between group hover:bg-natural-bg/50 transition-colors">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-natural-bg flex items-center justify-center text-accent-tan shadow-inner">
          <Icon size={28} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-natural-text">{label}</h4>
          <p className="text-sm text-natural-muted font-medium">{description}</p>
        </div>
      </div>
      <div className="bg-natural-bg px-4 py-2 rounded-xl border border-natural-border text-[10px] font-black uppercase tracking-widest text-natural-muted flex items-center gap-2 cursor-pointer hover:text-natural-text">
        {value}
        <ChevronRight size={14} />
      </div>
    </div>
  );
}

function ActionSetting({ icon: Icon, label, description, actionLabel }: any) {
  return (
    <div className="p-8 flex items-center justify-between group hover:bg-natural-bg/50 transition-colors">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-natural-bg flex items-center justify-center text-natural-muted shadow-inner group-hover:text-primary-green transition-colors">
          <Icon size={28} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-natural-text">{label}</h4>
          <p className="text-sm text-natural-muted font-medium">{description}</p>
        </div>
      </div>
      <button className="text-[10px] font-black uppercase tracking-widest bg-white border border-natural-border px-6 py-3 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-transform active:scale-95 group-hover:border-primary-green/30">
        {actionLabel}
      </button>
    </div>
  );
}
