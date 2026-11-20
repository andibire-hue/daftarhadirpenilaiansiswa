import React from 'react';
import { Users, TrendingUp, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StudentGrade } from '../types';

interface StatsCardsProps {
  students: StudentGrade[];
  kktp: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ students, kktp }) => {
  const count = students.length;

  if (count === 0) {
    return null;
  }

  const scores = students.map((s) => s.finalReportScore);
  const average = (scores.reduce((a, b) => a + b, 0) / count).toFixed(1);
  const highest = Math.max(...scores).toFixed(1);
  const lowest = Math.min(...scores).toFixed(1);
  const passedCount = students.filter((s) => s.finalReportScore >= kktp).length;
  const passPercentage = Math.round((passedCount / count) * 100);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 no-print">
      {/* Total Siswa */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Total Siswa</span>
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
          {count} <span className="text-xs font-normal text-slate-400">anak</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Data terdaftar di kelas</div>
      </div>

      {/* Rata-rata Kelas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Rata-rata Rapor</span>
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-blue-700 font-mono">
          {average}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Target KKTP: {kktp}</div>
      </div>

      {/* Nilai Tertinggi */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Nilai Tertinggi</span>
          <Award className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
          {highest}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Skor maksimal kelas</div>
      </div>

      {/* Nilai Terendah */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Nilai Terendah</span>
          <AlertCircle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-amber-600 font-mono">
          {lowest}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Skor minimum kelas</div>
      </div>

      {/* Tingkat Ketuntasan */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">Ketuntasan</span>
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
          {passPercentage}%
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          {passedCount} dari {count} siswa tuntas
        </div>
      </div>
    </div>
  );
};
