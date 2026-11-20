export interface StudentGrade {
  id: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  dailyScore: number;    // Nilai Harian / Sumatif Harian (NH)
  practicalScore: number; // Nilai Praktik / Keterampilan (NP)
  midtermScore: number;  // Nilai Tengah Semester (PTS / STS)
  finalScore: number;    // Nilai Akhir Semester (PAS / SAS)
  finalReportScore: number; // Nilai Rapor (NA)
  predicate: 'A' | 'B' | 'C' | 'D';
  status: 'Tuntas' | 'Remedial';
  notes?: string;
  heightCm?: number;
  weightKg?: number;
  favoriteSport?: string;
  isSelfRegistered?: boolean;
  updatedAt: string;
}

export type ClassGrade = 'Kelas 1' | 'Kelas 2' | 'Kelas 3' | 'Kelas 4' | 'Kelas 5' | 'Kelas 6';

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export interface AttendanceEntry {
  status: AttendanceStatus;
  note?: string;
}

export interface ClassAttendanceSession {
  date: string; // YYYY-MM-DD
  topic: string; // Materi / Kegiatan PJOK
  records: Record<string, AttendanceEntry>; // keyed by student.id
  updatedAt: string;
}

export interface SchoolInfo {
  schoolName: string;
  subject: string;
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  kktp: number; // Kriteria Ketercapaian Tujuan Pembelajaran / KKM
}

export type FasePembelajaran = 'Fase A' | 'Fase B' | 'Fase C';

export interface LearningIdentity {
  schoolName: string;
  subject: string;
  teacherName: string;
  academicYear: string;
  semester: string;
  kelas: ClassGrade;
  fase: FasePembelajaran;
}

export interface CpRow {
  id: string;
  no: string;
  elemen: string;
  capaianPembelajaran: string;
  sourceSheet: string;
}

export interface AtpRow {
  id: string;
  no: string;
  elemen: string;
  capaianPembelajaran?: string;
  tujuanPembelajaran: string;
  lingkupMateri: string;
  alokasiJp: number;
  alokasiLabel: string;
  pertemuanLabel?: string;
  semesterLabel?: string;
  rawColumns: Record<string, string>;
  sourceSheet: string;
}

export interface ProtaRow {
  id: string;
  atpId: string;
  no: string;
  elemen: string;
  tujuanPembelajaran: string;
  lingkupMateri: string;
  alokasiJp: number;
  distribusiPembelajaran: string;
}

export interface PromesRow {
  id: string;
  atpId: string;
  no: string;
  urutanPertemuan: string;
  elemen: string;
  tujuanPembelajaran: string;
  materiPembelajaran: string;
  alokasiJp: number;
  mingguPeriode: string; // Editable by teacher (not fabricated calendar)
}

export interface LearningMaterialItem {
  id: string;
  atpId: string;
  no: string;
  elemen: string;
  tujuanPembelajaran: string;
  lingkupMateri: string;
  penjelasanMateri: string;
  contohGerakan: string;
  aktivitasPraktik: string;
  manfaatPembelajaran: string;
  aturanKeselamatan: string;
  konteksNtt: string;
}

export interface ModulAjarItem {
  id: string;
  atpId: string;
  no: string;
  elemen: string;
  alokasiJp: number;
  identitasModul: string;
  kompetensiAwal: string;
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  profilKarakter: string;
  saranaPrasarana: string;
  karakteristikPesertaDidik: string;
  pendekatanMetode: string;
  pemahamanBermakna: string;
  pertanyaanPemantik: string;
  materiPembelajaran: string;
  langkahPembelajaran: string;
  kegiatanPendahuluan: string;
  kegiatanInti: string;
  kegiatanPenutup: string;
  asesmenDiagnostik: string;
  asesmenFormatif: string;
  asesmenSumatif: string;
  rubrikPenilaian: string;
  remedialPengayaan: string;
  refleksiGuru: string;
  refleksiPesertaDidik: string;
}

export interface AssessmentPackage {
  sikapKarakter: string;
  pengetahuan: string;
  keterampilanGerak: string;
  rubrikIndikator: Array<{
    aspek: string;
    skor4: string;
    skor3: string;
    skor2: string;
    skor1: string;
  }>;
  refleksiGuru: string;
  refleksiPesertaDidik: string;
}

export interface ClassCurriculumPackage {
  kelas: ClassGrade;
  fase: FasePembelajaran;
  identity: LearningIdentity;
  cpSourceSheet: string | null;
  atpSourceSheet: string | null;
  cpRows: CpRow[];
  atpRows: AtpRow[];
  protaRows: ProtaRow[];
  promesRows: PromesRow[];
  materials: LearningMaterialItem[];
  modulAjarList: ModulAjarItem[];
  assessmentPackage: AssessmentPackage;
  totalJpSemester1: number;
  updatedAt: string;
}

export interface CurriculumStoreState {
  sourceFileName: string | null;
  importedAt: string | null;
  detectedSheets: string[];
  classes: Record<ClassGrade, ClassCurriculumPackage>;
}

