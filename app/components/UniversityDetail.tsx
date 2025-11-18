'use client';

import { University } from '@/data';
import { useRef } from 'react';
import BackToTop from './BackToTop';

interface UniversityDetailProps {
  university: University;
}

export default function UniversityDetail({ university }: UniversityDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollRef} className="h-screen overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto p-8 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{university.rank}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-2">
                {university.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="text-base">{university.location.city}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-base">{university.location.country}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-10">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <p className="text-lg leading-relaxed text-gray-800">
              {university.description}
            </p>
          </div>
        </div>

        {/* Majors Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎓</span>
            <h2 className="text-2xl font-bold text-gray-900">
              Highlighted Majors & Strengths
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {university.majors.map((major, index) => (
              <div
                key={index}
                className="bg-white border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-base text-gray-800 font-medium">{major}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-20"></div>
      </div>

      <BackToTop scrollRef={scrollRef} />
    </div>
  );
}

