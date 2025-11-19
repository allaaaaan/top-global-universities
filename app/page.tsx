'use client';

import { useState } from 'react';
import { getAllUniversities, getUniversityById } from '@/data';
import UniversityList from './components/UniversityList';
import UniversityDetail from './components/UniversityDetail';

export default function Home() {
  const universities = getAllUniversities();
  const [selectedId, setSelectedId] = useState<string>('mit');

  const selectedUniversity = getUniversityById(selectedId);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 relative">
      {/* Circular Layout Link */}
      <a
        href="/circular"
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-sm font-medium flex items-center gap-2"
      >
        <span>🎯</span>
        <span>Circular View</span>
      </a>

      <div className="flex w-full max-w-[1600px] mx-auto">
        {/* Left Sidebar - University List */}
        <div className="w-full md:w-[280px] lg:w-[300px] flex-shrink-0 shadow-[0_0_40px_rgba(0,0,0,0.04)] overflow-x-hidden">
          <UniversityList
            universities={universities}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Right Panel - University Detail */}
        <div className="hidden md:flex flex-1">
          {selectedUniversity && <UniversityDetail university={selectedUniversity} />}
        </div>

        {/* Mobile: Show detail in overlay when selected */}
        <div className="md:hidden flex-1 flex items-center justify-center p-8">
          {selectedUniversity && <UniversityDetail university={selectedUniversity} />}
        </div>
      </div>
    </div>
  );
}
