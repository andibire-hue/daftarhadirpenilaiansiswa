import * as XLSX from 'xlsx';
import { ClassGrade } from '../types';
import {
  ATTACHED_KELAS_6_CP_ROWS,
  CURRICULUM_FIXED_INFO,
  getFaseForClass,
} from './curriculumGenerator';

interface TemplateClassSpec {
  kelas: ClassGrade;
  num: number;
  cpSheet: string;
  atpSheet: string;
}

const TEMPLATE_CLASS_SPECS: TemplateClassSpec[] = [
  { kelas: 'Kelas 1', num: 1, cpSheet: 'CP', atpSheet: 'ATP' },
  { kelas: 'Kelas 2', num: 2, cpSheet: 'CP (2)', atpSheet: 'ATP (2)' },
  { kelas: 'Kelas 3', num: 3, cpSheet: 'CP (3)', atpSheet: 'ATP (3)' },
  { kelas: 'Kelas 4', num: 4, cpSheet: 'CP (4)', atpSheet: 'ATP (4)' },
  { kelas: 'Kelas 5', num: 5, cpSheet: 'CP (5)', atpSheet: 'ATP (5)' },
  { kelas: 'Kelas 6', num: 6, cpSheet: 'CP (6)', atpSheet: 'ATP (6)' },
];

