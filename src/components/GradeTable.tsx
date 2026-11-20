import React, { useState } from 'react';
import {
  Search,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  UploadCloud,
  Zap,
  Printer,
} from 'lucide-react';
import { StudentGrade, ClassGrade, SchoolInfo } from '../types';
import { getPredicateDescription } from '../utils/gradeCalculations';

export type GradeScoreField =
  | 'dailyScore'
  | 'practicalScore'
  | 'midtermScore'
  | 'finalScore';

interface GradeTableProps {
  currentClass: ClassGrade;
  students: StudentGrade[];
  schoolInfo: SchoolInfo;
  onEditStudent: (student: StudentGrade) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onQuickUpdateGrade?: (
    studentId: string,
    field: GradeScoreField,
    value: number
  ) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onPrint?: () => void;
  onResetClassData: () => void;
  onClearClassData?: () => void;
  onOpenSelfRegistration?: () => void;
  onOpenUploadModal?: () => void;
}

interface InlineScoreInputProps {
  value: number;
  label: string;
  onChangeScore: (newValue: number) => void;
}

const InlineScoreInput: React.FC<InlineScoreInputProps> = ({
  value,
  label,
  onChangeScore,
}) => {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (!focused) {
      setText(String(value));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    if (raw.trim() === '') return;
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.min(100, Math.max(0, parsed));
      onChangeScore(clamped);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseFloat(text);
    if (isNaN(parsed)) {
      setText(String(value));
    } else {
      const clamped = Math.min(100, Math.max(0, parsed));
      setText(String(clamped));
      if (clamped !== value) {
        onChangeScore(clamped);
      }
    }
  };

  return (
    <input
      type="number"
      min={0}
      max={100}
      step="any"
      aria-label={label}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-14 px-1.5 py-1 text-right text-xs font-mono font-semibold rounded border border-blue-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
    />
  );
};

type SortField = 'number' | 'name' | 'highest' | 'lowest';

