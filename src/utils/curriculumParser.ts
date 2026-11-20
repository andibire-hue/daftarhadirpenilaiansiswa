import * as XLSX from 'xlsx';
import { AtpRow, ClassCurriculumPackage, ClassGrade, CpRow, CurriculumStoreState } from '../types';
import { ALL_CURRICULUM_CLASSES, buildCurriculumPackageForClass } from './curriculumGenerator';

export interface CurriculumImportReport {
  fileName: string;
  totalSheetsInFile: number;
  detectedSheets: string[];
  skippedSheets: string[];
  perClassSummary: Array<{
    kelas: ClassGrade;
    cpSheet: string | null;
    cpCount: number;
    atpSheet: string | null;
    atpCount: number;
    totalJp: number;
  }>;
  missingItems: string[];
}

function parseClassFromText(text: string): ClassGrade | null {
  const clean = text.toUpperCase();
  for (let num = 1; num <= 6; num++) {
    const pattern = new RegExp(
      `(?:KELAS|KLS)\\s*(?:/\\s*FASE\\s*[ABC]|\\s*FASE\\s*[ABC])?\\s*[:/\\-]?\\s*(?:[ABC]\\s*/\\s*)?${num}\\b|FASE\\s*[ABC]\\s*[:/\\-]?\\s*${num}\\b|\\(${num}\\)`
    );
    if (pattern.test(clean)) {
      return `Kelas ${num}` as ClassGrade;
    }
  }
  return null;
}

function detectSheetRoleAndClass(
  sheetName: string,
  rows: unknown[][]
): { role: 'CP' | 'ATP' | 'SKIP'; kelas: ClassGrade | null } {
  const trimmed = sheetName.trim();
  const upper = trimmed.toUpperCase();

  // Strictly ignore non-CP/ATP sheets (attendance, grades, students, teacher admin, template guide)
  const forbiddenKeywords = [
    'ABSEN',
    'HADIR',
    'NILAI',
    'SISWA',
    'PESERTA',
    'GURU',
    'REKAP',
    'COVER',
    'IDENTITAS',
    'PETUNJUK',
    'PANDUAN',
  ];
  if (
    forbiddenKeywords.some((kw) => upper.includes(kw)) &&
    !(upper.includes('CP') && !upper.includes('PETUNJUK') && !upper.includes('PANDUAN')) &&
    !(upper.includes('ATP') && !upper.includes('PETUNJUK') && !upper.includes('PANDUAN'))
  ) {
    return { role: 'SKIP', kelas: null };
  }

  let role: 'CP' | 'ATP' | 'SKIP' = 'SKIP';
  if (
    /(?:^|[\s_\-])ATP(?:$|[\s_\-\(\d])/i.test(trimmed) ||
    upper.includes('ALUR TUJUAN')
  ) {
    role = 'ATP';
  } else if (
    /(?:^|[\s_\-])CP(?:$|[\s_\-\(\d])/i.test(trimmed) ||
    upper.includes('CAPAIAN')
  ) {
    role = 'CP';
  }

  // Detect from metadata & header rows if sheet name is generic (e.g. Sheet1 from single CSV/XLSX)
  const topText = rows
    .slice(0, 15)
    .map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '')).join(' ') : ''))
    .join('\n');
  const topUpper = topText.toUpperCase();

  if (role === 'SKIP') {
    // Check ATP indicators BEFORE CP because ATP template also includes a "Capaian Pembelajaran" column
    if (
      topUpper.includes('ALUR TUJUAN PEMBELAJARAN') ||
      topUpper.includes('TUJUAN PEMBELAJARAN')
    ) {
      role = 'ATP';
    } else if (topUpper.includes('CAPAIAN PEMBELAJARAN')) {
      role = 'CP';
    }
  }

  if (role === 'SKIP') {
    return { role: 'SKIP', kelas: null };
  }

  // Class detection from sheet name first:
  // Exact rule: no suffix => Kelas 1, (2) => Kelas 2, ..., (6) => Kelas 6
  let kelas: ClassGrade | null = null;
  const suffixMatch = trimmed.match(
    /\(([1-6])\)|(?:CP|ATP|KELAS|KLS)[\s_\-]*([1-6])\b|\b([1-6])\b/i
  );
  if (suffixMatch) {
    const num = Number(suffixMatch[1] || suffixMatch[2] || suffixMatch[3]);
    if (num >= 1 && num <= 6) {
      kelas = `Kelas ${num}` as ClassGrade;
    }
  } else if (/^(CP|ATP)$/i.test(trimmed)) {
    kelas = 'Kelas 1';
  }

  // Cross-check or fallback from sheet top metadata (e.g. "Fase / Kelas : C / 6")
  const metaKelas = parseClassFromText(topText);
  if (!kelas && metaKelas) {
    kelas = metaKelas;
  } else if (/^SHEET\d+$/i.test(trimmed) && metaKelas) {
    kelas = metaKelas;
  }

  if (!kelas && (/^CP$/i.test(trimmed) || /^ATP$/i.test(trimmed))) {
    kelas = 'Kelas 1';
  }

  return { role, kelas };
}

