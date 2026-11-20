import { CurriculumStoreState } from '../types';
import {
  ALL_CURRICULUM_CLASSES,
  ATTACHED_KELAS_6_CP_ROWS,
  buildCurriculumPackageForClass,
  createInitialCurriculumStore,
} from './curriculumGenerator';

const CURRICULUM_STORAGE_KEY = 'lokojuli_pjok_perangkat_v1';

export function loadCurriculumStore(): CurriculumStoreState {
  try {
    const raw = localStorage.getItem(CURRICULUM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CurriculumStoreState;
      if (parsed && parsed.classes) {
        // Ensure all 6 classes exist and Kelas 6 CP fallback is present if empty
        const classes = { ...parsed.classes };
        ALL_CURRICULUM_CLASSES.forEach((cls) => {
          if (!classes[cls]) {
            const initCp = cls === 'Kelas 6' ? ATTACHED_KELAS_6_CP_ROWS : [];
            const cpSheet =
              cls === 'Kelas 6' ? 'Lampiran CSV (CP Kelas 6 / Fase C)' : null;
            classes[cls] = buildCurriculumPackageForClass(cls, initCp, [], cpSheet, null);
          }
        });
        return {
          ...parsed,
          classes,
        };
      }
    }
  } catch (err) {
    console.error('Error loading curriculum store:', err);
  }

  const initial = createInitialCurriculumStore();
  saveCurriculumStore(initial);
  return initial;
}

export function saveCurriculumStore(store: CurriculumStoreState): void {
  try {
    localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Error saving curriculum store:', err);
  }
}
