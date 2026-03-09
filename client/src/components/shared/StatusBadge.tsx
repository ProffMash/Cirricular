import { EventCategory } from '@/types';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  Sports: 'bg-green-100 text-green-800 border-green-200',
  Arts: 'bg-purple-100 text-purple-800 border-purple-200',
  Academic: 'bg-blue-100 text-blue-800 border-blue-200',
  Tech: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Cultural: 'bg-orange-100 text-orange-800 border-orange-200',
  Social: 'bg-pink-100 text-pink-800 border-pink-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
};

interface StatusBadgeProps {
  label: string;
  className?: string;
}

const StatusBadge = ({ label, className }: StatusBadgeProps) => {
  const colorClass = categoryColors[label] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