function parseJpNumber(raw: string): number {
  const s = String(raw || '').trim();
  if (!s) return 0;
  // Prefer explicit "<num> JP" first (e.g. "2x35 menit (4 JP)")
  const explicitJp = s.match(/(\d+(?:[.,]\d+)?)\s*(?:JP|JAM\s*PELAJARAN)/i);
  if (explicitJp) {
    const val = parseFloat(explicitJp[1].replace(',', '.'));
    return isNaN(val) ? 0 : val;
  }
  const numMatch = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!numMatch) return 0;
  const val = parseFloat(numMatch[1].replace(',', '.'));
  return isNaN(val) ? 0 : val;
}

function parseCpRowsFromSheet(sheetName: string, rows: unknown[][]): CpRow[] {
  let headerIdx = -1;
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const cells = r.map((c) => String(c ?? '').trim().toLowerCase()).filter(Boolean);
    if (cells.length < 2) continue;
    const hasElemen = cells.some((c) => c.includes('elemen') || c.includes('domain'));
    const hasCp = cells.some((c) => c.includes('capaian') || c === 'cp' || c.includes('uraian'));
    const hasNo = cells.some((c) => c === 'no' || c === 'no.' || c === 'nomor');
    if ((hasElemen && hasCp) || (hasNo && hasCp)) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const headers = rows[headerIdx].map((h) => String(h ?? '').trim().toLowerCase());
  const noIdx = headers.findIndex((h) => h === 'no' || h.startsWith('no'));
  const elemenIdx = headers.findIndex((h) => h.includes('elemen') || h.includes('domain'));
  const cpIdx = headers.findIndex((h) => h.includes('capaian') || h === 'cp' || h.includes('uraian'));

  if (cpIdx === -1 && elemenIdx === -1) return [];

  const result: CpRow[] = [];
  let lastElemen = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const rawNo = noIdx !== -1 ? String(r[noIdx] ?? '').trim() : '';
    const rawElemen = elemenIdx !== -1 ? String(r[elemenIdx] ?? '').trim() : '';
    const rawCp = cpIdx !== -1 ? String(r[cpIdx] ?? '').trim() : '';

    if (!rawElemen && !rawCp) continue;
    // Ignore signature/footer lines
    const combinedLower = `${rawElemen} ${rawCp}`.toLowerCase();
    if (combinedLower.includes('mengetahui') || combinedLower.includes('kepala sekolah')) {
      break;
    }

    const activeElemen = rawElemen || lastElemen;
    if (rawElemen) lastElemen = rawElemen;

    result.push({
      id: `cp_${sheetName}_${i}`,
      no: rawNo || String(result.length + 1),
      elemen: activeElemen || `Elemen ${result.length + 1}`,
      capaianPembelajaran: rawCp,
      sourceSheet: sheetName,
    });
  }

  return result;
}

