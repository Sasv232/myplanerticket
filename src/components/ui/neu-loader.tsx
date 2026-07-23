export function NeuLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-12 h-12";
  return (
    <div className="flex items-center justify-center">
      <svg className={`pl ${s}`} viewBox="0 0 128 128" width="128" height="128">
        <circle className="pl__ring pl__ring--a" cx="64" cy="64" r="52" fill="none" />
        <circle className="pl__ring pl__ring--b" cx="64" cy="64" r="52" fill="none" />
        <circle className="pl__ring pl__ring--c" cx="64" cy="64" r="52" fill="none" />
        <circle className="pl__ring pl__ring--d" cx="64" cy="64" r="52" fill="none" />
      </svg>
    </div>
  );
}
