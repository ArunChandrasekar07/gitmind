"use client";

const CAT_CLASSES: Record<string, string> = {
  feat:     "cat-feat",
  fix:      "cat-fix",
  refactor: "cat-refactor",
  perf:     "cat-perf",
  security: "cat-security",
  docs:     "cat-docs",
  chore:    "cat-chore",
  commit:   "cat-commit",
};

export function getCategoryFromText(text: string): string {
  const lower = text.toLowerCase();
  const cats = ["security", "feat", "fix", "perf", "refactor", "docs", "chore"];
  for (const c of cats) if (lower.includes(c)) return c;
  return "commit";
}

export function getCategoryFromMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.startsWith("feat") || lower.startsWith("feature")) return "feat";
  if (lower.startsWith("fix") || lower.startsWith("bug")) return "fix";
  if (lower.startsWith("refactor")) return "refactor";
  if (lower.startsWith("perf")) return "perf";
  if (lower.startsWith("security") || lower.startsWith("sec")) return "security";
  if (lower.startsWith("doc")) return "docs";
  if (lower.startsWith("chore") || lower.startsWith("ci") || lower.startsWith("build")) return "chore";
  return "commit";
}

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const cls = CAT_CLASSES[category] || CAT_CLASSES.commit;
  return (
    <span
      className={cls}
      style={{
        display: "inline-block",
        padding: size === "sm" ? "2px 7px" : "3px 10px",
        borderRadius: "5px",
        fontSize: size === "sm" ? "11px" : "12px",
        fontWeight: 600,
        fontFamily: "JetBrains Mono, monospace",
        border: "1px solid",
        letterSpacing: "0.01em",
        lineHeight: 1.5,
      }}
    >
      {category}
    </span>
  );
}