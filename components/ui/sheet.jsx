'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// 1. Create a Context so all children can access the close function
const SheetContext = React.createContext({
  open: false,
  onOpenChange: () => {},
});

const SheetOverlay = React.forwardRef((props, ref) => {
  // Use context to close when clicking the background
  const { onOpenChange } = React.useContext(SheetContext);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
});
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = React.forwardRef(({ className, children, side = 'right', ...props }, ref) => {
  // 2. Consume the context to get the close function
  const { onOpenChange } = React.useContext(SheetContext);

  const sideClasses = {
    right: 'right-0 top-0 h-full w-full sm:w-[400px]',
    left: 'left-0 top-0 h-full w-full sm:w-[400px]',
    top: 'top-0 left-0 w-full h-auto',
    bottom: 'bottom-0 left-0 w-full h-auto',
  };

  const sideAnimations = {
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    top: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } },
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col border bg-background shadow-lg',
        sideClasses[side],
        className
      )}
      initial={sideAnimations[side].initial}
      animate={sideAnimations[side].animate}
      exit={sideAnimations[side].exit}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      {...props}
    >
      <div className="flex h-full flex-col relative">
        {children}
        
        {/* 3. The "X" Button now works because it calls context */}
        <button 
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
      </div>
    </motion.div>
  );
});
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-2 p-6 pb-4', className)} {...props} />
);

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
SheetDescription.displayName = 'SheetDescription';

const SheetFooter = ({ className, ...props }) => (
  <div className={cn('flex flex-col-reverse gap-2 p-6 pt-4 sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);

// 4. THIS IS THE MISSING COMPONENT CAUSING THE ERROR
const SheetClose = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext);

  // If using asChild (wrapping a Button), we clone it to attach the onClick
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref,
      onClick: (e) => {
        // Call the original onClick if it exists
        children.props.onClick?.(e);
        // Then close the sheet
        onOpenChange(false);
      },
    });
  }

  return (
    <button
      ref={ref}
      className={cn(className)}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </button>
  );
});
SheetClose.displayName = "SheetClose";

// 5. The Root Component wraps everything in Context
const Sheet = ({ open, onOpenChange, children }) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      <AnimatePresence>
        {open && (
          <>
            <SheetOverlay />
            {children}
          </>
        )}
      </AnimatePresence>
    </SheetContext.Provider>
  );
};

export {
  Sheet,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose, // ✅ Exported now!
};