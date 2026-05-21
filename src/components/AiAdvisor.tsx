import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCcw, Quote, BrainCircuit, AlertTriangle, ShieldCheck } from "lucide-react";

interface AiAdvisorProps {
  weather: string;
  globalSurgeEnabled: boolean;
  onRefreshTrigger: number; // to allow parents to force refetch
}

export default function AiAdvisor({ weather, globalSurgeEnabled, onRefreshTrigger }: AiAdvisorProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        setAdvice(data.advice);
      } else {
        throw new Error(data.error || "Failed to generate recommendations.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to contact live transit advisory. Using saved offline directives.");
      setAdvice(`### System Transit Bulletin
      
*AI Transit recommendation engine is currently standardizing queues. Summary metrics indicate successful commuter balancing across all express tunnels.*
* **Congestion Multiplier Target**: Hold Skyway Bridge pricing at 2.50x to encourage bypass lane routing.
* **Friction Safety Caution**: Active weather overrides applied. Drive safely.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [weather, globalSurgeEnabled, onRefreshTrigger]);

  // Assist with markdown rendering fallback for custom transit formatting
  const renderAdviceMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Handle Headings
      if (trimmed.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-semibold text-slate-100 mt-4 mb-2 first:mt-0 font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1" id={`heading-${idx}`}><BrainCircuit className="w-4 h-4 text-indigo-400" /> {trimmed.substring(4)}</h4>;
      }
      if (trimmed.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-bold text-slate-100 mt-5 mb-2 first:mt-0 border-b border-indigo-950 pb-1 font-mono tracking-wide" id={`heading-${idx}`}>{trimmed.substring(3)}</h3>;
      }
      if (trimmed.startsWith("# ")) {
        return <h2 key={idx} className="text-lg font-extrabold text-indigo-450 mt-6 mb-3 first:mt-0 font-mono tracking-tight" id={`heading-${idx}`}>{trimmed.substring(2)}</h2>;
      }

      // Handle Bullet Points
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const content = trimmed.substring(2);
        // Highlight bold text inside bullet points
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="text-slate-200 font-semibold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < content.length) {
          parts.push(content.substring(lastIndex));
        }

        return (
          <li key={idx} className="list-disc list-inside text-slate-300 ml-2 mb-2 leading-relaxed" id={`bullet-${idx}`}>
            <span className="text-xs text-indigo-300 mr-1.5">•</span>
            <span className="text-xs font-sans text-slate-300">{parts.length > 0 ? parts : content}</span>
          </li>
        );
      }

      // Plain paragraphs
      if (trimmed.length === 0) return <div key={idx} className="h-2"></div>;

      return (
        <p key={idx} className="text-xs text-slate-400 mb-2 leading-relaxed font-sans" id={`para-${idx}`}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm" id="ai-advisor-container">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400 animate-pulse">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-1.5">
              Gemini Transit Advisory
            </h2>
            <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Co-Pilot Advisor Node</p>
          </div>
        </div>
        
        <button
          onClick={fetchAdvice}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 font-mono"
          id="refresh-advice-btn"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          RE-EVALUATE
        </button>
      </div>

      {/* Advisory Content Console Output */}
      <div className="bg-slate-950/65 rounded-xl border border-slate-850/80 p-5 max-h-[385px] overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-slate-800" id="advice-content-box">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-indigo-400 font-medium animate-pulse">Formulating Strategic Dynamic Traffic Directive...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-400 font-sans">
              {renderAdviceMarkdown(advice)}
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 font-sans">
            {renderAdviceMarkdown(advice)}
          </div>
        )}
      </div>

      {/* Meta specifications footer */}
      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-indigo-500" /> Compliance auto-audit active</span>
        <span>Node: gemini-3.5-flash</span>
      </div>
    </div>
  );
}
