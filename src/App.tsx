import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { enforceConditionalLanguage } from './lib/safety';
import { 
  Dna, 
  Activity, 
  Award, 
  MessageSquare, 
  ChevronRight, 
  BarChart3, 
  ShieldCheck, 
  Flame,
  User,
  Heart,
  TrendingUp,
  Info,
  X,
  Globe,
  History,
  Zap,
  Timer,
  Settings,
  Accessibility,
  Eye,
  Type,
  Move
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { MotionConfig } from 'motion/react';

// Types
interface Archetype {
  title: string;
  description: string;
  justification: string;
  confidence?: string;
  matchScore?: number;
  breakdown?: {
    heightSimilarity: number;
    weightSimilarity: number;
    bmiSimilarity: number;
    sportAffinity: number;
    historicalAlignment: number;
    pathwayFit: number;
  };
}

interface ChartData {
  attribute: string;
  value: number;
}

interface EraData {
  era: string;
  focus: number;
  dominantFamilies: string[];
  story: string;
}

interface ParalympicExplorerData {
  corePrinciples: string[];
  systems: {
    sport: string;
    description: string;
    codes: string[];
  }[];
  personalizedInsight?: string;
}

interface AnalysisResult {
  archetypes: Archetype[];
  chartData: ChartData[];
  radarData: ChartData[];
  historicalJourney: {
    eras: EraData[];
    narrative: string;
  };
  paralympicExplorer?: ParalympicExplorerData;
  regionalReflection?: {
    region: string;
    states: string;
    sportCultures: string;
    story: string;
    connection: string;
  };
  regionalAlignment: string;
  mirrorNarrative: string;
  isDeterministic?: boolean;
}

function buildFallbackNarrative(
  biometrics: any,
  topMatch: any,
  regionStory: any,
  eraStats: any[],
  sportStats: any[]
): string {
  const archetypeTitle = topMatch.title || topMatch.name || "Historical Match";
  const eraLabel = eraStats?.[eraStats.length - 1]?.era || "modern";
  const regionName = regionStory?.region || "your region";
  const sportCultures = regionStory?.sportCultures || "local competitive traditions";
  
  const relevantFamily = sportStats?.find((f: any) => 
    f.topSports.toLowerCase().includes(biometrics.sportInterest.toLowerCase()) ||
    f.family.toLowerCase().includes(biometrics.sportInterest.toLowerCase())
  )?.family || biometrics.sportInterest;
  
  const narrative = `Your profile could historically resemble a ${archetypeTitle} archetype, where ${biometrics.primaryGoal}-oriented success may align with specific historical success clusters. 

Within the Team USA Digital Mirror, this alignment could connect to the ${relevantFamily} context and the ${sportCultures} found in the ${regionName}. For someone interested in a ${biometrics.pathway} pathway, these physical signatures could historically suggest a legacy shared with athletes from the ${eraLabel} era.

This remains an exploratory historical alignment grounded in 120 years of competitive data, rather than a performance prediction or medical judgment.`;

  return enforceConditionalLanguage(narrative);
}

export default function App() {
  const [view, setView] = useState<'landing' | 'mirror' | 'results'>('landing');
  const [loading, setLoading] = useState(false);
  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    reducedMotion: false,
    largerText: false
  });
  const [biometrics, setBiometrics] = useState({
    height: 175,
    weight: 70,
    age: 25,
    primaryGoal: 'strength',
    region: 'South',
    gender: 'Neutral',
    sportInterest: 'Athletics',
    pathway: 'both',
    impairment: 'none'
  });
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const handleStart = () => setView('mirror');

  const analyzeData = async () => {
    setLoading(true);
    let contextData: any = null;
    let baseline: any = null;

    try {
      // 1. Get Context Data & Baseline from Backend
      const [dataRes, baselineRes] = await Promise.all([
        fetch('/api/data').catch(() => ({ json: () => ({ archetypes: [], sportStats: [], paralympic: [], regions: [], eraStats: [] }) })),
        fetch('/api/analyze-baseline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ biometrics })
        }).catch(() => null)
      ]);

      contextData = typeof (dataRes as any).json === 'function' ? await (dataRes as any).json() : (dataRes as any);
      baseline = baselineRes && typeof (baselineRes as any).json === 'function' ? await (baselineRes as any).json() : null;

      // 2. AI Analysis via backend Vertex AI route
      const aiRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biometrics, baseline })
      });

      if (!aiRes.ok) {
        throw new Error("VERTEX_ANALYSIS_FAILED");
      }

      const analysis = await aiRes.json();
      
      // Post-process with conditional language enforcement
      if (analysis.archetypes) {
        analysis.archetypes = analysis.archetypes.map((a: any) => ({
          ...a,
          description: enforceConditionalLanguage(a.description),
          justification: enforceConditionalLanguage(a.justification)
        }));
      }

      if (analysis.historicalJourney) {
        analysis.historicalJourney.narrative = enforceConditionalLanguage(analysis.historicalJourney.narrative);
      }

      if (analysis.regionalAlignment) {
        analysis.regionalAlignment = enforceConditionalLanguage(analysis.regionalAlignment);
      }

      if (analysis.regionalReflection) {
        analysis.regionalReflection.story = enforceConditionalLanguage(analysis.regionalReflection.story);
        analysis.regionalReflection.connection = enforceConditionalLanguage(analysis.regionalReflection.connection);
      }

      if (analysis.mirrorNarrative) {
        analysis.mirrorNarrative = enforceConditionalLanguage(analysis.mirrorNarrative);
      }

      if (analysis.paralympicExplorer) {
        analysis.paralympicExplorer.personalizedInsight = enforceConditionalLanguage(analysis.paralympicExplorer.personalizedInsight || "");
        analysis.paralympicExplorer.systems = analysis.paralympicExplorer.systems.map((s: any) => ({
          ...s,
          description: enforceConditionalLanguage(s.description)
        }));
      }

      setResults(analysis);
      setView('results');
    } catch (err) {
      console.warn("AI Analysis Failed. Using deterministic fallback.", err);
      if (baseline && contextData) {
        const topMatch = baseline.matches[0];
        const regionStory = contextData.regions.find((r: any) => r.region === biometrics.region) || contextData.regions[0];
        
        const fallbackResults: AnalysisResult = {
          isDeterministic: true,
          archetypes: baseline.matches.slice(0, 2),
          mirrorNarrative: buildFallbackNarrative(biometrics, topMatch, regionStory, contextData.eraStats, contextData.sportStats),
          chartData: [
            { attribute: 'Power', value: 70 },
            { attribute: 'Endurance', value: 70 },
            { attribute: 'Agility', value: 70 },
            { attribute: 'Precision', value: 70 },
            { attribute: 'Technical', value: 70 }
          ],
          radarData: [
            { attribute: 'Power', value: 70 },
            { attribute: 'Endurance', value: 70 },
            { attribute: 'Explosiveness', value: 70 },
            { attribute: 'Leverage', value: 70 },
            { attribute: 'Precision', value: 70 },
            { attribute: 'Adaptability', value: 70 }
          ],
          historicalJourney: {
            eras: (contextData?.eraStats || []).map((era: any) => ({
              era: era.era || "Era",
              focus: 50, 
              dominantFamilies: era.dominantFamilies ? era.dominantFamilies.split(',').map((f: string) => f.trim()) : ["Athletics"],
              story: enforceConditionalLanguage(era.story || "A historical competitive era.")
            })),
            narrative: `Historical mapping protocol complete via deterministic alignment.`
          },
          regionalReflection: regionStory,
          regionalAlignment: `Regional alignment analysis complete for ${biometrics.region}.`,
          paralympicExplorer: undefined
        };
        
        setResults(fallbackResults);
        setView('results');
      } else {
        alert("Mirror synchronization failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionConfig reducedMotion={accessibility.reducedMotion ? 'always' : 'user'}>
      <div className={`min-h-screen selection:bg-victory-red selection:text-white transition-colors duration-300 ${accessibility.highContrast ? 'high-contrast' : ''} ${accessibility.largerText ? 'text-large' : ''}`}>
        <AccessibilityMenu settings={accessibility} onToggle={(key) => setAccessibility(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))} />
        {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-end border-b border-white/10 bg-victory-deep/80 backdrop-blur-md">
        <div className="flex flex-col cursor-pointer" onClick={() => setView('landing')}>
          <div className="flex items-center gap-1">
            <h1 className="text-4xl font-black italic skew-title border-l-4 border-victory-red pl-3 leading-none">TEAM USA</h1>
          </div>
          <h2 className="text-sm font-bold opacity-60 tracking-tighter ml-3 uppercase">DIGITAL MIRROR</h2>
          <div className="ml-6 px-3 py-1 bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-victory-blue animate-pulse"></span>
            OLYMPIC + PARALYMPIC PARITY SYNC
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right hidden lg:block">
            <p className="text-[10px] tracking-[0.3em] opacity-40 uppercase font-mono">Affinity Processor</p>
            <p className="text-[10px] tracking-[0.3em] opacity-40 uppercase font-mono italic text-victory-gold">ANALYTICAL MIRROR • NOT PERFORMANCE PREDICTION</p>
          </div>
          <button onClick={() => setChatOpen(true)} className="p-2 hover:bg-white/5 transition-colors rounded-none border border-white/10">
            <MessageSquare className="w-5 h-5 opacity-80 text-victory-gold" />
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-[1400px] mx-auto">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingView onStart={handleStart} />
            </motion.div>
          )}
          {view === 'mirror' && (
            <motion.div key="mirror" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MirrorView 
                biometrics={biometrics} 
                setBiometrics={setBiometrics} 
                onAnalyze={analyzeData}
                loading={loading}
              />
            </motion.div>
          )}
          {view === 'results' && results && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsView 
                data={results} 
                onReset={() => setView('mirror')} 
                region={biometrics.region} 
                pathway={biometrics.pathway} 
                onOpenMethodology={() => setShowMethodology(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MethodologyModal isOpen={showMethodology} onClose={() => setShowMethodology(false)} />

      {/* Floating Chat */}
      <GeminiChat 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        profile={biometrics}
        results={results}
      />

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-victory-blue/20 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-victory-red/20 blur-[120px]"></div>
      </div>
    </div>
    </MotionConfig>
  );
}

function LandingView({ onStart }: { onStart: () => void }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid lg:grid-cols-12 gap-8 items-center"
    >
      <div className="lg:col-span-7 space-y-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-victory-blue/50 border-l-4 border-victory-gold text-white text-[10px] uppercase tracking-[0.4em] font-black">
          <Award className="w-4 h-4" /> Affinity Protocol Active
        </div>
        <h1 className="text-7xl md:text-[120px] font-black tracking-tighter leading-[0.8] uppercase italic skew-title transition-all">
          OWN THE <br />
          <span className="text-victory-red border-b-8 border-victory-red">VICTORY</span> <br />
          FRAME.
        </h1>
        <p className="text-xl text-neutral-400 max-w-xl font-light leading-relaxed border-l border-white/20 pl-6">
          Your biometric profile <span className="text-white font-bold underline italic">could historically align</span> with the elite success clusters of Team USA. Initialize the Digital Mirror to discover your archetype.
        </p>
        <div className="flex flex-wrap gap-6 pt-6">
          <button onClick={onStart} className="btn-primary group flex items-center gap-4 text-xl">
            <span>START ANALYSIS</span> <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>

      <div className="lg:col-span-5 grid grid-cols-1 gap-6">
        <div className="grid grid-cols-2 gap-6">
          <ExplainerCard 
            icon={<Flame className="text-victory-red w-8 h-8" />}
            title="OLYMPICS"
            description="High-performance excellence across hundreds of elite disciplines."
            borderClass="border-l-4 border-victory-red"
          />
          <ExplainerCard 
            icon={<ShieldCheck className="text-victory-gold w-8 h-8" />}
            title="PARALYMPICS"
            description="Elite competitive categories based on functional classifications."
            borderClass="border-l-4 border-victory-gold"
          />
        </div>
        <div className="glass-panel p-10 space-y-6 bg-gradient-to-br from-white/10 to-transparent">
          <div className="flex justify-between items-center text-[10px] font-black opacity-80 uppercase tracking-[0.3em]">
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-victory-red" /> MIRROR SYNC</span>
            <span className="text-emerald-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></div> LIVE
            </span>
          </div>
          <div className="h-2 bg-white/5 w-full relative overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-victory-red to-transparent w-1/2"
            />
          </div>
          <p className="text-[11px] opacity-40 font-mono italic leading-relaxed">
            * This application provides historical clusters based on biometric data. Analysis suggests potential alignment but does not guarantee results.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function ExplainerCard({ icon, title, description, borderClass }: { icon: React.ReactNode, title: string, description: string, borderClass?: string }) {
  return (
    <div className={`glass-panel p-8 space-y-6 group hover:bg-white/10 transition-all ${borderClass}`}>
      <div className="w-14 h-14 flex items-center justify-center bg-white/5 skew-x-[-10deg]">
        <div className="skew-x-[10deg]">{icon}</div>
      </div>
      <h3 className="text-xl font-black uppercase italic tracking-tighter skew-title">{title}</h3>
      <p className="text-xs text-neutral-400 font-medium leading-snug tracking-wide">{description}</p>
    </div>
  );
}

function MirrorView({ biometrics, setBiometrics, onAnalyze, loading }: { 
  biometrics: any, 
  setBiometrics: any, 
  onAnalyze: () => Promise<void>,
  loading: boolean
}) {
  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="glass-panel p-12 space-y-12 relative overflow-hidden border-t-8 border-victory-red">
        {/* Scanning lines effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full opacity-30">
          <motion.div 
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-victory-red/20 to-transparent z-10"
          />
        </div>

        <div className="flex flex-col items-center text-center space-y-4 relative z-20">
          <div className="w-20 h-20 bg-victory-blue/20 flex items-center justify-center skew-x-[-10deg] border border-victory-blue/40">
            <Dna className="w-10 h-10 text-victory-red skew-x-[10deg] animate-pulse" />
          </div>
          <h2 className="text-5xl font-black uppercase italic tracking-tighter skew-title">Biometric Calibration</h2>
          <p className="text-neutral-400 font-bold italic uppercase tracking-widest text-[10px]">Transmission Port 0 // Protocol Alpha</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 relative z-20">
          <InputGroup 
            label="Stature (cm)" 
            value={biometrics.height} 
            onChange={(v) => setBiometrics({...biometrics, height: v})}
            min={100} max={250}
          />
          <InputGroup 
            label="Mass Index (kg)" 
            value={biometrics.weight} 
            onChange={(v) => setBiometrics({...biometrics, weight: v})}
            min={30} max={200}
          />
          <InputGroup 
            label="Biological Age" 
            value={biometrics.age} 
            onChange={(v) => setBiometrics({...biometrics, age: v})}
            min={10} max={100}
          />
          
          <div className="space-y-4">
            <label htmlFor="gender-category" className="text-[11px] font-black uppercase tracking-[0.3em] text-victory-gold">Gender Category</label>
            <div id="gender-category" className="flex gap-2" role="group">
              {['Male', 'Female', 'Neutral'].map(g => (
                <button 
                  key={g} 
                  type="button"
                  onClick={() => setBiometrics({...biometrics, gender: g})}
                  aria-pressed={biometrics.gender === g}
                  className={`flex-1 py-3 font-black uppercase italic tracking-tighter border transition-all focus:ring-2 focus:ring-victory-red focus:outline-none ${biometrics.gender === g ? 'bg-victory-red border-victory-red text-white' : 'bg-white/5 border-white/10 text-neutral-500'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="pathway-focus" className="text-[11px] font-black uppercase tracking-[0.3em] text-victory-gold">Olympic / Paralympic Focus</label>
            <div id="pathway-focus" className="flex gap-2" role="group">
              {['olympic', 'paralympic', 'both'].map(p => (
                <button 
                  key={p} 
                  type="button"
                  onClick={() => setBiometrics({...biometrics, pathway: p})}
                  aria-pressed={biometrics.pathway === p}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border transition-all focus:ring-2 focus:ring-victory-blue focus:outline-none ${biometrics.pathway === p ? 'bg-victory-blue border-victory-blue text-white' : 'bg-white/5 border-white/10 text-neutral-500'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {biometrics.pathway !== 'olympic' && (
            <div className="space-y-4">
              <label htmlFor="impairment-select" className="text-[11px] font-black uppercase tracking-[0.3em] text-victory-gold">Functional Context</label>
              <div className="relative">
                <select 
                  id="impairment-select"
                  value={biometrics.impairment}
                  onChange={(e) => setBiometrics({...biometrics, impairment: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 p-4 outline-none focus:border-victory-red transition-all cursor-pointer rounded-none appearance-none font-black uppercase italic focus:ring-2 focus:ring-victory-red"
                >
                  <option value="none" className="bg-victory-deep">None / Neurotypical</option>
                  <option value="limb difference" className="bg-victory-deep">Limb Difference</option>
                  <option value="visual impairment" className="bg-victory-deep">Visual Impairment</option>
                  <option value="wheelchair user" className="bg-victory-deep">Wheelchair User</option>
                  <option value="coordination impairment" className="bg-victory-deep">Coordination Impairment</option>
                  <option value="other" className="bg-victory-deep">Other Potential Path</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-5 h-5 opacity-40 rotate-90" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label htmlFor="sport-interest" className="text-[11px] font-black uppercase tracking-[0.3em] text-victory-gold">Interest</label>
            <input 
              id="sport-interest"
              type="text"
              placeholder="e.g. Swimming, Sprints"
              value={biometrics.sportInterest}
              onChange={(e) => setBiometrics({...biometrics, sportInterest: e.target.value})}
              className="w-full bg-white/10 border border-white/20 p-4 outline-none focus:border-victory-red transition-all font-black uppercase italic tracking-tighter focus:ring-2 focus:ring-victory-red"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="primary-goal" className="text-[11px] font-black uppercase tracking-[0.3em] text-victory-gold">Primary Athletic Goal</label>
            <div className="relative">
              <select 
                id="primary-goal"
                value={biometrics.primaryGoal}
                onChange={(e) => setBiometrics({...biometrics, primaryGoal: e.target.value})}
                className="w-full bg-white/10 border border-white/20 p-4 outline-none focus:border-victory-red transition-all cursor-pointer rounded-none appearance-none font-black uppercase tracking-tighter italic focus:ring-2 focus:ring-victory-red"
              >
                <option value="strength" className="bg-victory-deep">Strength & Power</option>
                <option value="endurance" className="bg-victory-deep">Elite Endurance</option>
                <option value="agility" className="bg-victory-deep">Speed & Agility</option>
                <option value="precision" className="bg-victory-deep">Technical Precision</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-5 h-5 opacity-40 rotate-90" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label htmlFor="regional-origin" className="text-[11px] font-black uppercase tracking-[0.3em] text-victory-gold">Regional Origin</label>
            <div className="relative">
              <select 
                id="regional-origin"
                value={biometrics.region}
                onChange={(e) => setBiometrics({...biometrics, region: e.target.value})}
                className="w-full bg-white/10 border border-white/20 p-4 outline-none focus:border-victory-red transition-all cursor-pointer rounded-none appearance-none font-black uppercase tracking-tighter italic focus:ring-2 focus:ring-victory-red"
              >
                <option value="South" className="bg-victory-deep">South</option>
                <option value="West Coast" className="bg-victory-deep">West Coast</option>
                <option value="Mountain" className="bg-victory-deep">Mountain</option>
                <option value="Midwest" className="bg-victory-deep">Midwest</option>
                <option value="Northeast" className="bg-victory-deep">Northeast</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="w-5 h-5 opacity-40 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onAnalyze} 
          disabled={loading}
          className="w-full btn-primary h-20 text-2xl tracking-[0.4em] flex items-center justify-center gap-6 disabled:opacity-50"
        >
          {loading ? (
             <div className="flex items-center gap-4">
               <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
               SENSING...
             </div>
          ) : (
            <div className="flex items-center gap-4">
              <span>CALIBRATE MIRROR</span> <Activity className="w-6 h-6" />
            </div>
          )}
        </button>
      </div>
    </motion.section>
  );
}

function InputGroup({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) {
  const id = React.useId();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-white/10 pb-2">
        <label htmlFor={id} className="text-[11px] font-black uppercase tracking-[0.3em] opacity-80">{label}</label>
        <span className="text-3xl font-black font-sans italic skew-title text-victory-red" aria-hidden="true">{value}</span>
      </div>
      <input 
        id={id}
        type="range" min={min} max={max} value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-white/5 rounded-none cursor-pointer appearance-none accent-victory-red border border-white/10 focus:ring-2 focus:ring-victory-red focus:outline-none" 
      />
    </div>
  );
}

function AccessibilityMenu({ settings, onToggle }: { settings: any, onToggle: (key: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 left-0 glass-panel p-4 w-64 space-y-3 bg-victory-deep/95 border-victory-gold/30 backdrop-blur-xl"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-victory-gold mb-4 flex items-center gap-2">
                <Accessibility className="w-3 h-3" /> Accessibility Options
              </div>
              
              <button 
                onClick={() => onToggle('highContrast')}
                aria-pressed={settings.highContrast}
                className={`w-full flex items-center justify-between p-3 transition-all border outline-none focus:ring-2 focus:ring-victory-gold ${settings.highContrast ? 'bg-victory-gold text-victory-deep border-victory-gold' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">High Contrast</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.highContrast ? 'bg-victory-deep' : 'bg-white/20'}`}>
                  <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${settings.highContrast ? 'right-1 bg-victory-gold' : 'left-1 bg-white'}`} />
                </div>
              </button>

              <button 
                onClick={() => onToggle('reducedMotion')}
                aria-pressed={settings.reducedMotion}
                className={`w-full flex items-center justify-between p-3 transition-all border outline-none focus:ring-2 focus:ring-victory-gold ${settings.reducedMotion ? 'bg-victory-gold text-victory-deep border-victory-gold' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <Move className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">Reduced Motion</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.reducedMotion ? 'bg-victory-deep' : 'bg-white/20'}`}>
                  <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${settings.reducedMotion ? 'right-1 bg-victory-gold' : 'left-1 bg-white'}`} />
                </div>
              </button>

              <button 
                onClick={() => onToggle('largerText')}
                aria-pressed={settings.largerText}
                className={`w-full flex items-center justify-between p-3 transition-all border outline-none focus:ring-2 focus:ring-victory-gold ${settings.largerText ? 'bg-victory-gold text-victory-deep border-victory-gold' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3">
                  <Type className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase">Larger Text</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.largerText ? 'bg-victory-deep' : 'bg-white/20'}`}>
                  <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${settings.largerText ? 'right-1 bg-victory-gold' : 'left-1 bg-white'}`} />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Accessibility Settings"
          aria-expanded={isOpen}
          className={`w-12 h-12 flex items-center justify-center rounded-full glass-panel border-victory-gold/30 text-victory-gold transition-all hover:scale-110 active:scale-95 outline-none focus:ring-2 focus:ring-victory-gold ${isOpen ? 'bg-victory-gold text-victory-deep' : 'bg-victory-deep/80'}`}
        >
          <Settings className={`w-6 h-6 transition-transform duration-500 ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function MirrorNarrativeCard({ narrative }: { narrative: string }) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-panel p-12 space-y-10 bg-victory-gold/5 border-victory-gold/30 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Flame className="w-64 h-64 text-victory-gold" />
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="w-16 h-16 bg-victory-gold flex items-center justify-center skew-x-[-10deg] shrink-0">
          <MessageSquare className="w-8 h-8 text-victory-deep skew-x-[10deg]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-4xl font-black uppercase italic tracking-tighter skew-title text-white">THE MIRROR NARRATIVE</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-victory-gold opacity-60">Synthesized Team USA Profile</p>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl">
        <div className="prose prose-invert prose-p:text-xl prose-p:leading-relaxed prose-p:font-light prose-p:text-neutral-200 prose-p:italic">
          <div className="space-y-6 first-letter:text-6xl first-letter:font-black first-letter:text-victory-red first-letter:mr-3 first-letter:float-left first-letter:uppercase first-letter:tracking-tight">
            {narrative.split('\n').map((paragraph, idx) => (
              paragraph.trim() && <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10 opacity-60">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-victory-blue" />
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 italic">Authentic Historical Comparison Protocol // G-V1</span>
        </div>
        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-500 italic">
          Grounded In 120 Years Of Team USA Competitive Data
        </div>
      </div>
    </motion.div>
  );
}

function ResultsView({ data, onReset, region, pathway, onOpenMethodology }: { 
  data: AnalysisResult, 
  onReset: () => void, 
  region: string, 
  pathway: string,
  onOpenMethodology: () => void
}) {
  const topArchetype = data.archetypes?.[0];
  const profileSummary = enforceConditionalLanguage(
    data.mirrorNarrative ||
    topArchetype?.justification ||
    data.regionalAlignment ||
    `This profile could reflect a historical Team USA alignment from the ${region} region.`
  );

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-24"
    >
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b-8 border-victory-red pb-10">
        <div className="space-y-2">
          {data.isDeterministic && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-victory-gold/10 border border-victory-gold/30 text-victory-gold text-[9px] font-black uppercase tracking-[0.2em] mb-2 skew-x-[-10deg]">
              <Info className="w-3 h-3 skew-x-[10deg]" />
              <span className="skew-x-[10deg]">AI narrative unavailable; showing deterministic historical alignment.</span>
            </div>
          )}
          <span className="text-victory-gold font-black text-xs uppercase tracking-[0.5em] italic">Historical Synchronization Successful</span>
          <h2 className="text-7xl md:text-[140px] font-black uppercase tracking-tighter leading-[0.7] italic skew-title">YOUR <span className="text-victory-red">FRAME</span></h2>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.4em] pt-4 italic">
            This is a digital mirror, not a talent prediction tool. Results refer to historical biometric alignment only.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={onOpenMethodology}
            className="px-6 py-4 bg-victory-blue/10 border border-victory-blue/30 hover:bg-victory-blue/20 text-victory-blue uppercase text-xs font-black tracking-[0.2em] transition-all skew-x-[-10deg] flex items-center gap-2 outline-none focus:ring-2 focus:ring-victory-blue"
          >
            <Info className="w-4 h-4 skew-x-[10deg]" />
            <span className="skew-x-[10deg] block">HOW THIS WORKS</span>
          </button>
          <button onClick={onReset} className="px-10 py-4 bg-white/5 border border-white/20 hover:bg-white/10 uppercase text-sm font-black tracking-[0.2em] transition-all skew-x-[-10deg] outline-none focus:ring-2 focus:ring-white">
            <span className="skew-x-[10deg] block">NEW SCAN</span>
          </button>
          <button onClick={() => window.location.reload()} className="px-6 py-4 bg-victory-red text-white uppercase text-xs font-black tracking-[0.2em] transition-all skew-x-[-10deg] outline-none focus:ring-2 focus:ring-victory-red">
            <span className="skew-x-[10deg] block">HOME</span>
          </button>
        </div>
      </div>

      {/* Summary Highlight Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel p-1 border-victory-gold/50 bg-gradient-to-r from-victory-deep via-victory-gold/10 to-victory-deep"
      >
        <div className="bg-victory-deep p-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award className="w-64 h-64" />
          </div>
          <div className="shrink-0 w-48 h-48 border-4 border-victory-gold flex items-center justify-center relative z-10">
            <Dna className="w-24 h-24 text-victory-gold" />
            <div className="absolute -top-3 -right-3 bg-victory-red px-2 py-1 text-[10px] font-black italic">MIRROR SYNC</div>
          </div>
          <div className="space-y-4 text-center md:text-left relative z-10">
            <h3 className="text-4xl font-black italic uppercase tracking-tighter">Profile Alignment: <span className="text-victory-gold">{topArchetype?.title || "Historical Match"}</span></h3>
            <p className="text-neutral-400 font-medium max-w-xl">
              {profileSummary}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Left Column: Metrics & Radar */}
        <div className="lg:col-span-4 space-y-12">
          <div className="glass-panel p-10 space-y-8 border-l-4 border-victory-blue bg-gradient-to-b from-victory-blue/10 to-transparent">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-victory-gold flex items-center gap-3">
              <Dna className="w-5 h-5" /> DIGITAL MIRROR PROFILE
            </h3>
            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis 
                    dataKey="attribute" 
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 900 }}
                  />
                  <Radar
                    name="Profile"
                    dataKey="value"
                    stroke="#D4AF37"
                    fill="#D4AF37"
                    fillOpacity={0.5}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Central pulse dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-victory-red rounded-full blur-[4px] animate-pulse"></div>
            </div>
          </div>

          <div className="glass-panel p-10 space-y-8 border-l-4 border-victory-red">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-victory-gold flex items-center gap-3">
              <BarChart3 className="w-5 h-5" /> PERFORMANCE AFFINITY
            </h3>
            <div className="h-[250px] w-full bg-white/5 p-4 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.chartData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="attribute" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 900 }} />
                  <Radar
                    name="User"
                    dataKey="value"
                    stroke="#BF0A30"
                    fill="#BF0A30"
                    fillOpacity={0.7}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Archetypes & Paralympic Explorer */}
        <div className="lg:col-span-8 space-y-24">
          <div className="space-y-12">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
              <div className="w-10 h-10 bg-victory-red flex items-center justify-center skew-x-[-10deg]">
                <Flame className="w-5 h-5 text-white skew-x-[10deg]" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter skew-title">OLYMPIC ALIGNMENT</h3>
            </div>
            <div className="space-y-12">
              {data.archetypes.map((archetype, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.2 }}
                  className="glass-panel border-white/5 hover:border-victory-gold/50 transition-all group overflow-hidden"
                >
                  <div className="p-10 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-4">
                        <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter skew-title text-white">{archetype.title}</h3>
                        {archetype.matchScore && (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-32 bg-white/5 border border-white/10">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${archetype.matchScore}%` }}
                                className="h-full bg-victory-red"
                              />
                            </div>
                            <span className="text-[10px] font-black text-victory-red italic">{archetype.matchScore}% AFFINITY</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="px-4 py-1 bg-victory-gold/20 text-victory-gold text-[10px] uppercase font-black tracking-[0.3em] border border-victory-gold/30">HISTORICAL ALIGNMENT</div>
                        {archetype.confidence && (
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-victory-blue opacity-80 italic">{archetype.confidence}</div>
                        )}
                      </div>
                    </div>
                    <p className="text-lg text-neutral-300 font-light leading-relaxed max-w-2xl">{enforceConditionalLanguage(archetype.description)}</p>
                    
                    {archetype.breakdown && (
                      <div className="py-6 border-y border-white/5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-victory-gold" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-victory-gold">Why This Match?</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          <MatchScoreCard label="Height Sync" score={archetype.breakdown.heightSimilarity} />
                          <MatchScoreCard label="Weight Sync" score={archetype.breakdown.weightSimilarity} />
                          <MatchScoreCard label="BMI Sync" score={archetype.breakdown.bmiSimilarity} />
                          <MatchScoreCard label="Sport Affinity" score={archetype.breakdown.sportAffinity} />
                          <MatchScoreCard label="Historical" score={archetype.breakdown.historicalAlignment} />
                          <MatchScoreCard label="Pathway Fit" score={archetype.breakdown.pathwayFit} />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col md:flex-row items-start gap-4">
                      <div className="text-victory-red text-[11px] font-black uppercase tracking-[0.3em] pt-1 shrink-0 italic">HISTORICAL DATA:</div>
                      <p className="text-base text-neutral-500 font-bold leading-relaxed italic border-l-2 border-victory-red/20 pl-4">"{enforceConditionalLanguage(archetype.justification)}"</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {(pathway === 'paralympic' || pathway === 'both') && (
            <div className="space-y-12">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="w-10 h-10 bg-victory-blue flex items-center justify-center skew-x-[-10deg]">
                  <Accessibility className="w-5 h-5 text-white skew-x-[10deg]" />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter skew-title">PARALYMPIC CLASSIFICATION MIRROR</h3>
              </div>
              <ParalympicClassificationExplorer data={data.paralympicExplorer} />
            </div>
          )}
          
          <MirrorNarrativeCard narrative={data.mirrorNarrative} />
          
          <HistoricalJourney journey={data.historicalJourney} />
        </div>
      </div>

      {data.regionalReflection && (
        <div className="glass-panel p-16 space-y-12 bg-victory-blue/5 border-victory-blue/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-victory-gold">Regional Reflection</p>
              <h3 className="text-5xl font-black uppercase italic tracking-tighter skew-title">THE {data.regionalReflection.region.toUpperCase()} LEGACY</h3>
            </div>
            <div className="w-24 h-24 border-2 border-victory-gold/50 flex items-center justify-center rotate-45">
              <Globe className="w-12 h-12 text-victory-gold -rotate-45" />
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-victory-gold flex items-center gap-2">
                  <History className="w-4 h-4" /> Team USA Story
                </p>
                <p className="text-xl text-neutral-300 font-light leading-relaxed italic">
                  "{data.regionalReflection.story}"
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-victory-blue flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Archetype Connection
                </p>
                <p className="text-lg text-white font-medium leading-relaxed">
                  {data.regionalReflection.connection}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Regional Footprint (States)</p>
                <div className="text-sm font-bold text-victory-gold italic border border-white/10 bg-white/5 p-4 uppercase tracking-tighter">
                  {data.regionalReflection.states}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Historical Sport Cultures</p>
                <div className="text-sm font-bold text-white italic border border-white/10 bg-white/5 p-4 uppercase tracking-tighter">
                  {data.regionalReflection.sportCultures}
                </div>
              </div>

              <div className="p-6 border-l-4 border-victory-red bg-victory-red/5 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-victory-red">Biometric Alignment</p>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {enforceConditionalLanguage(data.regionalAlignment)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* Ethics Section */}
        <div className="glass-panel p-10 border-white/10 bg-white/5 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-victory-gold flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-victory-gold" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">DATA ETHICS & PRIVACY</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 text-[11px] font-bold text-neutral-500 uppercase tracking-widest leading-loose">
            <div className="space-y-4">
              <p><span className="text-white block mb-1">ZERO STORAGE POLICY:</span> Your biometric inputs are processed in real-time and are never stored or logged in our historical databases.</p>
              <p><span className="text-white block mb-1">ANONYMOUS AGGREGATION:</span> All mapping is compared against anonymized historical Team USA data sets to protect the privacy of specific athletes.</p>
            </div>
            <div className="space-y-4">
              <p><span className="text-white block mb-1">NO PRIVATE IDENTIFICATION:</span> This tool explicitly avoids comparing you to named private athletes to ensure institutional compliance and respect for individual privacy.</p>
              <p><span className="text-white block mb-1">AI GROUNDING:</span> Analysis is strictly grounded in verified historical Team USA Olympic and Paralympic datasets.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HistoricalJourney({ journey }: { journey?: AnalysisResult['historicalJourney'] }) {
  if (!journey) return null;

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-victory-blue flex items-center justify-center skew-x-[-10deg]">
          <History className="w-6 h-6 text-white skew-x-[10deg]" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter skew-title text-white">120-YEAR TEAM USA JOURNEY</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-victory-blue opacity-60 italic">Historical Era Mapping</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {journey.eras.map((era, idx) => (
          <div key={idx} className="glass-panel p-8 border-white/5 space-y-6 hover:border-victory-blue transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <span className="text-3xl font-black italic tracking-tighter text-white">{era.era}</span>
              <div className="text-[9px] font-black uppercase tracking-widest bg-victory-blue/20 text-victory-blue px-2 py-1">SYNC: {era.focus}%</div>
            </div>
            
            <div className="h-1 bg-white/5 border border-white/10 relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${era.focus}%` }}
                className="h-full bg-victory-blue"
              />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-neutral-500">Dominant Families</p>
                <p className="text-[11px] font-black text-victory-gold italic uppercase tracking-tight">{Array.isArray(era.dominantFamilies) ? era.dominantFamilies.join(', ') : era.dominantFamilies}</p>
              </div>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed leading-relaxed italic border-l border-white/10 pl-3">
                {era.story}
              </p>
            </div>

            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Timer className="w-24 h-24 text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-10 border-l-8 border-victory-blue bg-victory-blue/5 italic relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <History className="w-32 h-32 text-white" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-16 h-16 bg-white flex items-center justify-center skew-x-[-10deg] shrink-0">
            <Zap className="w-8 h-8 text-victory-blue skew-x-[10deg]" />
          </div>
          <p className="text-xl text-neutral-200 font-light leading-relaxed">
            {enforceConditionalLanguage(journey.narrative)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MatchScoreCard({ label, score }: { label: string, score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="h-1 bg-white/5 border border-white/10 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className="h-full bg-victory-blue"
        />
      </div>
    </div>
  );
}

function ParalympicClassificationExplorer({ data }: { data?: ParalympicExplorerData }) {
  const defaultSystems = [
    {
      sport: "Para Athletics",
      description: "Classifications could reflect how movement, vision, or coordination impacts track and field performance. T-classes correspond to track events, while F-classes correspond to field events.",
      codes: ["T/F11-13", "T/F20", "T/F31-38", "T/F40-47", "T/F51-57"]
    },
    {
      sport: "Para Swimming",
      description: "Athletes could be grouped by functional impact within specific stroke categories. S classes are for freestyle, butterfly and backstroke; SB for breaststroke; SM for individual medley.",
      codes: ["S1-S10", "S11-S13", "S14", "SB1-SB9", "SM1-SM10"]
    },
    {
      sport: "Wheelchair Basketball",
      description: "This sport could use a point-based functional system (1.0 to 4.5) to support balanced team competition based on trunk movement and stability.",
      codes: ["1.0 Points", "2.5 Points", "4.5 Points"]
    },
    {
      sport: "Wheelchair Rugby",
      description: "A point-based system (0.5 to 3.5) could be utilized to ensure equitable competition. Total team points on the court are strictly limited.",
      codes: ["0.5 Points", "2.0 Points", "3.5 Points"]
    }
  ];

  const displaySystems = data?.systems && data.systems.length > 0 ? data.systems : defaultSystems;

  return (
    <div className="glass-panel p-16 space-y-16 bg-victory-blue/5 border-victory-blue/20 relative overflow-hidden group">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-victory-blue text-white text-[10px] font-black uppercase italic tracking-widest">Core Principle</span>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">THE CLASSIFICATION MIRROR</h3>
          </div>
          <p className="text-xl text-neutral-300 font-light leading-relaxed">
            Classification is sport-specific and is <span className="text-victory-blue font-bold">not a medical diagnosis</span>. It describes how impairment <span className="text-white italic underline">could affect</span> sport-specific competition and historically groups athletes for equitable play.
          </p>
        </div>
        <div className="w-24 h-24 border-2 border-victory-blue/50 flex items-center justify-center rotate-45 shrink-0">
          <Activity className="w-12 h-12 text-victory-blue -rotate-45" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 relative z-10">
        {displaySystems.map((system, idx) => (
          <div key={idx} className="glass-panel p-8 border-white/5 space-y-6 hover:border-victory-blue transition-all group/card bg-white/5">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h4 className="text-xl font-black uppercase italic text-white tracking-widest">{system.sport}</h4>
              <div className="flex gap-1 flex-wrap justify-end">
                {system.codes.slice(0, 2).map((code, cidx) => (
                  <span key={cidx} className="text-[9px] font-black bg-victory-blue/20 border border-victory-blue/30 px-2 py-0.5 text-victory-blue">
                    {code}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed font-medium min-h-[60px]">
              {enforceConditionalLanguage(system.description)}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {system.codes.map((code, cidx) => (
                <span key={cidx} className="text-[10px] font-bold text-neutral-500 border border-white/5 px-2 py-1 bg-white/5">
                  {code}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {data?.personalizedInsight && (
        <div className="p-8 border-l-4 border-victory-blue bg-victory-blue/5 space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-victory-blue" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-victory-blue italic">Institutional Insight</span>
          </div>
          <p className="text-lg text-white font-medium italic leading-relaxed">
            {enforceConditionalLanguage(data.personalizedInsight)}
          </p>
        </div>
      )}

      <div className="p-8 bg-victory-blue/10 border border-victory-blue/30 text-victory-blue text-xs font-black uppercase tracking-[0.2em] italic text-center relative z-10">
        "Classification is sport-specific and is not a medical diagnosis. It describes how impairment could affect sport-specific competition."
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-white/5 text-[11px] font-bold text-neutral-500 uppercase tracking-widest leading-loose relative z-10">
        <ul className="space-y-4">
          {(data?.corePrinciples || [
            "Classification is sport-specific and functional.",
            "Grouping is based on movement impact on sport performance.",
            "Impairment must meet minimum eligibility criteria."
          ]).slice(0, 2).map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-victory-blue font-black">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-4">
          {(data?.corePrinciples || [
            "Classification systems could evolve as sports develop.",
            "Evaluation ensures competing fairly against similar profiles."
          ]).slice(2, 4).map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-victory-blue font-black">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="glass-panel p-6 space-y-2 border-victory-blue/20">
      <div className="flex items-center gap-3 opacity-60">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-3xl font-black font-sans italic text-white leading-none">{value}</div>
    </div>
  );
}

interface GeminiChatProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  results: AnalysisResult | null;
}

function GeminiChat({ isOpen, onClose, profile, results }: GeminiChatProps) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'model', content: "M.I.R.R.O.R synchronization complete. Legacy data streams ready. How can I assist in your historical mapping?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = [
    "How does my regional legacy align?",
    "Explain the historical era mapping.",
    "What characterizes my top archetype?",
    "Tell me about Paralympic classifications."
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = (typeof customText === 'string' ? customText : input || '').trim();
    if (!textToSend || isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          profile,
          results
        })
      });

      if (!response.ok) throw new Error("MIRROR_CHAT_FAILED");

      const { text: reply } = await response.json();
      setMessages(prev => [...prev, { role: 'model', content: enforceConditionalLanguage(reply) }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `
          <div class="space-y-4">
            <p>M.I.R.R.O.R synchronization interrupted. Context sync lost or API quota reached.</p>
            <button onclick="window.location.reload()" class="px-4 py-2 bg-victory-red text-white font-black uppercase text-[10px] tracking-widest italic skew-x-[-10deg]">
              <span class="skew-x-[10deg] block">REFRESH CONTEXT</span>
            </button>
          </div>
        ` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed bottom-0 right-0 w-full sm:w-[450px] h-full sm:h-[650px] bg-victory-deep z-[100] flex flex-col border-l-8 border-victory-blue"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-victory-blue">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white flex items-center justify-center skew-x-[-10deg]">
                <Flame className="w-6 h-6 text-victory-red skew-x-[10deg]" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-black uppercase italic tracking-tighter skew-title">PROTOCOL ASSISTANT</h2>
                <span className="text-[10px] opacity-70 font-black tracking-[0.4em] uppercase">Spirit of the Mirror</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close Assistant" 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all border border-white/30 flex items-center gap-2 group transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Close Window</span>
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-victory-deep" role="log" aria-live="polite">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[90%] p-6 rounded-none text-sm font-medium leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-victory-red text-white font-black italic skew-x-[-5deg]' 
                      : 'bg-white/5 border border-white/10 text-neutral-300 border-l-4 border-victory-gold'
                  }`}
                  aria-label={`${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content.replace(/<[^>]*>/g, '')}`}
                >
                  <div dangerouslySetInnerHTML={{ __html: m.content }}></div>
                </div>
              </div>
            ))}
            
            {messages.length < 3 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Suggested Modules:</p>
                <div className="flex flex-col gap-2" role="group" aria-label="Suggested Questions">
                  {suggestedQuestions.map((q, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="text-left text-[11px] p-3 bg-white/5 border border-white/10 hover:border-victory-red transition-all font-bold uppercase italic tracking-tighter focus:ring-2 focus:ring-victory-red outline-none"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start" aria-label="Loading response">
                <div className="bg-white/5 border border-white/10 p-6 flex gap-2">
                  <div className="w-2 h-2 bg-victory-red animate-bounce"></div>
                  <div className="w-2 h-2 bg-victory-red animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-victory-red animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-8 border-t border-white/10 bg-white/5 flex gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <label htmlFor="chat-query" className="sr-only">Query parameters</label>
              <input 
                id="chat-query"
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query parameters..."
                className="w-full bg-white/10 border border-white/20 px-6 py-4 text-sm font-bold italic outline-none focus:border-victory-red transition-all uppercase tracking-widest focus:ring-2 focus:ring-victory-red"
              />
            </div>
            <button 
              onClick={() => handleSend()}
              disabled={isLoading}
              aria-label="Send Query"
              className="bg-victory-red px-6 py-4 text-white hover:bg-red-700 disabled:opacity-50 transition-all font-black uppercase text-xl focus:ring-2 focus:ring-victory-red outline-none"
            >
              GO
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MethodologyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-victory-deep/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl glass-panel border-victory-gold/30 bg-victory-deep p-8 md:p-12 space-y-8 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck className="w-48 h-48 text-victory-gold" />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-victory-gold">
                  <Info className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Methodology Protocol</span>
                </div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter skew-title">SYSTEM GROUNDING</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-victory-red transition-all group/close"
              >
                <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-victory-blue">Biometric Sync</p>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Olympic athlete biometrics are used for statistical clustering and identifying historical archetype similarity based on 120 years of data.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-victory-gold">Para Classifications</p>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Paralympic data is used for functional classification explanations and potential pathway guidance based on impairment context.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-victory-red">Regional Context</p>
                  <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                    Regional histories and sport cultures are used as storytelling layers to connect your profile to local Team USA legacies.
                  </p>
                </div>
              </div>

              <div className="space-y-6 bg-white/5 p-6 border-l-4 border-victory-red">
                <p className="text-[10px] font-black uppercase tracking-widest text-white">System Boundaries</p>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-xs text-neutral-300 font-medium">
                    <div className="w-1.5 h-1.5 bg-victory-red rotate-45 shrink-0 mt-1.5" />
                    <span>The app <span className="text-white font-bold italic underline">does not</span> predict or guarantee future athletic success.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-neutral-300 font-medium">
                    <div className="w-1.5 h-1.5 bg-victory-red rotate-45 shrink-0 mt-1.5" />
                    <span>Results represent historical alignment signals, not expert talent judgments.</span>
                  </li>
                  <li className="flex gap-3 text-xs text-neutral-300 font-medium">
                    <div className="w-1.5 h-1.5 bg-victory-red rotate-45 shrink-0 mt-1.5" />
                    <span>The app <span className="text-white font-bold italic underline">does not</span> medically classify users for Para-sports.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-center opacity-40">
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">Analytical Framework // v2.4.0-Mirror</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
