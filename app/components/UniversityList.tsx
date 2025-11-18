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
    <div className="h-screen flex flex-col bg-gray-50 border-r border-gray-200">
      <div className="flex-shrink-0 p-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Top Universities</h1>
        <p className="text-sm text-gray-600 mt-1">Global Rankings 2024</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
  );
}

