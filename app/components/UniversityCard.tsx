import { University } from '@/data';

interface UniversityCardProps {
  university: University;
  isSelected: boolean;
  onClick: () => void;
}

export default function UniversityCard({ university, isSelected, onClick }: UniversityCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
        isSelected
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white hover:bg-gray-50 text-gray-900 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            isSelected ? 'bg-blue-700' : 'bg-blue-600 text-white'
          }`}
        >
          {university.rank}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-base leading-tight mb-1 ${
            isSelected ? 'text-white' : 'text-gray-900'
          }`}>
            {university.shortName}
          </h3>
          <p className={`text-sm truncate ${
            isSelected ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {university.location.city}
          </p>
        </div>
      </div>
    </button>
  );
}

