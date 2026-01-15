import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DrawerContainerProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DrawerContainer: React.FC<DrawerContainerProps> = ({
  isOpen,
  title,
  onClose,
  children,
  className,
}) => {
  return (
    <div 
      className={cn(
        // Fixed width, transitions smoothly in/out
        "h-full bg-panel border-l border-border/50 flex flex-col overflow-hidden",
        "transition-all duration-300 ease-out",
        isOpen ? "w-80" : "w-0",
        className
      )}
    >
      {/* Header */}
      {title && (
        <div className="h-10 flex items-center justify-between px-4 border-b border-border/30 flex-shrink-0">
          <span className="text-sm font-medium whitespace-nowrap">{title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 flex-shrink-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Content */}
      <div className={cn(
        "flex-1 overflow-y-auto scrollbar-thin overflow-x-hidden",
        !isOpen && "invisible"
      )}>
        {children}
      </div>
    </div>
  );
};
