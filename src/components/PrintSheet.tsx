import React from 'react';
import { StudentGrade, ClassGrade, SchoolInfo } from '../types';
import { getPredicateDescription } from '../utils/gradeCalculations';

interface PrintSheetProps {
  currentClass: ClassGrade;
  students: StudentGrade[];
  schoolInfo: SchoolInfo;
  previewMode?: boolean;
}

export const PrintSheet: React.FC<PrintSheetProps> = ({
  currentClass,
  students,
  schoolInfo,
  previewMode = false,
}) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const count = students.length;
  const avgNH = count > 0 ? (students.reduce((a, b) => a + b.dailyScore, 0) / count).toFixed(1) : '0.0';
  const avgNP = count > 0 ? (students.reduce((a, b) => a + b.practicalScore, 0) / count).toFixed(1) : '0.0';
  const avgPTS = count > 0 ? (students.reduce((a, b) => a + b.midtermScore, 0) / count).toFixed(1) : '0.0';
  const avgPAS = count > 0 ? (students.reduce((a, b) => a + b.finalScore, 0) / count).toFixed(1) : '0.0';
  const avgNA = count > 0 ? (students.reduce((a, b) => a + b.finalReportScore, 0) / count).toFixed(2) : '0.00';

  return (
    <div className={previewMode ? 'text-slate-900' : 'print-only'}>
      {/* Official School Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-slate-900">
        <h2 className="text-base font-bold tracking-wider uppercase">
          PEMERINTAH KABUPATEN
        </h2>
        <h1 className="text-xl font-extrabold tracking-wide uppercase">
          {schoolInfo.schoolName}
        </h1>
        <p className="text-xs text-slate-700 italic">
          Kecamatan Lokojuli · Nusa Tenggara Timur · Akreditasi Pendidikan Nasional
        </p>
      </div>

      <div className="text-center mb-5">
        <h3 className="text-sm font-bold uppercase underline">
          DAFTAR NILAI HASIL BELAJAR PESERTA DIDIK (RAPOR)
        </h3>
        <p className="text-xs font-semibold mt-1">
          Mata Pelajaran: {schoolInfo.subject}
        </p>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 text-xs mb-4">
        <div>
          <div>Kelas: <b>{currentClass}</b></div>
          <div>Semester: <b>{schoolInfo.semester}</b></div>
        </div>
        <div className="text-right">
          <div>Tahun Pelajaran: <b>{schoolInfo.academicYear}</b></div>
          <div>Kriteria Ketuntasan (KKTP): <b>{schoolInfo.kktp}</b></div>
        </div>
      </div>

      {/* Print Table */}
      <table className="print-table text-xs w-full mb-8">
        <thead>
          <tr className="bg-slate-100 font-bold text-center">
            <th style={{ width: '35px' }}>No</th>
            <th style={{ width: '65px' }}>NIS</th>
            <th style={{ textAlign: 'left' }}>Nama Siswa</th>
            <th style={{ width: '40px' }}>L/P</th>
            <th style={{ width: '45px' }}>NH</th>
            <th style={{ width: '45px' }}>NP</th>
            <th style={{ width: '45px' }}>PTS</th>
            <th style={{ width: '45px' }}>PAS</th>
            <th style={{ width: '60px' }}>Nilai Rapor</th>
            <th style={{ width: '50px' }}>Predikat</th>
            <th style={{ width: '65px' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={12} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                Belum ada data siswa di {currentClass}.
              </td>
            </tr>
          ) : (
            students.map((s, idx) => (
              <tr key={s.id}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ textAlign: 'center' }}>{s.nis || '-'}</td>
                <td>{s.name}</td>
                <td style={{ textAlign: 'center' }}>{s.gender}</td>
                <td style={{ textAlign: 'right' }}>{s.dailyScore}</td>
                <td style={{ textAlign: 'right' }}>{s.practicalScore}</td>
                <td style={{ textAlign: 'right' }}>{s.midtermScore}</td>
                <td style={{ textAlign: 'right' }}>{s.finalScore}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {s.finalReportScore.toFixed(2)}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{s.predicate}</td>
                <td style={{ textAlign: 'center' }}>{s.status}</td>
                <td>{getPredicateDescription(s.predicate)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-slate-50">
            <td colSpan={4} style={{ textAlign: 'center' }}>RATA-RATA KELAS</td>
            <td style={{ textAlign: 'right' }}>{avgNH}</td>
            <td style={{ textAlign: 'right' }}>{avgNP}</td>
            <td style={{ textAlign: 'right' }}>{avgPTS}</td>
            <td style={{ textAlign: 'right' }}>{avgPAS}</td>
            <td style={{ textAlign: 'right' }}>{avgNA}</td>
            <td colSpan={3} style={{ textAlign: 'center' }}>KKTP: {schoolInfo.kktp}</td>
          </tr>
        </tfoot>
      </table>

      {/* Signature Section */}
      <div className="grid grid-cols-2 text-xs pt-4" style={{ pageBreakInside: 'avoid' }}>
        <div className="text-center">
          <p>Mengetahui,</p>
          <p>Kepala {schoolInfo.schoolName}</p>
          <div style={{ height: '70px' }}></div>
          <p className="font-bold underline">{schoolInfo.principalName}</p>
          <p>NIP. {schoolInfo.principalNip}</p>
        </div>

        <div className="text-center">
          <p>Lokojuli, {currentDate}</p>
          <p>Guru Mata Pelajaran PJOK</p>
          <div style={{ height: '70px' }}></div>
          <p className="font-bold underline">{schoolInfo.teacherName}</p>
          <p>NIP. {schoolInfo.teacherNip}</p>
        </div>
      </div>
    </div>
  );
};