export const GradeTable: React.FC<GradeTableProps> = ({
  currentClass,
  students,
  schoolInfo,
  onEditStudent,
  onDeleteStudent,
  onQuickUpdateGrade,
  onExportExcel,
  onExportCsv,
  onPrint,
  onResetClassData,
  onClearClassData,
  onOpenSelfRegistration,
  onOpenUploadModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('number');
  const [isInlineEdit, setIsInlineEdit] = useState(false);

  // Filter students by name or NIS
  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q))
    );
  });

  // Sort students
  const sortedStudents = [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'id');
    }
    if (sortBy === 'highest') {
      return b.finalReportScore - a.finalReportScore;
    }
    if (sortBy === 'lowest') {
      return a.finalReportScore - b.finalReportScore;
    }
    return 0; // Default index
  });

  // Column Averages
  const totalCount = sortedStudents.length;
  const avgNH = totalCount > 0 ? (sortedStudents.reduce((a, b) => a + b.dailyScore, 0) / totalCount).toFixed(1) : '0.0';
  const avgNP = totalCount > 0 ? (sortedStudents.reduce((a, b) => a + b.practicalScore, 0) / totalCount).toFixed(1) : '0.0';
  const avgPTS = totalCount > 0 ? (sortedStudents.reduce((a, b) => a + b.midtermScore, 0) / totalCount).toFixed(1) : '0.0';
  const avgPAS = totalCount > 0 ? (sortedStudents.reduce((a, b) => a + b.finalScore, 0) / totalCount).toFixed(1) : '0.0';
  const avgNA = totalCount > 0 ? (sortedStudents.reduce((a, b) => a + b.finalReportScore, 0) / totalCount).toFixed(2) : '0.00';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Top Header & Export Toolbar */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Rekapitulasi Nilai PJOK</span>
            <span className="text-blue-700">· {currentClass}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar nilai peserta didik {schoolInfo.schoolName}
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onQuickUpdateGrade && students.length > 0 && (
            <button
              type="button"
              onClick={() => setIsInlineEdit((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isInlineEdit
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              }`}
              title="Ubah nilai NH, NP, PTS, PAS langsung di dalam tabel"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isInlineEdit ? 'Selesai Input Langsung' : 'Input Nilai Langsung'}</span>
            </button>
          )}

          {onOpenUploadModal && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
              title="Upload berkas Excel (.xlsx) atau CSV untuk kelas ini"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload File</span>
            </button>
          )}

          {onOpenSelfRegistration && (
            <button
              type="button"
              onClick={onOpenSelfRegistration}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
              title="Isi data siswa mandiri atau tempel daftar nama"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Input Mandiri</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Download file Excel (.xls) siap kirim ke Wali Kelas"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Export ke Excel</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            title="Export CSV kompatibel"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Pratinjau & Cetak Rekap Nilai A4"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetClassData}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            title="Muat ulang contoh data siswa SDN Lokojuli"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Contoh</span>
          </button>

          {onClearClassData && students.length > 0 && (
            <button
              type="button"
              onClick={onClearClassData}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
              title={`Hapus semua data siswa di ${currentClass}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Hapus Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau NIS..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="number">Nomor Urut</option>
            <option value="name">Nama (A - Z)</option>
            <option value="highest">Nilai Rapor Tertinggi</option>
            <option value="lowest">Nilai Rapor Terendah</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
              <th className="py-3 px-3 text-center w-12 font-bold">No</th>
              <th className="py-3 px-3 text-center w-20 font-bold">NIS</th>
              <th className="py-3 px-3 font-bold min-w-[160px]">Nama Siswa</th>
              <th className="py-3 px-2 text-center w-12 font-bold">L/P</th>
              <th className="py-3 px-3 text-right font-bold" title="Nilai Harian / Sumatif Harian">NH</th>
              <th className="py-3 px-3 text-right font-bold" title="Nilai Praktik / Keterampilan">NP</th>
              <th className="py-3 px-3 text-right font-bold" title="Nilai Penilaian Tengah Semester">PTS</th>
              <th className="py-3 px-3 text-right font-bold" title="Nilai Penilaian Akhir Semester">PAS</th>
              <th className="py-3 px-3 text-right font-extrabold bg-blue-50/80 text-blue-900 border-x border-blue-200/50" title="Nilai Akhir Rapor: Rata-rata dari NH, NP, PTS, PAS">
                Nilai Rapor
              </th>
              <th className="py-3 px-3 text-center font-bold">Predikat</th>
              <th className="py-3 px-3 text-center font-bold">Status</th>
              <th className="py-3 px-3 text-center font-bold w-24 no-print">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold text-slate-600">
                      {searchQuery ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada data nilai di kelas ini'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchQuery
                        ? 'Coba gunakan kata kunci pencarian yang lain'
                        : 'Gunakan form di sebelah kiri untuk memasukkan data siswa baru, atau klik Reset Data untuk memuat contoh'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedStudents.map((student, idx) => {
                const isPassed = student.finalReportScore >= schoolInfo.kktp;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {student.nis || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>{student.name}</div>
                      {(student.heightCm || student.weightKg || student.favoriteSport || student.isSelfRegistered) && (
                        <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
                          {student.isSelfRegistered && (
                            <span className="text-emerald-600 font-medium">Mandiri</span>
                          )}
                          {student.heightCm && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{student.heightCm} cm</span>
                            </>
                          )}
                          {student.weightKg && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{student.weightKg} kg</span>
                            </>
                          )}
                          {student.favoriteSport && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[120px]">{student.favoriteSport}</span>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500">
                      {student.gender}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {isInlineEdit && onQuickUpdateGrade ? (
                        <InlineScoreInput
                          value={student.dailyScore}
                          label={`NH ${student.name}`}
                          onChangeScore={(val) =>
                            onQuickUpdateGrade(student.id, 'dailyScore', val)
                          }
                        />
                      ) : (
                        student.dailyScore
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {isInlineEdit && onQuickUpdateGrade ? (
                        <InlineScoreInput
                          value={student.practicalScore}
                          label={`NP ${student.name}`}
                          onChangeScore={(val) =>
                            onQuickUpdateGrade(student.id, 'practicalScore', val)
                          }
                        />
                      ) : (
                        student.practicalScore
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {isInlineEdit && onQuickUpdateGrade ? (
                        <InlineScoreInput
                          value={student.midtermScore}
                          label={`PTS ${student.name}`}
                          onChangeScore={(val) =>
                            onQuickUpdateGrade(student.id, 'midtermScore', val)
                          }
                        />
                      ) : (
                        student.midtermScore
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {isInlineEdit && onQuickUpdateGrade ? (
                        <InlineScoreInput
                          value={student.finalScore}
                          label={`PAS ${student.name}`}
                          onChangeScore={(val) =>
                            onQuickUpdateGrade(student.id, 'finalScore', val)
                          }
                        />
                      ) : (
                        student.finalScore
                      )}
                    </td>

                    {/* Nilai Rapor Otomatis */}
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 bg-blue-50/50 border-x border-blue-100">
                      {student.finalReportScore.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold font-mono text-slate-800" title={getPredicateDescription(student.predicate)}>
                        {student.predicate}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {isPassed ? 'Tuntas' : 'Remedial'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Edit nilai siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(student.id, student.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Hapus data siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Table: Rata-Rata Kelas */}
          {sortedStudents.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 font-semibold text-slate-800 border-t-2 border-slate-300">
                <td colSpan={4} className="py-2.5 px-3 text-center font-bold text-slate-700">
                  RATA-RATA KELAS
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800">{avgNH}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800">{avgNP}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800">{avgPTS}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800">{avgPAS}</td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 bg-blue-100 border-x border-blue-200">
                  {avgNA}
                </td>
                <td colSpan={3} className="py-2.5 px-3 text-center text-xs text-slate-500 font-normal">
                  KKTP: <b className="text-slate-700">{schoolInfo.kktp}</b>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Table Information Note */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 no-print">
        <div>
          Keterangan Predikat: <b>A</b> (88-100 Sangat Baik) · <b>B</b> (76-87 Baik) · <b>C</b> (65-75 Cukup) · <b>D</b> (&lt;65 Perlu Bimbingan)
        </div>
        <div className="text-slate-400">
          Total Terdata: {students.length} Siswa
        </div>
      </div>
    </div>
  );
};
