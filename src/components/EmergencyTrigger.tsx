'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Camera, X, ShieldAlert, Check, AlertCircle, Loader2, Radio } from 'lucide-react';
import { transcribeAudio, analyzeEmergencyImage, classifyEmergency, AIDetectionResult } from '@/lib/ai/detection';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AlertDoc } from '@/lib/types';

interface EmergencyTriggerProps {
  onClose: () => void;
}

const EmergencyTrigger: React.FC<EmergencyTriggerProps> = ({ onClose }) => {
  const [step, setStep] = useState<'selecting' | 'recording' | 'processing' | 'confirming'>('selecting');
  const [recordTime, setRecordTime] = useState(0);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const [processingStep, setProcessingStep] = useState('Listening to voice...');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setActiveAlertId, currentUser, currentLocation } = useAppStore();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'recording') {
      interval = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const recognitionRef = useRef<any>(null);

  // ── Voice Recording via Web Speech API ──
  const handleStartRecording = () => {
    setStep('recording');
    setRecordTime(0);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice not supported. Using AI fallback inference.');
      handleProcess('I have a critical emergency, please dispatch help.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    let finalTranscript = '';

    recognition.onresult = (e: any) => {
      finalTranscript = e.results[0][0].transcript;
    };

    recognition.onend = () => {
      handleProcess(finalTranscript || 'Emergency triggered. Need assistance.');
    };

    try {
      recognition.start();
    } catch {
      handleProcess('Emergency triggered via fallback.');
    }

    // Auto-stop after 8 seconds
    setTimeout(() => {
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch {}
    }, 8000);
  };

  const handleStopRecording = () => {
    try {
      if (recognitionRef.current) recognitionRef.current.stop();
    } catch {}
  };

  // ── Image Upload ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
      setStep('processing');
      setProcessingStep('Analyzing scene with Gemini Vision...');

      try {
        const labels = await analyzeEmergencyImage(base64);
        setProcessingStep('Classifying emergency with Grok AI...');
        const result = await classifyEmergency('Image-based emergency report', labels);
        setAiResult(result);
        setStep('confirming');
      } catch (err) {
        toast.error('Image analysis failed.');
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Main AI Processing Pipeline ──
  const handleProcess = async (transcript: string) => {
    setStep('processing');

    try {
      setProcessingStep('Classifying emergency with Grok AI...');
      const result = await classifyEmergency(transcript, ['Distress', 'Voice Command']);

      setAiResult(result);
      setStep('confirming');
    } catch (error) {
      toast.error('AI Analysis failed. Please try again.');
      onClose();
    }
  };

  // ── Confirm & Create Alert ──
  const handleConfirm = async () => {
    if (!aiResult || !currentUser || !currentLocation) {
      toast.error('Missing user or location. Please ensure location is enabled.');
      return;
    }

    try {
      const newAlert: AlertDoc = {
        userId: currentUser.id,
        userLocation: currentLocation,
        type: aiResult.emergencyType,
        severity: aiResult.severity,
        status: 'pending',
        responders: [],
        confidence: aiResult.confidence,
        reason: aiResult.reason,
        instructions: aiResult.instructions,
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'alerts'), newAlert);
      toast.success(`🚨 ${aiResult.emergencyType} reported. Responders notified!`);
      // setActiveAlertId operates locally but the Firebase listener on HomePage will also trigger redirect
      onClose();
    } catch (err) {
      toast.error('Failed to create emergency alert.');
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const severityColor = {
    LOW: 'bg-yellow-100 text-yellow-700',
    MEDIUM: 'bg-orange-100 text-orange-600',
    HIGH: 'bg-red-100 text-red-600',
    CRITICAL: 'bg-red-600 text-white',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-xl flex flex-col p-8 animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-10">
        <X size={32} />
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex-1 flex flex-col justify-center items-center text-center">

        {/* ── STEP 1: Select Mode ── */}
        {step === 'selecting' && (
          <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500">
            <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 pulse-red">
              <ShieldAlert size={64} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Emergency Trigger</h2>
              <p className="text-white/60">Choose your input method for AI detection</p>
            </div>

            <div className="flex gap-6 w-full max-w-sm">
              <button
                onClick={handleStartRecording}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-6 rounded-3xl flex flex-col items-center gap-3 transition-all tap-effect active:scale-95"
              >
                <div className="p-4 bg-primary/20 rounded-2xl text-primary">
                  <Mic size={32} />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Voice</span>
                <span className="text-[10px] text-white/40">Speak your emergency</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-6 rounded-3xl flex flex-col items-center gap-3 transition-all tap-effect active:scale-95"
              >
                <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400">
                  <Camera size={32} />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Image</span>
                <span className="text-[10px] text-white/40">Gemini Vision AI</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Recording ── */}
        {step === 'recording' && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="w-36 h-36 bg-primary/20 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
              <div className="w-36 h-36 bg-primary rounded-full flex items-center justify-center relative z-10 shadow-2xl shadow-primary/50">
                <Mic size={52} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-5xl font-black text-white mb-2 tabular-nums tracking-tight">
                {formatTime(recordTime)}
              </h2>
              <p className="text-primary font-black uppercase tracking-widest animate-pulse flex items-center gap-2 justify-center">
                <Radio size={14} /> Recording distress call...
              </p>
              <p className="text-white/30 text-xs mt-2">Auto-stops at 8s • Web Speech API active</p>
            </div>
            <button
              onClick={handleStopRecording}
              className="px-8 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-bold hover:bg-white/20 transition-all"
            >
              Stop &amp; Analyze
            </button>
          </div>
        )}

        {/* ── STEP 3: Processing ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center gap-6">
            {imagePreview && (
              <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-primary/40 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Scene" className="w-full h-full object-cover" />
              </div>
            )}
            <Loader2 size={64} className="text-primary animate-spin" />
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-1">AI Analyzing Scene</h2>
              <p className="text-white/40 font-medium animate-pulse">{processingStep}</p>
              <div className="flex gap-1.5 justify-center mt-4">
                {['Gemini', 'Grok-4', 'SerpAPI'].map((api, i) => (
                  <span key={api} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${i === 0 ? 'bg-blue-500/20 text-blue-400' : i === 1 ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                    {api}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Confirm ── */}
        {step === 'confirming' && aiResult && (
          <div className="w-full max-w-sm bg-white rounded-[32px] p-8 animate-in slide-in-from-bottom-10 duration-500">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${severityColor[aiResult.severity]}`}>
              <AlertCircle size={32} />
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {aiResult.emergencyType}
            </h2>

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${severityColor[aiResult.severity]}`}>
                {aiResult.severity} SEVERITY
              </span>
              <span className="text-xs font-bold text-gray-400">{aiResult.confidence}% confidence</span>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed mb-4">{aiResult.reason}</p>

            {/* Safety Instructions */}
            <div className="bg-amber-50 rounded-2xl p-4 mb-6">
              <p className="text-xs font-black text-amber-700 uppercase mb-2">⚡ Immediate Instructions</p>
              <ol className="flex flex-col gap-1.5">
                {aiResult.instructions.map((inst, i) => (
                  <li key={i} className="text-xs text-amber-900 flex gap-2">
                    <span className="font-black text-amber-600 shrink-0">{i + 1}.</span>
                    {inst}
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-sm font-bold text-gray-900 mb-4 text-center">
              Should we dispatch help now?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 tap-effect active:scale-95"
              >
                <Check size={20} /> YES, DISPATCH HELP
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold tap-effect"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .pulse-red {
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.4); }
          70% { box-shadow: 0 0 0 24px rgba(229, 57, 53, 0); }
          100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
        }
      `}</style>
    </div>
  );
};

export default EmergencyTrigger;
