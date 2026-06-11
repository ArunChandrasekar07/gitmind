import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("shimmer rounded-md", className)}
      style={{
        background: "hsl(222 16% 14%)",
      }}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: `${i === lines - 1 ? 65 : 100}%` }}
        />
      ))}
    </div>
  );
}

export function CommitRowSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 16px",
        borderBottom: "1px solid hsl(222 14% 14%)",
      }}
    >
      <Skeleton style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 }} />
      <Skeleton style={{ width: "46px", height: "18px", borderRadius: "5px", flexShrink: 0 }} />
      <Skeleton style={{ width: "56px", height: "18px", borderRadius: "5px", flexShrink: 0 }} />
      <Skeleton style={{ flex: 1, height: "14px", borderRadius: "4px" }} />
      <Skeleton style={{ width: "80px", height: "14px", borderRadius: "4px", flexShrink: 0 }} />
      <Skeleton style={{ width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0 }} />
    </div>
  );
}

export function RepoHeaderSkeleton() {
  return (
    <div
      style={{
        background: "hsl(222 18% 10%)",
        border: "1px solid hsl(222 14% 15%)",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <Skeleton style={{ width: "48px", height: "48px", borderRadius: "10px", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ width: "180px", height: "18px", borderRadius: "5px", marginBottom: "8px" }} />
          <Skeleton style={{ width: "260px", height: "13px", borderRadius: "4px", marginBottom: "10px" }} />
          <div style={{ display: "flex", gap: "12px" }}>
            <Skeleton style={{ width: "60px", height: "13px", borderRadius: "4px" }} />
            <Skeleton style={{ width: "50px", height: "13px", borderRadius: "4px" }} />
            <Skeleton style={{ width: "50px", height: "13px", borderRadius: "4px" }} />
          </div>
        </div>
      </div>
      <Skeleton style={{ height: "80px", borderRadius: "8px" }} />
    </div>
  );
}