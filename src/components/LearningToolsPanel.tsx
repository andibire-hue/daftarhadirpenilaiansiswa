import React, { useState, useRef, useMemo } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Printer,
  Download,
  Lock,
  Edit3,
  Check,
  AlertTriangle,
  Layers,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  Award,
  Search,
  RotateCcw,
  Link2,
  X,
  FileCheck,
  FileSpreadsheet,
  HelpCircle,
} from 'lucide-react';
import {
  ClassCurriculumPackage,
  ClassGrade,
  CurriculumStoreState,
  LearningMaterialItem,
  ModulAjarItem,
  SchoolInfo,
} from '../types';
import {
  ALL_CURRICULUM_CLASSES,
  buildCurriculumPackageForClass,
} from '../utils/curriculumGenerator';
import {
  CurriculumImportReport,
  parseCurriculumWorkbook,
} from '../utils/curriculumParser';
import {
  buildCurriculumDocumentHtml,
  CurriculumExportScope,
  downloadCurriculumPrintableHtml,
  downloadCurriculumWordDoc,
} from '../utils/curriculumExport';
import { downloadCurriculumTemplateExcel } from '../utils/curriculumTemplate';

interface LearningToolsPanelProps {
  currentClass: ClassGrade;
  onSelectClass: (cls: ClassGrade) => void;
  store: CurriculumStoreState;
  schoolInfo: SchoolInfo;
  onUpdateStore: (nextStore: CurriculumStoreState) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

type SubTab =
  | 'all'
  | 'cp'
  | 'atp'
  | 'prota'
  | 'promes'
  | 'materi'
  | 'modul'
  | 'asesmen';

export const LearningToolsPanel: React.FC<LearningToolsPanelProps> = ({
  currentClass,
  onSelectClass,
  store,
  schoolInfo,
  onUpdateStore,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [importReport, setImportReport] = useState<CurriculumImportReport | null>(
    null
  );
  const [selectedModulId, setSelectedModulId] = useState<string | null>(null);
  const [editingMateriId, setEditingMateriId] = useState<string | null>(null);
  const [editingModulId, setEditingModulId] = useState<string | null>(null);
  const [isEditingProta, setIsEditingProta] = useState(false);
  const [isEditingPromes, setIsEditingPromes] = useState(false);
  const [isEditingAsesmen, setIsEditingAsesmen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printBlockedHint, setPrintBlockedHint] = useState(false);
  const [showTemplateGuide, setShowTemplateGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  const pkg: ClassCurriculumPackage = store.classes[currentClass];

  const activeModul: ModulAjarItem | null = useMemo(() => {
    if (pkg.modulAjarList.length === 0) return null;
    if (selectedModulId) {
      const found = pkg.modulAjarList.find((m) => m.id === selectedModulId);
      if (found) return found;
    }
    return pkg.modulAjarList[0];
  }, [pkg.modulAjarList, selectedModulId]);

  const updateClassPackage = (
    updater: (prev: ClassCurriculumPackage) => ClassCurriculumPackage
  ) => {
    const updatedPkg = {
      ...updater(pkg),
      updatedAt: new Date().toISOString(),
    };
    const nextStore: CurriculumStoreState = {
      ...store,
      classes: {
        ...store.classes,
        [currentClass]: updatedPkg,
      },
    };
    onUpdateStore(nextStore);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { store: parsedStore, report } = await parseCurriculumWorkbook(
        file,
        store,
        currentClass
      );
      onUpdateStore(parsedStore);
      setImportReport(report);
      setSelectedModulId(null);
      setEditingMateriId(null);
      setEditingModulId(null);
      if (report.detectedSheets.length === 0) {
        onNotify(
          `File "${file.name}" terbaca, tetapi belum ada baris CP/ATP yang terisi.`,
          'error'
        );
      } else {
        onNotify(
          `Berhasil membaca ${report.detectedSheets.length} sheet CP/ATP dari "${file.name}".`
        );
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal membaca file Excel/CSV perangkat pembelajaran.';
      onNotify(msg, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetClassDevelopment = () => {
    const regenerated = buildCurriculumPackageForClass(
      currentClass,
      pkg.cpRows,
      pkg.atpRows,
      pkg.cpSourceSheet,
      pkg.atpSourceSheet
    );
    updateClassPackage(() => regenerated);
    setEditingMateriId(null);
    setEditingModulId(null);
    setIsEditingProta(false);
    setIsEditingPromes(false);
    setIsEditingAsesmen(false);
    onNotify(
      `Hasil pengembangan ${currentClass} disusun ulang dari CP & ATP asli.`
    );
  };

  const jumpToLinkedItem = (atpId: string, target: 'materi' | 'modul') => {
    setSubTab(target);
    if (target === 'modul') {
      const mod = pkg.modulAjarList.find((m) => m.atpId === atpId);
      if (mod) setSelectedModulId(mod.id);
    }
  };

  const filteredProta = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pkg.protaRows;
    return pkg.protaRows.filter(
      (r) =>
        r.elemen.toLowerCase().includes(q) ||
        r.tujuanPembelajaran.toLowerCase().includes(q) ||
        r.lingkupMateri.toLowerCase().includes(q)
    );
  }, [pkg.protaRows, searchQuery]);

  const filteredPromes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pkg.promesRows;
    return pkg.promesRows.filter(
      (r) =>
        r.elemen.toLowerCase().includes(q) ||
        r.tujuanPembelajaran.toLowerCase().includes(q) ||
        r.materiPembelajaran.toLowerCase().includes(q) ||
        r.urutanPertemuan.toLowerCase().includes(q)
    );
  }, [pkg.promesRows, searchQuery]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return pkg.materials;
    return pkg.materials.filter(
      (m) =>
        m.elemen.toLowerCase().includes(q) ||
        m.tujuanPembelajaran.toLowerCase().includes(q) ||
        m.lingkupMateri.toLowerCase().includes(q)
    );
  }, [pkg.materials, searchQuery]);

  const exportScope: CurriculumExportScope = subTab;

  const handlePrintFromModal = () => {
    const iframeWin = printIframeRef.current?.contentWindow;
    if (!iframeWin) {
      setPrintBlockedHint(true);
      return;
    }

    let fired = false;
    const onBefore = () => {
      fired = true;
      setPrintBlockedHint(false);
    };

    try {
      iframeWin.addEventListener('beforeprint', onBefore, { once: true });
    } catch {
      // Ignore cross-frame listener restrictions
    }
    window.addEventListener('beforeprint', onBefore, { once: true });

    try {
      iframeWin.focus();
      iframeWin.print();
    } catch {
      setPrintBlockedHint(true);
    }

    window.setTimeout(() => {
      try {
        iframeWin.removeEventListener('beforeprint', onBefore);
      } catch {
        // Ignore
      }
      window.removeEventListener('beforeprint', onBefore);
      if (!fired) setPrintBlockedHint(true);
    }, 450);
  };

  const updateMaterialField = (
    id: string,
    field: keyof LearningMaterialItem,
    val: string
  ) => {
    updateClassPackage((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === id ? { ...m, [field]: val } : m
      ),
    }));
  };

  const updateModulField = (
    id: string,
    field: keyof ModulAjarItem,
    val: string
  ) => {
    updateClassPackage((prev) => ({
      ...prev,
      modulAjarList: prev.modulAjarList.map((m) =>
        m.id === id ? { ...m, [field]: val } : m
      ),
    }));
  };

  const missingCpOrAtp = pkg.cpRows.length === 0 || pkg.atpRows.length === 0;

  return (
    <div className="space-y-5 no-print">
      {/* Top Banner & Source Uploader */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Perangkat Pembelajaran PJOK Terpadu · {pkg.kelas} ({pkg.fase})
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  T.A. {pkg.identity.academicYear} · Semester 1
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {pkg.identity.schoolName} · Guru:{' '}
                <b className="text-slate-800">{pkg.identity.teacherName}</b>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUploadFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Unggah file CP dan ATP (.xlsx) untuk diproses Read-Only"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {isUploading ? 'Membaca .xlsx...' : 'Upload File .xlsx (CP & ATP)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadCurriculumTemplateExcel();
                onNotify(
                  'Template Excel CP & ATP Kelas 1-6 (.xlsx) berhasil diunduh!'
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Unduh template Excel 12 sheet CP & ATP Kelas 1-6 siap isi"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Template (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTemplateGuide((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                showTemplateGuide
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Format Template</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPrintBlockedHint(false);
                setIsPrintModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadCurriculumWordDoc(pkg, schoolInfo, exportScope);
                onNotify(
                  `Dokumen Word (.doc) Perangkat Pembelajaran ${pkg.kelas} berhasil diunduh.`
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Word (.doc)</span>
            </button>
          </div>
        </div>

        {/* Class & Fase Quick Switcher inside Perangkat Pembelajaran */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {ALL_CURRICULUM_CLASSES.map((cls) => {
              const p = store.classes[cls];
              const isSelected = cls === currentClass;
              const hasCp = p.cpRows.length > 0;
              const hasAtp = p.atpRows.length > 0;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    onSelectClass(cls);
                    setSelectedModulId(null);
                    setEditingMateriId(null);
                    setEditingModulId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{cls}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-blue-700/80 text-blue-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p.fase.replace('Fase ', 'F-')} · {hasCp && hasAtp ? `${p.totalJpSemester1}JP` : hasCp ? 'CP' : 'Kosong'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>
              Sumber aktif: <b className="text-slate-700">{store.sourceFileName || '-'}</b>
            </span>
          </div>
        </div>

        {/* Collapsible Format Template Guide */}
        {showTemplateGuide && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span>Panduan Format Template Pengisian CP &amp; ATP (.xlsx)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadCurriculumTemplateExcel();
                    onNotify(
                      'Template Excel CP & ATP Kelas 1-6 (.xlsx) berhasil diunduh!'
                    );
                  }}
                  className="px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
                >
                  Unduh File Template (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplateGuide(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
                <div className="font-bold text-slate-900">1. Susunan 12 Nama Sheet</div>
                <ul className="text-[11px] space-y-0.5 text-slate-600">
                  <li><b>Kelas 1 (Fase A):</b> <code>CP</code> &amp; <code>ATP</code></li>
                  <li><b>Kelas 2 (Fase A):</b> <code>CP (2)</code> &amp; <code>ATP (2)</code></li>
                  <li><b>Kelas 3 (Fase B):</b> <code>CP (3)</code> &amp; <code>ATP (3)</code></li>
                  <li><b>Kelas 4 (Fase B):</b> <code>CP (4)</code> &amp; <code>ATP (4)</code></li>
                  <li><b>Kelas 5 (Fase C):</b> <code>CP (5)</code> &amp; <code>ATP (5)</code></li>
                  <li><b>Kelas 6 (Fase C):</b> <code>CP (6)</code> &amp; <code>ATP (6)</code></li>
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
                <div className="font-bold text-slate-900">2. Kolom Wajib Sheet CP</div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Baris header tabel:</div>
                  <div className="font-mono bg-slate-100 px-2 py-1 rounded text-[10px]">
                    No | Elemen | Capaian Pembelajaran
                  </div>
                  <p>
                    Isi teks CP sesuai sumber resmi. Sheet <code>CP (6)</code> pada template sudah terisi dari lampiran Anda.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
                <div className="font-bold text-slate-900">3. Kolom Pengisian Sheet ATP</div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>Baris header tabel (5 kolom utama + No):</div>
                  <div className="font-mono bg-slate-100 px-2 py-1 rounded text-[10px]">
                    No | Elemen | Capaian Pembelajaran | Tujuan Pembelajaran | Lingkup Materi | Alokasi Waktu (JP)
                  </div>
                  <p>
                    Jika sheet CP dikosongkan, sistem otomatis mengambil kolom <b>Capaian Pembelajaran</b> dari sheet ATP. Total JP Semester 1 dihitung otomatis dari kolom <b>Alokasi Waktu (JP)</b>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Missing Source Warning Banner (Honest, Read-Only Enforcement) */}
        {missingCpOrAtp && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-900">
                  {pkg.cpRows.length === 0 && pkg.atpRows.length === 0
                    ? `Data CP dan ATP asli untuk ${currentClass} (${pkg.fase}) belum tersedia`
                    : pkg.cpRows.length === 0
                      ? `Data CP asli untuk ${currentClass} belum tersedia`
                      : `Data ATP asli untuk ${currentClass} (${pkg.fase}) belum tersedia`}
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Lampiran chat hanya terbaca sebagai <b>1 sheet CSV (CP Kelas 6)</b> sehingga CP Kelas 1–5 dan ATP Kelas 1–6 tidak terbawa oleh sistem chat, dan aplikasi <b>tidak mengarang CP/ATP buatan sendiri</b>. Silakan klik <b>&quot;Unduh Template (.xlsx)&quot;</b> untuk mengisi sesuai format, atau langsung <b>&quot;Upload File .xlsx (CP &amp; ATP)&quot;</b> menggunakan file sumber asli Anda.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  downloadCurriculumTemplateExcel();
                  onNotify(
                    'Template Excel CP & ATP Kelas 1-6 (.xlsx) berhasil diunduh!'
                  );
                }}
                className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
              >
                Unduh Template
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
              >
                Pilih File .xlsx Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Import Report Summary after uploading .xlsx */}
        {importReport && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Laporan Pembacaan File (Read-Only): {importReport.fileName} ({importReport.totalSheetsInFile} sheet)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {importReport.perClassSummary.map((item) => (
                <div
                  key={item.kelas}
                  className="bg-white border border-emerald-200 rounded-lg p-2"
                >
                  <div className="font-bold text-slate-900">{item.kelas}</div>
                  <div className="text-[11px] text-slate-600">
                    CP: <b>{item.cpCount}</b> ({item.cpSheet || '-'})
                  </div>
                  <div className="text-[11px] text-slate-600">
                    ATP: <b>{item.atpCount}</b> TP · <b>{item.totalJp} JP</b>
                  </div>
                </div>
              ))}
            </div>
            {importReport.skippedSheets.length > 0 && (
              <div className="text-[11px] text-slate-600">
                Sheet selain CP/ATP dilewati (read-only safety):{' '}
                <span className="font-mono">{importReport.skippedSheets.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Submenu Navigation */}
        <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Semua Bagian (1–10)' },
              { id: 'cp', label: '1–2. Identitas & CP' },
              { id: 'atp', label: `3. ATP (${pkg.atpRows.length})` },
              { id: 'prota', label: `4. PROTA (${pkg.totalJpSemester1} JP)` },
              { id: 'promes', label: '5. PROMES' },
              { id: 'materi', label: `6. Materi (${pkg.materials.length})` },
              { id: 'modul', label: `7. Modul Ajar (${pkg.modulAjarList.length})` },
              { id: 'asesmen', label: '8–10. Asesmen, Rubrik & Refleksi' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as SubTab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  subTab === tab.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari TP / materi..."
                className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 w-44"
              />
            </div>
            {pkg.atpRows.length > 0 && (
              <button
                type="button"
                onClick={handleResetClassDevelopment}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Susun ulang hasil pengembangan dari CP & ATP asli"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Pengembangan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1 & 2: IDENTITAS & CAPAIAN PEMBELAJARAN (DATA ASLI READ-ONLY) */}
      {(subTab === 'all' || subTab === 'cp') && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>1. Identitas Pembelajaran PJOK ({pkg.kelas})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Satuan Pendidikan</div>
                <div className="font-bold text-slate-900 mt-0.5">{pkg.identity.schoolName}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Mata Pelajaran</div>
                <div className="font-bold text-slate-900 mt-0.5">{pkg.identity.subject}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Kelas / Fase</div>
                <div className="font-bold text-blue-700 mt-0.5">
                  {pkg.kelas} · {pkg.fase}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Tahun Ajaran / Semester</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {pkg.identity.academicYear} · Semester {pkg.identity.semester}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500">Guru PJOK</div>
                <div className="font-bold text-slate-900 mt-0.5">{pkg.identity.teacherName}</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200">
                <div className="text-blue-700">Total Alokasi Semester 1 (ATP)</div>
                <div className="font-extrabold font-mono text-blue-900 mt-0.5">
                  {pkg.totalJpSemester1} JP
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-emerald-50/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  2. Capaian Pembelajaran (CP) — {pkg.kelas} ({pkg.fase})
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Data Asli Sumber · Read-Only
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Sheet: {pkg.cpSourceSheet || 'Belum dimuat'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12 font-bold">No</th>
                    <th className="py-2.5 px-3 font-bold w-48">Elemen</th>
                    <th className="py-2.5 px-3 font-bold">Capaian Pembelajaran (Asli)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pkg.cpRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Data CP asli untuk {pkg.kelas} belum tersedia. Unggah file <code>CP DAN ATP SMS 1 KELAS 1-6.xlsx</code> untuk memuat sheet CP {pkg.kelas}.
                      </td>
                    </tr>
                  ) : (
                    pkg.cpRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {row.no}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 align-top">
                          {row.elemen}
                        </td>
                        <td className="py-3 px-3 text-slate-700 leading-relaxed whitespace-pre-line">
                          {row.capaianPembelajaran}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ATP (DATA ASLI READ-ONLY) */}
      {(subTab === 'all' || subTab === 'atp') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-emerald-50/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">
                3. Alur Tujuan Pembelajaran (ATP) — {pkg.kelas} ({pkg.fase})
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Data Asli Sumber · Read-Only
              </span>
            </div>
            <span className="text-xs text-slate-600 font-mono">
              Sheet: {pkg.atpSourceSheet || 'Belum dimuat'} · Total: <b>{pkg.totalJpSemester1} JP</b>
            </span>
          </div>

          <div className="overflow-x-auto">
            {(() => {
              const showAtpCpCol = pkg.atpRows.some((r) => Boolean(r.capaianPembelajaran));
              return (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center w-12 font-bold">No</th>
                      <th className="py-2.5 px-3 font-bold w-40">Elemen</th>
                      {showAtpCpCol && (
                        <th className="py-2.5 px-3 font-bold w-64">Capaian Pembelajaran</th>
                      )}
                      <th className="py-2.5 px-3 font-bold">Tujuan Pembelajaran (TP)</th>
                      <th className="py-2.5 px-3 font-bold w-48">Lingkup Materi</th>
                      <th className="py-2.5 px-3 text-center font-bold w-24">Alokasi Waktu (JP)</th>
                      <th className="py-2.5 px-3 text-center font-bold w-40">Keterhubungan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pkg.atpRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={showAtpCpCol ? 7 : 6}
                          className="py-8 text-center text-slate-400"
                        >
                          Data ATP asli untuk {pkg.kelas} belum tersedia. Unggah file <code>CP DAN ATP SMS 1 KELAS 1-6.xlsx</code> atau gunakan tombol <b>Unduh Template (.xlsx)</b>.
                        </td>
                      </tr>
                    ) : (
                      pkg.atpRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 text-center font-mono text-slate-500">
                            {row.no}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900 align-top">
                            {row.elemen}
                          </td>
                          {showAtpCpCol && (
                            <td className="py-3 px-3 text-slate-600 leading-relaxed align-top">
                              {row.capaianPembelajaran || '-'}
                            </td>
                          )}
                          <td className="py-3 px-3 text-slate-700 leading-relaxed">
                            {row.tujuanPembelajaran}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {row.lingkupMateri}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-blue-800">
                            {row.alokasiLabel}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => jumpToLinkedItem(row.id, 'materi')}
                                className="px-2 py-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                              >
                                Materi
                              </button>
                              <button
                                type="button"
                                onClick={() => jumpToLinkedItem(row.id, 'modul')}
                                className="px-2 py-1 text-[11px] font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                              >
                                Modul
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {pkg.atpRows.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td
                          colSpan={showAtpCpCol ? 5 : 4}
                          className="py-2.5 px-3 text-right"
                        >
                          TOTAL ALOKASI WAKTU SEMESTER 1 (SESUAI ATP)
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-900">
                          {pkg.totalJpSemester1} JP
                        </td>
                        <td className="py-2.5 px-3 text-center text-[11px] text-slate-500 font-normal">
                          Terhubung ke PROTA &amp; PROMES
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* SECTION 4: PROTA */}
      {(subTab === 'all' || subTab === 'prota') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-blue-50/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                4. Program Tahunan (PROTA) — {pkg.kelas}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Hasil Pengembangan
              </span>
            </div>
            {pkg.protaRows.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingProta((v) => !v)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                {isEditingProta ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditingProta ? 'Selesai Edit PROTA' : 'Edit Distribusi'}</span>
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div className="text-xs font-bold text-slate-800">
              A. Semester 1 (Total Alokasi Waktu: {pkg.totalJpSemester1} JP sesuai ATP)
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12 font-bold">No</th>
                    <th className="py-2.5 px-3 font-bold w-36">Elemen</th>
                    <th className="py-2.5 px-3 font-bold">Tujuan Pembelajaran</th>
                    <th className="py-2.5 px-3 font-bold w-44">Lingkup Materi</th>
                    <th className="py-2.5 px-3 text-center font-bold w-20">Alokasi</th>
                    <th className="py-2.5 px-3 font-bold w-56">Distribusi Pembelajaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProta.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        PROTA akan otomatis tersusun begitu data ATP {pkg.kelas} dimuat.
                      </td>
                    </tr>
                  ) : (
                    filteredProta.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                          {row.no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {row.elemen}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {row.tujuanPembelajaran}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {row.lingkupMateri}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-800">
                          {row.alokasiJp} JP
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditingProta ? (
                            <input
                              type="text"
                              value={row.distribusiPembelajaran}
                              onChange={(e) =>
                                updateClassPackage((prev) => ({
                                  ...prev,
                                  protaRows: prev.protaRows.map((p) =>
                                    p.id === row.id
                                      ? { ...p, distribusiPembelajaran: e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:border-blue-600"
                            />
                          ) : (
                            <span className="text-slate-700">{row.distribusiPembelajaran}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {pkg.protaRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="py-2.5 px-3 text-right">
                        JUMLAH ALOKASI WAKTU SEMESTER 1
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-blue-900">
                        {pkg.totalJpSemester1} JP
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-normal text-slate-600">
                        Sesuai jumlah ATP {pkg.kelas}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-700">
              <div className="font-bold text-slate-900 mb-1">B. Semester 2</div>
              <p>
                <b>Data belum tersedia.</b> File sumber yang dilampirkan hanya memuat pembelajaran Semester 1, sehingga materi dan alokasi waktu Semester 2 tidak dikarang dan menunggu sumber resmi Semester 2.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: PROMES */}
      {(subTab === 'all' || subTab === 'promes') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-blue-50/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                5. Program Semester 1 (PROMES) — {pkg.kelas}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Hasil Pengembangan
              </span>
            </div>
            {pkg.promesRows.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingPromes((v) => !v)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                {isEditingPromes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditingPromes ? 'Selesai Edit PROMES' : 'Sesuaikan Minggu / Periode'}</span>
              </button>
            )}
          </div>

          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-500">
              Kolom <b>Minggu / Periode</b> disediakan agar guru dapat menyesuaikan langsung dengan kalender sekolah masing-masing (tidak mengarang kalender akademik).
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12 font-bold">No</th>
                    <th className="py-2.5 px-3 font-bold w-36">Urutan Pertemuan</th>
                    <th className="py-2.5 px-3 font-bold w-32">Elemen</th>
                    <th className="py-2.5 px-3 font-bold">Tujuan Pembelajaran</th>
                    <th className="py-2.5 px-3 font-bold w-44">Materi Pembelajaran</th>
                    <th className="py-2.5 px-3 text-center font-bold w-20">Alokasi</th>
                    <th className="py-2.5 px-3 font-bold w-56">Minggu / Periode (Guru)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPromes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        PROMES akan otomatis tersusun mengikuti urutan ATP {pkg.kelas}.
                      </td>
                    </tr>
                  ) : (
                    filteredPromes.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                          {row.no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-blue-800">
                          {isEditingPromes ? (
                            <input
                              type="text"
                              value={row.urutanPertemuan}
                              onChange={(e) =>
                                updateClassPackage((prev) => ({
                                  ...prev,
                                  promesRows: prev.promesRows.map((p) =>
                                    p.id === row.id
                                      ? { ...p, urutanPertemuan: e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full px-2 py-1 text-xs rounded border border-blue-300"
                            />
                          ) : (
                            row.urutanPertemuan
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium">
                          {row.elemen}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {row.tujuanPembelajaran}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {row.materiPembelajaran}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-800">
                          {row.alokasiJp} JP
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditingPromes ? (
                            <input
                              type="text"
                              value={row.mingguPeriode}
                              onChange={(e) =>
                                updateClassPackage((prev) => ({
                                  ...prev,
                                  promesRows: prev.promesRows.map((p) =>
                                    p.id === row.id
                                      ? { ...p, mingguPeriode: e.target.value }
                                      : p
                                  ),
                                }))
                              }
                              className="w-full px-2 py-1 text-xs rounded border border-blue-300"
                            />
                          ) : (
                            <span className="text-slate-600">{row.mingguPeriode}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {pkg.promesRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={5} className="py-2.5 px-3 text-right">
                        TOTAL ALOKASI WAKTU SEMESTER 1
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-blue-900">
                        {pkg.totalJpSemester1} JP
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-normal text-slate-500">
                        Sesuai urutan ATP
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: MATERI PEMBELAJARAN */}
      {(subTab === 'all' || subTab === 'materi') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-blue-50/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                6. Materi Pembelajaran PJOK (Konteks SD NTT / 3T) — {pkg.kelas}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Hasil Pengembangan
              </span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {filteredMaterials.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Materi pembelajaran akan tersusun otomatis mengikuti urutan lingkup materi pada ATP {pkg.kelas}.
              </div>
            ) : (
              filteredMaterials.map((mat) => {
                const isEditing = editingMateriId === mat.id;
                return (
                  <div
                    key={mat.id}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
                          <span>
                            Materi {mat.no}: {mat.lingkupMateri}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            {mat.elemen}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>TP ATP: {mat.tujuanPembelajaran}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => jumpToLinkedItem(mat.atpId, 'modul')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                        >
                          Buka Modul Ajar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingMateriId(isEditing ? null : mat.id)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          {isEditing ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Selesai</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Materi</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {(
                        [
                          ['penjelasanMateri', 'Penjelasan Materi'],
                          ['contohGerakan', 'Contoh Gerakan'],
                          ['aktivitasPraktik', 'Contoh Aktivitas Praktik (Sarana 3T)'],
                          ['manfaatPembelajaran', 'Manfaat Pembelajaran'],
                          ['aturanKeselamatan', 'Aturan Keselamatan'],
                          ['konteksNtt', 'Konteks Anak NTT (Sabu, Raijua, Rote, Timor, Flores)'],
                        ] as Array<[keyof LearningMaterialItem, string]>
                      ).map(([field, label]) => (
                        <div
                          key={field}
                          className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80"
                        >
                          <div className="font-bold text-slate-800 mb-1">{label}</div>
                          {isEditing ? (
                            <textarea
                              rows={3}
                              value={String(mat[field] || '')}
                              onChange={(e) =>
                                updateMaterialField(mat.id, field, e.target.value)
                              }
                              className="w-full p-2 text-xs rounded border border-blue-300 bg-white focus:outline-none focus:border-blue-600"
                            />
                          ) : (
                            <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                              {mat[field]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 7: MODUL AJAR (22 KOMPONEN DEEP LEARNING) */}
      {(subTab === 'all' || subTab === 'modul') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-blue-50/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                7. Modul Ajar PJOK (Pendekatan Deep Learning · 22 Komponen) — {pkg.kelas}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Hasil Pengembangan
              </span>
            </div>
            {activeModul && (
              <button
                type="button"
                onClick={() =>
                  setEditingModulId(
                    editingModulId === activeModul.id ? null : activeModul.id
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                {editingModulId === activeModul.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selesai Edit Modul</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Modul Ajar Ini</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            {pkg.modulAjarList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Modul Ajar akan dibuat otomatis untuk setiap Tujuan Pembelajaran pada ATP {pkg.kelas}.
              </div>
            ) : (
              <>
                {/* Selector daftar Modul Ajar per TP */}
                <div className="flex flex-wrap gap-2">
                  {pkg.modulAjarList.map((mod) => {
                    const isActive = activeModul?.id === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => setSelectedModulId(mod.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          Modul #{mod.no} · {mod.elemen} ({mod.alokasiJp} JP)
                        </div>
                      </button>
                    );
                  })}
                </div>

                {activeModul && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-900">
                        Detail Lengkap Modul Ajar #{activeModul.no} ({pkg.kelas} · {pkg.fase})
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        Terhubung ke ATP TP #{activeModul.no}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {(
                        [
                          ['identitasModul', '1. Identitas Modul', false],
                          ['kompetensiAwal', '2. Kompetensi Awal', false],
                          ['capaianPembelajaran', '3. Capaian Pembelajaran (Data Asli)', true],
                          ['tujuanPembelajaran', '4. Tujuan Pembelajaran (Data Asli ATP)', true],
                          ['profilKarakter', '5. Profil & Karakter yang Dikembangkan', false],
                          ['saranaPrasarana', '6. Sarana & Prasarana (SD 3T)', false],
                          ['karakteristikPesertaDidik', '7. Karakteristik Peserta Didik', false],
                          ['pendekatanMetode', '8. Pendekatan & Metode (Deep Learning)', false],
                          ['pemahamanBermakna', '9. Pemahaman Bermakna', false],
                          ['pertanyaanPemantik', '10. Pertanyaan Pemantik', false],
                          ['materiPembelajaran', '11. Materi Pembelajaran', false],
                          ['langkahPembelajaran', '12. Langkah Pembelajaran', false],
                          ['kegiatanPendahuluan', '13. Kegiatan Pendahuluan', false],
                          ['kegiatanInti', '14. Kegiatan Inti', false],
                          ['kegiatanPenutup', '15. Kegiatan Penutup', false],
                          ['asesmenDiagnostik', '16. Asesmen Diagnostik', false],
                          ['asesmenFormatif', '17. Asesmen Formatif', false],
                          ['asesmenSumatif', '18. Asesmen Sumatif', false],
                          ['rubrikPenilaian', '19. Rubrik Penilaian', false],
                          ['remedialPengayaan', '20. Remedial & Pengayaan', false],
                          ['refleksiGuru', '21. Refleksi Guru', false],
                          ['refleksiPesertaDidik', '22. Refleksi Peserta Didik', false],
                        ] as Array<[keyof ModulAjarItem, string, boolean]>
                      ).map(([field, label, isReadOnlyOriginal]) => {
                        const isEditingThis =
                          editingModulId === activeModul.id && !isReadOnlyOriginal;
                        return (
                          <div
                            key={field}
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-50/50"
                          >
                            <div className="md:col-span-4 font-bold text-slate-800 flex items-start gap-1.5">
                              <span>{label}</span>
                              {isReadOnlyOriginal && (
                                <Lock className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                            </div>
                            <div className="md:col-span-8">
                              {isEditingThis ? (
                                <textarea
                                  rows={3}
                                  value={String(activeModul[field] || '')}
                                  onChange={(e) =>
                                    updateModulField(
                                      activeModul.id,
                                      field,
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2 text-xs rounded border border-blue-300 bg-white focus:outline-none focus:border-blue-600"
                                />
                              ) : (
                                <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                                  {String(activeModul[field] || '-')}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION 8, 9, 10: ASESMEN, RUBRIK & REFLEKSI */}
      {(subTab === 'all' || subTab === 'asesmen') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-blue-50/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                8–10. Asesmen, Rubrik Penilaian &amp; Refleksi — {pkg.kelas}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Hasil Pengembangan
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingAsesmen((v) => !v)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              {isEditingAsesmen ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selesai Edit</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Asesmen &amp; Refleksi</span>
                </>
              )}
            </button>
          </div>

          <div className="p-5 space-y-5 text-xs">
            {/* 8. Asesmen Pembelajaran */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  ['sikapKarakter', '1. Sikap & Karakter'],
                  ['pengetahuan', '2. Pengetahuan'],
                  ['keterampilanGerak', '3. Keterampilan Gerak'],
                ] as const
              ).map(([field, title]) => (
                <div
                  key={field}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70"
                >
                  <div className="font-bold text-slate-900 mb-1.5">{title}</div>
                  {isEditingAsesmen ? (
                    <textarea
                      rows={4}
                      value={pkg.assessmentPackage[field]}
                      onChange={(e) =>
                        updateClassPackage((prev) => ({
                          ...prev,
                          assessmentPackage: {
                            ...prev.assessmentPackage,
                            [field]: e.target.value,
                          },
                        }))
                      }
                      className="w-full p-2 text-xs rounded border border-blue-300 bg-white"
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {pkg.assessmentPackage[field]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* 9. Rubrik Penilaian */}
            <div>
              <div className="font-bold text-slate-900 mb-2">
                9. Rubrik Penilaian Praktik Keterampilan Gerak (Skala 1–4)
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3 font-bold w-44">Aspek Penilaian</th>
                      <th className="py-2.5 px-3 font-bold">Skor 4 (Sangat Baik)</th>
                      <th className="py-2.5 px-3 font-bold">Skor 3 (Baik)</th>
                      <th className="py-2.5 px-3 font-bold">Skor 2 (Cukup)</th>
                      <th className="py-2.5 px-3 font-bold">Skor 1 (Perlu Bimbingan)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pkg.assessmentPackage.rubrikIndikator.map((ind, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {ind.aspek}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{ind.skor4}</td>
                        <td className="py-2.5 px-3 text-slate-700">{ind.skor3}</td>
                        <td className="py-2.5 px-3 text-slate-700">{ind.skor2}</td>
                        <td className="py-2.5 px-3 text-slate-700">{ind.skor1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10. Refleksi Guru & Peserta Didik */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(
                [
                  ['refleksiGuru', '10A. Refleksi Guru'],
                  ['refleksiPesertaDidik', '10B. Refleksi Peserta Didik'],
                ] as const
              ).map(([field, title]) => (
                <div
                  key={field}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70"
                >
                  <div className="font-bold text-slate-900 mb-1.5">{title}</div>
                  {isEditingAsesmen ? (
                    <textarea
                      rows={3}
                      value={pkg.assessmentPackage[field]}
                      onChange={(e) =>
                        updateClassPackage((prev) => ({
                          ...prev,
                          assessmentPackage: {
                            ...prev.assessmentPackage,
                            [field]: e.target.value,
                          },
                        }))
                      }
                      className="w-full p-2 text-xs rounded border border-blue-300 bg-white"
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {pkg.assessmentPackage[field]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print / PDF Preview Modal for Perangkat Pembelajaran */}
      {isPrintModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-900/75 backdrop-blur-xs no-print"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-white">
                Pratinjau Cetak &amp; PDF Perangkat Pembelajaran · {pkg.kelas} ({pkg.fase})
              </h3>
              <p className="text-[11px] text-slate-300">
                {pkg.identity.schoolName} · Guru: {pkg.identity.teacherName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrintFromModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadCurriculumPrintableHtml(pkg, schoolInfo, exportScope);
                  onNotify(
                    'File cetak A4 (.html) diunduh! Buka file untuk mencetak atau Simpan sebagai PDF.'
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Siap-Cetak / PDF (.html)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadCurriculumWordDoc(pkg, schoolInfo, exportScope);
                  onNotify('File Word (.doc) berhasil diunduh.');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>
          </div>

          {printBlockedHint && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 text-xs text-amber-950 flex items-center justify-between gap-2 shrink-0">
              <span>
                Preview memblokir pop-up cetak langsung. Klik <b>&quot;Unduh Siap-Cetak / PDF (.html)&quot;</b> lalu buka file di browser untuk mencetak / Save as PDF.
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200">
            <iframe
              ref={printIframeRef}
              title="Pratinjau Perangkat Pembelajaran"
              srcDoc={buildCurriculumDocumentHtml(pkg, schoolInfo, exportScope, true)}
              className="w-full max-w-[210mm] mx-auto bg-white shadow-xl border border-slate-300 min-h-[75vh] h-[1100px] rounded-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};
