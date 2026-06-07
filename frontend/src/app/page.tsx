"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  GitCommit,
  Brain,
  Zap,
  Shield,
  ArrowRight,
  Loader2,
  GitBranch,
  BarChart2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CommitCard } from "@/components/CommitCard";
import { RepoHeader } from "@/components/RepoHeader";
import { analyzeAPI, githubAPI, BatchAnalysisResponse } from "@/lib/api";
import { toast } from "sonner";

const EXAMPLE_REPOS = [
  "https://github.com/tiangolo/fastapi",
  "https://github.com/vercel/next.js",
  "https://github.com/ArunChandrasekar07/devmind",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [result, setResult] = useState<BatchAnalysisResponse | null>(null);
  const [commitLimit, setCommitLimit] = useState(10);

  const handleAnalyze = async (repoUrl?: string) => {
    const targetUrl = repoUrl || url;
    if (!targetUrl.trim()) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      setLoadingStage("Fetching repository...");
      await new Promise(r => setTimeout(r, 400));

      setLoadingStage("Reading commit history...");
      await new Promise(r => setTimeout(r, 400));

      setLoadingStage("Analyzing commits with AI...");

      const data = await analyzeAPI.analyzeBatch(targetUrl, commitLimit);
      setResult(data);
      toast.success(`Analyzed ${data.total} commits from ${data.repo.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center"
            >
              <Brain className="w-3.5 h-3.5 text-primary" />
            </motion.div>
            <span className="font-bold tracking-tight">GitMind</span>
            <Badge variant="secondary" className="text-xs border border-primary/20 bg-primary/5 text-primary ml-1">
              AI
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <a
            
              href="https://github.com/ArunChandrasekar07"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitBranch className="w-4 h-4" />
            </a>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Built by Arun C · VIT Vellore
            </span>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      {!result && (
        <section className="flex flex-col items-center justify-center min-h-screen px-6 pt-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Badge variant="secondary" className="gap-2 px-4 py-1.5 border border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Gemini AI + GitHub API
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-[1.1] max-w-3xl"
          >
            Understand any{" "}
            <span className="gradient-text">Git repository</span>{" "}
            instantly.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-10"
          >
            Paste a GitHub repo URL → AI explains every commit in plain English,
            detects risky changes, and generates a visual changelog.
          </motion.p>

          {/* URL Input */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-2xl mb-4"
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://github.com/owner/repository"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="pl-10 h-12 bg-background/80 text-base border-border/50 focus:border-primary/50"
                />
              </div>
              <select
                value={commitLimit}
                onChange={(e) => setCommitLimit(Number(e.target.value))}
                className="h-12 px-3 rounded-xl border border-border/50 bg-background/80 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                <option value={5}>5 commits</option>
                <option value={10}>10 commits</option>
                <option value={20}>20 commits</option>
                <option value={30}>30 commits</option>
              </select>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => handleAnalyze()}
                  disabled={isLoading}
                  className="h-12 px-6 gap-2 glow"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Loading stage */}
          <AnimatePresence>
            {isLoading && loadingStage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-primary mb-4"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                {loadingStage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Example repos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 justify-center mb-16"
          >
            <span className="text-xs text-muted-foreground self-center">Try:</span>
            {EXAMPLE_REPOS.map((repo) => (
              <button
                key={repo}
                onClick={() => { setUrl(repo); handleAnalyze(repo); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors bg-card/30"
              >
                {repo.replace("https://github.com/", "")}
              </button>
            ))}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid sm:grid-cols-3 gap-4 max-w-3xl w-full"
          >
            {[
              { icon: GitCommit, color: "text-violet-400", bg: "bg-violet-400/10", title: "Commit Explanations", desc: "Every commit explained in plain English — what changed and why it matters" },
              { icon: Shield, color: "text-red-400", bg: "bg-red-400/10", title: "Risk Detection", desc: "AI flags risky commits that may introduce bugs or security issues" },
              { icon: BarChart2, color: "text-emerald-400", bg: "bg-emerald-400/10", title: "Repo Health", desc: "Overall repository activity summary and development pattern analysis" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl border border-border/50 bg-card/30 glass text-left"
              >
                <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-6 pt-20 pb-16"
          >
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setResult(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Analyze another repo
            </motion.button>

            {/* Repo header */}
            <RepoHeader
              repo={result.repo}
              summary={result.summary}
              commitCount={result.total}
            />

            {/* New analysis button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-muted-foreground">
                {result.total} commits · click any to see AI analysis
              </h2>
              <button
                onClick={() => { setResult(null); }}
                className="text-xs text-primary hover:underline"
              >
                + Analyze another
              </button>
            </div>

            {/* Commit cards */}
            <div className="space-y-3">
              {result.analyzed_commits.map((item, i) => (
                <CommitCard
                  key={item.commit.sha}
                  commit={item.commit}
                  analysis={item.analysis}
                  owner={result.repo.owner}
                  repo={result.repo.name}
                  index={i}
                />
              ))}
            </div>

            <div className="text-center mt-8 text-xs text-muted-foreground">
              Built by Arun C · VIT Vellore · Powered by Gemini AI
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}