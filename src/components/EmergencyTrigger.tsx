'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Camera, X, ShieldAlert, Check, AlertCircle, Loader2 } from 'lucide-react';
import { transcribeAudio, analyzeEmergencyImage, classifyEmergency, AIDetectionResult } from '@/lib/ai/detection';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

interface EmergencyTriggerProps {
  onClose: () => void;
}

const EmergencyTrigger: React.FC<EmergencyTriggerProps> = ({ onClose }) => {
  const [step, setStep] = useState<'selecting' | 'recording' | 'processing' | 'confirming'>('selecting');
  const [recordTime, setRecordTime] = useState(0);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const { setActiveAlert, currentUser } = useAppStore();

  useEffect(() => {
    let interval: any;
    if (step === 'recording') {
      interval = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleStartRecording = () => {
    setStep('recording');
    setRecordTime(0);
    // Simulate recording stop after 4 seconds
    setTimeout(() => {
      handleProcess();
    }, 4000);
  };

  const handleProcess = async () => {
    setStep('processing');
    try {
      const transcript = await transcribeAudio(new Blob());
      const labels = ["Fire", "Distress"];
      const result = await classifyEmergency(transcript, labels);
      setAiResult(result);
      setStep('confirming');
    } catch (error) {
      toast.error("AI Analysis failed. Reverting to manual.");
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!aiResult) return;
    
    const newAlert = {
      id: 'alert-' + Date.now(),
      userId: currentUser?.id || 'guest',
      type: aiResult.emergencyType as any,
      status: 'dispatched' as any,
      severity: aiResult.severity.toLowerCase() as any,
      location: currentUser?.location || { lat: 28.6139, lng: 77.2090, address: 'Current Location' },
      createdAt: new Date().toISOString()
    };

    setActiveAlert(newAlert);
    toast.success(`Success! ${aiResult.emergencyType} reported.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col p-8 animate-in fade-in duration-300">
      <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
        <X size={32} />
      </button>

      <div className="flex-1 flex flex-col justify-center items-center text-center">
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
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-6 rounded-3xl flex flex-col items-center gap-3 transition-all tap-effect"
              >
                <div className="p-4 bg-primary/20 rounded-2xl text-primary">
                  <Mic size={32} />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Voice</span>
              </button>
              <button className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-6 rounded-3xl flex flex-col items-center gap-3 transition-all tap-effect cursor-not-allowed opacity-50">
                <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-500">
                  <Camera size={32} />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Image</span>
              </button>
            </div>
          </div>
        )}

        {step === 'recording' && (
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center animate-ping absolute inset-0"></div>
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                <Mic size={48} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-black text-white mb-2 tabular-nums">00:0{recordTime}</h2>
              <p className="text-primary font-black uppercase tracking-widest animate-pulse">Recording distress...</p>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-6">
            <Loader2 size={64} className="text-primary animate-spin" />
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-1">Analyzing Scene</h2>
              <p className="text-white/40 font-medium">Gemini is evaluating severity...</p>
            </div>
          </div>
        )}

        {step === 'confirming' && aiResult && (
          <div className="w-full max-w-sm bg-white rounded-[32px] p-8 animate-in slide-in-from-bottom-10 duration-500">
             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
               aiResult.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
             }`}>
                <AlertCircle size={32} />
             </div>
             
             <h2 className="text-2xl font-black text-gray-900 mb-2">Detected: {aiResult.emergencyType}</h2>
             <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  aiResult.severity === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {aiResult.severity} SEVERITY
                </span>
                <span className="text-xs font-bold text-gray-400">{aiResult.confidence}% Confidence</span>
             </div>

             <p className="text-gray-500 text-sm leading-relaxed mb-8">
               {aiResult.reason} <br/><br/>
               <span className="font-bold text-gray-900">Should we dispatch help now?</span>
             </p>

             <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirm}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 tap-effect"
                >
                  <Check size={20} /> YES, CONFIRM
                </button>
                <button 
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-bold tap-effect"
                >
                  NO, CANCEL
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
          70% { box-shadow: 0 0 0 20px rgba(229, 57, 53, 0); }
          100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
        }
      `}</style>
    </div>
  );
};

export default EmergencyTrigger;
