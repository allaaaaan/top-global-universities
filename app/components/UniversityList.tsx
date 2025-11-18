'use client';

import { University } from '@/data';
import UniversityCard from './UniversityCard';

interface UniversityListProps {
  universities: University[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function UniversityList({ universities, selectedId, onSelect }: UniversityListProps) {
  return (
    <div className="h-screen flex flex-col bg-stone-50/50">
      <div className="flex-shrink-0 px-6 py-8 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Top Universities</h1>
        <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">GLOBAL RANKINGS</p>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5 overflow-x-hidden">
          {universities.map((university) => (
            <UniversityCard
              key={university.id}
              university={university}
              isSelected={selectedId === university.id}
              onClick={() => onSelect(university.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