function parseAtpRowsFromSheet(sheetName: string, rows: unknown[][]): AtpRow[] {
  let headerIdx = -1;
  for (let i = 0; i < Math.min(25, rows.length); i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const cells = r.map((c) => String(c ?? '').trim().toLowerCase()).filter(Boolean);
    if (cells.length < 2) continue;

    const hasTpCol = cells.some(
      (c) =>
        c === 'tp' ||
        c === 'tujuan pembelajaran' ||
        (c.includes('tujuan pembelajaran') && !c.includes('alur tujuan pembelajaran'))
    );
    const hasElemenCol = cells.some((c) => c.includes('elemen') || c.includes('domain'));
    const hasMateriCol = cells.some(
      (c) =>
        c.includes('lingkup materi') ||
        c.includes('materi') ||
        c.includes('topik') ||
        c.includes('pokok bahasan')
    );
    const hasJpCol = cells.some(
      (c) => c.includes('alokasi') || c === 'jp' || c.includes('waktu')
    );

    if (
      (hasTpCol && (hasElemenCol || hasMateriCol || hasJpCol)) ||
      (hasElemenCol && (hasMateriCol || hasJpCol))
    ) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const originalHeaders = rows[headerIdx].map((h) => String(h ?? '').trim());
  const lowerHeaders = originalHeaders.map((h) => h.toLowerCase());

  const noIdx = lowerHeaders.findIndex((h) => h === 'no' || h === 'no.' || h === 'nomor' || h === 'kode');
  const elemenIdx = lowerHeaders.findIndex((h) => h.includes('elemen') || h.includes('domain'));
  const cpIdx = lowerHeaders.findIndex(
    (h) => h.includes('capaian pembelajaran') || h.includes('capaian') || h === 'cp'
  );
  const tpIdx = lowerHeaders.findIndex(
    (h) => h.includes('tujuan pembelajaran') || h === 'tp' || h.includes('alur tujuan')
  );
  const materiIdx = lowerHeaders.findIndex(
    (h) =>
      h.includes('lingkup materi') ||
      h.includes('materi') ||
      h.includes('topik') ||
      h.includes('konten') ||
      h.includes('pokok bahasan')
  );
  const jpIdx = lowerHeaders.findIndex(
    (h) => h.includes('alokasi') || h === 'jp' || h.includes('waktu') || h.includes('jam')
  );
  const pertemuanIdx = lowerHeaders.findIndex((h) => h.includes('pertemuan'));
  const semesterIdx = lowerHeaders.findIndex((h) => h.includes('semester') || h === 'smt');

  if (tpIdx === -1 && materiIdx === -1) return [];

  const result: AtpRow[] = [];
  let lastElemen = '';
  let lastCp = '';
  let lastMateri = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;

    const rawNo = noIdx !== -1 ? String(r[noIdx] ?? '').trim() : '';
    const rawElemen = elemenIdx !== -1 ? String(r[elemenIdx] ?? '').trim() : '';
    const rawCp = cpIdx !== -1 ? String(r[cpIdx] ?? '').trim() : '';
    const rawTp = tpIdx !== -1 ? String(r[tpIdx] ?? '').trim() : '';
    const rawMateri = materiIdx !== -1 ? String(r[materiIdx] ?? '').trim() : '';
    const rawJp = jpIdx !== -1 ? String(r[jpIdx] ?? '').trim() : '';
    const rawPertemuan = pertemuanIdx !== -1 ? String(r[pertemuanIdx] ?? '').trim() : '';
    const rawSemester = semesterIdx !== -1 ? String(r[semesterIdx] ?? '').trim() : '';

    // Skip empty rows and summary/total/signature rows
    if (!rawTp && !rawMateri && !rawElemen && !rawCp) continue;
    const rowTextLower = `${rawNo} ${rawElemen} ${rawTp} ${rawMateri}`.toLowerCase();
    if (
      rowTextLower.includes('jumlah jp') ||
      rowTextLower.includes('total jp') ||
      rowTextLower.includes('total alokasi') ||
      rowTextLower.includes('mengetahui') ||
      rowTextLower.includes('kepala sekolah') ||
      rowTextLower.includes('lokojuli,') ||
      rowTextLower.startsWith('jumlah') ||
      rowTextLower.startsWith('total')
    ) {
      continue;
    }

    // Must have at least TP or Materi to be an instructional row
    if (!rawTp && !rawMateri) continue;

    const activeElemen = rawElemen || lastElemen;
    if (rawElemen) {
      if (rawElemen !== lastElemen && !rawCp) {
        lastCp = '';
      }
      lastElemen = rawElemen;
    }

    const activeCp = rawCp || lastCp;
    if (rawCp) lastCp = rawCp;

    const activeMateri = rawMateri || lastMateri;
    if (rawMateri) lastMateri = rawMateri;

    const rawColumns: Record<string, string> = {};
    originalHeaders.forEach((hdr, colIdx) => {
      if (hdr) {
        rawColumns[hdr] = String(r[colIdx] ?? '').trim();
      }
    });

    const parsedJp = parseJpNumber(rawJp);

    result.push({
      id: `atp_${sheetName}_${i}`,
      no: rawNo || String(result.length + 1),
      elemen: activeElemen || 'Terampil Bergerak',
      capaianPembelajaran: activeCp || undefined,
      tujuanPembelajaran: rawTp || activeMateri,
      lingkupMateri: activeMateri || rawTp,
      alokasiJp: parsedJp,
      alokasiLabel: rawJp || (parsedJp > 0 ? `${parsedJp} JP` : '-'),
      pertemuanLabel: rawPertemuan || undefined,
      semesterLabel: rawSemester || undefined,
      rawColumns,
      sourceSheet: sheetName,
    });
  }

  return result;
}

