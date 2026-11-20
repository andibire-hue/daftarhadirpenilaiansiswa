import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ClassAttendanceSession,
  ClassCurriculumPackage,
  ClassGrade,
  CurriculumStoreState,
  SchoolInfo,
  StudentGrade,
} from '../types';
import {
  loadClassAttendance,
  loadClassGrades,
  loadSchoolInfo,
  saveClassAttendance,
  saveClassGrades,
  saveSchoolInfo,
} from './storage';
import { loadCurriculumStore, saveCurriculumStore } from './curriculumStorage';
import { ALL_CURRICULUM_CLASSES } from './curriculumGenerator';

export const DEFAULT_WORKSPACE_ID = 'sdn_lokojuli_pjok_2026_2027';
const WORKSPACE_STORAGE_KEY = 'lokojuli_pjok_workspace_id';
const WORKSPACE_ID_REGEX = /^[a-zA-Z0-9_-]{6,128}$/;

const ALL_CLASSES: ClassGrade[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export function normalizeWorkspaceCode(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '_');
}

export function isValidWorkspaceCode(raw: string): boolean {
  return WORKSPACE_ID_REGEX.test(normalizeWorkspaceCode(raw));
}

export function getActiveWorkspaceId(): string {
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const syncParam = url.searchParams.get('sync');
      if (syncParam && isValidWorkspaceCode(syncParam)) {
        const clean = normalizeWorkspaceCode(syncParam);
        localStorage.setItem(WORKSPACE_STORAGE_KEY, clean);
        url.searchParams.delete('sync');
        window.history.replaceState({}, '', url.toString());
        return clean;
      }
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (saved && isValidWorkspaceCode(saved)) {
        return normalizeWorkspaceCode(saved);
      }
    } catch {
      // Fallback to default workspace ID if URL or localStorage fails
    }
  }
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, DEFAULT_WORKSPACE_ID);
  } catch {
    // Ignore storage error
  }
  return DEFAULT_WORKSPACE_ID;
}

export function setActiveWorkspaceId(rawCode: string): string {
  const clean = normalizeWorkspaceCode(rawCode);
  if (!WORKSPACE_ID_REGEX.test(clean)) {
    throw new Error(
      'Kode ruang kerja minimal 6 karakter dan hanya boleh huruf, angka, garis bawah (_), atau strip (-).'
    );
  }
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, clean);
  } catch {
    // Ignore storage error
  }
  return clean;
}

export function sanitizeDocId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  return cleaned || `doc_${Date.now()}`;
}

export function classToKey(kelas: ClassGrade): string {
  return kelas.toLowerCase().replace(/\s+/g, '_'); // e.g. 'kelas_1'
}

export function studentDocId(kelas: ClassGrade, localId: string): string {
  return sanitizeDocId(`${classToKey(kelas)}__${localId}`);
}

export function attendanceDocId(kelas: ClassGrade, date: string): string {
  return sanitizeDocId(`${classToKey(kelas)}__${date}`);
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    });
    return out as T;
  }
  return value;
}

