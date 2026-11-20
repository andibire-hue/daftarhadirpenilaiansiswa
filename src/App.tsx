import React, { useState, useEffect, useRef } from 'react';
import { Header, type CloudSyncStatus } from './components/Header';
import { ClassNavigation } from './components/ClassNavigation';
import { StatsCards } from './components/StatsCards';
import { ClassAnalyticsDashboard } from './components/ClassAnalyticsDashboard';
import { GradeForm } from './components/GradeForm';
import { GradeTable, GradeScoreField } from './components/GradeTable';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { SelfRegistrationModal } from './components/SelfRegistrationModal';
import { UploadClassDataModal } from './components/UploadClassDataModal';
import { AttendancePanel } from './components/AttendancePanel';
import { ConfirmModal } from './components/ConfirmModal';
import { PrintSheet } from './components/PrintSheet';
import { PrintAttendanceSheet } from './components/PrintAttendanceSheet';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { LearningToolsPanel } from './components/LearningToolsPanel';
import {
  StudentGrade,
  ClassGrade,
  SchoolInfo,
  ClassAttendanceSession,
  CurriculumStoreState,
} from './types';
import {
  loadClassGrades,
  saveClassGrades,
  loadSchoolInfo,
  saveSchoolInfo,
  initialSampleData,
  loadClassAttendance,
  saveClassAttendance,
} from './utils/storage';
import {
  loadCurriculumStore,
  saveCurriculumStore,
} from './utils/curriculumStorage';
import {
  bootstrapCloudFromLocalIfEmpty,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  subscribeWorkspaceCloudData,
  syncClassAttendanceToCloud,
  syncClassStudentsToCloud,
  syncCurriculumStoreToCloud,
  syncSchoolInfoToCloud,
} from './utils/cloudSync';
import {
  calculateFinalScore,
  calculatePredicate,
  calculateStatus,
} from './utils/gradeCalculations';
import {
  exportToExcel,
  exportToCsv,
  exportAttendanceToExcel,
} from './utils/exportExcel';
import { downloadStandaloneHtmlFile } from './utils/generateStandaloneHtml';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
} from 'lucide-react';

