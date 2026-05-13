'use client';

import React, { useState } from 'react';
import { Plus, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { categories } from '@/lib/constants';
import { Sheet, SheetContent } from '@/components/ui/SheetCart';
import { AddItemForm } from './add-item-modal';

export function DesktopAddView() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const openQuickAdd = (cat = '') => {
    setSelectedCategory(cat);
    setIsSheetOpen(true);
  };

  return (
    <div className="relative flex flex-col bg-white h-full overflow-hidden">
      
      {/* --- HEADER (Fixed) --- */}
      <div className="p-4 border-b bg-white z-10 shrink-0">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-[#d97757]" />
                Incoming Stock
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Log new items to your inventory</p>
            </div>
            
            {/* Main CTA */}
            <Button 
              onClick={() => openQuickAdd()} 
              className="bg-[#d97757] hover:bg-[#c06245] text-white shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Quick Add
            </Button>
          </div>
        </div>
      </div>

      {/* --- CONTENT (Category Grid) --- */}
      <div className="flex-1 p-8 bg-gray-50/50 overflow-y-auto pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((item) => (
              <Card 
                key={item.value} 
                onClick={() => openQuickAdd(item.value)}
                className="
                  group cursor-pointer relative flex flex-col items-center justify-center p-8
                  bg-white border border-gray-200 shadow-sm
                  hover:border-[#d97757]/50 hover:shadow-md hover:-translate-y-0.5
                  transition-all duration-200 active:scale-[0.98]
                "
              >
                <div className="
                  mb-4 p-3 rounded-full bg-white text-[#d97757]
                  group-hover:bg-[#d97757]/10 group-hover:text-[#d97757]
                  transition-colors duration-200
                ">
                  <item.icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center">
                  {item.name}
                </span>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* --- DESKTOP SLIDE-OUT PANEL --- */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent 
          side="right" 
          className="p-0 bg-white h-full w-[450px] border-l shadow-2xl"
        >
          <AddItemForm 
            initialCategory={selectedCategory} 
            onClose={() => setIsSheetOpen(false)} 
          />
        </SheetContent>
      </Sheet>

    </div>
  );
}