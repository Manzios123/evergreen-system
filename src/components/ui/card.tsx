// components/ui/card.tsx
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`min-w-0 bg-card text-card-foreground shadow-sm rounded-xl border border-border ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}