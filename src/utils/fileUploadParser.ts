import * as XLSX from 'xlsx';
import { StudentGrade, ClassGrade } from '../types';
import { calculateFinalScore, calculatePredicate, calculateStatus } from './gradeCalculations';

export interface ParsedStudentRow {
  nis: string;
  name: string;
  gender: 'L' | 'P';
  dailyScore: number;
  practicalScore: number;
  midtermScore: number;
  finalScore: number;
}

export function parseSpreadsheetFile(
  file: File,
  kktp: number = 70
): Promise<StudentGrade[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of arrays or objects
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Array of arrays to robustly detect headers
          defval: '',
        });

        if (!jsonRows || jsonRows.length === 0) {
          throw new Error('Berkas Excel / CSV kosong.');
        }

        // Find header row (usually contains "nama" or "siswa" or "nis")
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonRows.length); i++) {
          const row = jsonRows[i];
          if (Array.isArray(row)) {
            const rowStr = row.map((c) => String(c).toLowerCase()).join(' ');
            if (rowStr.includes('nama') || rowStr.includes('siswa') || rowStr.includes('nis')) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          // If no explicit header recognized, assume first row is header
          headerRowIndex = 0;
        }

        const headers = jsonRows[headerRowIndex].map((h: any) =>
          String(h).trim().toLowerCase()
        );

        // Find column indices
        const nisIdx = headers.findIndex(
          (h: string) =>
            h.includes('nis') || h.includes('induk') || h.includes('no induk') || h === 'id'
        );
        const nameIdx = headers.findIndex(
          (h: string) =>
            h.includes('nama') || h.includes('siswa') || h.includes('peserta didik') || h === 'name'
        );
        const genderIdx = headers.findIndex(
          (h: string) =>
            h.includes('jk') ||
            h.includes('l/p') ||
            h.includes('kelamin') ||
            h.includes('gender')
        );
        const nhIdx = headers.findIndex(
          (h: string) =>
            h === 'nh' ||
            h.includes('harian') ||
            h.includes('sumatif harian') ||
            h.includes('tugas')
        );
        const npIdx = headers.findIndex(
          (h: string) =>
            h === 'np' ||
            h.includes('praktik') ||
            h.includes('keterampilan') ||
            h.includes('lapangan')
        );
        const ptsIdx = headers.findIndex(
          (h: string) =>
            h === 'pts' ||
            h === 'sts' ||
            h.includes('tengah') ||
            h.includes('uts') ||
            h.includes('mid')
        );
        const pasIdx = headers.findIndex(
          (h: string) =>
            h === 'pas' ||
            h === 'sas' ||
            h.includes('akhir') ||
            h.includes('uas') ||
            h.includes('semester')
        );

        if (nameIdx === -1) {
          throw new Error(
            'Kolom "Nama Siswa" tidak ditemukan dalam berkas. Pastikan ada baris judul dengan nama kolom "Nama" atau "Nama Siswa".'
          );
        }

        const students: StudentGrade[] = [];

        for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || !Array.isArray(row)) continue;

          const rawName = String(row[nameIdx] || '').trim();
          if (!rawName) continue; // Skip empty rows

          // Parse NIS
          let rawNis = nisIdx !== -1 ? String(row[nisIdx] || '').trim() : '';
          if (!rawNis) {
            rawNis = String(100 + i);
          }

          // Parse Gender (L/P)
          let gender: 'L' | 'P' = 'L';
          if (genderIdx !== -1) {
            const rawG = String(row[genderIdx] || '').toUpperCase().trim();
            if (rawG.startsWith('P') || rawG.startsWith('W') || rawG === 'FEMALE') {
              gender = 'P';
            }
          }

          // Parse Grades
          const nh = nhIdx !== -1 ? parseFloat(String(row[nhIdx]).replace(',', '.')) : 75;
          const np = npIdx !== -1 ? parseFloat(String(row[npIdx]).replace(',', '.')) : 80;
          const pts = ptsIdx !== -1 ? parseFloat(String(row[ptsIdx]).replace(',', '.')) : 75;
          const pas = pasIdx !== -1 ? parseFloat(String(row[pasIdx]).replace(',', '.')) : 80;

          const safeNh = isNaN(nh) ? 75 : Math.min(100, Math.max(0, nh));
          const safeNp = isNaN(np) ? 80 : Math.min(100, Math.max(0, np));
          const safePts = isNaN(pts) ? 75 : Math.min(100, Math.max(0, pts));
          const safePas = isNaN(pas) ? 80 : Math.min(100, Math.max(0, pas));

          const finalReportScore = calculateFinalScore(safeNh, safeNp, safePts, safePas);
          const predicate = calculatePredicate(finalReportScore);
          const status = calculateStatus(finalReportScore, kktp);

          students.push({
            id: `std_up_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
            nis: rawNis,
            name: rawName,
            gender,
            dailyScore: safeNh,
            practicalScore: safeNp,
            midtermScore: safePts,
            finalScore: safePas,
            finalReportScore,
            predicate,
            status,
            notes: 'Diimpor dari berkas Excel/CSV',
            isSelfRegistered: false,
            updatedAt: new Date().toISOString(),
          });
        }

        if (students.length === 0) {
          throw new Error('Tidak ada data siswa yang berhasil dibaca dari berkas.');
        }

        resolve(students);
      } catch (err: any) {
        reject(err.message || 'Gagal memproses berkas Excel / CSV.');
      }
    };

    reader.onerror = () => {
      reject('Gagal membaca berkas.');
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a clean Excel template file (.xlsx) ready to be filled by teachers.
 */
export function downloadUploadTemplateExcel(targetClass: ClassGrade): void {
  const templateData = [
    {
      'No': 1,
      'NIS': '101',
      'Nama Siswa': 'Aditia Pratama',
      'Jenis Kelamin (L/P)': 'L',
      'Nilai Harian (NH)': 85,
      'Nilai Praktik (NP)': 88,
      'PTS': 82,
      'PAS': 86,
    },
    {
      'No': 2,
      'NIS': '102',
      'Nama Siswa': 'Bella Safitri',
      'Jenis Kelamin (L/P)': 'P',
      'Nilai Harian (NH)': 90,
      'Nilai Praktik (NP)': 92,
      'PTS': 88,
      'PAS': 91,
    },
    {
      'No': 3,
      'NIS': '103',
      'Nama Siswa': 'Christian Dapa',
      'Jenis Kelamin (L/P)': 'L',
      'Nilai Harian (NH)': 78,
      'Nilai Praktik (NP)': 80,
      'PTS': 75,
      'PAS': 78,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 10 }, // NIS
    { wch: 28 }, // Nama Siswa
    { wch: 20 }, // Jenis Kelamin
    { wch: 18 }, // NH
    { wch: 18 }, // NP
    { wch: 12 }, // PTS
    { wch: 12 }, // PAS
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Data Siswa ${targetClass}`);

  XLSX.writeFile(
    workbook,
    `Template_Upload_Siswa_${targetClass.replace(' ', '_')}_SDN_Lokojuli.xlsx`
  );
}