export function downloadCurriculumTemplateExcel(): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet PETUNJUK (otomatis dilewati oleh parser saat upload)
  const guideRows: (string | number)[][] = [
    ['TEMPLATE PENGISIAN CP & ATP PJOK TERPADU KELAS 1 - 6'],
    [`Satuan Pendidikan : ${CURRICULUM_FIXED_INFO.schoolName}`],
    [`Mata Pelajaran    : ${CURRICULUM_FIXED_INFO.subject}`],
    [`Tahun Ajaran      : ${CURRICULUM_FIXED_INFO.academicYear} (Semester ${CURRICULUM_FIXED_INFO.semester})`],
    [`Guru Pengampu     : ${CURRICULUM_FIXED_INFO.teacherName}`],
    [''],
    ['A. ATURAN PENAMAAN SHEET (JANGAN DIUBAH)'],
    ['Kelas', 'Fase', 'Nama Sheet CP', 'Nama Sheet ATP', 'Keterangan'],
    ['Kelas 1', 'Fase A', 'CP', 'ATP', 'Tanpa akhiran angka'],
    ['Kelas 2', 'Fase A', 'CP (2)', 'ATP (2)', 'Akhiran (2)'],
    ['Kelas 3', 'Fase B', 'CP (3)', 'ATP (3)', 'Akhiran (3)'],
    ['Kelas 4', 'Fase B', 'CP (4)', 'ATP (4)', 'Akhiran (4)'],
    ['Kelas 5', 'Fase C', 'CP (5)', 'ATP (5)', 'Akhiran (5)'],
    ['Kelas 6', 'Fase C', 'CP (6)', 'ATP (6)', 'Akhiran (6) - CP sudah terisi dari lampiran'],
    [''],
    ['B. FORMAT KOLOM SHEET CP (CAPAIAN PEMBELAJARAN)'],
    ['Kolom', 'Wajib?', 'Format / Cara Pengisian'],
    ['No', 'Ya', 'Nomor urut elemen (1, 2, 3, 4)'],
    ['Elemen', 'Ya', 'Nama elemen CP (misal: Terampil Bergerak, Belajar Melalui Gerak, Bergaya Hidup Aktif, Memilih Hidup yang Menyehatkan)'],
    ['Capaian Pembelajaran', 'Ya', 'Salin teks lengkap Capaian Pembelajaran sesuai dokumen resmi tanpa disingkat'],
    [''],
    ['C. FORMAT KOLOM SHEET ATP (ALUR TUJUAN PEMBELAJARAN)'],
    ['Kolom', 'Wajib?', 'Format / Cara Pengisian'],
    ['No', 'Ya', 'Nomor urut tujuan pembelajaran (1, 2, 3, ...)'],
    ['Elemen', 'Ya', 'Nama elemen CP terkait (misal: Terampil Bergerak, Belajar Melalui Gerak, Bergaya Hidup Aktif, Memilih Hidup yang Menyehatkan)'],
    ['Capaian Pembelajaran', 'Ya', 'Teks Capaian Pembelajaran yang sesuai dengan elemen pada baris tersebut'],
    ['Tujuan Pembelajaran', 'Ya', 'Rumusan Tujuan Pembelajaran (TP) yang spesifik dan terukur sesuai ATP'],
    ['Lingkup Materi', 'Ya', 'Pokok materi PJOK pada TP tersebut (misal: Gerak Dasar Lokomotor, Permainan Bola Besar, Kebugaran Jasmani)'],
    ['Alokasi Waktu (JP)', 'Ya', 'Jumlah jam pelajaran (tulis angka saja seperti 6 atau format "6 JP"). Total Semester 1 sesuai ATP (misal 54 JP)'],
    [''],
    ['D. CATATAN PENTING'],
    ['1. Jangan mengubah nama sheet dan jangan mengubah baris judul kolom tabel.'],
    ['2. Jika kolom Elemen / Capaian Pembelajaran / Lingkup Materi sama untuk beberapa baris TP di bawahnya, boleh ditulis ulang atau dikosongkan (sistem otomatis meneruskan dari baris atasnya).'],
    ['3. Apabila sheet CP dikosongkan dan kolom "Capaian Pembelajaran" sudah diisi di sheet ATP, sistem otomatis mengekstrak CP tersebut secara utuh ke bagian CP kelas terkait.'],
    ['4. Setelah diisi, simpan file (.xlsx) lalu klik tombol "Upload File .xlsx (CP & ATP)" di menu Perangkat Pembelajaran.'],
    ['5. Sistem membaca file secara READ-ONLY dan otomatis menyusun PROTA, PROMES, Materi, Modul Ajar (22 Komponen), Asesmen, Rubrik, dan Refleksi.'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide['!cols'] = [
    { wch: 24 },
    { wch: 12 },
    { wch: 30 },
    { wch: 30 },
    { wch: 52 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK');

  // 2. 12 Sheet Data Resmi (CP & ATP Kelas 1 s/d 6)
  TEMPLATE_CLASS_SPECS.forEach((spec) => {
    const fase = getFaseForClass(spec.kelas);

    // Sheet CP
    const cpRows: (string | number)[][] = [
      ['CAPAIAN PEMBELAJARAN (CP) PJOK', '', ''],
      ['Satuan Pendidikan', `: ${CURRICULUM_FIXED_INFO.schoolName}`, ''],
      ['Mata Pelajaran', `: ${CURRICULUM_FIXED_INFO.subject}`, ''],
      ['Fase / Kelas', `: ${fase.replace('Fase ', '')} / ${spec.num}`, ''],
      ['Tahun Ajaran', `: ${CURRICULUM_FIXED_INFO.academicYear}`, ''],
      ['Semester', `: ${CURRICULUM_FIXED_INFO.semester}`, ''],
      ['', '', ''],
      ['No', 'Elemen', 'Capaian Pembelajaran'],
    ];

    if (spec.kelas === 'Kelas 6') {
      ATTACHED_KELAS_6_CP_ROWS.forEach((row) => {
        cpRows.push([row.no, row.elemen, row.capaianPembelajaran]);
      });
    } else {
      for (let i = 1; i <= 4; i++) {
        cpRows.push([i, '', '']);
      }
    }

    const wsCp = XLSX.utils.aoa_to_sheet(cpRows);
    wsCp['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 85 }];
    XLSX.utils.book_append_sheet(wb, wsCp, spec.cpSheet);

    // Sheet ATP (5 kolom utama pengisian: Elemen, Capaian Pembelajaran, Tujuan Pembelajaran, Lingkup Materi, Alokasi Waktu (JP) + No)
    const atpRows: (string | number)[][] = [
      ['ALUR TUJUAN PEMBELAJARAN (ATP) PJOK', '', '', '', '', ''],
      ['Satuan Pendidikan', `: ${CURRICULUM_FIXED_INFO.schoolName}`, '', '', '', ''],
      ['Mata Pelajaran', `: ${CURRICULUM_FIXED_INFO.subject}`, '', '', '', ''],
      ['Fase / Kelas', `: ${fase.replace('Fase ', '')} / ${spec.num}`, '', '', '', ''],
      ['Tahun Ajaran', `: ${CURRICULUM_FIXED_INFO.academicYear}`, '', '', '', ''],
      ['Semester', `: ${CURRICULUM_FIXED_INFO.semester}`, '', '', '', ''],
      ['', '', '', '', '', ''],
      [
        'No',
        'Elemen',
        'Capaian Pembelajaran',
        'Tujuan Pembelajaran',
        'Lingkup Materi',
        'Alokasi Waktu (JP)',
      ],
    ];

    for (let i = 1; i <= 9; i++) {
      atpRows.push([i, '', '', '', '', '']);
    }

    const wsAtp = XLSX.utils.aoa_to_sheet(atpRows);
    wsAtp['!cols'] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 56 },
      { wch: 48 },
      { wch: 34 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsAtp, spec.atpSheet);
  });

  XLSX.writeFile(wb, 'Template_CP_dan_ATP_PJOK_Kelas_1-6.xlsx');
}
