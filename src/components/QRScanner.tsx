/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, AlertTriangle, XCircle, Volume2, UserCheck, Calendar, Clock, Award } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { SystemUser, AttendanceRecord } from '../types';
import { getDB, dbOperations } from '../data/mockDatabase';

interface QRScannerProps {
  onScanLogged?: () => void;
  scannerAdmin: string;
  mode?: 'attendance' | 'meal';
}

export default function QRScanner({ onScanLogged, scannerAdmin, mode = 'attendance' }: QRScannerProps) {
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'duplicate' | 'invalid' | null;
    message: string;
    user?: SystemUser;
  }>({ status: null, message: '' });
  const [showPopup, setShowPopup] = useState<boolean>(false);

  const [recentLogs, setRecentLogs] = useState<Array<{
    id: string;
    userName: string;
    userOrg: string;
    scan_date: string;
    scan_time: string;
    status: string;
  }>>([]);
  
  const qrRef = useRef<Html5Qrcode | null>(null);
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync recent logs on mount and when a scan is processed
  const loadRecentLogs = () => {
    const allUsers = getDB.users();
    
    if (mode === 'meal') {
      const allMeals = getDB.meals();
      const enriched = allMeals.map(record => {
        const matchUser = allUsers.find(u => u.id === record.user_id);
        return {
          id: record.id,
          userName: matchUser ? matchUser.full_name : 'Unknown Attendee',
          userOrg: matchUser ? matchUser.organization : 'Unknown Organization',
          scan_date: record.scan_date,
          scan_time: record.scan_time,
          status: record.meal_status,
        };
      }).sort((a, b) => b.scan_date.localeCompare(a.scan_date) || b.scan_time.localeCompare(a.scan_time));
      setRecentLogs(enriched);
    } else {
      const allAttendance = getDB.attendance();
      const enriched = allAttendance.map(record => {
        const matchUser = allUsers.find(u => u.id === record.user_id);
        return {
          id: record.id,
          userName: matchUser ? matchUser.full_name : 'Unknown Attendee',
          userOrg: matchUser ? matchUser.organization : 'Unknown Organization',
          scan_date: record.scan_date,
          scan_time: record.scan_time,
          status: record.attendance_status,
        };
      }).sort((a, b) => b.scan_date.localeCompare(a.scan_date) || b.scan_time.localeCompare(a.scan_time));
      setRecentLogs(enriched);
    }
  };

  useEffect(() => {
    loadRecentLogs();
  }, [mode]);

  // Voice speech synthesis helper
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel(); // Clear current queue
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech blocked: ', e);
      }
    }
  };

  // Safe standard synthesizer audio feedback
  const playBeep = (type: 'success' | 'warning' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Quick clean beep
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'warning') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Lower warning tone
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); // Low error buzz
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.45);
      }
    } catch (e) {
      console.log('Audio feedback context blocked: ', e);
    }
  };

  // Webcam controls
  const startWebcam = async () => {
    if (cameraActive || qrRef.current) return;
    
    setUseWebcam(true);
    setCameraActive(true);
    
    // Delay initialization slightly to let React finish rendering the target div
    setTimeout(async () => {
      try {
        let cameraId: any = { facingMode: "environment" };
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
            cameraId = backCam ? backCam.id : devices[0].id;
          }
        } catch (e) {
          console.warn('Failed to enumerate cameras, falling back to constraint-based facingMode', e);
        }

        const qrScanner = new Html5Qrcode("qr-reader-element");
        qrRef.current = qrScanner;
        
        await qrScanner.start(
          cameraId,
          {
            fps: 24, // High framerate
            // Use native aspect ratios to prevent warping or text distortion on-screen
            aspectRatio: undefined
          },
          (qrCodeMessage) => {
            handleScanSubmit(qrCodeMessage);
          },
          () => {
            // Failure matches continuously, ignore
          }
        );
      } catch (err) {
        console.error('Camera initialization error: ', err);
        alert('Could not start Camera. Please ensure permissions are granted in your browser, or enter code/ID manually if available.');
        setUseWebcam(false);
        setCameraActive(false);
        qrRef.current = null;
      }
    }, 250);
  };

  const stopWebcam = async () => {
    if (qrRef.current) {
      try {
        if (qrRef.current.isScanning) {
          await qrRef.current.stop();
        }
        qrRef.current.clear();
      } catch (err) {
        console.warn("Stopping Error: ", err);
      }
      qrRef.current = null;
    }
    setCameraActive(false);
    setUseWebcam(false);
  };

  useEffect(() => {
    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(err => console.log(err));
      }
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, []);

  // Process SCANNED items and automatically save check-in
  const handleScanSubmit = (qrString: string) => {
    if (!qrString) return;
    
    let result;
    if (mode === 'meal') {
      result = dbOperations.scanMealQRCode(qrString, scannerAdmin);
    } else {
      result = dbOperations.scanQRCode(qrString, scannerAdmin);
    }
    
    // Voice speech & Tone trigger alerts
    if (result.status === 'success') {
      playBeep('success');
      if (mode === 'meal') {
        speakText("Bon Appétit! Welcome to the restaurant");
      } else {
        speakText("Welcome to the forum, " + (result.user?.full_name || ''));
      }
    } else if (result.status === 'duplicate') {
      playBeep('warning');
      if (mode === 'meal') {
        speakText("Meal voucher already scanned!");
      } else {
        speakText("Already checked in!");
      }
    } else {
      playBeep('error');
      speakText("the qr code is not recognized");
    }

    setScanResult({
      status: result.status,
      message: result.message,
      user: result.user,
    });
    
    setShowPopup(true);

    // Refresh desk arrivals list instantly
    loadRecentLogs();

    if (onScanLogged) {
      onScanLogged();
    }

    // Auto dismiss logging popup screens after 4 seconds
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    autoDismissTimer.current = setTimeout(() => {
      setShowPopup(false);
    }, 4000);
  };

  return (
    <div className="relative">
      {/* Immersive Fullscreen Alert Overlay Modal for Scanners */}
      {showPopup && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-2xl rounded-3xl p-8 border-4 text-center shadow-2xl transform scale-100 transition duration-300 ${
            scanResult.status === 'success' 
              ? 'bg-slate-900 border-emerald-500 text-emerald-100 shadow-emerald-950/50' 
              : scanResult.status === 'duplicate' 
              ? 'bg-slate-900 border-amber-500 text-amber-100 shadow-amber-950/50' 
              : 'bg-slate-900 border-rose-500 text-rose-100 shadow-rose-950/50'
          }`}>
            <div className="flex flex-col items-center">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center mb-6 shadow-lg border-2 ${
                scanResult.status === 'success' ? 'bg-emerald-950 border-emerald-400 text-emerald-400 animate-bounce' :
                scanResult.status === 'duplicate' ? 'bg-amber-950 border-amber-400 text-amber-400' :
                'bg-rose-950 border-rose-450 text-rose-450 animate-pulse'
              }`}>
                {scanResult.status === 'success' && <CheckCircle size={52} />}
                {scanResult.status === 'duplicate' && <AlertTriangle size={52} />}
                {scanResult.status === 'invalid' && <XCircle size={52} />}
              </div>

              <h2 className="text-3xl font-black uppercase tracking-wider mb-2 font-sans">
                {scanResult.status === 'success' && (mode === 'meal' ? '🍽️ Bon Appétit' : '✅ Access Granted')}
                {scanResult.status === 'duplicate' && '⚠️ Ticket Claim Warning'}
                {scanResult.status === 'invalid' && '❌ QR NOT RECOGNIZED'}
              </h2>

              <p className="text-lg font-bold mb-6 block leading-relaxed max-w-lg">
                {scanResult.status === 'success' 
                  ? (mode === 'meal' ? `Bon Appétit, welcome to the restaurant!` : `Welcome to the Kurdistan Education Forum!`) 
                  : scanResult.message
                }
              </p>

              {scanResult.user && (
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md text-left space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400 text-xs">Full Name</span>
                    <span className="text-white text-sm">{scanResult.user.full_name}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400 text-xs">Organization</span>
                    <span className="text-white text-sm truncate max-w-[240px]">{scanResult.user.organization}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400 text-xs">Position</span>
                    <span className="text-white text-sm truncate max-w-[240px]">{scanResult.user.position}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400 text-xs">Pass key</span>
                    <span className="text-white text-sm font-mono">{scanResult.user.registration_id}</span>
                  </div>
                  {mode === 'meal' && (
                    <div className="flex justify-between font-bold pt-2 border-t border-slate-700/50">
                      <span className="text-emerald-450 text-xs font-black uppercase">Dietary preference</span>
                      <span className="text-emerald-300 text-xs font-black uppercase bg-emerald-950/70 border border-emerald-900 px-2 py-0.5 rounded">{scanResult.user.food_allergies || 'Standard Meal'}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowPopup(false)}
                className={`mt-8 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow transition duration-250 hover:scale-105 cursor-pointer ${
                  scanResult.status === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950' :
                  scanResult.status === 'duplicate' ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-amber-950' :
                  'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                }`}
              >
                Dismiss frame
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 max-w-5xl mx-auto align-stretch">
        {/* Visual Camera Scan Box */}
        <div className="md:col-span-7 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {mode === 'meal' ? 'Restaurant Voucher Scanner' : 'Security QR Scanner Frame'}
                </h3>
                <p className="text-xs text-slate-400">
                  {mode === 'meal' ? 'Scan credential badge QR to authorize dining entry' : 'Point badge QR code token directly to checkpoint camera'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">
                  {cameraActive ? 'Camera Engaged' : 'Camera Standby'}
                </span>
              </div>
            </div>

            <div className="relative aspect-[4/3] bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-900 shadow-inner group w-full">
              {useWebcam ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">
                  <div id="qr-reader-element" className="w-full h-full bg-black flex items-center justify-center [&_video]:object-contain [&_video]:w-full [&_video]:h-full overflow-hidden" />
                  {/* Laser scanline effect */}
                  <div className="absolute w-[80%] ml-[10%] h-[2px] bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.8)] top-0 left-0 animate-[bounce_3s_infinite] pointer-events-none z-10" />
                </div>
              ) : (
                <div className="text-center p-6 flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 mb-3 border border-slate-800 group-hover:scale-105 transition duration-300">
                    <Camera size={26} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-1">Check-in Camera is Closed</h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-4">
                    Initialize client-side viewport authorization to process real administrative badges.
                  </p>
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-xl font-bold text-xs transition border border-slate-700 font-mono tracking-wider cursor-pointer"
                  >
                    START {mode === 'meal' ? 'RESTAURANT SCAN' : 'STREAM CHECK'}
                  </button>
                </div>
              )}

              {useWebcam && (
                <div className="absolute bottom-3 right-3 flex gap-2 z-20">
                  <button
                    onClick={stopWebcam}
                    className="px-3 py-1.5 bg-rose-600/95 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] uppercase font-mono transition shadow-lg cursor-pointer"
                  >
                    Shut Down
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines bar */}
          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl mt-4 text-xs font-semibold text-slate-600 flex items-start gap-2.5">
            <Volume2 size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-sans">
                {mode === 'meal' ? 'Restaurant scanners verify meal allowance instantly.' : 'Present the printed badge QR or show badge on phone. Sound alerts verify status immediately.'}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Feedback & Recent Desk Arrivals (NO simulator controls) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {/* Output Display Panel */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Instant Scan Result</h4>
            
            {scanResult.status === null ? (
              <div className="py-6 text-center text-slate-400">
                <div className="h-12 w-12 rounded-full border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3">
                  <UserCheck size={20} className="text-slate-300" />
                </div>
                <span className="text-xs font-medium">Ready to process attendees</span>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* Result header alert banner */}
                <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                  scanResult.status === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' :
                  scanResult.status === 'duplicate' ? 'bg-amber-50/50 border-amber-100 text-amber-800' :
                  'bg-rose-50/50 border-rose-100 text-rose-800'
                }`}>
                  <div className="mt-0.5">
                    {scanResult.status === 'success' && <CheckCircle size={18} className="text-emerald-500" />}
                    {scanResult.status === 'duplicate' && <AlertTriangle size={18} className="text-amber-500" />}
                    {scanResult.status === 'invalid' && <XCircle size={18} className="text-rose-500" />}
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider mb-0.5">
                      {scanResult.status === 'success' ? 'VERIFIED' :
                       scanResult.status === 'duplicate' ? 'DUPLICATE EXCEPTION' : 'INVALID CHECK'}
                    </h5>
                    <p className="text-xs font-bold leading-relaxed">{scanResult.message}</p>
                  </div>
                </div>

                {/* Scanned User metadata card */}
                {scanResult.user && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-sm font-black text-slate-800 leading-snug">{scanResult.user.full_name}</h5>
                        <p className="text-[11px] text-slate-400 font-medium">{scanResult.user.position}</p>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-slate-200/50 px-2 py-0.5 rounded text-slate-600 block">
                        {scanResult.user.registration_id}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200/50 my-1.5" />

                    <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-[10px] font-semibold">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Organization</span>
                        <span className="text-slate-700 truncate block">{scanResult.user.organization}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Dietary Needs</span>
                        <span className="text-slate-700 truncate block">{scanResult.user.food_allergies || 'None'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desk Arrivals Roll Log list */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex-1 flex flex-col min-h-[180px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {mode === 'meal' ? 'Restaurant Desk Logs' : 'Desk Entry Logs'}
              </h4>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold font-mono uppercase">
                {recentLogs.length} Checked
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[170px] space-y-2.5 pr-1 text-xs">
              {recentLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-300 font-medium">
                  {mode === 'meal' ? 'No meals recorded' : 'No checkins logged for KEF.'}
                </div>
              ) : (
                recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-100/60 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100/50 transition duration-150">
                    <div className="min-w-0 pr-1">
                      <p className="font-bold text-slate-800 truncate leading-snug">{log.userName}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{log.userOrg}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono font-bold block">{log.scan_time}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                        log.status === 'Present' || log.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
