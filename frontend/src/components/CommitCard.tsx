"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown, ChevronUp, ExternalLink,
  Plus, Minus, FileCode2, Loader2,
  AlertTriangle, CheckCircle, AlertCircle,
} from "lucide-react";
import { CommitInfo, analyzeAPI } from "@/lib/api";
import { toast } from "sonner";

interface CommitCardProps {
  commit: CommitInfo;
  analysis?: string;
  owner: string;
  repo: string;
  index: number;
}

function getRiskBadge(analysis: string) {
  if (analysis.includes("🔴")) return { color: "text-red-400 bg-red-400/10 border-red-400/20", label: "Risky", icon: AlertTriangle };
  if (analysis.includes("🟡")) return { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", label: "Minor Risk", icon: AlertCircle };
  return { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Safe", icon: CheckCircle };
}

function getCategory(analysis: string) {
  const cats = ["feat", "fix", "refactor", "docs", "chore", "perf", "security"];
  for (const cat of cats) {
    if (analysis.toLowerCase().includes(cat)) return cat;
  }
  return "commit";
}

const CAT_COLORS: Record<string, string> = {
  feat: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  fix: "bg-red-500/10 text-red-400 border-red-500/20",
  refactor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  docs: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  chore: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  perf: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  security: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  commit: "bg-muted text-muted-foreground border-border",
};

export function CommitCard({ commit, analysis: initialAnalysis, owner, repo, index }: CommitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState(initialAnalysis || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  const handleAnalyze = async () => {
    if (analysis || isAnalyzing) {
      setExpanded(!expanded);
      return;
    }

    setIsAnalyzing(true);
    setExpanded(true);

    try {
      await analyzeAPI.streamCommit(
        owner, repo, commit.sha,
        (token) => setStreamedText(prev => prev + token),
        () => {
          setAnalysis(streamedText);
          setIsAnalyzing(false);
        },
      );
    } catch {
      toast.error("Analysis failed for this commit");
      setIsAnalyzing(false);
    }
  };

  const displayAnalysis = analysis || streamedText;
  const risk = displayAnalysis ? getRiskBadge(displayAnalysis) : null;
  const category = displayAnalysis ? getCategory(displayAnalysis) : null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const firstLine = commit.message.split("\n")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border/50 rounded-2xl bg-card/30 glass overflow-hidden hover:border-primary/30 transition-colors duration-200"
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={handleAnalyze}
      >
        {/* Avatar */}
        {commit.avatar ? (
          <img src={commit.avatar} alt={commit.author} className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary">{commit.author[0]}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Category badge */}
            {category && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CAT_COLORS[category]}`}>
                {category}
              </span>
            )}
            {/* Risk badge */}
            {risk && (
              <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${risk.color}`}>
                <risk.icon className="w-2.5 h-2.5" />
                {risk.label}
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-foreground truncate mb-1">{firstLine}</p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded">{commit.short_sha}</span>
            <span>{commit.author}</span>
            <span>{formatDate(commit.date)}</span>
            {commit.additions !== undefined && (
              <>
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <Plus className="w-3 h-3" />{commit.additions}
                </span>
                <span className="text-red-400 flex items-center gap-0.5">
                  <Minus className="w-3 h-3" />{commit.deletions}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
        <a
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <button className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Analysis */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/30 pt-3">
              {/* Files changed */}
              {commit.files && commit.files.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <FileCode2 className="w-3 h-3" />
                    {commit.files.length} file{commit.files.length > 1 ? "s" : ""} changed
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {commit.files.map((f) => (
                      <span key={f.filename} className={`text-xs px-2 py-0.5 rounded-lg border font-mono ${
                        f.status === "added" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        f.status === "removed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-muted/50 text-muted-foreground border-border/30"
                      }`}>
                        {f.filename.split("/").pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <p className="text-xs text-primary font-medium mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  GitMind Analysis
                </p>
                {isAnalyzing && !streamedText ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Analyzing commit...
                  </div>
                ) : (
                  <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{displayAnalysis}</ReactMarkdown>
                    {isAnalyzing && (
                      <motion.span
                        className="inline-block w-0.5 h-4 bg-primary ml-0.5 rounded-full"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}