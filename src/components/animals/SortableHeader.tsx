import React from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortConfig } from '@/hooks/useAnimalTableSort';

interface SortableHeaderProps {
  column: string;
  label: React.ReactNode;
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right';
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  column,
  label,
  sortConfig,
  onSort,
  className,
  style,
  align = 'left'
}) => {
  const isActive = sortConfig.column === column;
  const Icon = !isActive ? ArrowUpDown : sortConfig.direction === 'asc' ? ChevronUp : ChevronDown;

  return (
    <th
      className={cn(
        'cursor-pointer select-none align-middle',
        className
      )}
      style={style}
      scope="col"
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'flex w-full items-center gap-1 text-xs font-semibold tracking-tight',
          align === 'center'
            ? 'justify-center text-center'
            : align === 'right'
            ? 'justify-end text-right'
            : 'justify-start text-left'
        )}
      >
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </button>
    </th>
  );
};

export default SortableHeader;
