import { University } from '@/data';

interface UniversityCardProps {
  university: University;
  isSelected: boolean;
  onClick: () => void;
}

function getRankGradient(rank: number): string {
  if (rank <= 10) {
    return 'from-amber-400 to-orange-500'; // Gold gradient
  } else if (rank <= 20) {
    return 'from-slate-300 to-slate-400'; // Silver gradient
  }
  return 'from-indigo-400 to-indigo-500'; // Indigo gradient
}

export default function UniversityCard({ university, isSelected, onClick }: UniversityCardProps) {
  const gradientClass = getRankGradient(university.rank);

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left px-4 py-3 transition-all duration-200 relative border-l-2 ${
        isSelected
          ? 'bg-white border-indigo-500 shadow-sm scale-[1.01]'
          : 'bg-transparent border-transparent hover:bg-white/50 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-sm`}
        >
          <span className="text-[11px] font-bold text-white">
            {university.rank}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm leading-tight mb-0.5 transition-colors ${
            isSelected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
          }`}>
            {university.shortName}
          </h3>
          <p className={`text-xs truncate transition-colors ${
            isSelected ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
          }`}>
            {university.location.city}
          </p>
        </div>
      </div>
    </button>
  );
}
