import React, { useState, useRef } from "react";
import { 
  Clapperboard, 
  Upload, 
  Play, 
  RotateCcw, 
  Download, 
  Image as ImageIcon,
  Loader2,
  Film,
  Camera,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { parseScript, generateBeatImage, StoryboardBeat } from "./services/geminiService";

export default function App() {
  const [script, setScript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"input" | "generating" | "results">("input");
  const [beats, setBeats] = useState<StoryboardBeat[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const scriptRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScript(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const startGeneration = async () => {
    if (!script.trim()) return;

    setError(null);
    setIsProcessing(true);
    setCurrentStep("generating");
    setStatusMessage("Analyzing script structure...");

    try {
      const parsedBeats = await parseScript(script);
      setBeats(parsedBeats);
      setCurrentStep("results");
      
      const updatedBeats = [...parsedBeats];
      for (let i = 0; i < updatedBeats.length; i++) {
        setStatusMessage(`Rendering Scene ${updatedBeats[i].sceneNumber}: ${updatedBeats[i].title}...`);
        try {
          const imageUrl = await generateBeatImage(updatedBeats[i].visualPrompt);
          updatedBeats[i] = { ...updatedBeats[i], imageUrl };
          setBeats([...updatedBeats]);
        } catch (imgErr) {
          console.error(`Failed to generate image for beat ${i}`, imgErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again with a different script snippet.");
      setCurrentStep("input");
    } finally {
      setIsProcessing(false);
      setStatusMessage("");
    }
  };

  const reset = () => {
    setScript("");
    setBeats([]);
    setCurrentStep("input");
    setError(null);
  };

  return (
    <div className="h-screen w-full bg-black text-neutral-200 flex flex-col overflow-hidden selection:bg-amber-600/30 font-sans">
      <nav className="h-16 border-b border-neutral-800 flex items-center justify-between px-8 bg-neutral-900/50 relative z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center font-bold text-black text-xs italic">S</div>
          <h1 className="text-xl tracking-wider font-serif font-light text-neutral-100 uppercase">
            SCENE<span className="text-amber-500/80">WEAVER</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-1 items-center">
            <span className={`h-2 w-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></span>
            <span className={`text-[10px] uppercase tracking-widest ${isProcessing ? 'text-amber-500' : 'text-emerald-500'} font-semibold`}>
              {isProcessing ? 'Digital Negatives Processing' : 'Engine Ready'}
            </span>
          </div>
          {currentStep === "results" && (
            <>
              <button 
                onClick={() => {/* Mock export */}}
                className="btn-secondary"
              >
                Export PDF
              </button>
              <button 
                onClick={reset}
                className="btn-primary"
              >
                New Script
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {currentStep === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_50%_40%,#111_0%,#000_100%)]"
            >
              <div className="max-w-3xl w-full flex flex-col gap-8">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl sm:text-5xl font-serif italic text-neutral-100">
                    Capture the <span className="text-amber-600/90">Frame</span>
                  </h2>
                  <p className="text-neutral-500 text-sm tracking-wide font-light max-w-lg mx-auto">
                    A cinematic storyboard generator for directors and screenwriters. Define your vision, manifest your scenes.
                  </p>
                </div>

                <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-600/50" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="label-caps">SOURCE SCRIPT</label>
                      <label className="cursor-pointer text-[10px] uppercase font-bold text-amber-500/80 hover:text-amber-500 transition-colors flex items-center gap-1">
                        <Upload size={12} />
                        UPLOAD MANUSCRIPT
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                    
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="INT. CYBER-BAR - NIGHT\n\nJax lights a cigarette. The orange glow reflects in his synthetic eyes..."
                      className="w-full h-64 bg-black/40 border border-neutral-800 rounded-lg p-4 text-neutral-300 placeholder:text-neutral-700 resize-none focus:outline-none focus:border-amber-600/50 transition-all font-mono text-xs leading-relaxed"
                    />

                    {error && (
                      <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg text-red-500 text-xs font-mono">
                        ERR: {error}
                      </div>
                    )}

                    <button
                      onClick={startGeneration}
                      disabled={!script.trim() || isProcessing}
                      className="w-full btn-primary h-12 text-sm"
                    >
                      {isProcessing ? "PROCESSING..." : "BEGIN VISUALIZATION"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative">
                <div className="w-16 h-16 border-2 border-neutral-800 rounded-full animate-spin border-t-amber-600" />
                <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-600 w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-serif italic text-amber-200/90">{statusMessage}</h3>
                <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] mt-2 animate-pulse">Encoding Cinematic Matrix</p>
              </div>
            </motion.div>
          )}

          {currentStep === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full"
            >
              <aside className="w-80 border-r border-neutral-800 bg-neutral-900/30 p-6 flex flex-col gap-6 overflow-hidden">
                <div className="space-y-1">
                  <label className="label-caps">Current Vision</label>
                  <p className="font-serif italic text-lg text-amber-200/90 truncate">Untitled Masterpiece</p>
                </div>
                
                <div className="flex-1 bg-black/40 rounded-lg border border-neutral-800 p-4 font-mono text-[10px] leading-relaxed text-neutral-400 overflow-y-auto custom-scrollbar">
                  {script.split("\n").map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-neutral-700 w-4 select-none">{(i + 1).toString().padStart(3, '0')}</span>
                      <span>{line || <br/>}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg space-y-3">
                  <p className="label-caps !text-amber-200/70">FILM PARAMETERS</p>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Aspect Ratio</span>
                    <span className="text-neutral-100">2.39:1 (Anamorphic)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-500">Processing</span>
                    <span className="text-neutral-100">{isProcessing ? 'Active' : 'Finalized'}</span>
                  </div>
                  <div className="h-1 bg-neutral-800 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-amber-600 transition-all duration-500" 
                      style={{ width: `${(beats.filter(b => b.imageUrl).length / beats.length) * 100}%` }} 
                    />
                  </div>
                </div>
              </aside>

              <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-12 pb-24">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl font-serif text-neutral-100 italic">Storyboard Sequence</h2>
                      <p className="text-sm text-neutral-500 tracking-wide mt-1">Found {beats.length} master frames</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {beats.map((beat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col gap-4 group"
                      >
                        <div className="aspect-[2.39/1] bg-neutral-900 rounded border-2 border-neutral-800 overflow-hidden relative shadow-2xl group-hover:border-amber-600/40 transition-all duration-700">
                          {beat.imageUrl ? (
                            <img 
                              src={beat.imageUrl} 
                              alt={beat.title}
                              className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-105 group-hover:grayscale-0 transition-all duration-1000"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center opacity-30 gap-4">
                              <Loader2 className="animate-spin text-amber-600" />
                              <span className="text-[10px] font-mono tracking-[0.3em] text-neutral-500 uppercase italic">Developing Negative...</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                          
                          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                            <span className="text-[10px] uppercase font-bold text-amber-500/90 tracking-widest drop-shadow-lg">
                              Frame {beat.sceneNumber.toString().padStart(2, '0')} // {beat.title}
                            </span>
                          </div>
                        </div>
                        
                        <div className="px-2 space-y-3">
                          <p className="text-xs text-neutral-400 font-serif italic leading-relaxed first-letter:text-lg first-letter:not-italic first-letter:text-amber-500">
                            {beat.description}
                          </p>
                          <div className="flex gap-2 items-center opacity-40 group-hover:opacity-80 transition-opacity">
                            <Camera size={12} className="text-amber-500" />
                            <span className="text-[10px] font-mono uppercase tracking-tighter text-neutral-500 line-clamp-1 italic italic">
                              {beat.visualPrompt}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="h-10 bg-black border-t border-neutral-900 px-6 flex items-center justify-between text-[10px] text-neutral-600 font-mono relative z-50">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_4px_#34d399]"></span>
            OP_MODE: {currentStep.toUpperCase()}
          </span>
          <span>LATENCY: 24MS</span>
          <span>MODEL: GEMINI-3-FLASH</span>
        </div>
        <div className="hidden sm:block">© 2024 SCENEWEAVER STUDIOS. ALL RIGHTS RESERVED.</div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d97706;
        }
      `}</style>
    </div>
  );
}


