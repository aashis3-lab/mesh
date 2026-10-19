export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      mesh<span className="text-gold">.</span>
    </span>
  );
}
