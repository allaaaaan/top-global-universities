'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { getAllUniversities, University } from '@/data';

export default function CircularLayout() {
  const universities = getAllUniversities();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = 320;
  const centerRadius = 120;
  const angleStep = (2 * Math.PI) / universities.length;

  const selectedUniversity = universities.find(u => u.id === selectedId);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
    '#6C5B7B', '#F67280', '#355C7D', '#99B898', '#FECEAB',
    '#E8175D', '#474056', '#363636', '#CC527A', '#4B3F72',
    '#119DA4', '#19647E', '#5C80BC', '#FF8C42', '#FF3C38',
    '#A23E48', '#5E7CE2', '#FFB8D1', '#D4A5A5', '#9896F1'
  ];

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
      >
        <h1 className="text-4xl font-bold text-white text-center tracking-tight">
          Round Table of Universities
        </h1>
        <p className="text-purple-300 text-center mt-2 text-sm">
          Hover, drag, and click to explore • {universities.length} global institutions
        </p>
      </motion.div>

      {/* Circular Layout Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        {/* Center Circle */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="absolute w-[240px] h-[240px] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border-2 border-purple-400/30 flex items-center justify-center z-10"
        >
          <div className="text-center px-6">
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Top 30
            </div>
            <div className="text-purple-300 text-sm mt-2 font-medium">
              Universities
            </div>
          </div>
        </motion.div>

        {/* University Circles */}
        {universities.map((uni, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSelected = selectedId === uni.id;
          const isHovered = hoveredId === uni.id;

          return (
            <motion.div
              key={uni.id}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: 1,
                scale: isSelected ? 1.3 : 1,
                x,
                y,
                zIndex: isSelected ? 50 : isHovered ? 40 : 10,
              }}
              transition={{
                delay: index * 0.03,
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
              drag
              dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
              dragElastic={0.1}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
              whileHover={{
                scale: isSelected ? 1.3 : 1.2,
                rotate: [0, -5, 5, 0],
                transition: { duration: 0.3 },
              }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setHoveredId(uni.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => setSelectedId(selectedId === uni.id ? null : uni.id)}
              className="absolute cursor-pointer"
              style={{
                left: '50%',
                top: '50%',
                translateX: '-50%',
                translateY: '-50%',
              }}
            >
              {/* Glow Effect */}
              {(isSelected || isHovered) && (
                <motion.div
                  layoutId={`glow-${uni.id}`}
                  className="absolute inset-0 rounded-full blur-xl opacity-60"
                  style={{
                    backgroundColor: colors[index % colors.length],
                    scale: 1.5,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                />
              )}

              {/* Circle */}
              <motion.div
                className="relative w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xl border-2 border-white/30 backdrop-blur-sm"
                style={{
                  backgroundColor: colors[index % colors.length],
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                <span className="relative z-10 text-lg">{uni.rank}</span>
              </motion.div>

              {/* Tooltip on Hover */}
              <AnimatePresence>
                {(isHovered || isSelected) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl whitespace-nowrap pointer-events-none border border-gray-200"
                  >
                    <div className="font-bold text-gray-900 text-sm">
                      {uni.shortName}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {uni.location.city}, {uni.location.country}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Selected University Detail Panel */}
      <AnimatePresence>
        {selectedUniversity && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-2xl w-full mx-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-gray-200 z-[100]"
          >
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>

            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0"
                style={{
                  backgroundColor: colors[selectedUniversity.rank - 1],
                }}
              >
                {selectedUniversity.rank}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedUniversity.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedUniversity.location.city}, {selectedUniversity.location.country}
                </p>

                <p className="mt-4 text-gray-700 leading-relaxed">
                  {selectedUniversity.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedUniversity.majors.map((major, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {major}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <motion.a
        href="/"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute top-8 left-8 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20 text-sm font-medium"
      >
        ← Back to List View
      </motion.a>
    </div>
  );
}