const ALL_CLASSES: ClassGrade[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export default function App() {
  const [currentClass, setCurrentClass] = useState<ClassGrade>('Kelas 1');
  const [activeSection, setActiveSection] = useState<
    'grades' | 'attendance' | 'curriculum'
  >('grades');
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<ClassAttendanceSession[]>([]);
  const [curriculumStore, setCurriculumStore] = useState<CurriculumStoreState>(
    () => loadCurriculumStore()
  );
  const [editingStudent, setEditingStudent] = useState<StudentGrade | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(loadSchoolInfo());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSelfRegOpen, setIsSelfRegOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [printPreviewMode, setPrintPreviewMode] = useState<'grades' | 'attendance' | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Ya, Hapus',
    variant: 'danger',
    onConfirm: () => {},
  });

  const [workspaceId, setWorkspaceId] = useState<string>(() => getActiveWorkspaceId());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('syncing');
  const currentClassRef = useRef<ClassGrade>(currentClass);
  const cloudStudentIdsRef = useRef<Set<string>>(new Set());
  const cloudSessionIdsRef = useRef<Set<string>>(new Set());
  const cloudCurriculumKeysRef = useRef<Set<string>>(new Set());
  const hasCloudSettingsRef = useRef<boolean>(false);
  const hasCloudCurriculumMetaRef = useRef<boolean>(false);

  useEffect(() => {
    currentClassRef.current = currentClass;
  }, [currentClass]);

  // Student counts cache for each class
  const [studentCounts, setStudentCounts] = useState<Record<ClassGrade, number>>({
    'Kelas 1': 0,
    'Kelas 2': 0,
    'Kelas 3': 0,
    'Kelas 4': 0,
    'Kelas 5': 0,
    'Kelas 6': 0,
  });

  // Load students and attendance for active class and compute counts
  useEffect(() => {
    const loaded = loadClassGrades(currentClass);
    const loadedAttendance = loadClassAttendance(currentClass);
    setStudents(loaded);
    setAttendanceSessions(loadedAttendance);
    refreshAllCounts();
  }, [currentClass]);

  const refreshAllCounts = () => {
    const counts: Record<ClassGrade, number> = {
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 3': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
      'Kelas 6': 0,
    };
    ALL_CLASSES.forEach((cls) => {
      const list = loadClassGrades(cls);
      counts[cls] = list.length;
    });
    setStudentCounts(counts);
  };

  // Automatic Zero-Login Cloud Sync (Komputer & HP)
  useEffect(() => {
    let unsubCloud: (() => void) | null = null;
    let isMounted = true;

    cloudStudentIdsRef.current = new Set();
    cloudSessionIdsRef.current = new Set();
    cloudCurriculumKeysRef.current = new Set();
    hasCloudSettingsRef.current = false;
    hasCloudCurriculumMetaRef.current = false;
    setCloudSyncStatus('syncing');

    const startSync = async () => {
      try {
        await bootstrapCloudFromLocalIfEmpty(workspaceId);
        if (!isMounted) return;

        unsubCloud = subscribeWorkspaceCloudData(workspaceId, {
          onSchoolInfo: (info) => {
            if (!isMounted) return;
            setSchoolInfo(info);
            setCloudSyncStatus('synced');
          },
          onStudentsByClass: (byClass, cloudIds) => {
            if (!isMounted) return;
            cloudStudentIdsRef.current = cloudIds;
            const activeCls = currentClassRef.current;
            setStudents(byClass[activeCls] || []);
            refreshAllCounts();
            setCloudSyncStatus('synced');
          },
          onAttendanceByClass: (byClass, cloudIds) => {
            if (!isMounted) return;
            cloudSessionIdsRef.current = cloudIds;
            const activeCls = currentClassRef.current;
            setAttendanceSessions(byClass[activeCls] || []);
            setCloudSyncStatus('synced');
          },
          onCurriculumStore: (nextStore, cloudKeys, hasMeta) => {
            if (!isMounted) return;
            cloudCurriculumKeysRef.current = cloudKeys;
            hasCloudCurriculumMetaRef.current = hasMeta;
            setCurriculumStore(nextStore);
            setCloudSyncStatus('synced');
          },
          onMetaStatus: (hasSettings, hasMeta) => {
            hasCloudSettingsRef.current = hasSettings;
            hasCloudCurriculumMetaRef.current = hasMeta;
          },
        });
      } catch (err) {
        console.error('Cloud sync bootstrap error:', err);
        if (isMounted) {
          setCloudSyncStatus('error');
          showToast(
            'Gagal menyinkronkan data ke cloud. Data lokal tetap aman tersimpan.',
            'error'
          );
        }
      }
    };

    void startSync();

    return () => {
      isMounted = false;
      if (unsubCloud) unsubCloud();
    };
  }, [workspaceId]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setNotification({ message: msg, type });
    toastTimerRef.current = window.setTimeout(() => {
      setNotification(null);
      toastTimerRef.current = null;
    }, 3500);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleChangeWorkspaceId = (
    newCode: string
  ): { ok: boolean; error?: string } => {
    try {
      const normalized = setActiveWorkspaceId(newCode);
      if (normalized === workspaceId) {
        return { ok: true };
      }
      setWorkspaceId(normalized);
      showToast(`Ruang data beralih ke "${normalized}". Menyinkronkan data...`);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Kode ruang data minimal 6 karakter (huruf, angka, _, -).',
      };
    }
  };

  const handleCopySyncLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('sync', workspaceId);
    const shareUrl = url.toString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          showToast(
            'Link sinkronisasi berhasil disalin! Buka link ini di HP/komputer lain tanpa login Google.'
          );
        })
        .catch(() => {
          showToast(`Gunakan kode ruang data "${workspaceId}" di perangkat lain.`, 'success');
        });
    } else {
      showToast(`Gunakan kode ruang data "${workspaceId}" di perangkat lain.`, 'success');
    }
  };

  const pushStudentsCloud = (cls: ClassGrade, list: StudentGrade[]) => {
    setCloudSyncStatus('syncing');
    syncClassStudentsToCloud(workspaceId, cls, list, cloudStudentIdsRef.current)
      .then(() => setCloudSyncStatus('synced'))
      .catch(() => setCloudSyncStatus('error'));
  };

  const pushAttendanceCloud = (cls: ClassGrade, sessions: ClassAttendanceSession[]) => {
    setCloudSyncStatus('syncing');
    syncClassAttendanceToCloud(workspaceId, cls, sessions, cloudSessionIdsRef.current)
      .then(() => setCloudSyncStatus('synced'))
      .catch(() => setCloudSyncStatus('error'));
  };

  const handleManualCloudSync = async () => {
    setCloudSyncStatus('syncing');
    try {
      await syncSchoolInfoToCloud(
        workspaceId,
        loadSchoolInfo(),
        hasCloudSettingsRef.current
      );
      hasCloudSettingsRef.current = true;
      for (const cls of ALL_CLASSES) {
        await syncClassStudentsToCloud(
          workspaceId,
          cls,
          loadClassGrades(cls),
          cloudStudentIdsRef.current
        );
        await syncClassAttendanceToCloud(
          workspaceId,
          cls,
          loadClassAttendance(cls),
          cloudSessionIdsRef.current
        );
      }
      await syncCurriculumStoreToCloud(
        workspaceId,
        curriculumStore,
        cloudCurriculumKeysRef.current,
        hasCloudCurriculumMetaRef.current
      );
      hasCloudCurriculumMetaRef.current = true;
      setCloudSyncStatus('synced');
      showToast('Seluruh data (Nilai, Absensi, Pengaturan & Perangkat Pembelajaran) tersinkron ke Cloud!');
    } catch {
      setCloudSyncStatus('error');
      showToast('Sebagian data gagal disinkronkan ke Cloud.', 'error');
    }
  };

  const handleSelectClass = (cls: ClassGrade) => {
    if (cls !== currentClass) {
      setCurrentClass(cls);
      setEditingStudent(null);
    }
  };

  // Add or Edit student (automatically updates existing student by ID or normalized Name without duplicate rows)
  const handleSaveStudent = (
    data: Omit<StudentGrade, 'id' | 'updatedAt'>,
    editId?: string
  ) => {
    const normalizedName = data.name.trim().toLowerCase();
    const matchedById = editId ? students.find((s) => s.id === editId) : undefined;
    const matchedByName = students.find(
      (s) => s.name.trim().toLowerCase() === normalizedName
    );
    const existingTarget = matchedById || matchedByName;

    let updatedList: StudentGrade[];

    if (existingTarget) {
      updatedList = students.map((s) =>
        s.id === existingTarget.id
          ? {
              ...s,
              ...data,
              nis: data.nis || s.nis,
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      showToast(
        `Nilai siswa "${data.name}" berhasil diperbarui (tanpa duplikasi nama).`
      );
    } else {
      const newStudent: StudentGrade = {
        ...data,
        id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        updatedAt: new Date().toISOString(),
      };
      updatedList = [newStudent, ...students];
      showToast(`Nilai siswa "${data.name}" berhasil disimpan ke ${currentClass}.`);
    }

    setStudents(updatedList);
    saveClassGrades(currentClass, updatedList);
    pushStudentsCloud(currentClass, updatedList);
    setEditingStudent(null);
    refreshAllCounts();
  };

  // Inline quick grade update directly from GradeTable
  const handleQuickUpdateGrade = (
    studentId: string,
    field: GradeScoreField,
    value: number
  ) => {
    const clamped = Math.min(100, Math.max(0, Number(value) || 0));
    const updatedList = students.map((s) => {
      if (s.id !== studentId) return s;
      const next = {
        ...s,
        [field]: clamped,
      };
      const finalReportScore = calculateFinalScore(
        next.dailyScore,
        next.practicalScore,
        next.midtermScore,
        next.finalScore
      );
      return {
        ...next,
        finalReportScore,
        predicate: calculatePredicate(finalReportScore),
        status: calculateStatus(finalReportScore, schoolInfo.kktp),
        updatedAt: new Date().toISOString(),
      };
    });

    setStudents(updatedList);
    saveClassGrades(currentClass, updatedList);
    pushStudentsCloud(currentClass, updatedList);
    setEditingStudent((curr) => {
      if (!curr || curr.id !== studentId) return curr;
      return updatedList.find((s) => s.id === studentId) || null;
    });
  };

  // Save student from self-registration portal
  const handleSaveSelfStudent = (
    targetClass: ClassGrade,
    data: Omit<StudentGrade, 'id' | 'updatedAt'>
  ) => {
    const existingList = loadClassGrades(targetClass);
    const normalizedName = data.name.trim().toLowerCase();
    // Prioritize exact name match (or matching NIS when name matches / self-reg)
    const existingIndex = existingList.findIndex(
      (s) =>
        s.name.trim().toLowerCase() === normalizedName ||
        (data.nis && s.nis && s.nis.trim().toLowerCase() === data.nis.trim().toLowerCase() && s.name.trim().toLowerCase() === normalizedName)
    );

    let updatedList: StudentGrade[];
    if (existingIndex >= 0) {
      const old = existingList[existingIndex];
      const updatedStudent: StudentGrade = {
        ...old,
        ...data,
        nis: data.nis || old.nis,
        updatedAt: new Date().toISOString(),
      };
      updatedList = [...existingList];
      updatedList[existingIndex] = updatedStudent;
      showToast(`Data siswa "${data.name}" di ${targetClass} berhasil diperbarui.`);
    } else {
      const newStudent: StudentGrade = {
        ...data,
        id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        updatedAt: new Date().toISOString(),
      };
      updatedList = [newStudent, ...existingList];
      showToast(`Data mandiri "${data.name}" berhasil ditambahkan ke ${targetClass}.`);
    }

    saveClassGrades(targetClass, updatedList);
    pushStudentsCloud(targetClass, updatedList);
    if (targetClass === currentClass) {
      setStudents(updatedList);
    } else {
      setCurrentClass(targetClass);
    }
    refreshAllCounts();
  };

  // Batch add/update students from text import (merges existing names instead of duplicating)
  const handleBatchAddStudents = (
    targetClass: ClassGrade,
    newStudentsData: Array<Omit<StudentGrade, 'id' | 'updatedAt'>>
  ) => {
    const existingList = [...loadClassGrades(targetClass)];
    let addedCount = 0;
    let updatedCount = 0;
    const toPrepend: StudentGrade[] = [];

    newStudentsData.forEach((data, idx) => {
      const normName = data.name.trim().toLowerCase();
      const existingIdx = existingList.findIndex(
        (s) => s.name.trim().toLowerCase() === normName
      );
      if (existingIdx >= 0) {
        existingList[existingIdx] = {
          ...existingList[existingIdx],
          ...data,
          nis: data.nis || existingList[existingIdx].nis,
          updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        toPrepend.push({
          ...data,
          id: `std_batch_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
          updatedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    const updatedList = [...toPrepend, ...existingList];
    saveClassGrades(targetClass, updatedList);
    pushStudentsCloud(targetClass, updatedList);
    if (targetClass === currentClass) {
      setStudents(updatedList);
    } else {
      setCurrentClass(targetClass);
    }
    refreshAllCounts();
    showToast(
      `Berhasil memproses ${newStudentsData.length} siswa di ${targetClass} (${addedCount} baru, ${updatedCount} diperbarui).`
    );
  };

  // Upload student data per class from Excel/CSV file
  const handleConfirmUpload = (
    targetClass: ClassGrade,
    uploadedStudents: StudentGrade[],
    mode: 'replace' | 'append'
  ) => {
    let finalList: StudentGrade[];
    if (mode === 'replace') {
      finalList = uploadedStudents;
    } else {
      const existingList = [...loadClassGrades(targetClass)];
      const toPrepend: StudentGrade[] = [];
      uploadedStudents.forEach((up) => {
        const normName = up.name.trim().toLowerCase();
        const existingIdx = existingList.findIndex(
          (s) => s.name.trim().toLowerCase() === normName
        );
        if (existingIdx >= 0) {
          existingList[existingIdx] = {
            ...existingList[existingIdx],
            ...up,
            id: existingList[existingIdx].id,
            updatedAt: new Date().toISOString(),
          };
        } else {
          toPrepend.push(up);
        }
      });
      finalList = [...toPrepend, ...existingList];
    }

    saveClassGrades(targetClass, finalList);
    pushStudentsCloud(targetClass, finalList);
    if (targetClass === currentClass) {
      setStudents(finalList);
    } else {
      setCurrentClass(targetClass);
    }
    refreshAllCounts();
    showToast(
      `Berhasil mengunggah ${uploadedStudents.length} siswa ke ${targetClass} (${
        mode === 'replace' ? 'Ganti Data' : 'Gabung Data'
      })!`
    );
  };

  // Delete student (using in-app ConfirmModal instead of blocked window.confirm)
  const handleDeleteStudent = (id: string, name: string) => {
    const targetClass = currentClass;
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Siswa',
      message: `Apakah Anda yakin ingin menghapus data nilai "${name}" dari ${targetClass}? Data yang dihapus tidak dapat dikembalikan.`,
      confirmLabel: 'Ya, Hapus Siswa',
      variant: 'danger',
      onConfirm: () => {
        const currentList = loadClassGrades(targetClass);
        const updatedList = currentList.filter((s) => s.id !== id);
        saveClassGrades(targetClass, updatedList);
        pushStudentsCloud(targetClass, updatedList);
        setStudents(updatedList);
        setEditingStudent((curr) => (curr?.id === id ? null : curr));

        // Clean deleted student's record from attendance sessions in this class
        const currentSessions = loadClassAttendance(targetClass);
        if (currentSessions.length > 0) {
          const cleanedSessions = currentSessions.map((ses) => {
            if (!(id in ses.records)) return ses;
            const nextRecords = { ...ses.records };
            delete nextRecords[id];
            return { ...ses, records: nextRecords };
          });
          saveClassAttendance(targetClass, cleanedSessions);
          pushAttendanceCloud(targetClass, cleanedSessions);
          setAttendanceSessions(cleanedSessions);
        }

        refreshAllCounts();
        closeConfirmDialog();
        showToast(`Data nilai "${name}" telah dihapus.`);
      },
    });
  };

  // Clear all students in active class
  const handleClearClassData = () => {
    const targetClass = currentClass;
    setConfirmDialog({
      isOpen: true,
      title: `Hapus Semua Data ${targetClass}`,
      message: `Semua data nilai siswa di ${targetClass} (${students.length} siswa) akan dihapus hingga kosong. Lanjutkan?`,
      confirmLabel: 'Ya, Hapus Semua',
      variant: 'danger',
      onConfirm: () => {
        saveClassGrades(targetClass, []);
        pushStudentsCloud(targetClass, []);
        setStudents([]);
        setEditingStudent(null);
        refreshAllCounts();
        closeConfirmDialog();
        showToast(`Seluruh data siswa di ${targetClass} telah dikosongkan.`);
      },
    });
  };

  // Reset class sample data
  const handleResetClassData = () => {
    const targetClass = currentClass;
    setConfirmDialog({
      isOpen: true,
      title: `Muat Ulang Data Contoh ${targetClass}`,
      message: `Muat ulang contoh data siswa SDN Lokojuli untuk ${targetClass}? Data saat ini di ${targetClass} akan diganti dengan data contoh.`,
      confirmLabel: 'Ya, Muat Ulang',
      variant: 'primary',
      onConfirm: () => {
        const sample = (initialSampleData[targetClass] || []).map((s) => ({
          ...s,
          status: calculateStatus(s.finalReportScore, schoolInfo.kktp),
        }));
        setStudents(sample);
        saveClassGrades(targetClass, sample);
        pushStudentsCloud(targetClass, sample);
        setEditingStudent(null);
        refreshAllCounts();
        closeConfirmDialog();
        showToast(`Data contoh ${targetClass} berhasil dimuat ulang.`);
      },
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (students.length === 0) {
      showToast('Tidak ada data siswa di kelas ini untuk diekspor.', 'error');
      return;
    }
    exportToExcel(currentClass, students, schoolInfo);
    showToast(`File Excel rekap nilai PJOK ${currentClass} berhasil diunduh.`);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (students.length === 0) {
      showToast('Tidak ada data siswa di kelas ini untuk diekspor.', 'error');
      return;
    }
    exportToCsv(currentClass, students, schoolInfo);
    showToast(`File CSV rekap nilai ${currentClass} berhasil diunduh.`);
  };

  // Download Standalone HTML
  const handleDownloadStandaloneHtml = () => {
    downloadStandaloneHtmlFile();
    showToast('File mandiri index.html berhasil diunduh! Siap dijalankan offline.');
  };

  // Save attendance sessions for active class
  const handleSaveAttendanceSessions = (updatedSessions: ClassAttendanceSession[]) => {
    setAttendanceSessions(updatedSessions);
    saveClassAttendance(currentClass, updatedSessions);
    pushAttendanceCloud(currentClass, updatedSessions);
  };

  // Request delete attendance session via ConfirmModal
  const handleRequestDeleteAttendanceSession = (dateToDelete: string, formattedDate: string) => {
    const targetClass = currentClass;
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Pertemuan Absensi',
      message: `Hapus data absensi pertemuan tanggal ${formattedDate} untuk ${targetClass}?`,
      confirmLabel: 'Ya, Hapus Pertemuan',
      variant: 'danger',
      onConfirm: () => {
        const currentSessions = loadClassAttendance(targetClass);
        const next = currentSessions.filter((s) => s.date !== dateToDelete);
        saveClassAttendance(targetClass, next);
        pushAttendanceCloud(targetClass, next);
        setAttendanceSessions(next);
        closeConfirmDialog();
        showToast(`Data absensi tanggal ${formattedDate} telah dihapus.`);
      },
    });
  };

  // Export attendance to Excel
  const handleExportAttendanceExcel = () => {
    if (students.length === 0) {
      showToast('Belum ada data siswa di kelas ini untuk diekspor!', 'error');
      return;
    }
    exportAttendanceToExcel(currentClass, students, attendanceSessions, schoolInfo);
    showToast(`File Excel Daftar Hadir ${currentClass} berhasil diunduh.`);
  };

  // Save school configuration & recalculate student statuses across all classes for new KKTP
  const handleSaveSettings = (newInfo: SchoolInfo) => {
    setSchoolInfo(newInfo);
    saveSchoolInfo(newInfo);
    setCloudSyncStatus('syncing');
    syncSchoolInfoToCloud(workspaceId, newInfo, hasCloudSettingsRef.current)
      .then(() => {
        hasCloudSettingsRef.current = true;
        setCloudSyncStatus('synced');
      })
      .catch(() => setCloudSyncStatus('error'));

    ALL_CLASSES.forEach((cls) => {
      const list = loadClassGrades(cls);
      const updated = list.map((s) => ({
        ...s,
        status: calculateStatus(s.finalReportScore, newInfo.kktp),
      }));
      saveClassGrades(cls, updated);
      pushStudentsCloud(cls, updated);
      if (cls === currentClass) {
        setStudents(updated);
      }
    });

    showToast('Pengaturan sekolah dan standar KKTP berhasil disimpan.');
  };

  const handleUpdateCurriculumStore = (nextStore: CurriculumStoreState) => {
    setCurriculumStore(nextStore);
    saveCurriculumStore(nextStore);
    setCloudSyncStatus('syncing');
    syncCurriculumStoreToCloud(
      workspaceId,
      nextStore,
      cloudCurriculumKeysRef.current,
      hasCloudCurriculumMetaRef.current
    )
      .then(() => {
        hasCloudCurriculumMetaRef.current = true;
        setCloudSyncStatus('synced');
      })
      .catch(() => setCloudSyncStatus('error'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-5">
        <div className="no-print">
          {/* Header */}
          <Header
            schoolInfo={schoolInfo}
            workspaceId={workspaceId}
            cloudSyncStatus={cloudSyncStatus}
            onManualCloudSync={handleManualCloudSync}
            onChangeWorkspaceId={handleChangeWorkspaceId}
            onCopySyncLink={handleCopySyncLink}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onDownloadStandalone={handleDownloadStandaloneHtml}
            onOpenSelfRegistration={() => setIsSelfRegOpen(true)}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onPrint={() =>
              setPrintPreviewMode(
                activeSection === 'attendance' ? 'attendance' : 'grades'
              )
            }
          />

          {/* Toast Notification */}
          {notification && (
            <div
              className={`fixed bottom-5 right-5 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold border animate-in fade-in slide-in-from-bottom-3 duration-200 no-print ${
                notification.type === 'error'
                  ? 'bg-red-950 text-white border-red-800'
                  : 'bg-slate-900 text-white border-slate-700'
              }`}
            >
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Class Navigation Tabs */}
          <ClassNavigation
            currentClass={currentClass}
            onSelectClass={handleSelectClass}
            studentCounts={studentCounts}
          />

        {/* Workspace Mode Switcher: Nilai vs Absensi vs Perangkat Pembelajaran */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 no-print">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-xs self-start">
            <button
              type="button"
              onClick={() => setActiveSection('grades')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'grades'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Nilai &amp; Statistik Kelas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('attendance')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'attendance'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Daftar Hadir / Absensi</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                  activeSection === 'attendance'
                    ? 'bg-blue-700/80 text-blue-100'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {attendanceSessions.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('curriculum')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'curriculum'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Perangkat Pembelajaran</span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                  activeSection === 'curriculum'
                    ? 'bg-blue-700/80 text-blue-100'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {curriculumStore.classes[currentClass]?.atpRows.length || 0} ATP
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Kelas Aktif: <b className="text-slate-800">{currentClass}</b> ·{' '}
            {students.length} siswa terdaftar
          </div>
        </div>

        {activeSection === 'grades' ? (
          <>
            {/* Class Statistics Overview */}
            <StatsCards students={students} kktp={schoolInfo.kktp} />

            {/* Interactive Class Analytics Dashboard (Recharts) */}
            <ClassAnalyticsDashboard
              currentClass={currentClass}
              students={students}
              kktp={schoolInfo.kktp}
            />

            {/* Main 2-Column Work Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Form: Input Nilai Siswa */}
              <div className="lg:col-span-4 lg:sticky lg:top-5">
                <GradeForm
                  currentClass={currentClass}
                  students={students}
                  editingStudent={editingStudent}
                  kktp={schoolInfo.kktp}
                  onSaveStudent={handleSaveStudent}
                  onSelectExistingStudent={(s) => setEditingStudent(s)}
                  onCancelEdit={() => setEditingStudent(null)}
                />
              </div>

              {/* Right Table: Rekapitulasi Data Siswa */}
              <div className="lg:col-span-8">
                <GradeTable
                  currentClass={currentClass}
                  students={students}
                  schoolInfo={schoolInfo}
                  onEditStudent={(s) => setEditingStudent(s)}
                  onDeleteStudent={handleDeleteStudent}
                  onQuickUpdateGrade={handleQuickUpdateGrade}
                  onExportExcel={handleExportExcel}
                  onExportCsv={handleExportCsv}
                  onPrint={() => setPrintPreviewMode('grades')}
                  onResetClassData={handleResetClassData}
                  onClearClassData={handleClearClassData}
                  onOpenSelfRegistration={() => setIsSelfRegOpen(true)}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                />
              </div>
            </div>
          </>
        ) : activeSection === 'attendance' ? (
          <AttendancePanel
            currentClass={currentClass}
            students={students}
            sessions={attendanceSessions}
            schoolInfo={schoolInfo}
            onSaveSessions={handleSaveAttendanceSessions}
            onRequestDeleteSession={handleRequestDeleteAttendanceSession}
            onExportAttendanceExcel={handleExportAttendanceExcel}
            onPrintAttendance={() => setPrintPreviewMode('attendance')}
            onNotify={showToast}
          />
        ) : (
          <LearningToolsPanel
            currentClass={currentClass}
            onSelectClass={handleSelectClass}
            store={curriculumStore}
            schoolInfo={schoolInfo}
            onUpdateStore={handleUpdateCurriculumStore}
            onNotify={showToast}
          />
        )}
        </div>

        {/* Print Sheet View (Hidden on screen, rendered on paper/PDF print) */}
        {(printPreviewMode || activeSection) === 'attendance' ? (
          <PrintAttendanceSheet
            currentClass={currentClass}
            students={students}
            sessions={attendanceSessions}
            schoolInfo={schoolInfo}
          />
        ) : (
          <PrintSheet
            currentClass={currentClass}
            students={students}
            schoolInfo={schoolInfo}
          />
        )}

        {/* School Settings Modal */}
        <SchoolSettingsModal
          isOpen={isSettingsOpen}
          schoolInfo={schoolInfo}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />

        {/* Self Registration Modal (Mode Siswa Mandiri & Input Massal) */}
        <SelfRegistrationModal
          isOpen={isSelfRegOpen}
          defaultClass={currentClass}
          schoolInfo={schoolInfo}
          onClose={() => setIsSelfRegOpen(false)}
          onSaveSelfStudent={handleSaveSelfStudent}
          onBatchAddStudents={handleBatchAddStudents}
        />

        {/* Upload Data Siswa Perkelas Modal */}
        <UploadClassDataModal
          isOpen={isUploadModalOpen}
          defaultClass={currentClass}
          schoolInfo={schoolInfo}
          onClose={() => setIsUploadModalOpen(false)}
          onConfirmUpload={handleConfirmUpload}
        />

        {/* In-App Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirmDialog}
        />

        {/* Print Preview Modal */}
        <PrintPreviewModal
          isOpen={printPreviewMode !== null}
          mode={
            printPreviewMode ||
            (activeSection === 'attendance' ? 'attendance' : 'grades')
          }
          currentClass={currentClass}
          students={students}
          sessions={attendanceSessions}
          schoolInfo={schoolInfo}
          onClose={() => setPrintPreviewMode(null)}
          onNotify={showToast}
        />
      </div>
    </div>
  );
}
