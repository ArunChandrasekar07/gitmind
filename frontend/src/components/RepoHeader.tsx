"use client";

import { motion } from "framer-motion";
import { Star, GitFork, ExternalLink, Code2, Calendar } from "lucide-react";
import { RepoInfo } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface RepoHeaderProps {
  repo: RepoInfo;
  summary?: string;
  commitCount: number;
}

export function RepoHeader({ repo, summary, commitCount }: RepoHeaderProps) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", {
    month: "short", year: "numeric"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-border/50 p-6 mb-6"
    >
      {/* Repo info */}
      <div className="flex items-start gap-4 mb-4">
        <img src={repo.avatar} alt={repo.owner} className="w-12 h-12 rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {repo.full_name}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          {repo.description && (
            <p className="text-sm text-muted-foreground mb-2">{repo.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {repo.language && (
              <span className="flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              {repo.stars.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              {repo.forks.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(repo.updated_at)}
            </span>
            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {commitCount} commits analyzed
            </span>
          </div>
        </div>
      </div>

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {repo.topics.map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground border border-border/30">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
          <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Repository Health Summary
          </p>
          <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
}