'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Camera, X, ShieldAlert, Check, AlertCircle, Loader2, Radio, Type } from 'lucide-react';
import { analyzeEmergencyImage, classifyEmergency, AIDetectionResult } from '@/lib/ai/detection';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createAlert } from '@/lib/alertService';
import { AlertDoc } from '@/lib/types';
import { canTriggerAlert, canCallAI, incrementAlertCount, incrementAICount, setDebugField, debugLog, debugError, DEBUG } from '@/lib/debug';

interface EmergencyTriggerProps {
  onClose: () => void;
}

const EmergencyTrigger: React.FC<EmergencyTriggerProps> = ({ onClose }) => {
  const [step, setStep] = useState<'selecting' | 'text' | 'recording' | 'processing' | 'confirming'>('selecting');
  const [recordTime, setRecordTime] = useState(0);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const [processingStep, setProcessingStep] = useState('Listening...');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setActiveAlert, currentUser } = useAppStore();
  const router = useRouter();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'recording') {
      interval = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const checkRateLimits = (): boolean => {
    if (!canTriggerAlert()) { toast.error('Rate limit: Max 3 alerts per session.'); return false; }
    if (!canCallAI()) { toast.error('Rate limit: Max 10 AI calls per session.'); return false; }
    return true;
  };

  // ── Voice ──
  const handleStartRecording = () => {
    if (!checkRateLimits()) return;
    setStep('recording');
    setRecordTime(0);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Speech not supported. Use text input.'); setStep('text'); return; }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    let final = '';
    let done = false;

    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
    };
    rec.onerror = (e: any) => {
      debugError('Speech', e.error);
      if (DEBUG) toast.error(`Speech error: ${e.error}`);
      if (!done) { done = true; setStep('text'); }
    };
    rec.onend = () => {
      if (done) return;
      done = true;
      const t = final.trim();
      if (t) { debugLog('Speech', t); handleProcess(t); }
      else { toast.error('No speech detected.'); setStep('text'); }
    };
    try { rec.start(); } catch { setStep('text'); }
    setTimeout(() => { try { rec?.stop(); } catch {} }, 8000);
  };

  const handleStopRecording = () => { try { recognitionRef.current?.stop(); } catch {} };

  // ── Text ──
  const handleTextSubmit = () => {
    if (!textInput.trim()) { toast.error('Describe your emergency.'); return; }
    if (!checkRateLimits()) return;
    handleProcess(textInput.trim());
  };

  // ── Image ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !checkRateLimits()) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      setStep('processing');
      setProcessingStep('Analyzing with Gemini Vision...');
      try {
        incrementAICount();
        const labels = await analyzeEmergencyImage(base64);
        debugLog('Vision', labels);
        setDebugField({ ai: 'ACTIVE' });
        setProcessingStep('Classifying emergency...');
        incrementAICount();
        const result = await classifyEmergency('Image-based emergency', labels);
        setAiResult(result);
        setStep('confirming');
      } catch (err) {
        debugError('Vision', err);
        setDebugField({ ai: 'FAILED' });
        toast.error('❌ Vision API failed.');
        setStep('selecting');
      }
    };
    reader.readAsDataURL(file);
  };

  // ── AI Pipeline ──
  const handleProcess = async (transcript: string) => {
    setStep('processing');
    setProcessingStep('Classifying emergency...');
    try {
      incrementAICount();
      const result = await classifyEmergency(transcript, ['Distress', 'Voice Command']);
      debugLog('Classify', result);
      setDebugField({ ai: 'ACTIVE' });
      setAiResult(result);
      setStep('confirming');
    } catch (error) {
      debugError('Classify', error);
      setDebugField({ ai: 'FAILED' });
      toast.error('❌ AI Processing Failed.');
      setStep('selecting');
    }
  };

  // ── Confirm & Write to Firestore ──
  const handleConfirm = async () => {
    if (!aiResult || isDispatching) return;
    setIsDispatching(true);

    const alertId = 'alert-' + Date.now();
    const alertDoc: AlertDoc = {
      id: alertId,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.username || 'Unknown',
      userPhone: currentUser?.phone || '',
      type: aiResult.emergencyType,
      severity: aiResult.severity,
      status: 'pending',
      confidence: aiResult.confidence,
      reason: aiResult.reason,
      instructions: aiResult.instructions,
      userLocation: currentUser?.location
        ? { lat: currentUser.location.lat, lng: currentUser.location.lng, address: currentUser.location.address }
        : { lat: 28.6139, lng: 77.2090, address: 'Unknown' },
      createdAt: Date.now(),
    };

    try {
      await createAlert(alertDoc);
      incrementAlertCount();
      setActiveAlert(alertDoc);
      toast.success(`🚨 ${aiResult.emergencyType} reported. Waiting for responder...`);
      onClose();
      router.push('/active');
    } catch (err) {
      debugError('Dispatch', err);
      toast.error('Failed to dispatch alert. Check connection.');
      setIsDispatching(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const sevColor: Record<string, string> = {
    LOW: 'bg-yellow-100 text-yellow-700',
    MEDIUM: 'bg-orange-100 text-orange-600',
    HIGH: 'bg-red-100 text-red-600',
    CRITICAL: 'bg-red-600 text-white',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-10"><X size={28} /></button>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />

      <div className="flex-1 flex flex-col justify-center items-center text-center">

        {step === 'selecting' && (
          <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
            <div className="w-28 h-28 bg-gradient-to-br from-primary to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 pulse-red">
              <ShieldAlert size={52} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Report Emergency</h2>
              <p className="text-white/50 text-sm">Choose input method</p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              {[
                { icon: Mic, label: 'Voice', sub: 'Speak', color: 'bg-primary/20 text-primary', onClick: handleStartRecording },
                { icon: Type, label: 'Text', sub: 'Type', color: 'bg-emerald-500/20 text-emerald-400', onClick: () => setStep('text') },
                { icon: Camera, label: 'Image', sub: 'Photo', color: 'bg-blue-500/20 text-blue-400', onClick: () => fileInputRef.current?.click() },
              ].map((m) => (
                <button key={m.label} onClick={m.onClick} className="flex-1 bg-white/8 hover:bg-white/15 border border-white/10 py-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <div className={`p-3 rounded-xl ${m.color}`}><m.icon size={24} /></div>
                  <span className="text-xs font-bold text-white">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'text' && (
          <div className="flex flex-col items-center gap-5 w-full max-w-sm animate-in zoom-in-95 duration-300">
            <Type size={36} className="text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Describe Emergency</h2>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder='e.g. "Fire in building, 3rd floor"' className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl px-4 py-4 outline-none focus:border-emerald-500/50 resize-none h-28 placeholder:text-white/20" />
            <div className="flex gap-3 w-full">
              <button onClick={() => setStep('selecting')} className="flex-1 bg-white/10 text-white py-3 rounded-xl font-semibold text-sm">Back</button>
              <button onClick={handleTextSubmit} disabled={!textInput.trim()} className="flex-1 bg-emerald-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm active:scale-95 transition-all">Analyze</button>
            </div>
          </div>
        )}

        {step === 'recording' && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 bg-primary/20 rounded-full animate-ping absolute inset-0" />
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-indigo-600 rounded-full flex items-center justify-center relative z-10 shadow-2xl"><Mic size={48} className="text-white" /></div>
            </div>
            <h2 className="text-4xl font-bold text-white tabular-nums">{formatTime(recordTime)}</h2>
            <p className="text-primary font-bold uppercase tracking-widest animate-pulse text-sm flex items-center gap-2"><Radio size={12} /> Recording...</p>
            <button onClick={handleStopRecording} className="px-6 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-semibold text-sm">Stop & Analyze</button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-5">
            {imagePreview && <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/30"><img src={imagePreview} alt="Scene" className="w-full h-full object-cover" /></div>}
            <Loader2 size={52} className="text-primary animate-spin" />
            <h2 className="text-xl font-bold text-white">AI Analyzing</h2>
            <p className="text-white/40 text-sm animate-pulse">{processingStep}</p>
          </div>
        )}

        {step === 'confirming' && aiResult && (
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 animate-in slide-in-from-bottom-10 duration-500">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${sevColor[aiResult.severity] || 'bg-gray-100'}`}>
              <AlertCircle size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{aiResult.emergencyType}</h2>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${sevColor[aiResult.severity] || ''}`}>{aiResult.severity}</span>
              <span className="text-xs text-slate-400">{aiResult.confidence}% confidence</span>
            </div>
            <p className="text-slate-500 text-sm mb-3">{aiResult.reason}</p>
            <div className="bg-amber-50 rounded-xl p-3 mb-5">
              <p className="text-[10px] font-bold text-amber-700 uppercase mb-1.5">Safety Instructions</p>
              {aiResult.instructions.map((inst, i) => (
                <p key={i} className="text-xs text-amber-900 mb-1"><span className="font-bold text-amber-600">{i+1}.</span> {inst}</p>
              ))}
            </div>
            <button onClick={handleConfirm} disabled={isDispatching} className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all">
              {isDispatching ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isDispatching ? 'Dispatching...' : 'DISPATCH HELP'}
            </button>
            <button onClick={onClose} className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-semibold mt-2 text-sm">Cancel</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .pulse-red { animation: pulse-red 2s infinite; }
        @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); } 70% { box-shadow: 0 0 0 20px rgba(37,99,235,0); } 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); } }
      `}</style>
    </div>
  );
};

export default EmergencyTrigger;
