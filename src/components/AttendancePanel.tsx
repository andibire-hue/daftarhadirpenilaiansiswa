import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCheck,
  FileSpreadsheet,
  Printer,
  Search,
  Trash2,
  ClipboardCheck,
  Users,
  BookOpen,
  History,
  CheckCircle2,
} from 'lucide-react';
import {
  StudentGrade,
  ClassGrade,
  SchoolInfo,
  ClassAttendanceSession,
  AttendanceStatus,
} from '../types';

interface AttendancePanelProps {
  currentClass: ClassGrade;
  students: StudentGrade[];
  sessions: ClassAttendanceSession[];
  schoolInfo: SchoolInfo;
  onSaveSessions: (updatedSessions: ClassAttendanceSession[]) => void;
  onRequestDeleteSession: (dateToDelete: string, formattedDate: string) => void;
  onExportAttendanceExcel: () => void;
  onPrintAttendance: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const getTodayIsoDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '-';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const STATUS_OPTIONS: Array<{
  code: AttendanceStatus;
  label: string;
  activeClass: string;
}> = [
  {
    code: 'H',
    label: 'Hadir',
    activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
  },
  {
    code: 'S',
    label: 'Sakit',
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-xs',
  },
  {
    code: 'I',
    label: 'Izin',
    activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs',
  },
  {
    code: 'A',
    label: 'Alpa',
    activeClass: 'bg-red-600 text-white border-red-600 shadow-xs',
  },
];

export const AttendancePanel: React.FC<AttendancePanelProps> = ({
  currentClass,
  students,
  sessions,
  schoolInfo,
  onSaveSessions,
  onRequestDeleteSession,
  onExportAttendanceExcel,
  onPrintAttendance,
  onNotify,
}) => {
  const [viewTab, setViewTab] = useState<'daily' | 'recap'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIsoDate());
  const [searchQuery, setSearchQuery] = useState('');

  const studentIdSet = useMemo(
    () => new Set(students.map((s) => s.id)),
    [students]
  );

