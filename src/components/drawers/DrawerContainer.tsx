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
  if (!isOpen) return null;
  
  return (
    <div 
      className={cn(
        "absolute top-0 bottom-0 right-12 w-80 bg-panel border-l border-border/50",
        "animate-slide-in-right z-30",
        className
      )}
    >
      {/* Header */}
      {title && (
        <div className="h-10 flex items-center justify-between px-4 border-b border-border/30">
          <span className="text-sm font-medium">{title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Content */}
      <div className="overflow-y-auto scrollbar-thin h-[calc(100%-2.5rem)]">
        {children}
      </div>
    </div>
  );
};
