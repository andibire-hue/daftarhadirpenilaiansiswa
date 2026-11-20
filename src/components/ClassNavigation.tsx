import React from 'react';
import { ClassGrade } from '../types';

interface ClassNavigationProps {
  currentClass: ClassGrade;
  onSelectClass: (cls: ClassGrade) => void;
  studentCounts: Record<ClassGrade, number>;
}

const CLASSES: ClassGrade[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export const ClassNavigation: React.FC<ClassNavigationProps> = ({
  currentClass,
  onSelectClass,
  studentCounts,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs mb-6 no-print">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {CLASSES.map((cls) => {
          const isActive = currentClass === cls;
          const count = studentCounts[cls] || 0;

          return (
            <button
              key={cls}
              type="button"
              onClick={() => onSelectClass(cls)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{cls}</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-blue-700/80 text-blue-100'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
