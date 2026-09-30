import React from 'react';
import { Quote } from 'lucide-react';

export default function TestimonialCarousel() {
  const testimonials = [
    {
      quote: "Before EDUK8U, our ASQA audits took weeks of manual spreadsheet reconciliation. Now, we export the exact compliance data we need in three clicks.",
      author: "Sarah Jenkins",
      role: "Compliance Director, TAFE Network"
    },
    {
      quote: "The ability for supervisors to approve student hours directly from their phones without logging into a clunky system has saved us hundreds of hours.",
      author: "Dr. Michael Chen",
      role: "Host Placement Coordinator"
    }
  ];

  return (
    <div className="py-24 bg-indigo-900 border-b border-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl relative">
              <Quote className="w-12 h-12 text-indigo-400/50 absolute top-6 right-6" />
              <p className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8 relative z-10">
                "{t.quote}"
              </p>
              <div>
                <div className="font-bold text-white text-lg">{t.author}</div>
                <div className="text-indigo-200">{t.role}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
