interface GlassCardProps {
  title?: string;
  emoji?: string;
  className?: string;
  children: React.ReactNode;
}

export default function GlassCard({ title, emoji, className = '', children }: GlassCardProps) {
  return (
    <div className={`glass-card p-4 ${className}`} style={{ animation: 'fade-in-up 0.4s ease-out both' }}>
      {title && (
        <h2 className="section-header mb-3 flex items-center gap-2">
          {emoji && <span className="text-sm" style={{ animation: 'float 3s ease-in-out infinite' }}>{emoji}</span>}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
