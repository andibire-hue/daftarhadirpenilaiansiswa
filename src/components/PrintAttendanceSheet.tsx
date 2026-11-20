import React from 'react';
import {
  StudentGrade,
  ClassGrade,
  SchoolInfo,
  ClassAttendanceSession,
} from '../types';

interface PrintAttendanceSheetProps {
  currentClass: ClassGrade;
  students: StudentGrade[];
  sessions: ClassAttendanceSession[];
  schoolInfo: SchoolInfo;
  previewMode?: boolean;
}

export const PrintAttendanceSheet: React.FC<PrintAttendanceSheetProps> = ({
  currentClass,
  students,
  sessions,
  schoolInfo,
  previewMode = false,
}) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  // Show up to the latest 10 sessions in A4 portrait print view
  const displayedSessions = sortedSessions.slice(-10);

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
          DAFTAR HADIR PESERTA DIDIK (ABSENSI PJOK)
        </h3>
        <p className="text-xs font-semibold mt-1">
          Mata Pelajaran: {schoolInfo.subject}
        </p>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 text-xs mb-4">
        <div>
          <div>
            Kelas: <b>{currentClass}</b>
          </div>
          <div>
            Semester: <b>{schoolInfo.semester}</b>
          </div>
        </div>
        <div className="text-right">
          <div>
            Tahun Pelajaran: <b>{schoolInfo.academicYear}</b>
          </div>
          <div>
            Total Pertemuan Tercatat: <b>{sortedSessions.length}</b>
          </div>
        </div>
      </div>

      {/* Print Attendance Table */}
      <table className="print-table text-xs w-full mb-8">
        <thead>
          <tr className="bg-slate-100 font-bold text-center">
            <th style={{ width: '32px' }}>No</th>
            <th style={{ width: '60px' }}>NIS</th>
            <th style={{ textAlign: 'left' }}>Nama Siswa</th>
            <th style={{ width: '34px' }}>L/P</th>
            {displayedSessions.map((ses) => (
              <th key={ses.date} style={{ width: '38px', fontSize: '9px' }}>
                {ses.date.split('-').reverse().slice(0, 2).join('/')}
              </th>
            ))}
            <th style={{ width: '32px' }}>H</th>
            <th style={{ width: '32px' }}>S</th>
            <th style={{ width: '32px' }}>I</th>
            <th style={{ width: '32px' }}>A</th>
            <th style={{ width: '48px' }}>% Hadir</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={9 + displayedSessions.length} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                Belum ada data siswa di {currentClass}.
              </td>
            </tr>
          ) : (
            students.map((std, idx) => {
              let h = 0;
              let s = 0;
              let i = 0;
              let a = 0;
              sortedSessions.forEach((ses) => {
                const st = ses.records[std.id]?.status;
                if (st === 'H') h++;
                else if (st === 'S') s++;
                else if (st === 'I') i++;
                else if (st === 'A') a++;
              });
              const totalRec = h + s + i + a;
              const pct = totalRec > 0 ? Math.round((h / totalRec) * 100) : 0;

              return (
                <tr key={std.id}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ textAlign: 'center' }}>{std.nis || '-'}</td>
                  <td>{std.name}</td>
                  <td style={{ textAlign: 'center' }}>{std.gender}</td>
                  {displayedSessions.map((ses) => (
                    <td key={ses.date} style={{ textAlign: 'center', fontWeight: 600 }}>
                      {ses.records[std.id]?.status || '-'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{h}</td>
                  <td style={{ textAlign: 'center' }}>{s}</td>
                  <td style={{ textAlign: 'center' }}>{i}</td>
                  <td style={{ textAlign: 'center' }}>{a}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{pct}%</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="text-[11px] text-slate-600 mb-6">
        Keterangan: <b>H</b> = Hadir, <b>S</b> = Sakit, <b>I</b> = Izin, <b>A</b> = Alpa (Tanpa Keterangan).
      </div>

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
