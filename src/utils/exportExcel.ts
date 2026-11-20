import { StudentGrade, ClassGrade, SchoolInfo, ClassAttendanceSession } from '../types';
import { getPredicateDescription } from './gradeCalculations';

export function exportToExcel(
  classGrade: ClassGrade,
  students: StudentGrade[],
  schoolInfo: SchoolInfo
): void {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate statistics for footer
  const count = students.length;
  let avgDaily = 0;
  let avgPractical = 0;
  let avgMidterm = 0;
  let avgFinal = 0;
  let avgReport = 0;

  if (count > 0) {
    avgDaily = students.reduce((acc, s) => acc + s.dailyScore, 0) / count;
    avgPractical = students.reduce((acc, s) => acc + s.practicalScore, 0) / count;
    avgMidterm = students.reduce((acc, s) => acc + s.midtermScore, 0) / count;
    avgFinal = students.reduce((acc, s) => acc + s.finalScore, 0) / count;
    avgReport = students.reduce((acc, s) => acc + s.finalReportScore, 0) / count;
  }

  // XML-compatible HTML Spreadsheet format that Excel opens natively with full formatting
  let tableRows = '';
  students.forEach((s, idx) => {
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    tableRows += `
      <tr style="background-color: ${bgColor};">
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; mso-number-format:'\\@';">${s.nis || '-'}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding: 6px; font-weight: 500;">${s.name}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px;">${s.gender}</td>
        <td style="border: 1px solid #cbd5e1; text-align: right; padding: 6px;">${s.dailyScore}</td>
        <td style="border: 1px solid #cbd5e1; text-align: right; padding: 6px;">${s.practicalScore}</td>
        <td style="border: 1px solid #cbd5e1; text-align: right; padding: 6px;">${s.midtermScore}</td>
        <td style="border: 1px solid #cbd5e1; text-align: right; padding: 6px;">${s.finalScore}</td>
        <td style="border: 1px solid #cbd5e1; text-align: right; padding: 6px; font-weight: bold; background-color: #e0f2fe;">${s.finalReportScore.toFixed(2)}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-weight: bold;">${s.predicate}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; color: ${s.status === 'Tuntas' ? '#15803d' : '#b91c1c'}; font-weight: 600;">${s.status}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding: 6px;">${getPredicateDescription(s.predicate)}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Nilai PJOK ${classGrade}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #1e3a8a; padding: 8px; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="12" style="font-size: 16pt; font-weight: bold; text-align: center; color: #1e3a8a; padding: 8px;">
            DAFTAR NILAI HASIL BELAJAR PESERTA DIDIK
          </td>
        </tr>
        <tr>
          <td colspan="12" style="font-size: 14pt; font-weight: bold; text-align: center; padding: 4px;">
            ${schoolInfo.schoolName}
          </td>
        </tr>
        <tr>
          <td colspan="12" style="font-size: 11pt; text-align: center; color: #475569; padding-bottom: 12px;">
            Mata Pelajaran: ${schoolInfo.subject} | ${classGrade} | Semester ${schoolInfo.semester} | Tahun Ajaran ${schoolInfo.academicYear}
          </td>
        </tr>
        <tr><td colspan="12"></td></tr>
        <tr style="background-color: #1e40af; color: #ffffff; font-weight: bold;">
          <th style="background-color: #1e40af; color: #ffffff;">No</th>
          <th style="background-color: #1e40af; color: #ffffff;">NIS</th>
          <th style="background-color: #1e40af; color: #ffffff;">Nama Siswa</th>
          <th style="background-color: #1e40af; color: #ffffff;">L/P</th>
          <th style="background-color: #1e40af; color: #ffffff;">Nilai Harian (NH)</th>
          <th style="background-color: #1e40af; color: #ffffff;">Nilai Praktik (NP)</th>
          <th style="background-color: #1e40af; color: #ffffff;">PTS / STS</th>
          <th style="background-color: #1e40af; color: #ffffff;">PAS / SAS</th>
          <th style="background-color: #0369a1; color: #ffffff;">Nilai Rapor (NA)</th>
          <th style="background-color: #1e40af; color: #ffffff;">Predikat</th>
          <th style="background-color: #1e40af; color: #ffffff;">Status</th>
          <th style="background-color: #1e40af; color: #ffffff;">Keterangan</th>
        </tr>
        ${tableRows}
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="4" style="border: 1px solid #94a3b8; text-align: center; padding: 6px;">RATA-RATA KELAS</td>
          <td style="border: 1px solid #94a3b8; text-align: right; padding: 6px;">${avgDaily.toFixed(1)}</td>
          <td style="border: 1px solid #94a3b8; text-align: right; padding: 6px;">${avgPractical.toFixed(1)}</td>
          <td style="border: 1px solid #94a3b8; text-align: right; padding: 6px;">${avgMidterm.toFixed(1)}</td>
          <td style="border: 1px solid #94a3b8; text-align: right; padding: 6px;">${avgFinal.toFixed(1)}</td>
          <td style="border: 1px solid #94a3b8; text-align: right; padding: 6px; background-color: #bae6fd;">${avgReport.toFixed(2)}</td>
          <td colspan="3" style="border: 1px solid #94a3b8; text-align: center; padding: 6px;">KKTP: ${schoolInfo.kktp}</td>
        </tr>
        <tr><td colspan="12"></td></tr>
        <tr><td colspan="12"></td></tr>
        <tr>
          <td colspan="3" style="text-align: center; font-size: 10pt;">
            Mengetahui,<br>
            Kepala Sekolah<br><br><br><br>
            <b><u>${schoolInfo.principalName}</u></b><br>
            NIP. ${schoolInfo.principalNip}
          </td>
          <td colspan="5"></td>
          <td colspan="4" style="text-align: center; font-size: 10pt;">
            Lokojuli, ${dateStr}<br>
            Guru PJOK<br><br><br><br>
            <b><u>${schoolInfo.teacherName}</u></b><br>
            NIP. ${schoolInfo.teacherNip}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Rekap_Nilai_PJOK_${classGrade.replace(' ', '_')}_SDN_Lokojuli.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportToCsv(
  classGrade: ClassGrade,
  students: StudentGrade[],
  schoolInfo: SchoolInfo
): void {
  const headers = [
    'No',
    'NIS',
    'Nama Siswa',
    'L/P',
    'Nilai Harian (NH)',
    'Nilai Praktik (NP)',
    'PTS / STS',
    'PAS / SAS',
    'Nilai Rapor (NA)',
    'Predikat',
    'Status',
    'Keterangan',
  ];

  const rows = students.map((s, idx) => [
    idx + 1,
    `"${s.nis || ''}"`,
    `"${s.name.replace(/"/g, '""')}"`,
    s.gender,
    s.dailyScore,
    s.practicalScore,
    s.midtermScore,
    s.finalScore,
    s.finalReportScore.toFixed(2),
    s.predicate,
    s.status,
    `"${getPredicateDescription(s.predicate)}"`,
  ]);

  const schoolMeta = [
    `"DAFTAR NILAI PJOK - ${schoolInfo.schoolName}"`,
    `"Kelas: ${classGrade} | Semester: ${schoolInfo.semester} | Tahun Ajaran: ${schoolInfo.academicYear}"`,
    '',
  ];

  const csvContent = '\uFEFF' + [
    ...schoolMeta,
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Nilai_PJOK_${classGrade.replace(' ', '_')}_SDN_Lokojuli.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportAttendanceToExcel(
  classGrade: ClassGrade,
  students: StudentGrade[],
  sessions: ClassAttendanceSession[],
  schoolInfo: SchoolInfo
): void {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const totalCols = 4 + sortedSessions.length + 5; // No, NIS, Nama, L/P + dates + H, S, I, A, %

  const sessionHeaders = sortedSessions
    .map((ses) => {
      const shortDate = ses.date.split('-').reverse().slice(0, 2).join('/');
      return `<th style="background-color: #1e40af; color: #ffffff; min-width: 50px;">${shortDate}</th>`;
    })
    .join('');

  let tableRows = '';
  students.forEach((student, idx) => {
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    const dateCells = sortedSessions
      .map((ses) => {
        const entry = ses.records[student.id];
        const status = entry?.status || '-';
        if (status === 'H') hadir++;
        else if (status === 'S') sakit++;
        else if (status === 'I') izin++;
        else if (status === 'A') alpa++;

        let color = '#64748b';
        if (status === 'H') color = '#15803d';
        else if (status === 'S') color = '#d97706';
        else if (status === 'I') color = '#2563eb';
        else if (status === 'A') color = '#dc2626';

        return `<td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-weight: bold; color: ${color};">${status}</td>`;
      })
      .join('');

    const totalSessions = sortedSessions.length;
    const pct = totalSessions > 0 ? Math.round((hadir / totalSessions) * 100) : 0;

    tableRows += `
      <tr style="background-color: ${bgColor};">
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; mso-number-format:'\\@';">${student.nis || '-'}</td>
        <td style="border: 1px solid #cbd5e1; text-align: left; padding: 6px; font-weight: 500;">${student.name}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px;">${student.gender}</td>
        ${dateCells}
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-weight: bold; color: #15803d; background-color: #f0fdf4;">${hadir}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-weight: bold; color: #d97706;">${sakit}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-weight: bold; color: #2563eb;">${izin}</td>
        <td style="border: 1px solid #cbd5e1; text-align: center; padding: 6px; font-weight: bold; color: #dc2626;">${alpa}</td>
        <td style="border: 1px solid #cbd5e1; text-align: right; padding: 6px; font-weight: bold; background-color: #e0f2fe;">${pct}%</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Absensi PJOK ${classGrade}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #1e3a8a; padding: 8px; text-align: center; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${totalCols}" style="font-size: 16pt; font-weight: bold; text-align: center; color: #1e3a8a; padding: 8px;">
            DAFTAR HADIR PESERTA DIDIK (ABSENSI PJOK)
          </td>
        </tr>
        <tr>
          <td colspan="${totalCols}" style="font-size: 14pt; font-weight: bold; text-align: center; padding: 4px;">
            ${schoolInfo.schoolName}
          </td>
        </tr>
        <tr>
          <td colspan="${totalCols}" style="font-size: 11pt; text-align: center; color: #475569; padding-bottom: 12px;">
            Mata Pelajaran: ${schoolInfo.subject} | ${classGrade} | Semester ${schoolInfo.semester} | Tahun Ajaran ${schoolInfo.academicYear}
          </td>
        </tr>
        <tr><td colspan="${totalCols}"></td></tr>
        <tr>
          <th style="background-color: #1e40af; color: #ffffff;">No</th>
          <th style="background-color: #1e40af; color: #ffffff;">NIS</th>
          <th style="background-color: #1e40af; color: #ffffff;">Nama Siswa</th>
          <th style="background-color: #1e40af; color: #ffffff;">L/P</th>
          ${sessionHeaders}
          <th style="background-color: #15803d; color: #ffffff;">H</th>
          <th style="background-color: #d97706; color: #ffffff;">S</th>
          <th style="background-color: #2563eb; color: #ffffff;">I</th>
          <th style="background-color: #dc2626; color: #ffffff;">A</th>
          <th style="background-color: #0369a1; color: #ffffff;">% Hadir</th>
        </tr>
        ${tableRows}
        <tr><td colspan="${totalCols}"></td></tr>
        <tr>
          <td colspan="${totalCols}" style="font-size: 10pt; color: #475569;">
            Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpa (Tanpa Keterangan) | Total Pertemuan Tercatat: ${sortedSessions.length}
          </td>
        </tr>
        <tr><td colspan="${totalCols}"></td></tr>
        <tr>
          <td colspan="3" style="text-align: center; font-size: 10pt;">
            Mengetahui,<br>
            Kepala Sekolah<br><br><br><br>
            <b><u>${schoolInfo.principalName}</u></b><br>
            NIP. ${schoolInfo.principalNip}
          </td>
          <td colspan="${Math.max(1, totalCols - 6)}"></td>
          <td colspan="3" style="text-align: center; font-size: 10pt;">
            Lokojuli, ${dateStr}<br>
            Guru PJOK<br><br><br><br>
            <b><u>${schoolInfo.teacherName}</u></b><br>
            NIP. ${schoolInfo.teacherNip}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Daftar_Hadir_PJOK_${classGrade.replace(' ', '_')}_SDN_Lokojuli.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
