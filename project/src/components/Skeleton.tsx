export default function Skeleton({ className = "" }: { className?: string }) {
  // O 'animate-pulse' é o segredo do efeito "respirando" igual ao do LinkedIn
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}