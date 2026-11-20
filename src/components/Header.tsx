import React, { useState, useEffect } from 'react';
import {
  School,
  Printer,
  Settings,
  FileCode,
  UserCheck,
  UploadCloud,
  Cloud,
  RefreshCw,
  KeyRound,
  Link2,
  Check,
  X,
} from 'lucide-react';
import { SchoolInfo } from '../types';

export type CloudSyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

interface HeaderProps {
  schoolInfo: SchoolInfo;
  workspaceId: string;
  cloudSyncStatus: CloudSyncStatus;
  onManualCloudSync: () => void;
  onChangeWorkspaceId: (newCode: string) => { ok: boolean; error?: string };
  onCopySyncLink: () => void;
  onOpenSettings: () => void;
  onDownloadStandalone: () => void;
  onOpenSelfRegistration: () => void;
  onOpenUploadModal: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  schoolInfo,
  workspaceId,
  cloudSyncStatus,
  onManualCloudSync,
  onChangeWorkspaceId,
  onCopySyncLink,
  onOpenSettings,
  onDownloadStandalone,
  onOpenSelfRegistration,
  onOpenUploadModal,
  onPrint,
}) => {
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState(workspaceId);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    setCodeDraft(workspaceId);
  }, [workspaceId]);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onChangeWorkspaceId(codeDraft);
    if (res.ok) {
      setCodeError(null);
      setIsEditingCode(false);
    } else {
      setCodeError(res.error || 'Kode ruang kerja tidak valid.');
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-xl shadow-lg shadow-blue-950/10 mb-6 p-5 sm:p-6 no-print border border-blue-700/50">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <School className="w-8 h-8 text-blue-200" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider text-blue-200 uppercase bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-400/20">
                Aplikasi Penilaian Sekolah Dasar
              </span>
              <span className="text-xs text-blue-200/80">·</span>
              <span className="text-xs font-medium text-blue-200">
                T.A. {schoolInfo.academicYear} (Semester {schoolInfo.semester})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-xs">
              Sistem Pengolahan Nilai PJOK
            </h1>
            <p className="text-sm font-medium text-blue-100 flex flex-wrap items-center gap-2 mt-0.5">
              <span>{schoolInfo.schoolName}</span>
              <span className="text-blue-300">·</span>
              <span className="text-blue-200 text-xs">Guru: {schoolInfo.teacherName}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          <button
            onClick={onOpenUploadModal}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
            title="Upload berkas Excel (.xlsx, .xls) atau CSV perkelas"
          >
            <UploadCloud className="w-4 h-4 text-indigo-200" />
            <span>Upload Data Siswa</span>
          </button>

          <button
            onClick={onOpenSelfRegistration}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
            title="Buka form pengisian data peserta didik secara mandiri atau tempel daftar siswa"
          >
            <UserCheck className="w-4 h-4 text-emerald-100" />
            <span>Pengisian Mandiri</span>
          </button>

          <button
            onClick={onPrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
            title="Buka Pratinjau & Cetak format Rapor Resmi A4"
          >
            <Printer className="w-4 h-4 text-blue-200" />
            <span className="hidden sm:inline">Cetak Rekap</span>
          </button>

          <button
            onClick={onDownloadStandalone}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-600 text-white border border-blue-400/30 transition-colors shadow-xs cursor-pointer"
            title="Unduh single-file index.html murni untuk dijalankan offline tanpa server"
          >
            <FileCode className="w-4 h-4 text-blue-200" />
            <span>Unduh index.html</span>
          </button>

          <button
            onClick={onOpenSettings}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
            title="Pengaturan Guru, Kepala Sekolah & KKTP"
          >
            <Settings className="w-4 h-4 text-blue-200" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Zero-Login Cross-Device Cloud Sync Bar (Komputer & HP) */}
      <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-col gap-2.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-blue-100">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold ${
                cloudSyncStatus === 'error'
                  ? 'bg-red-500/25 text-red-100 border border-red-400/40'
                  : cloudSyncStatus === 'syncing'
                    ? 'bg-amber-500/25 text-amber-100 border border-amber-400/40'
                    : 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/40'
              }`}
            >
              {cloudSyncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>
                {cloudSyncStatus === 'syncing'
                  ? 'Menyinkronkan ke Cloud...'
                  : cloudSyncStatus === 'error'
                    ? 'Gangguan Koneksi Cloud (Data Lokal Aman)'
                    : 'Cloud Aktif · Tersimpan Otomatis (HP & Komputer)'}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-blue-200">
              <span>Ruang Data:</span>
              <code className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-400/25 text-white font-mono text-[11px]">
                {workspaceId}
              </code>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCopySyncLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors cursor-pointer"
              title="Salin link untuk dibuka di HP atau komputer lain tanpa login Google"
            >
              <Link2 className="w-3.5 h-3.5 text-blue-200" />
              <span>Salin Link HP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCodeDraft(workspaceId);
                setCodeError(null);
                setIsEditingCode((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors cursor-pointer"
              title="Gunakan kode ruang kerja/PIN rahasia sekolah sendiri agar data lebih privat"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Ganti Kode / Kunci</span>
            </button>

            <button
              type="button"
              onClick={onManualCloudSync}
              disabled={cloudSyncStatus === 'syncing'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-50 font-semibold border border-emerald-400/35 transition-colors cursor-pointer disabled:opacity-50"
              title="Simpan & sinkronkan ulang seluruh data saat ini ke Cloud"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`}
              />
              <span>Sinkronkan</span>
            </button>
          </div>
        </div>

        {isEditingCode && (
          <form
            onSubmit={handleSubmitCode}
            className="flex flex-col sm:flex-row sm:items-center gap-2 bg-blue-950/60 border border-blue-400/30 rounded-lg p-2.5"
          >
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-blue-100">
                Kode Ruang Data Sekolah / PIN Sinkronisasi (tanpa perlu login Google, min. 6 karakter huruf/angka/_/-):
              </label>
              <input
                type="text"
                value={codeDraft}
                onChange={(e) => {
                  setCodeDraft(e.target.value);
                  if (codeError) setCodeError(null);
                }}
                placeholder="contoh: lokojuli_pjok_2026"
                className="w-full sm:max-w-sm px-2.5 py-1.5 rounded-md bg-white text-slate-900 font-mono text-xs border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {codeError && <span className="text-[11px] text-red-300 font-medium">{codeError}</span>}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingCode(false);
                  setCodeError(null);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 font-semibold cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </header>
  );
};