export async function parseCurriculumWorkbook(
  file: File,
  previousStore?: CurriculumStoreState,
  fallbackClass?: ClassGrade
): Promise<{ store: CurriculumStoreState; report: CurriculumImportReport }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

  const detectedSheets: string[] = [];
  const skippedSheets: string[] = [];

  const cpMap: Partial<Record<ClassGrade, { sheet: string; rows: CpRow[] }>> = {};
  const atpMap: Partial<Record<ClassGrade, { sheet: string; rows: AtpRow[] }>> = {};
  const isSingleSheet = workbook.SheetNames.length === 1;

  workbook.SheetNames.forEach((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: '',
    });

    const detected = detectSheetRoleAndClass(sheetName, rows);
    const role = detected.role;
    const kelas = detected.kelas || (isSingleSheet && role !== 'SKIP' ? fallbackClass || null : null);

    if (role === 'SKIP' || !kelas) {
      skippedSheets.push(sheetName);
      return;
    }

    if (role === 'CP') {
      const parsedCp = parseCpRowsFromSheet(sheetName, rows);
      if (parsedCp.length > 0) {
        cpMap[kelas] = { sheet: sheetName, rows: parsedCp };
        detectedSheets.push(`${sheetName} (${kelas} - CP)`);
      } else {
        skippedSheets.push(`${sheetName} (CP kosong/header tidak cocok)`);
      }
    } else if (role === 'ATP') {
      const parsedAtp = parseAtpRowsFromSheet(sheetName, rows);
      if (parsedAtp.length > 0) {
        atpMap[kelas] = { sheet: sheetName, rows: parsedAtp };
        detectedSheets.push(`${sheetName} (${kelas} - ATP)`);
      } else {
        skippedSheets.push(`${sheetName} (ATP kosong/header tidak cocok)`);
      }
    }
  });

  const classes = {} as Record<ClassGrade, ClassCurriculumPackage>;
  const perClassSummary: CurriculumImportReport['perClassSummary'] = [];
  const missingItems: string[] = [];

  ALL_CURRICULUM_CLASSES.forEach((cls) => {
    const prevPkg = previousStore?.classes[cls];
    const cpEntry = cpMap[cls];
    const atpEntry = atpMap[cls];

    const finalAtpRows = atpEntry ? atpEntry.rows : prevPkg?.atpRows || [];
    const finalAtpSheet = atpEntry ? atpEntry.sheet : prevPkg?.atpSourceSheet || null;

    let finalCpRows = cpEntry ? cpEntry.rows : prevPkg?.cpRows || [];
    let finalCpSheet = cpEntry ? cpEntry.sheet : prevPkg?.cpSourceSheet || null;

    // If CP sheet was left blank/absent (or previously derived from ATP), extract verbatim Capaian Pembelajaran from ATP rows
    if (
      !cpEntry &&
      atpEntry &&
      atpEntry.rows.some((a) => a.capaianPembelajaran) &&
      (finalCpRows.length === 0 || prevPkg?.cpSourceSheet?.endsWith('(Kolom CP)'))
    ) {
      const seen = new Set<string>();
      const derivedCp: CpRow[] = [];
      atpEntry.rows.forEach((a) => {
        const cpText = a.capaianPembelajaran?.trim();
        if (!cpText) return;
        const key = `${a.elemen.trim().toLowerCase()}||${cpText.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        derivedCp.push({
          id: `cp_from_atp_${cls}_${derivedCp.length + 1}`,
          no: String(derivedCp.length + 1),
          elemen: a.elemen,
          capaianPembelajaran: cpText,
          sourceSheet: finalAtpSheet ? `${finalAtpSheet} (Kolom CP)` : 'ATP',
        });
      });
      if (derivedCp.length > 0) {
        finalCpRows = derivedCp;
        finalCpSheet = finalAtpSheet ? `${finalAtpSheet} (Kolom CP)` : 'ATP';
      }
    } else if (finalCpRows.length === 0 && finalAtpRows.some((a) => a.capaianPembelajaran)) {
      const seen = new Set<string>();
      const derivedCp: CpRow[] = [];
      finalAtpRows.forEach((a) => {
        const cpText = a.capaianPembelajaran?.trim();
        if (!cpText) return;
        const key = `${a.elemen.trim().toLowerCase()}||${cpText.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        derivedCp.push({
          id: `cp_from_atp_${cls}_${derivedCp.length + 1}`,
          no: String(derivedCp.length + 1),
          elemen: a.elemen,
          capaianPembelajaran: cpText,
          sourceSheet: finalAtpSheet ? `${finalAtpSheet} (Kolom CP)` : 'ATP',
        });
      });
      if (derivedCp.length > 0) {
        finalCpRows = derivedCp;
        finalCpSheet = finalAtpSheet ? `${finalAtpSheet} (Kolom CP)` : 'ATP';
      }
    }

    if (finalCpRows.length === 0) {
      missingItems.push(`CP ${cls}`);
    }
    if (finalAtpRows.length === 0) {
      missingItems.push(`ATP ${cls}`);
    }

    const pkg = buildCurriculumPackageForClass(
      cls,
      finalCpRows,
      finalAtpRows,
      finalCpSheet,
      finalAtpSheet
    );

    classes[cls] = pkg;

    perClassSummary.push({
      kelas: cls,
      cpSheet: finalCpSheet,
      cpCount: finalCpRows.length,
      atpSheet: finalAtpSheet,
      atpCount: finalAtpRows.length,
      totalJp: pkg.totalJpSemester1,
    });
  });

  const store: CurriculumStoreState = {
    sourceFileName: file.name,
    importedAt: new Date().toISOString(),
    detectedSheets,
    classes,
  };

  const report: CurriculumImportReport = {
    fileName: file.name,
    totalSheetsInFile: workbook.SheetNames.length,
    detectedSheets,
    skippedSheets,
    perClassSummary,
    missingItems,
  };

  return { store, report };
}