  // Sorted list of recorded sessions (newest first)
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions]
  );

  // Active session for selectedDate (or undefined if not yet recorded)
  const activeSession = useMemo(
    () => sessions.find((s) => s.date === selectedDate),
    [sessions, selectedDate]
  );

  const upsertSession = (
    date: string,
    updater: (prev: ClassAttendanceSession) => ClassAttendanceSession
  ) => {
    if (!date) return;
    const existing = sessions.find((s) => s.date === date);
    const base: ClassAttendanceSession = existing || {
      date,
      topic: '',
      records: {},
      updatedAt: new Date().toISOString(),
    };
    const updated = {
      ...updater(base),
      updatedAt: new Date().toISOString(),
    };
    const nextSessions = existing
      ? sessions.map((s) => (s.date === date ? updated : s))
      : [updated, ...sessions];
    onSaveSessions(nextSessions);
  };

  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    upsertSession(selectedDate, (prev) => ({
      ...prev,
      records: {
        ...prev.records,
        [studentId]: {
          status,
          note: prev.records[studentId]?.note || '',
        },
      },
    }));
  };

  const handleSetStudentNote = (studentId: string, note: string) => {
    upsertSession(selectedDate, (prev) => ({
      ...prev,
      records: {
        ...prev.records,
        [studentId]: {
          status: prev.records[studentId]?.status || 'H',
          note,
        },
      },
    }));
  };

  const handleTopicChange = (topic: string) => {
    upsertSession(selectedDate, (prev) => ({
      ...prev,
      topic,
    }));
  };

  const handleMarkAllPresent = () => {
    if (students.length === 0) return;
    upsertSession(selectedDate, (prev) => {
      const nextRecords = { ...prev.records };
      students.forEach((std) => {
        nextRecords[std.id] = {
          status: 'H',
          note: nextRecords[std.id]?.note || '',
        };
      });
      return {
        ...prev,
        records: nextRecords,
      };
    });
    onNotify(`Seluruh ${students.length} siswa ${currentClass} ditandai Hadir pada ${formatDisplayDate(selectedDate)}.`);
  };

  const handleDeleteSession = (dateToDelete: string) => {
    onRequestDeleteSession(dateToDelete, formatDisplayDate(dateToDelete));
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // Daily summary metrics for selectedDate
  const dailySummary = useMemo(() => {
    let h = 0;
    let s = 0;
    let i = 0;
    let a = 0;
    let unmarked = 0;

    students.forEach((std) => {
      const status = activeSession?.records[std.id]?.status;
      if (status === 'H') h++;
      else if (status === 'S') s++;
      else if (status === 'I') i++;
      else if (status === 'A') a++;
      else unmarked++;
    });

    const total = students.length;
    const pct = total > 0 ? Math.round((h / total) * 100) : 0;

    return { total, h, s, i, a, unmarked, pct };
  }, [students, activeSession]);

  // Cumulative semester recap across all recorded sessions
  const semesterRecap = useMemo(() => {
    return filteredStudents.map((std) => {
      let h = 0;
      let s = 0;
      let i = 0;
      let a = 0;
      sessions.forEach((ses) => {
        const st = ses.records[std.id]?.status;
        if (st === 'H') h++;
        else if (st === 'S') s++;
        else if (st === 'I') i++;
        else if (st === 'A') a++;
      });
      const recordedCount = h + s + i + a;
      const pct = recordedCount > 0 ? Math.round((h / recordedCount) * 100) : 0;
      return {
        student: std,
        recordedCount,
        h,
        s,
        i,
        a,
        pct,
      };
    });
  }, [filteredStudents, sessions]);

  return (
    <div className="space-y-5 no-print">
      {/* Top Toolbar Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Daftar Hadir &amp; Absensi PJOK</span>
                <span className="text-blue-700">· {currentClass}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {schoolInfo.schoolName} · {sortedSessions.length} pertemuan tercatat
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sub-view switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/70">
              <button
                type="button"
                onClick={() => setViewTab('daily')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  viewTab === 'daily'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Absensi Harian
              </button>
              <button
                type="button"
                onClick={() => setViewTab('recap')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  viewTab === 'recap'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Pertemuan ({sortedSessions.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onExportAttendanceExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Export Absensi (.xls)</span>
            </button>

            <button
              type="button"
              onClick={onPrintAttendance}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Absensi</span>
            </button>
          </div>
        </div>

        {/* Daily Attendance Controls */}
        {viewTab === 'daily' && (
          <div className="p-5 space-y-5">
            {/* Session Date & Topic Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tanggal Pertemuan</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Materi / Kegiatan PJOK (Opsional)</span>
                </label>
                <input
                  type="text"
                  value={activeSession?.topic || ''}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  placeholder="Contoh: Gerak Lokomotor & Permainan Bola Kecil"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="md:col-span-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  disabled={students.length === 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Tandai Semua Hadir (H)</span>
                </button>
              </div>
            </div>

            {/* Quick Past Dates Selector if any */}
            {sortedSessions.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat tanggal:</span>
                </span>
                {sortedSessions.slice(0, 8).map((ses) => {
                  const isSelected = ses.date === selectedDate;
                  return (
                    <button
                      key={ses.date}
                      type="button"
                      onClick={() => setSelectedDate(ses.date)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {formatDisplayDate(ses.date)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Daily Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">Total Siswa</div>
                <div className="text-lg font-extrabold font-mono text-slate-900">
                  {dailySummary.total}
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5">
                <div className="text-[11px] font-semibold text-emerald-700">Hadir (H)</div>
                <div className="text-lg font-extrabold font-mono text-emerald-700">
                  {dailySummary.h}{' '}
                  <span className="text-xs font-semibold">({dailySummary.pct}%)</span>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-2.5">
                <div className="text-[11px] font-semibold text-amber-700">Sakit (S)</div>
                <div className="text-lg font-extrabold font-mono text-amber-700">
                  {dailySummary.s}
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-3.5 py-2.5">
                <div className="text-[11px] font-semibold text-blue-700">Izin (I)</div>
                <div className="text-lg font-extrabold font-mono text-blue-700">
                  {dailySummary.i}
                </div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/60 px-3.5 py-2.5 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold text-red-700">Alpa (A)</div>
                <div className="text-lg font-extrabold font-mono text-red-700">
                  {dailySummary.a}
                </div>
              </div>
            </div>

            {/* Search & Auto-save Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau NIS siswa..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {activeSession
                      ? 'Absensi tanggal ini tersimpan otomatis di browser'
                      : 'Klik status H/S/I/A atau "Tandai Semua Hadir" untuk mencatat tanggal ini'}
                  </span>
                </div>

                {activeSession && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(activeSession.date)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-red-200 bg-red-50/70 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Hapus pertemuan tanggal ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Pertemuan Ini</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attendance Input Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-3 text-center w-12 font-bold">No</th>
                    <th className="py-3 px-3 text-center w-20 font-bold">NIS</th>
                    <th className="py-3 px-3 font-bold min-w-[180px]">Nama Siswa</th>
                    <th className="py-3 px-2 text-center w-12 font-bold">L/P</th>
                    <th className="py-3 px-3 text-center font-bold min-w-[230px]">
                      Status Kehadiran
                    </th>
                    <th className="py-3 px-3 font-bold min-w-[180px]">
                      Catatan / Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-1">
                          <p className="font-semibold text-slate-600">
                            {searchQuery
                              ? 'Tidak ada siswa yang cocok dengan pencarian'
                              : `Belum ada daftar siswa di ${currentClass}`}
                          </p>
                          <p className="text-xs">
                            Tambahkan siswa melalui Form Input Nilai, Pengisian Mandiri, atau Upload Data Siswa perkelas.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const entry = activeSession?.records[student.id];
                      const currentStatus = entry?.status;
                      const currentNote = entry?.note || '';

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                            {student.nis || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {student.name}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500">
                            {student.gender}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {STATUS_OPTIONS.map((opt) => {
                                const isActive = currentStatus === opt.code;
                                return (
                                  <button
                                    key={opt.code}
                                    type="button"
                                    onClick={() =>
                                      handleSetStudentStatus(student.id, opt.code)
                                    }
                                    title={opt.label}
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                                      isActive
                                        ? opt.activeClass
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {opt.code} · {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) =>
                                handleSetStudentNote(student.id, e.target.value)
                              }
                              placeholder="Keterangan (opsional)..."
                              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Semester Recap & Meeting History View */}
        {viewTab === 'recap' && (
          <div className="p-5 space-y-6">
            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau NIS siswa..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>
              <div className="text-xs text-slate-500">
                Akumulasi dari <b>{sortedSessions.length}</b> pertemuan tercatat di {currentClass}
              </div>
            </div>

            {/* Cumulative Student Attendance Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-3 text-center w-12 font-bold">No</th>
                    <th className="py-3 px-3 text-center w-20 font-bold">NIS</th>
                    <th className="py-3 px-3 font-bold min-w-[180px]">Nama Siswa</th>
                    <th className="py-3 px-2 text-center w-12 font-bold">L/P</th>
                    <th className="py-3 px-3 text-center font-bold">Tercatat</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/70">
                      Hadir (H)
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-amber-700">
                      Sakit (S)
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-blue-700">
                      Izin (I)
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-red-700">
                      Alpa (A)
                    </th>
                    <th className="py-3 px-3 text-right font-bold min-w-[140px]">
                      Kehadiran (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {semesterRecap.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        Belum ada data siswa di {currentClass}.
                      </td>
                    </tr>
                  ) : (
                    semesterRecap.map((row, idx) => (
                      <tr key={row.student.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {row.student.nis || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {row.student.name}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500">
                          {row.student.gender}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {row.recordedCount}x
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                          {row.h}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-amber-700">
                          {row.s}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-blue-700">
                          {row.i}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-red-700">
                          {row.a}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  row.pct >= 80
                                    ? 'bg-emerald-600'
                                    : row.pct >= 60
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${row.pct}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-800 w-9 text-right">
                              {row.pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Session History Manager */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Daftar Pertemuan Tercatat ({sortedSessions.length})</span>
              </h3>

              {sortedSessions.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                  Belum ada pertemuan yang dicatat untuk {currentClass}. Buka tab <b>Absensi Harian</b> untuk mulai mengisi daftar hadir.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedSessions.map((ses) => {
                    const vals = Object.entries(ses.records)
                      .filter(([stdId]) => studentIdSet.has(stdId))
                      .map(([, val]) => val);
                    const hCount = vals.filter((v) => v.status === 'H').length;
                    const absentCount = vals.filter((v) => v.status !== 'H').length;

                    return (
                      <div
                        key={ses.date}
                        className="border border-slate-200 rounded-lg p-3.5 bg-white flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold font-mono text-blue-700">
                              {formatDisplayDate(ses.date)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              H: {hCount} · Non-H: {absentCount}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {ses.topic || 'Pembelajaran PJOK Reguler'}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(ses.date);
                              setViewTab('daily');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                          >
                            Buka / Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(ses.date)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Hapus data pertemuan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
