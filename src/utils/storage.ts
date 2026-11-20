import { StudentGrade, ClassGrade, SchoolInfo, ClassAttendanceSession } from '../types';
import { calculateFinalScore, calculatePredicate, calculateStatus } from './gradeCalculations';

const STORAGE_KEY_PREFIX = 'lokojuli_pjok_grades_';
const ATTENDANCE_KEY_PREFIX = 'lokojuli_pjok_attendance_';
const SCHOOL_INFO_KEY = 'lokojuli_pjok_school_info';

export const defaultSchoolInfo: SchoolInfo = {
  schoolName: 'UPTD SD NEGERI LOKOJULI',
  subject: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  teacherName: 'Guru PJOK, S.Pd.',
  teacherNip: '19880512 201101 1 008',
  principalName: 'Kepala Sekolah, S.Pd., M.M.',
  principalNip: '19750820 199903 1 004',
  academicYear: '2024/2025',
  semester: 'Ganjil',
  kktp: 70,
};

// Realistic initial sample student records for SD Negeri Lokojuli
export const initialSampleData: Record<ClassGrade, StudentGrade[]> = {
  'Kelas 1': [
    createInitialStudent('101', 'Aditia Pratama', 'L', 84, 86, 80, 85),
    createInitialStudent('102', 'Bella Safitri', 'P', 88, 90, 85, 89),
    createInitialStudent('103', 'Christian Dapa', 'L', 76, 78, 72, 75),
    createInitialStudent('104', 'Delsi Kalumbang', 'P', 90, 92, 88, 91),
    createInitialStudent('105', 'Efraim Bili', 'L', 68, 70, 65, 68),
  ],
  'Kelas 2': [
    createInitialStudent('201', 'Farel Ronaldo', 'L', 85, 88, 82, 86),
    createInitialStudent('202', 'Grace Natalia', 'P', 92, 90, 89, 93),
    createInitialStudent('203', 'Hendrikus Lado', 'L', 78, 80, 75, 78),
    createInitialStudent('204', 'Intan Permata', 'P', 82, 84, 80, 82),
  ],
  'Kelas 3': [
    createInitialStudent('301', 'Johan Maramba', 'L', 80, 85, 82, 84),
    createInitialStudent('302', 'Kezia Rambu', 'P', 88, 89, 86, 90),
    createInitialStudent('303', 'Leonel Umbu', 'L', 74, 76, 70, 73),
    createInitialStudent('304', 'Maria Fatima', 'P', 86, 88, 85, 87),
    createInitialStudent('305', 'Novrianto Bire', 'L', 90, 95, 88, 92),
  ],
  'Kelas 4': [
    createInitialStudent('401', 'Oktovianus Dida', 'L', 82, 85, 80, 84),
    createInitialStudent('402', 'Priskila Lodo', 'P', 88, 90, 86, 89),
    createInitialStudent('403', 'Rivaldo Kaka', 'L', 85, 88, 84, 86),
    createInitialStudent('404', 'Sindi Claudia', 'P', 78, 80, 75, 77),
  ],
  'Kelas 5': [
    createInitialStudent('501', 'Tomi Robinson', 'L', 86, 92, 85, 88),
    createInitialStudent('502', 'Ulfa Damayanti', 'P', 90, 90, 88, 92),
    createInitialStudent('503', 'Valen Umbu Deta', 'L', 80, 84, 78, 82),
    createInitialStudent('504', 'Widya Astuti', 'P', 84, 86, 82, 85),
    createInitialStudent('505', 'Yanto Malo', 'L', 65, 68, 62, 66),
  ],
  'Kelas 6': [
    createInitialStudent('601', 'Aldo Fernandez', 'L', 88, 94, 90, 92),
    createInitialStudent('602', 'Bertha Rambu Ana', 'P', 92, 95, 91, 94),
    createInitialStudent('603', 'Candra Wijaya', 'L', 84, 88, 82, 85),
    createInitialStudent('604', 'Dina Mariana', 'P', 80, 82, 78, 80),
    createInitialStudent('605', 'Emanuel Golu', 'L', 86, 90, 85, 88),
  ],
};

function createInitialStudent(
  nis: string,
  name: string,
  gender: 'L' | 'P',
  daily: number,
  practical: number,
  midterm: number,
  final: number
): StudentGrade {
  const finalReportScore = calculateFinalScore(daily, practical, midterm, final);
  const predicate = calculatePredicate(finalReportScore);
  const status = calculateStatus(finalReportScore, 70);

  return {
    id: `std_${nis}_${Date.now()}`,
    nis,
    name,
    gender,
    dailyScore: daily,
    practicalScore: practical,
    midtermScore: midterm,
    finalScore: final,
    finalReportScore,
    predicate,
    status,
    notes: 'Aktif dalam pembelajaran PJOK',
    updatedAt: new Date().toISOString(),
  };
}

export function loadClassGrades(classGrade: ClassGrade): StudentGrade[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${classGrade}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading localStorage:', err);
  }

  // Fallback to initial sample data
  const initial = initialSampleData[classGrade] || [];
  saveClassGrades(classGrade, initial);
  return initial;
}

export function saveClassGrades(classGrade: ClassGrade, data: StudentGrade[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${classGrade}`, JSON.stringify(data));
  } catch (err) {
    console.error('Error writing to localStorage:', err);
  }
}

export function loadSchoolInfo(): SchoolInfo {
  try {
    const raw = localStorage.getItem(SCHOOL_INFO_KEY);
    if (raw) {
      return { ...defaultSchoolInfo, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading school info:', err);
  }
  return defaultSchoolInfo;
}

export function saveSchoolInfo(info: SchoolInfo): void {
  try {
    localStorage.setItem(SCHOOL_INFO_KEY, JSON.stringify(info));
  } catch (err) {
    console.error('Error writing school info:', err);
  }
}

export function loadClassAttendance(classGrade: ClassGrade): ClassAttendanceSession[] {
  try {
    const raw = localStorage.getItem(`${ATTENDANCE_KEY_PREFIX}${classGrade}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading attendance from localStorage:', err);
  }
  return [];
}

export function saveClassAttendance(
  classGrade: ClassGrade,
  sessions: ClassAttendanceSession[]
): void {
  try {
    localStorage.setItem(`${ATTENDANCE_KEY_PREFIX}${classGrade}`, JSON.stringify(sessions));
  } catch (err) {
    console.error('Error writing attendance to localStorage:', err);
  }
}
