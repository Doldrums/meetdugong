interface GlassCardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export default function GlassCard({ title, className = '', children }: GlassCardProps) {
  return (
    <div className={`glass-card p-4 ${className}`} style={{ animation: 'fade-in-up 0.4s ease-out both' }}>
      {title && (
        <h2 className="section-header mb-3">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
