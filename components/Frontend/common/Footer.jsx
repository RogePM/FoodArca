import React from 'react';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    // Changed bg to Deep Espresso (#1C1917) and removed the light border
    <footer className="bg-[#1C1917] pt-24 pb-12 relative overflow-hidden">
      
      {/* Background Watermark - Flipped to light beige with very low opacity */}
      <div className="absolute -top-12 -right-12 md:-top-24 md:-right-24 text-[12rem] md:text-[20rem] font-serif text-[#FAFAF9] opacity-[0.03] pointer-events-none select-none leading-none">
        Arca
      </div>

      <div className="container mx-auto px-6 max-w-[85rem] relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1: Brand (Takes up more space on desktop) */}
          <div className="col-span-2 md:col-span-5 lg:col-span-4 lg:pr-12">
            <div className="flex items-center gap-2 mb-6">
              <Leaf size={24} className="text-[#D97757]" />
              {/* Text changed to light beige */}
              <span className="text-xl font-serif font-medium tracking-tight text-[#FAFAF9]">Food Arca</span>
            </div>
            {/* Paragraph text changed to a warm, legible grey (#A8A29E) */}
            <p className="text-[#A8A29E] text-[15px] leading-relaxed max-w-sm">
              The inventory tool for high-volume food pantries. Scan barcodes, sync teams in real-time, and speed up your distribution lines.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2 lg:col-start-7">
            <h4 className="font-serif text-[#FAFAF9] mb-6 text-lg tracking-wide">Platform</h4>
            <ul className="space-y-4 text-[15px] text-[#A8A29E]">
              {['Features', 'Inventory', 'Distribution', 'Pricing'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="hover:text-[#D97757] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="col-span-1 md:col-span-4 lg:col-span-2">
            <h4 className="font-serif text-[#FAFAF9] mb-6 text-lg tracking-wide">Company</h4>
            <ul className="space-y-4 text-[15px] text-[#A8A29E]">
              <li>
                <a href="#" className="hover:text-[#D97757] transition-colors">About Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-[#D97757] transition-colors">Contact</a>
              </li>
              <li>
                <a href="#" className="hover:text-[#D97757] transition-colors">Support</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="col-span-2 md:col-span-12 lg:col-span-2 flex flex-row lg:flex-col gap-8 lg:gap-4 justify-start">
            <div className="w-full">
              <h4 className="font-serif text-[#FAFAF9] mb-6 text-lg tracking-wide">Legal</h4>
              <ul className="space-y-4 text-[15px] text-[#A8A29E]">
                <li>
                  <a href="#" className="hover:text-[#D97757] transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#D97757] transition-colors">Terms of Service</a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Adjusted border to a dark, subtle grey */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10 text-[13px] text-[#78716C]">
          <p>&copy; {new Date().getFullYear()} Food Arca Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Designed and built by</span>
            <span className="text-[#FAFAF9] font-medium">Novo Web Designs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}