function clampScore(val: number): number {
  const n = Number(val);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function buildSchoolPayload(workspaceId: string, info: SchoolInfo) {
  return {
    workspaceId,
    schoolName: (String(info.schoolName || '').trim() || 'UPTD SD NEGERI LOKOJULI').slice(0, 150),
    subject: (String(info.subject || '').trim() || 'PJOK').slice(0, 150),
    teacherName: (String(info.teacherName || '').trim() || 'Guru PJOK').slice(0, 150),
    teacherNip: String(info.teacherNip || '').slice(0, 60),
    principalName: String(info.principalName || '').slice(0, 150),
    principalNip: String(info.principalNip || '').slice(0, 60),
    academicYear: (String(info.academicYear || '').trim() || '2026/2027').slice(0, 40),
    semester: info.semester === 'Genap' ? 'Genap' : 'Ganjil',
    kktp: clampScore(info.kktp),
  };
}

function buildStudentPayload(workspaceId: string, kelas: ClassGrade, s: StudentGrade) {
  return {
    workspaceId,
    localId: sanitizeDocId(s.id),
    kelas,
    nis: String(s.nis || '').slice(0, 40),
    name: (String(s.name || '').trim() || 'Siswa').slice(0, 150),
    gender: s.gender === 'P' ? 'P' : 'L',
    dailyScore: clampScore(s.dailyScore),
    practicalScore: clampScore(s.practicalScore),
    midtermScore: clampScore(s.midtermScore),
    finalScore: clampScore(s.finalScore),
    finalReportScore: clampScore(s.finalReportScore),
    predicate: ['A', 'B', 'C', 'D'].includes(s.predicate) ? s.predicate : 'C',
    status: s.status === 'Remedial' ? 'Remedial' : 'Tuntas',
    notes: String(s.notes || '').slice(0, 500),
    heightCm: Math.max(0, Math.min(300, Number(s.heightCm) || 0)),
    weightKg: Math.max(0, Math.min(300, Number(s.weightKg) || 0)),
    favoriteSport: String(s.favoriteSport || '').slice(0, 100),
    isSelfRegistered: Boolean(s.isSelfRegistered),
    clientUpdatedAt: String(s.updatedAt || new Date().toISOString()).slice(0, 60),
  };
}

function buildAttendancePayload(
  workspaceId: string,
  kelas: ClassGrade,
  session: ClassAttendanceSession
) {
  const sanitizedRecords: Record<string, { status: string; note?: string }> = {};
  const entries = Object.entries(session.records || {}).slice(0, 100);
  entries.forEach(([k, v]) => {
    sanitizedRecords[sanitizeDocId(k)] = stripUndefined({
      status: v.status || 'H',
      ...(v.note ? { note: String(v.note).slice(0, 200) } : {}),
    });
  });

  return {
    workspaceId,
    kelas,
    date: (String(session.date || '').trim() || new Date().toISOString().slice(0, 10)).slice(0, 30),
    topic: String(session.topic || '').slice(0, 200),
    records: sanitizedRecords,
    clientUpdatedAt: String(session.updatedAt || new Date().toISOString()).slice(0, 60),
  };
}

function buildCurriculumMetaPayload(workspaceId: string, store: CurriculumStoreState) {
  return {
    workspaceId,
    sourceFileName: String(store.sourceFileName || '').slice(0, 200),
    importedAt: String(store.importedAt || '').slice(0, 60),
    detectedSheets: (store.detectedSheets || []).slice(0, 40).map((s) => String(s)),
  };
}

function buildCurriculumClassPayload(workspaceId: string, pkg: ClassCurriculumPackage) {
  return stripUndefined({
    workspaceId,
    kelas: pkg.kelas,
    fase: pkg.fase,
    identity: { ...pkg.identity },
    cpSourceSheet: String(pkg.cpSourceSheet || '').slice(0, 120),
    atpSourceSheet: String(pkg.atpSourceSheet || '').slice(0, 120),
    cpRows: (pkg.cpRows || []).slice(0, 30),
    atpRows: (pkg.atpRows || []).slice(0, 60),
    protaRows: (pkg.protaRows || []).slice(0, 60),
    promesRows: (pkg.promesRows || []).slice(0, 60),
    materials: (pkg.materials || []).slice(0, 60),
    modulAjarList: (pkg.modulAjarList || []).slice(0, 60),
    assessmentPackage: { ...pkg.assessmentPackage },
    totalJpSemester1: Math.max(0, Math.min(500, Number(pkg.totalJpSemester1) || 0)),
    packageUpdatedAt: String(pkg.updatedAt || new Date().toISOString()).slice(0, 60),
  });
}

export async function syncSchoolInfoToCloud(
  workspaceId: string,
  info: SchoolInfo,
  existsInCloud: boolean
): Promise<void> {
  const path = `workspaces/${workspaceId}/settings/schoolInfo`;
  const ref = doc(db, 'workspaces', workspaceId, 'settings', 'schoolInfo');
  const payload = buildSchoolPayload(workspaceId, info);
  try {
    if (existsInCloud) {
      const { workspaceId: _ignore, ...updatable } = payload;
      await updateDoc(ref, {
        ...updatable,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, existsInCloud ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function syncClassStudentsToCloud(
  workspaceId: string,
  kelas: ClassGrade,
  students: StudentGrade[],
  knownCloudIds: Set<string>
): Promise<void> {
  const prefix = `${classToKey(kelas)}__`;
  const targetDocIds = new Set(students.map((s) => studentDocId(kelas, s.id)));
  const path = `workspaces/${workspaceId}/students`;

  try {
    // Delete students removed from this class
    for (const existingId of Array.from(knownCloudIds)) {
      if (existingId.startsWith(prefix) && !targetDocIds.has(existingId)) {
        await deleteDoc(doc(db, 'workspaces', workspaceId, 'students', existingId));
        knownCloudIds.delete(existingId);
      }
    }

    // Batch creates/updates (max 400 per batch)
    for (let i = 0; i < students.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = students.slice(i, i + 400);
      chunk.forEach((student) => {
        const docId = studentDocId(kelas, student.id);
        const ref = doc(db, 'workspaces', workspaceId, 'students', docId);
        const payload = buildStudentPayload(workspaceId, kelas, student);
        if (knownCloudIds.has(docId)) {
          const { workspaceId: _ignore, ...updatable } = payload;
          batch.update(ref, {
            ...updatable,
            updatedAt: serverTimestamp(),
          });
        } else {
          batch.set(ref, {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          knownCloudIds.add(docId);
        }
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncClassAttendanceToCloud(
  workspaceId: string,
  kelas: ClassGrade,
  sessions: ClassAttendanceSession[],
  knownCloudIds: Set<string>
): Promise<void> {
  const prefix = `${classToKey(kelas)}__`;
  const targetDocIds = new Set(sessions.map((s) => attendanceDocId(kelas, s.date)));
  const path = `workspaces/${workspaceId}/attendanceSessions`;

  try {
    for (const existingId of Array.from(knownCloudIds)) {
      if (existingId.startsWith(prefix) && !targetDocIds.has(existingId)) {
        await deleteDoc(doc(db, 'workspaces', workspaceId, 'attendanceSessions', existingId));
        knownCloudIds.delete(existingId);
      }
    }

    for (const session of sessions) {
      const docId = attendanceDocId(kelas, session.date);
      const ref = doc(db, 'workspaces', workspaceId, 'attendanceSessions', docId);
      const payload = buildAttendancePayload(workspaceId, kelas, session);
      if (knownCloudIds.has(docId)) {
        const { workspaceId: _ignore, ...updatable } = payload;
        await updateDoc(ref, {
          ...updatable,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        knownCloudIds.add(docId);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncCurriculumStoreToCloud(
  workspaceId: string,
  store: CurriculumStoreState,
  knownClassKeys: Set<string>,
  hasMetaInCloud: boolean
): Promise<void> {
  const metaPath = `workspaces/${workspaceId}/curriculumMeta/active`;
  try {
    const metaRef = doc(db, 'workspaces', workspaceId, 'curriculumMeta', 'active');
    const metaPayload = buildCurriculumMetaPayload(workspaceId, store);
    if (hasMetaInCloud) {
      const { workspaceId: _ignore, ...updatable } = metaPayload;
      await updateDoc(metaRef, {
        ...updatable,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(metaRef, {
        ...metaPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      hasMetaInCloud ? OperationType.UPDATE : OperationType.CREATE,
      metaPath
    );
  }

  for (const cls of ALL_CURRICULUM_CLASSES) {
    const pkg = store.classes[cls];
    if (!pkg) continue;
    const key = classToKey(cls);
    const classPath = `workspaces/${workspaceId}/curriculumClasses/${key}`;
    try {
      const ref = doc(db, 'workspaces', workspaceId, 'curriculumClasses', key);
      const payload = buildCurriculumClassPayload(workspaceId, pkg);
      if (knownClassKeys.has(key)) {
        const { workspaceId: _ignore, ...updatable } = payload;
        await updateDoc(ref, {
          ...updatable,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        knownClassKeys.add(key);
      }
    } catch (error) {
      handleFirestoreError(
        error,
        knownClassKeys.has(key) ? OperationType.UPDATE : OperationType.CREATE,
        classPath
      );
    }
  }
}

export interface CloudSnapshotCallbacks {
  onSchoolInfo: (info: SchoolInfo) => void;
  onStudentsByClass: (byClass: Record<ClassGrade, StudentGrade[]>, cloudIds: Set<string>) => void;
  onAttendanceByClass: (
    byClass: Record<ClassGrade, ClassAttendanceSession[]>,
    cloudIds: Set<string>
  ) => void;
  onCurriculumStore: (
    store: CurriculumStoreState,
    cloudClassKeys: Set<string>,
    hasMeta: boolean
  ) => void;
  onMetaStatus: (hasSettings: boolean, hasMeta: boolean) => void;
}

/**
 * Push local device data to cloud ONLY for slices that are still empty in the active workspace,
 * ensuring zero data loss on first open while keeping cloud data authoritative across devices.
 */
export async function bootstrapCloudFromLocalIfEmpty(workspaceId: string): Promise<void> {
  const settingsQ = query(
    collection(db, 'workspaces', workspaceId, 'settings'),
    where('workspaceId', '==', workspaceId)
  );
  const studentsQ = query(
    collection(db, 'workspaces', workspaceId, 'students'),
    where('workspaceId', '==', workspaceId)
  );
  const attQ = query(
    collection(db, 'workspaces', workspaceId, 'attendanceSessions'),
    where('workspaceId', '==', workspaceId)
  );
  const currMetaQ = query(
    collection(db, 'workspaces', workspaceId, 'curriculumMeta'),
    where('workspaceId', '==', workspaceId)
  );
  const currClsQ = query(
    collection(db, 'workspaces', workspaceId, 'curriculumClasses'),
    where('workspaceId', '==', workspaceId)
  );

  let settingsSnap, studentsSnap, attSnap, currMetaSnap, currClsSnap;

  try {
    [settingsSnap, studentsSnap, attSnap, currMetaSnap, currClsSnap] = await Promise.all([
      getDocs(settingsQ),
      getDocs(studentsQ),
      getDocs(attQ),
      getDocs(currMetaQ),
      getDocs(currClsQ),
    ]);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `workspaces/${workspaceId}`);
  }

  // 1. Settings
  if (settingsSnap.empty) {
    const localInfo = loadSchoolInfo();
    await syncSchoolInfoToCloud(workspaceId, localInfo, false);
  }

  // 2. Students
  if (studentsSnap.empty) {
    const emptySet = new Set<string>();
    for (const cls of ALL_CLASSES) {
      const localStudents = loadClassGrades(cls);
      if (localStudents.length > 0) {
        await syncClassStudentsToCloud(workspaceId, cls, localStudents, emptySet);
      }
    }
  }

  // 3. Attendance
  if (attSnap.empty) {
    const emptySet = new Set<string>();
    for (const cls of ALL_CLASSES) {
      const localSessions = loadClassAttendance(cls);
      if (localSessions.length > 0) {
        await syncClassAttendanceToCloud(workspaceId, cls, localSessions, emptySet);
      }
    }
  }

  // 4. Curriculum
  if (currMetaSnap.empty && currClsSnap.empty) {
    const localCurr = loadCurriculumStore();
    await syncCurriculumStoreToCloud(workspaceId, localCurr, new Set<string>(), false);
  }
}

export function subscribeWorkspaceCloudData(
  workspaceId: string,
  callbacks: CloudSnapshotCallbacks
): () => void {
  const unsubscribes: Array<() => void> = [];

  let latestMeta: {
    sourceFileName: string | null;
    importedAt: string | null;
    detectedSheets: string[];
  } = {
    sourceFileName: null,
    importedAt: null,
    detectedSheets: [],
  };
  let hasMeta = false;
  let latestCurriculumClasses: Record<ClassGrade, ClassCurriculumPackage> =
    loadCurriculumStore().classes;
  const knownCurriculumKeys = new Set<string>();

  const emitCurriculum = () => {
    const nextStore: CurriculumStoreState = {
      sourceFileName: latestMeta.sourceFileName,
      importedAt: latestMeta.importedAt,
      detectedSheets: latestMeta.detectedSheets,
      classes: latestCurriculumClasses,
    };
    saveCurriculumStore(nextStore);
    callbacks.onCurriculumStore(nextStore, knownCurriculumKeys, hasMeta);
  };

  // 1. Settings listener
  const settingsQ = query(
    collection(db, 'workspaces', workspaceId, 'settings'),
    where('workspaceId', '==', workspaceId)
  );
  unsubscribes.push(
    onSnapshot(
      settingsQ,
      (snap) => {
        const hasSettings = !snap.empty;
        callbacks.onMetaStatus(hasSettings, hasMeta);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const info: SchoolInfo = {
            schoolName: String(data.schoolName || 'UPTD SD NEGERI LOKOJULI'),
            subject: String(data.subject || 'PJOK'),
            teacherName: String(data.teacherName || ''),
            teacherNip: String(data.teacherNip || ''),
            principalName: String(data.principalName || ''),
            principalNip: String(data.principalNip || ''),
            academicYear: String(data.academicYear || '2026/2027'),
            semester: data.semester === 'Genap' ? 'Genap' : 'Ganjil',
            kktp: Number(data.kktp) || 70,
          };
          saveSchoolInfo(info);
          callbacks.onSchoolInfo(info);
        }
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, `workspaces/${workspaceId}/settings`)
    )
  );

  // 2. Students listener
  const studentsQ = query(
    collection(db, 'workspaces', workspaceId, 'students'),
    where('workspaceId', '==', workspaceId)
  );
  unsubscribes.push(
    onSnapshot(
      studentsQ,
      (snap) => {
        const byClass: Record<ClassGrade, StudentGrade[]> = {
          'Kelas 1': [],
          'Kelas 2': [],
          'Kelas 3': [],
          'Kelas 4': [],
          'Kelas 5': [],
          'Kelas 6': [],
        };
        const cloudIds = new Set<string>();

        snap.docs.forEach((docSnap) => {
          cloudIds.add(docSnap.id);
          const d = docSnap.data();
          const cls = d.kelas as ClassGrade;
          if (!byClass[cls]) return;
          byClass[cls].push({
            id: String(d.localId || docSnap.id),
            nis: String(d.nis || ''),
            name: String(d.name || ''),
            gender: d.gender === 'P' ? 'P' : 'L',
            dailyScore: Number(d.dailyScore) || 0,
            practicalScore: Number(d.practicalScore) || 0,
            midtermScore: Number(d.midtermScore) || 0,
            finalScore: Number(d.finalScore) || 0,
            finalReportScore: Number(d.finalReportScore) || 0,
            predicate: (['A', 'B', 'C', 'D'].includes(d.predicate)
              ? d.predicate
              : 'C') as StudentGrade['predicate'],
            status: d.status === 'Remedial' ? 'Remedial' : 'Tuntas',
            notes: d.notes ? String(d.notes) : undefined,
            heightCm: Number(d.heightCm) > 0 ? Number(d.heightCm) : undefined,
            weightKg: Number(d.weightKg) > 0 ? Number(d.weightKg) : undefined,
            favoriteSport: d.favoriteSport ? String(d.favoriteSport) : undefined,
            isSelfRegistered: Boolean(d.isSelfRegistered),
            updatedAt: String(d.clientUpdatedAt || new Date().toISOString()),
          });
        });

        ALL_CLASSES.forEach((cls) => {
          byClass[cls].sort((a, b) => a.name.localeCompare(b.name, 'id'));
          saveClassGrades(cls, byClass[cls]);
        });
        callbacks.onStudentsByClass(byClass, cloudIds);
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, `workspaces/${workspaceId}/students`)
    )
  );

  // 3. Attendance listener
  const attQ = query(
    collection(db, 'workspaces', workspaceId, 'attendanceSessions'),
    where('workspaceId', '==', workspaceId)
  );
  unsubscribes.push(
    onSnapshot(
      attQ,
      (snap) => {
        const byClass: Record<ClassGrade, ClassAttendanceSession[]> = {
          'Kelas 1': [],
          'Kelas 2': [],
          'Kelas 3': [],
          'Kelas 4': [],
          'Kelas 5': [],
          'Kelas 6': [],
        };
        const cloudIds = new Set<string>();

        snap.docs.forEach((docSnap) => {
          cloudIds.add(docSnap.id);
          const d = docSnap.data();
          const cls = d.kelas as ClassGrade;
          if (!byClass[cls]) return;
          byClass[cls].push({
            date: String(d.date || ''),
            topic: String(d.topic || ''),
            records: (d.records || {}) as ClassAttendanceSession['records'],
            updatedAt: String(d.clientUpdatedAt || new Date().toISOString()),
          });
        });

        ALL_CLASSES.forEach((cls) => {
          byClass[cls].sort((a, b) => b.date.localeCompare(a.date));
          saveClassAttendance(cls, byClass[cls]);
        });
        callbacks.onAttendanceByClass(byClass, cloudIds);
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `workspaces/${workspaceId}/attendanceSessions`
        )
    )
  );

  // 4. Curriculum meta listener
  const currMetaQ = query(
    collection(db, 'workspaces', workspaceId, 'curriculumMeta'),
    where('workspaceId', '==', workspaceId)
  );
  unsubscribes.push(
    onSnapshot(
      currMetaQ,
      (snap) => {
        hasMeta = !snap.empty;
        if (!snap.empty) {
          const d = snap.docs[0].data();
          latestMeta = {
            sourceFileName: d.sourceFileName ? String(d.sourceFileName) : null,
            importedAt: d.importedAt ? String(d.importedAt) : null,
            detectedSheets: Array.isArray(d.detectedSheets) ? d.detectedSheets : [],
          };
          emitCurriculum();
        }
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `workspaces/${workspaceId}/curriculumMeta`
        )
    )
  );

  // 5. Curriculum classes listener
  const currClsQ = query(
    collection(db, 'workspaces', workspaceId, 'curriculumClasses'),
    where('workspaceId', '==', workspaceId)
  );
  unsubscribes.push(
    onSnapshot(
      currClsQ,
      (snap) => {
        if (!snap.empty) {
          const updatedClasses = { ...latestCurriculumClasses };
          knownCurriculumKeys.clear();
          snap.docs.forEach((docSnap) => {
            knownCurriculumKeys.add(docSnap.id);
            const d = docSnap.data();
            const cls = d.kelas as ClassGrade;
            if (!cls || !updatedClasses[cls]) return;
            updatedClasses[cls] = {
              kelas: cls,
              fase: d.fase,
              identity: d.identity,
              cpSourceSheet: d.cpSourceSheet ? String(d.cpSourceSheet) : null,
              atpSourceSheet: d.atpSourceSheet ? String(d.atpSourceSheet) : null,
              cpRows: Array.isArray(d.cpRows) ? d.cpRows : [],
              atpRows: Array.isArray(d.atpRows) ? d.atpRows : [],
              protaRows: Array.isArray(d.protaRows) ? d.protaRows : [],
              promesRows: Array.isArray(d.promesRows) ? d.promesRows : [],
              materials: Array.isArray(d.materials) ? d.materials : [],
              modulAjarList: Array.isArray(d.modulAjarList) ? d.modulAjarList : [],
              assessmentPackage: d.assessmentPackage,
              totalJpSemester1: Number(d.totalJpSemester1) || 0,
              updatedAt: String(d.packageUpdatedAt || new Date().toISOString()),
            };
          });
          latestCurriculumClasses = updatedClasses;
          emitCurriculum();
        }
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `workspaces/${workspaceId}/curriculumClasses`
        )
    )
  );

  return () => {
    unsubscribes.forEach((u) => u());
  };
}
