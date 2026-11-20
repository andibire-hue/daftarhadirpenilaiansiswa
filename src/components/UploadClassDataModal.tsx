import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { StudentGrade, ClassGrade, SchoolInfo } from '../types';
import { parseSpreadsheetFile, downloadUploadTemplateExcel } from '../utils/fileUploadParser';

interface UploadClassDataModalProps {
  isOpen: boolean;
  defaultClass: ClassGrade;
  schoolInfo: SchoolInfo;
  onClose: () => void;
  onConfirmUpload: (
    targetClass: ClassGrade,
    students: StudentGrade[],
    mode: 'replace' | 'append'
  ) => void;
}

const ALL_CLASSES: ClassGrade[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export const UploadClassDataModal: React.FC<UploadClassDataModalProps> = ({
  isOpen,
  defaultClass,
  schoolInfo,
  onClose,
  onConfirmUpload,
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassGrade>(defaultClass);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedStudents, setParsedStudents] = useState<StudentGrade[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedClass(defaultClass);
      setSelectedFile(null);
      setParsedStudents([]);
      setErrorMessage(null);
      setIsSuccess(false);
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, defaultClass]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage(null);
    setParsedStudents([]);
    setIsSuccess(false);

    try {
      const students = await parseSpreadsheetFile(file, schoolInfo.kktp);
      setParsedStudents(students);
    } catch (err: unknown) {
      const msg =
        typeof err === 'string'
          ? err
          : err instanceof Error
            ? err.message
            : 'Gagal membaca berkas Excel/CSV.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    downloadUploadTemplateExcel(selectedClass);
  };

  const handleSubmit = () => {
    if (parsedStudents.length === 0) return;
    onConfirmUpload(selectedClass, parsedStudents, importMode);
    setIsSuccess(true);
  };

  const handleResetModal = () => {
    setSelectedFile(null);
    setParsedStudents([]);
    setErrorMessage(null);
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Upload Data Siswa Perkelas
              </h3>
              <p className="text-xs text-blue-200">
                {schoolInfo.schoolName} · Format Excel (.xlsx, .xls) & CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5">
          {isSuccess ? (
            /* Success confirmation screen */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in duration-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Data Siswa Berhasil Diunggah!
                </h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
                  Sebanyak <b>{parsedStudents.length} siswa</b> telah berhasil dimasukkan ke dalam daftar{' '}
                  <span className="font-semibold text-blue-700">{selectedClass}</span>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Upload Kelas Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Tutup & Lihat Tabel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Target Class Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1. Pilih Target Kelas Yang Akan Diisi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ALL_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`py-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        selectedClass === cls
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Download Banner */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span>Belum memiliki format berkas?</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Unduh template Excel resmi untuk {selectedClass} yang sudah berisi kolom No, NIS, Nama, L/P, NH, NP, PTS, PAS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-100/60 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template .xlsx</span>
                </button>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  2. Pilih Berkas Excel atau CSV (.xlsx, .xls, .csv)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Klik untuk memilih berkas atau seret berkas ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mendukung berkas Microsoft Excel (.xlsx, .xls) dan CSV
                  </p>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-blue-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses dan membaca isi berkas...</span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal mengunggah berkas: </span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Preview Parsed Data */}
              {parsedStudents.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Pratinjau Berkas: Terdeteksi {parsedStudents.length} Siswa
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Target: <b className="text-blue-700">{selectedClass}</b>
                    </span>
                  </div>

                  {/* Mode Impor: Replace vs Append */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                    <span className="font-semibold text-slate-800 block">
                      Metode Penyimpanan ke {selectedClass}:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          importMode === 'replace'
                            ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5"
                        />
                        <div>
                          <div>Ganti Seluruh Data (Replace)</div>
                          <div className="text-[10px] font-normal text-slate-500">
                            Menimpa daftar siswa lama {selectedClass} dengan data baru ini.
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          importMode === 'append'
                            ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="mt-0.5"
                        />
                        <div>
                          <div>Gabungkan (Append)</div>
                          <div className="text-[10px] font-normal text-slate-500">
                            Menambahkan siswa baru tanpa menghapus data yang sudah ada.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Mini Preview Table */}
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="py-1.5 px-2 text-center w-8">No</th>
                          <th className="py-1.5 px-2 text-center w-14">NIS</th>
                          <th className="py-1.5 px-2">Nama Siswa</th>
                          <th className="py-1.5 px-1 text-center w-8">L/P</th>
                          <th className="py-1.5 px-2 text-right">NH</th>
                          <th className="py-1.5 px-2 text-right">NP</th>
                          <th className="py-1.5 px-2 text-right">PTS</th>
                          <th className="py-1.5 px-2 text-right">PAS</th>
                          <th className="py-1.5 px-2 text-right bg-blue-50 text-blue-900 font-bold">Rapor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedStudents.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1 px-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-1 px-2 text-center font-mono text-slate-600">{s.nis}</td>
                            <td className="py-1 px-2 font-medium text-slate-900">{s.name}</td>
                            <td className="py-1 px-1 text-center text-slate-500">{s.gender}</td>
                            <td className="py-1 px-2 text-right font-mono">{s.dailyScore}</td>
                            <td className="py-1 px-2 text-right font-mono">{s.practicalScore}</td>
                            <td className="py-1 px-2 text-right font-mono">{s.midtermScore}</td>
                            <td className="py-1 px-2 text-right font-mono">{s.finalScore}</td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-blue-900 bg-blue-50/50">
                              {s.finalReportScore.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                    >
                      <span>Simpan {parsedStudents.length} Siswa ke {selectedClass}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
