'use client';

import { University } from '@/data';
import { useRef } from 'react';
import BackToTop from './BackToTop';
import LocationIcon from './LocationIcon';
import AcademicIcon from './AcademicIcon';

interface UniversityDetailProps {
  university: University;
}

function getRankGradient(rank: number): string {
  if (rank <= 10) {
    return 'from-amber-400 to-orange-500';
  } else if (rank <= 20) {
    return 'from-slate-300 to-slate-400';
  }
  return 'from-indigo-400 to-indigo-500';
}

export default function UniversityDetail({ university }: UniversityDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gradientClass = getRankGradient(university.rank);

  return (
    <div ref={scrollRef} className="h-screen overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12 lg:px-16 lg:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start gap-5 mb-6">
            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
              <span className="text-xl font-bold text-white">{university.rank}</span>
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight mb-3">
                {university.name}
              </h1>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="flex items-center gap-1.5">
                  <LocationIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{university.location.city}</span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-sm">{university.location.country}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <p className="text-lg leading-relaxed text-gray-600">
            {university.description}
          </p>
        </div>

        {/* Majors Section */}
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <AcademicIcon className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Highlighted Majors & Strengths
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {university.majors.map((major, index) => (
              <div
                key={index}
                className="group bg-stone-50/80 hover:bg-stone-100/80 px-4 py-3.5 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                  {major}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-24"></div>
      </div>

      <BackToTop scrollRef={scrollRef} />
    </div>
  );
}
