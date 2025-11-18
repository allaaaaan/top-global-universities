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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Sidebar - University List */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0">
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

      {/* Mobile: Show detail in overlay when selected (optional future enhancement) */}
      <div className="md:hidden flex-1 flex items-center justify-center p-8">
        {selectedUniversity && <UniversityDetail university={selectedUniversity} />}
      </div>
    </div>
  );
}
