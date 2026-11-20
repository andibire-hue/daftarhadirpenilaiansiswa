import React, { useState, useRef, useEffect } from 'react';
import { Printer, Download, X, AlertCircle, FileCheck } from 'lucide-react';
import {
  StudentGrade,
  ClassGrade,
  SchoolInfo,
  ClassAttendanceSession,
} from '../types';
import { PrintSheet } from './PrintSheet';
import { PrintAttendanceSheet } from './PrintAttendanceSheet';

interface PrintPreviewModalProps {
  isOpen: boolean;
  mode: 'grades' | 'attendance';
  currentClass: ClassGrade;
  students: StudentGrade[];
  sessions: ClassAttendanceSession[];
  schoolInfo: SchoolInfo;
  onClose: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  mode,
  currentClass,
  students,
  sessions,
  schoolInfo,
  onClose,
  onNotify,
}) => {
  const [printBlockedHint, setPrintBlockedHint] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrintBlockedHint(false);
    }
  }, [isOpen, mode, currentClass]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNativePrint = () => {
    let beforePrintFired = false;
    const onBeforePrint = () => {
      beforePrintFired = true;
      setPrintBlockedHint(false);
    };

    window.addEventListener('beforeprint', onBeforePrint, { once: true });

    try {
      window.print();
    } catch {
      setPrintBlockedHint(true);
    }

    window.setTimeout(() => {
      window.removeEventListener('beforeprint', onBeforePrint);
      if (!beforePrintFired) {
        setPrintBlockedHint(true);
      }
    }, 350);
  };

  const handleDownloadPrintableHtml = () => {
    const content = sheetRef.current?.innerHTML || '';
    const titleLabel =
      mode === 'grades'
        ? `Rapor_PJOK_${currentClass.replace(/\s+/g, '_')}`
        : `Daftar_Hadir_PJOK_${currentClass.replace(/\s+/g, '_')}`;

    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleLabel} - ${schoolInfo.schoolName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.45;
    }
    .paper {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 16mm 14mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 14px auto;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .btn-print {
      background: #1d4ed8;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-extrabold { font-weight: 800; }
    .font-semibold { font-weight: 600; }
    .underline { text-decoration: underline; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-wide { letter-spacing: 0.025em; }
    .text-xl { font-size: 18px; margin: 2px 0; }
    .text-base { font-size: 14px; margin: 0; }
    .text-sm { font-size: 13px; margin: 0; }
    .text-xs { font-size: 11.5px; }
    .text-\\[11px\\] { font-size: 11px; }
    .text-slate-700 { color: #334155; }
    .text-slate-600 { color: #475569; }
    .mb-4 { margin-bottom: 14px; }
    .mb-5 { margin-bottom: 18px; }
    .mb-6 { margin-bottom: 22px; }
    .mb-8 { margin-bottom: 28px; }
    .mt-1 { margin-top: 4px; }
    .pb-4 { padding-bottom: 12px; }
    .pt-4 { padding-top: 14px; }
    .border-b-2 { border-bottom: 2px solid #0f172a; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; gap: 16px; }
    table.print-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
    }
    table.print-table th,
    table.print-table td {
      border: 1px solid #1e293b;
      padding: 5px 7px;
      font-size: 11px;
    }
    table.print-table thead tr {
      background-color: #f1f5f9;
    }
    table.print-table tfoot tr {
      background-color: #f8fafc;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .paper { box-shadow: none; padding: 0; max-width: 100%; }
      @page { size: A4 portrait; margin: 1.5cm 1cm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">Cetak / Simpan PDF</button>
  </div>
  <div class="paper">
    ${content}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 250);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleLabel}_${schoolInfo.academicYear.replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onNotify) {
      onNotify(
        'Lembar cetak siap-print (.html) diunduh! Buka file tersebut untuk mencetak atau menyimpan PDF.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/75 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau Cetak"
    >
      {/* Top Preview Toolbar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {mode === 'grades'
                ? `Pratinjau Cetak Rekap Nilai PJOK · ${currentClass}`
                : `Pratinjau Cetak Daftar Hadir PJOK · ${currentClass}`}
            </h3>
            <p className="text-[11px] text-slate-300">
              Format A4 Resmi · {schoolInfo.schoolName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNativePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPrintableHtml}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
            title="Unduh lembar cetak A4 yang siap dicetak dari tab browser baru"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Lembar Cetak (.html)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>
      </div>

      {/* Fallback notice if iframe blocks window.print() */}
      {printBlockedHint && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Browser/iframe preview memblokir dialog cetak langsung. Gunakan tombol{' '}
              <b>&quot;Unduh Lembar Cetak (.html)&quot;</b> di kanan atas lalu buka file untuk
              mencetak/simpan PDF, atau tekan <b>Ctrl+P</b> (Mac: <b>Cmd+P</b>).
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadPrintableHtml}
            className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
          >
            Unduh Lembar Cetak Sekarang
          </button>
        </div>
      )}

      {/* Scrollable A4 Paper Preview */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/90">
        <div
          ref={sheetRef}
          className="max-w-[210mm] mx-auto bg-white shadow-xl border border-slate-300 rounded-sm p-6 sm:p-10 min-h-[297mm] [&_table.print-table]:w-full [&_table.print-table]:border-collapse [&_table.print-table_th]:border [&_table.print-table_th]:border-slate-800 [&_table.print-table_th]:px-2 [&_table.print-table_th]:py-1.5 [&_table.print-table_td]:border [&_table.print-table_td]:border-slate-800 [&_table.print-table_td]:px-2 [&_table.print-table_td]:py-1.5"
        >
          {mode === 'grades' ? (
            <PrintSheet
              currentClass={currentClass}
              students={students}
              schoolInfo={schoolInfo}
              previewMode
            />
          ) : (
            <PrintAttendanceSheet
              currentClass={currentClass}
              students={students}
              sessions={sessions}
              schoolInfo={schoolInfo}
              previewMode
            />
          )}
        </div>
      </div>
    </div>
  );
};
