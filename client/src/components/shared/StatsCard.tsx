import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; label: string };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border border-border',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-green-500 text-white',
  warning: 'bg-amber-500 text-white',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-white/20 text-white',
  success: 'bg-white/20 text-white',
  warning: 'bg-white/20 text-white',
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  className,
}: StatsCardProps) => {
  const isColored = variant !== 'default';
  return (
    <div
      className={cn(
        'rounded-xl p-6 shadow-card flex items-start gap-4',
        variantStyles[variant],
        className
      )}
    >
      <div className={cn('p-3 rounded-lg flex-shrink-0', iconVariantStyles[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isColored ? 'text-white/80' : 'text-muted-foreground')}>
          {title}
        </p>
        <p className={cn('text-2xl font-bold mt-1', isColored ? 'text-white' : 'text-foreground')}>
          {value}
        </p>
        {description && (
          <p className={cn('text-xs mt-1', isColored ? 'text-white/70' : 'text-muted-foreground')}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
