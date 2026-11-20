import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Check, X, Calculator, UserCheck, RefreshCw } from 'lucide-react';
import { StudentGrade, ClassGrade } from '../types';
import {
  calculateFinalScore,
  calculatePredicate,
  calculateStatus,
} from '../utils/gradeCalculations';

interface GradeFormProps {
  currentClass: ClassGrade;
  students: StudentGrade[];
  editingStudent: StudentGrade | null;
  kktp: number;
  onSaveStudent: (
    student: Omit<StudentGrade, 'id' | 'updatedAt'>,
    editId?: string
  ) => void;
  onSelectExistingStudent: (student: StudentGrade | null) => void;
  onCancelEdit: () => void;
}

export const GradeForm: React.FC<GradeFormProps> = ({
  currentClass,
  students,
  editingStudent,
  kktp,
  onSaveStudent,
  onSelectExistingStudent,
  onCancelEdit,
}) => {
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [dailyScore, setDailyScore] = useState<string>('');
  const [practicalScore, setPracticalScore] = useState<string>('');
  const [midtermScore, setMidtermScore] = useState<string>('');
  const [finalScore, setFinalScore] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setNis('');
    setName('');
    setGender('L');
    setDailyScore('');
    setPracticalScore('');
    setMidtermScore('');
    setFinalScore('');
    setErrorMsg(null);
  };

  // Populate form when editingStudent changes
  useEffect(() => {
    if (editingStudent) {
      setNis(editingStudent.nis || '');
      setName(editingStudent.name);
      setGender(editingStudent.gender);
      setDailyScore(String(editingStudent.dailyScore));
      setPracticalScore(String(editingStudent.practicalScore));
      setMidtermScore(String(editingStudent.midtermScore));
      setFinalScore(String(editingStudent.finalScore));
      setErrorMsg(null);
    } else {
      resetForm();
    }
  }, [editingStudent]);

  // Reset form cleanly when active class changes
  useEffect(() => {
    if (!editingStudent) {
      resetForm();
    }
  }, [currentClass]);

  // Detect if typed name matches an existing student (when not explicitly editing that student)
  const matchedExistingStudent = useMemo(() => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return null;
    const match = students.find(
      (s) => s.name.trim().toLowerCase() === trimmedName
    );
    if (!match) return null;
    if (editingStudent && editingStudent.id === match.id) return null;
    return match;
  }, [name, students, editingStudent]);

  // Live calculation of Nilai Akhir / Rapor
  const nhNum = Math.min(100, Math.max(0, parseFloat(dailyScore) || 0));
  const npNum = Math.min(100, Math.max(0, parseFloat(practicalScore) || 0));
  const ptsNum = Math.min(100, Math.max(0, parseFloat(midtermScore) || 0));
  const pasNum = Math.min(100, Math.max(0, parseFloat(finalScore) || 0));

  const hasAnyGrade =
    dailyScore !== '' ||
    practicalScore !== '' ||
    midtermScore !== '' ||
    finalScore !== '';
  const liveFinalScore = calculateFinalScore(nhNum, npNum, ptsNum, pasNum);
  const livePredicate = calculatePredicate(liveFinalScore);
  const liveStatus = calculateStatus(liveFinalScore, kktp);

  const handleQuickPickerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      onSelectExistingStudent(null);
      resetForm();
      return;
    }
    const found = students.find((s) => s.id === selectedId) || null;
    onSelectExistingStudent(found);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Nama siswa wajib diisi');
      return;
    }

    const dVal = parseFloat(dailyScore);
    const pVal = parseFloat(practicalScore);
    const mVal = parseFloat(midtermScore);
    const fVal = parseFloat(finalScore);

    if (isNaN(dVal) || isNaN(pVal) || isNaN(mVal) || isNaN(fVal)) {
      setErrorMsg(
        'Semua kolom nilai (NH, NP, PTS, PAS) harus diisi angka yang valid (0-100)'
      );
      return;
    }

    if (
      dVal < 0 ||
      dVal > 100 ||
      pVal < 0 ||
      pVal > 100 ||
      mVal < 0 ||
      mVal > 100 ||
      fVal < 0 ||
      fVal > 100
    ) {
      setErrorMsg('Rentang nilai harus berada di antara 0 sampai 100');
      return;
    }

    const calculatedReportScore = calculateFinalScore(dVal, pVal, mVal, fVal);
    const predicate = calculatePredicate(calculatedReportScore);
    const status = calculateStatus(calculatedReportScore, kktp);

    const targetEditId = editingStudent?.id || matchedExistingStudent?.id;

    onSaveStudent(
      {
        nis: nis.trim() || matchedExistingStudent?.nis || '',
        name: name.trim(),
        gender,
        dailyScore: dVal,
        practicalScore: pVal,
        midtermScore: mVal,
        finalScore: fVal,
        finalReportScore: calculatedReportScore,
        predicate,
        status,
        notes:
          editingStudent?.notes ||
          matchedExistingStudent?.notes ||
          `Penilaian PJOK ${currentClass}`,
      },
      targetEditId
    );

    if (!editingStudent) {
      resetForm();
    }
  };

  const isUpdateMode = Boolean(editingStudent || matchedExistingStudent);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            {isUpdateMode ? 'Ubah / Perbarui Nilai Siswa' : 'Form Input Nilai Siswa'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Target kelas aktif:{' '}
            <span className="font-semibold text-blue-700">{currentClass}</span>
          </p>
        </div>
        {editingStudent && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Batal
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Quick Picker for Registered Students (Prevents Duplicate Entries) */}
        {students.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilih Siswa Terdaftar (Ubah Nilai Langsung)</span>
            </label>
            <select
              value={editingStudent?.id || ''}
              onChange={handleQuickPickerChange}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="">+ Tambah Siswa Baru / Ketik Nama Manual</option>
              {students.map((std) => (
                <option key={std.id} value={std.id}>
                  {std.nis ? `[${std.nis}] ` : ''}
                  {std.name} — Rapor: {std.finalReportScore.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Induk / NIS
            </label>
            <input
              type="text"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              placeholder="Contoh: 101"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Siswa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list={`student-names-${currentClass.replace(/\s+/g, '-')}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap siswa..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            />
            <datalist id={`student-names-${currentClass.replace(/\s+/g, '-')}`}>
              {students.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Auto-match notification when user types an existing student's name */}
        {matchedExistingStudent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900 flex items-center justify-between gap-2">
            <div>
              <span className="font-bold">{matchedExistingStudent.name}</span> sudah terdaftar (Rapor:{' '}
              <b className="font-mono">{matchedExistingStudent.finalReportScore.toFixed(2)}</b>). Nilai
              lama akan langsung diperbarui tanpa mendobel nama.
            </div>
            <button
              type="button"
              onClick={() => onSelectExistingStudent(matchedExistingStudent)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Muat Nilai</span>
            </button>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Jenis Kelamin
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('L')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                gender === 'L'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Laki-laki (L)
            </button>
            <button
              type="button"
              onClick={() => setGender('P')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                gender === 'P'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Perempuan (P)
            </button>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
            <span>Parameter Komponen Nilai PJOK</span>
            <span className="text-[11px] text-slate-400 font-normal">(Skala 0 - 100)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Harian (NH) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={dailyScore}
                onChange={(e) => setDailyScore(e.target.value)}
                placeholder="0 - 100"
                className="w-full px-2.5 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Praktik (NP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={practicalScore}
                onChange={(e) => setPracticalScore(e.target.value)}
                placeholder="0 - 100"
                className="w-full px-2.5 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                PTS / STS <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={midtermScore}
                onChange={(e) => setMidtermScore(e.target.value)}
                placeholder="0 - 100"
                className="w-full px-2.5 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                PAS / SAS <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                required
                value={finalScore}
                onChange={(e) => setFinalScore(e.target.value)}
                placeholder="0 - 100"
                className="w-full px-2.5 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Live Automatic Calculation Panel */}
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Kalkulasi Otomatis Nilai Rapor</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Rumus Standar: (NH + NP + PTS + PAS) ÷ 4
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-blue-900 font-mono tracking-tight">
              {hasAnyGrade ? liveFinalScore.toFixed(2) : '0.00'}
            </div>
            <div className="text-[11px] font-medium text-slate-600">
              Predikat:{' '}
              <span className="font-bold text-blue-700">
                {hasAnyGrade ? livePredicate : '-'}
              </span>{' '}
              ·{' '}
              <span
                className={
                  liveStatus === 'Tuntas'
                    ? 'text-emerald-700 font-semibold'
                    : 'text-amber-700 font-semibold'
                }
              >
                {hasAnyGrade ? liveStatus : 'Standar'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isUpdateMode ? 'Perbarui Nilai Siswa' : 'Simpan Nilai Siswa'}</span>
          </button>

          {editingStudent && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="py-2.5 px-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
