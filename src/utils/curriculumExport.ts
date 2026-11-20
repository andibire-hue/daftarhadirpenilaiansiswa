import { ClassCurriculumPackage, SchoolInfo } from '../types';

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

export type CurriculumExportScope =
  | 'all'
  | 'cp'
  | 'atp'
  | 'prota'
  | 'promes'
  | 'materi'
  | 'modul'
  | 'asesmen';

export function buildCurriculumDocumentHtml(
  pkg: ClassCurriculumPackage,
  schoolInfo: SchoolInfo,
  scope: CurriculumExportScope = 'all',
  forWord: boolean = false
): string {
  const showAll = scope === 'all';
  const todayLabel = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const headerSection = `
    <div style="text-align:center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px;">
      <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH KABUPATEN · DINAS PENDIDIKAN</div>
      <div style="font-size: 15pt; font-weight: bold; text-transform: uppercase;">${escapeHtml(pkg.identity.schoolName)}</div>
      <div style="font-size: 9.5pt; color: #334155;">PERANGKAT PEMBELAJARAN PJOK TERPADU · ${escapeHtml(pkg.kelas.toUpperCase())} (${escapeHtml(pkg.fase)})</div>
    </div>

    <h2 style="font-size: 12pt; margin: 12px 0 6px 0; color: #1e3a8a;">1. IDENTITAS PEMBELAJARAN</h2>
    <table class="doc-table">
      <tr><td style="width: 220px; font-weight: bold;">Satuan Pendidikan</td><td>${escapeHtml(pkg.identity.schoolName)}</td></tr>
      <tr><td style="font-weight: bold;">Mata Pelajaran</td><td>${escapeHtml(pkg.identity.subject)}</td></tr>
      <tr><td style="font-weight: bold;">Kelas / Fase</td><td>${escapeHtml(pkg.kelas)} / ${escapeHtml(pkg.fase)}</td></tr>
      <tr><td style="font-weight: bold;">Tahun Ajaran</td><td>${escapeHtml(pkg.identity.academicYear)}</td></tr>
      <tr><td style="font-weight: bold;">Semester</td><td>${escapeHtml(pkg.identity.semester)}</td></tr>
      <tr><td style="font-weight: bold;">Guru Mata Pelajaran PJOK</td><td>${escapeHtml(pkg.identity.teacherName)}</td></tr>
      <tr><td style="font-weight: bold;">Total Alokasi Waktu Semester 1</td><td><b>${pkg.totalJpSemester1} JP</b> (mengikuti total ATP)</td></tr>
    </table>
  `;

  const cpSection =
    showAll || scope === 'cp'
      ? `
    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">2. CAPAIAN PEMBELAJARAN (CP) <span class="badge-orig">[DATA ASLI SUMBER · READ-ONLY]</span></h2>
    <div style="font-size: 9pt; color: #475569; margin-bottom: 6px;">Sumber Sheet: ${escapeHtml(pkg.cpSourceSheet || 'Belum tersedia')}</div>
    <table class="doc-table">
      <thead>
        <tr><th style="width: 35px;">No</th><th style="width: 170px;">Elemen</th><th>Capaian Pembelajaran (Asli)</th></tr>
      </thead>
      <tbody>
        ${
          pkg.cpRows.length === 0
            ? `<tr><td colspan="3" style="text-align:center; color:#b91c1c;">Data CP asli untuk ${escapeHtml(pkg.kelas)} belum ditemukan dari sumber.</td></tr>`
            : pkg.cpRows
                .map(
                  (r) =>
                    `<tr><td style="text-align:center;">${escapeHtml(r.no)}</td><td style="font-weight:bold;">${escapeHtml(r.elemen)}</td><td>${nl2br(r.capaianPembelajaran)}</td></tr>`
                )
                .join('')
        }
      </tbody>
    </table>
  `
      : '';

  const hasAtpCpCol = pkg.atpRows.some((r) => Boolean(r.capaianPembelajaran));

  const atpSection =
    showAll || scope === 'atp'
      ? `
    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">3. ALUR TUJUAN PEMBELAJARAN (ATP) <span class="badge-orig">[DATA ASLI SUMBER · READ-ONLY]</span></h2>
    <div style="font-size: 9pt; color: #475569; margin-bottom: 6px;">Sumber Sheet: ${escapeHtml(pkg.atpSourceSheet || 'Belum tersedia')}</div>
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width: 35px;">No</th>
          <th style="width: 125px;">Elemen</th>
          ${hasAtpCpCol ? '<th style="width: 210px;">Capaian Pembelajaran</th>' : ''}
          <th>Tujuan Pembelajaran</th>
          <th style="width: 150px;">Lingkup Materi</th>
          <th style="width: 75px; text-align:center;">Alokasi Waktu (JP)</th>
        </tr>
      </thead>
      <tbody>
        ${
          pkg.atpRows.length === 0
            ? `<tr><td colspan="${hasAtpCpCol ? 6 : 5}" style="text-align:center; color:#b91c1c;">Data ATP asli untuk ${escapeHtml(pkg.kelas)} belum ditemukan dari sumber.</td></tr>`
            : pkg.atpRows
                .map(
                  (r) =>
                    `<tr><td style="text-align:center;">${escapeHtml(r.no)}</td><td>${escapeHtml(r.elemen)}</td>${
                      hasAtpCpCol ? `<td>${nl2br(r.capaianPembelajaran || '-')}</td>` : ''
                    }<td>${nl2br(r.tujuanPembelajaran)}</td><td>${nl2br(r.lingkupMateri)}</td><td style="text-align:center; font-weight:bold;">${escapeHtml(r.alokasiLabel)}</td></tr>`
                )
                .join('')
        }
      </tbody>
      ${
        pkg.atpRows.length > 0
          ? `<tfoot><tr style="font-weight:bold; background:#f1f5f9;"><td colspan="${hasAtpCpCol ? 5 : 4}" style="text-align:right;">TOTAL ALOKASI WAKTU SEMESTER 1 (SESUAI ATP)</td><td style="text-align:center;">${pkg.totalJpSemester1} JP</td></tr></tfoot>`
          : ''
      }
    </table>
  `
      : '';

  const protaSection =
    showAll || scope === 'prota'
      ? `
    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">4. PROGRAM TAHUNAN (PROTA) <span class="badge-dev">[HASIL PENGEMBANGAN]</span></h2>
    <h3 style="font-size: 10.5pt; margin: 8px 0 4px 0;">A. Semester 1 (Total: ${pkg.totalJpSemester1} JP)</h3>
    <table class="doc-table">
      <thead>
        <tr><th style="width: 35px;">No</th><th style="width: 130px;">Elemen</th><th>Tujuan Pembelajaran</th><th style="width: 160px;">Lingkup Materi</th><th style="width: 65px; text-align:center;">JP</th><th style="width: 160px;">Distribusi Pembelajaran</th></tr>
      </thead>
      <tbody>
        ${
          pkg.protaRows.length === 0
            ? `<tr><td colspan="6" style="text-align:center; color:#64748b;">PROTA menunggu data ATP ${escapeHtml(pkg.kelas)}.</td></tr>`
            : pkg.protaRows
                .map(
                  (r) =>
                    `<tr><td style="text-align:center;">${escapeHtml(r.no)}</td><td>${escapeHtml(r.elemen)}</td><td>${nl2br(r.tujuanPembelajaran)}</td><td>${nl2br(r.lingkupMateri)}</td><td style="text-align:center; font-weight:bold;">${r.alokasiJp} JP</td><td>${nl2br(r.distribusiPembelajaran)}</td></tr>`
                )
                .join('')
        }
      </tbody>
      ${
        pkg.protaRows.length > 0
          ? `<tfoot><tr style="font-weight:bold; background:#f1f5f9;"><td colspan="4" style="text-align:right;">JUMLAH ALOKASI WAKTU SEMESTER 1</td><td style="text-align:center;">${pkg.totalJpSemester1} JP</td><td>Sesuai ATP ${escapeHtml(pkg.kelas)}</td></tr></tfoot>`
          : ''
      }
    </table>
    <h3 style="font-size: 10.5pt; margin: 10px 0 4px 0;">B. Semester 2</h3>
    <div style="border: 1px dashed #94a3b8; padding: 10px; background: #f8fafc; font-size: 9.5pt;">
      <b>Keterangan Semester 2:</b> Data belum tersedia (file sumber hanya memuat Semester 1). Alokasi waktu dan materi Semester 2 tidak dikarang dan akan ditambahkan setelah sumber resmi Semester 2 tersedia.
    </div>
  `
      : '';

  const promesSection =
    showAll || scope === 'promes'
      ? `
    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">5. PROGRAM SEMESTER (PROMES) · SEMESTER 1 <span class="badge-dev">[HASIL PENGEMBANGAN]</span></h2>
    <table class="doc-table">
      <thead>
        <tr><th style="width: 35px;">No</th><th style="width: 110px;">Urutan Pertemuan</th><th style="width: 120px;">Elemen</th><th>Tujuan Pembelajaran</th><th style="width: 150px;">Materi Pembelajaran</th><th style="width: 60px; text-align:center;">JP</th><th style="width: 150px;">Minggu / Periode (Disesuaikan Guru)</th></tr>
      </thead>
      <tbody>
        ${
          pkg.promesRows.length === 0
            ? `<tr><td colspan="7" style="text-align:center; color:#64748b;">PROMES menunggu data ATP ${escapeHtml(pkg.kelas)}.</td></tr>`
            : pkg.promesRows
                .map(
                  (r) =>
                    `<tr><td style="text-align:center;">${escapeHtml(r.no)}</td><td>${escapeHtml(r.urutanPertemuan)}</td><td>${escapeHtml(r.elemen)}</td><td>${nl2br(r.tujuanPembelajaran)}</td><td>${nl2br(r.materiPembelajaran)}</td><td style="text-align:center; font-weight:bold;">${r.alokasiJp} JP</td><td>${nl2br(r.mingguPeriode)}</td></tr>`
                )
                .join('')
        }
      </tbody>
      ${
        pkg.promesRows.length > 0
          ? `<tfoot><tr style="font-weight:bold; background:#f1f5f9;"><td colspan="5" style="text-align:right;">TOTAL ALOKASI WAKTU SEMESTER 1</td><td style="text-align:center;">${pkg.totalJpSemester1} JP</td><td>Sesuai ATP</td></tr></tfoot>`
          : ''
      }
    </table>
  `
      : '';

  const materiSection =
    showAll || scope === 'materi'
      ? `
    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">6. MATERI PEMBELAJARAN PJOK <span class="badge-dev">[HASIL PENGEMBANGAN]</span></h2>
    ${
      pkg.materials.length === 0
        ? `<p style="font-size:10pt; color:#64748b;">Materi pembelajaran menunggu data ATP ${escapeHtml(pkg.kelas)}.</p>`
        : pkg.materials
            .map(
              (m) => `
      <div style="border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 12px; page-break-inside: avoid;">
        <div style="font-weight: bold; font-size: 10.5pt; color: #1e3a8a; margin-bottom: 4px;">Materi ${escapeHtml(m.no)}: ${escapeHtml(m.lingkupMateri)} (${escapeHtml(m.elemen)})</div>
        <div style="font-size: 9pt; color: #475569; margin-bottom: 6px;"><b>Tujuan Pembelajaran (ATP):</b> ${nl2br(m.tujuanPembelajaran)}</div>
        <table class="doc-table" style="margin-bottom:0;">
          <tr><td style="width:170px; font-weight:bold;">Penjelasan Materi</td><td>${nl2br(m.penjelasanMateri)}</td></tr>
          <tr><td style="font-weight:bold;">Contoh Gerakan</td><td>${nl2br(m.contohGerakan)}</td></tr>
          <tr><td style="font-weight:bold;">Aktivitas Praktik (3T)</td><td>${nl2br(m.aktivitasPraktik)}</td></tr>
          <tr><td style="font-weight:bold;">Manfaat Pembelajaran</td><td>${nl2br(m.manfaatPembelajaran)}</td></tr>
          <tr><td style="font-weight:bold;">Aturan Keselamatan</td><td>${nl2br(m.aturanKeselamatan)}</td></tr>
          <tr><td style="font-weight:bold;">Konteks Anak NTT</td><td>${nl2br(m.konteksNtt)}</td></tr>
        </table>
      </div>
    `
            )
            .join('')
    }
  `
      : '';

  const modulSection =
    showAll || scope === 'modul'
      ? `
    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">7. MODUL AJAR PJOK (DEEP LEARNING) <span class="badge-dev">[HASIL PENGEMBANGAN]</span></h2>
    ${
      pkg.modulAjarList.length === 0
        ? `<p style="font-size:10pt; color:#64748b;">Modul Ajar menunggu data ATP ${escapeHtml(pkg.kelas)}.</p>`
        : pkg.modulAjarList
            .map(
              (mod) => `
      <div style="margin-bottom: 16px; page-break-inside: avoid;">
        <h3 style="font-size: 10.5pt; background: #eff6ff; border: 1px solid #bfdbfe; padding: 6px 10px; margin: 0 0 6px 0; color: #1e3a8a;">
          Modul Ajar #${escapeHtml(mod.no)} · ${escapeHtml(mod.elemen)} (${mod.alokasiJp} JP)
        </h3>
        <table class="doc-table">
          <tr><td style="width:195px; font-weight:bold;">1. Identitas Modul</td><td>${nl2br(mod.identitasModul)}</td></tr>
          <tr><td style="font-weight:bold;">2. Kompetensi Awal</td><td>${nl2br(mod.kompetensiAwal)}</td></tr>
          <tr><td style="font-weight:bold;">3. Capaian Pembelajaran (Asli)</td><td>${nl2br(mod.capaianPembelajaran)}</td></tr>
          <tr><td style="font-weight:bold;">4. Tujuan Pembelajaran (Asli ATP)</td><td>${nl2br(mod.tujuanPembelajaran)}</td></tr>
          <tr><td style="font-weight:bold;">5. Profil & Karakter</td><td>${nl2br(mod.profilKarakter)}</td></tr>
          <tr><td style="font-weight:bold;">6. Sarana & Prasarana (3T)</td><td>${nl2br(mod.saranaPrasarana)}</td></tr>
          <tr><td style="font-weight:bold;">7. Karakteristik Peserta Didik</td><td>${nl2br(mod.karakteristikPesertaDidik)}</td></tr>
          <tr><td style="font-weight:bold;">8. Pendekatan & Metode</td><td>${nl2br(mod.pendekatanMetode)}</td></tr>
          <tr><td style="font-weight:bold;">9. Pemahaman Bermakna</td><td>${nl2br(mod.pemahamanBermakna)}</td></tr>
          <tr><td style="font-weight:bold;">10. Pertanyaan Pemantik</td><td>${nl2br(mod.pertanyaanPemantik)}</td></tr>
          <tr><td style="font-weight:bold;">11. Materi Pembelajaran</td><td>${nl2br(mod.materiPembelajaran)}</td></tr>
          <tr><td style="font-weight:bold;">12. Langkah Pembelajaran</td><td>${nl2br(mod.langkahPembelajaran)}</td></tr>
          <tr><td style="font-weight:bold;">13. Kegiatan Pendahuluan</td><td>${nl2br(mod.kegiatanPendahuluan)}</td></tr>
          <tr><td style="font-weight:bold;">14. Kegiatan Inti</td><td>${nl2br(mod.kegiatanInti)}</td></tr>
          <tr><td style="font-weight:bold;">15. Kegiatan Penutup</td><td>${nl2br(mod.kegiatanPenutup)}</td></tr>
          <tr><td style="font-weight:bold;">16. Asesmen Diagnostik</td><td>${nl2br(mod.asesmenDiagnostik)}</td></tr>
          <tr><td style="font-weight:bold;">17. Asesmen Formatif</td><td>${nl2br(mod.asesmenFormatif)}</td></tr>
          <tr><td style="font-weight:bold;">18. Asesmen Sumatif</td><td>${nl2br(mod.asesmenSumatif)}</td></tr>
          <tr><td style="font-weight:bold;">19. Rubrik Penilaian</td><td>${nl2br(mod.rubrikPenilaian)}</td></tr>
          <tr><td style="font-weight:bold;">20. Remedial & Pengayaan</td><td>${nl2br(mod.remedialPengayaan)}</td></tr>
          <tr><td style="font-weight:bold;">21. Refleksi Guru</td><td>${nl2br(mod.refleksiGuru)}</td></tr>
          <tr><td style="font-weight:bold;">22. Refleksi Peserta Didik</td><td>${nl2br(mod.refleksiPesertaDidik)}</td></tr>
        </table>
      </div>
    `
            )
            .join('')
    }
  `
      : '';

  const asesmenSection =
    showAll || scope === 'asesmen'
      ? `
    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">8. ASESMEN PEMBELAJARAN <span class="badge-dev">[HASIL PENGEMBANGAN]</span></h2>
    <table class="doc-table">
      <tr><td style="width:195px; font-weight:bold;">1. Sikap & Karakter</td><td>${nl2br(pkg.assessmentPackage.sikapKarakter)}</td></tr>
      <tr><td style="font-weight:bold;">2. Pengetahuan</td><td>${nl2br(pkg.assessmentPackage.pengetahuan)}</td></tr>
      <tr><td style="font-weight:bold;">3. Keterampilan Gerak</td><td>${nl2br(pkg.assessmentPackage.keterampilanGerak)}</td></tr>
    </table>

    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">9. RUBRIK PENILAIAN PRAKTIK PJOK <span class="badge-dev">[HASIL PENGEMBANGAN]</span></h2>
    <table class="doc-table">
      <thead>
        <tr><th style="width:150px;">Aspek Penilaian</th><th>Skor 4 (Sangat Baik)</th><th>Skor 3 (Baik)</th><th>Skor 2 (Cukup)</th><th>Skor 1 (Perlu Bimbingan)</th></tr>
      </thead>
      <tbody>
        ${pkg.assessmentPackage.rubrikIndikator
          .map(
            (ind) =>
              `<tr><td style="font-weight:bold;">${escapeHtml(ind.aspek)}</td><td>${nl2br(ind.skor4)}</td><td>${nl2br(ind.skor3)}</td><td>${nl2br(ind.skor2)}</td><td>${nl2br(ind.skor1)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>

    <h2 style="font-size: 12pt; margin: 18px 0 6px 0; color: #1e3a8a;">10. REFLEKSI GURU & PESERTA DIDIK <span class="badge-dev">[HASIL PENGEMBANGAN]</span></h2>
    <table class="doc-table">
      <tr><td style="width:195px; font-weight:bold;">Refleksi Guru</td><td>${nl2br(pkg.assessmentPackage.refleksiGuru)}</td></tr>
      <tr><td style="font-weight:bold;">Refleksi Peserta Didik</td><td>${nl2br(pkg.assessmentPackage.refleksiPesertaDidik)}</td></tr>
    </table>
  `
      : '';

  const signatureSection = `
    <table style="width:100%; border:none; margin-top: 28px; page-break-inside: avoid;">
      <tr>
        <td style="width:50%; text-align:center; border:none; font-size:10pt;">
          <div>Mengetahui,</div>
          <div>Kepala ${escapeHtml(pkg.identity.schoolName)}</div>
          <div style="height:60px;"></div>
          <div style="font-weight:bold; text-decoration:underline;">${escapeHtml(schoolInfo.principalName)}</div>
          <div>NIP. ${escapeHtml(schoolInfo.principalNip)}</div>
        </td>
        <td style="width:50%; text-align:center; border:none; font-size:10pt;">
          <div>Lokojuli, ${escapeHtml(todayLabel)}</div>
          <div>Guru Mata Pelajaran PJOK</div>
          <div style="height:60px;"></div>
          <div style="font-weight:bold; text-decoration:underline;">${escapeHtml(pkg.identity.teacherName)}</div>
          <div>NIP. ${escapeHtml(schoolInfo.teacherNip)}</div>
        </td>
      </tr>
    </table>
  `;

  const wordNamespaces = forWord
    ? `xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"`
    : '';

  return `<!DOCTYPE html>
<html ${wordNamespaces} lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Perangkat Pembelajaran PJOK - ${escapeHtml(pkg.kelas)} (${escapeHtml(pkg.fase)})</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      font-size: 10pt;
      line-height: 1.45;
      margin: ${forWord ? '1.5cm' : '0'};
      background: ${forWord ? '#ffffff' : '#f1f5f9'};
    }
    .paper {
      max-width: ${forWord ? '100%' : '210mm'};
      margin: ${forWord ? '0' : '16px auto'};
      background: #ffffff;
      padding: ${forWord ? '0' : '14mm'};
    }
    .toolbar {
      max-width: 210mm;
      margin: 16px auto 0 auto;
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
      font-weight: bold;
      cursor: pointer;
    }
    table.doc-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.doc-table th, table.doc-table td {
      border: 1px solid #334155;
      padding: 6px 8px;
      vertical-align: top;
      text-align: left;
      font-size: 9.5pt;
    }
    table.doc-table th {
      background-color: #e2e8f0;
      font-weight: bold;
    }
    .badge-orig {
      font-size: 8.5pt;
      color: #166534;
    }
    .badge-dev {
      font-size: 8.5pt;
      color: #1d4ed8;
    }
    @media print {
      body { background: #ffffff; }
      .toolbar { display: none !important; }
      .paper { margin: 0; padding: 0; max-width: 100%; }
      @page { size: A4 portrait; margin: 1.5cm 1.2cm; }
    }
  </style>
</head>
<body>
  ${
    forWord
      ? ''
      : `<div class="toolbar"><button class="btn-print" onclick="window.print()">Cetak / Simpan PDF</button></div>`
  }
  <div class="paper">
    ${headerSection}
    ${cpSection}
    ${atpSection}
    ${protaSection}
    ${promesSection}
    ${materiSection}
    ${modulSection}
    ${asesmenSection}
    ${signatureSection}
  </div>
  ${
    forWord
      ? ''
      : `<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 250); });</script>`
  }
</body>
</html>`;
}

export function downloadCurriculumWordDoc(
  pkg: ClassCurriculumPackage,
  schoolInfo: SchoolInfo,
  scope: CurriculumExportScope = 'all'
): void {
  const html = buildCurriculumDocumentHtml(pkg, schoolInfo, scope, true);
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Perangkat_Pembelajaran_PJOK_${pkg.kelas.replace(/\s+/g, '_')}_Smt1_2026-2027.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCurriculumPrintableHtml(
  pkg: ClassCurriculumPackage,
  schoolInfo: SchoolInfo,
  scope: CurriculumExportScope = 'all'
): void {
  const html = buildCurriculumDocumentHtml(pkg, schoolInfo, scope, false);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Cetak_PDF_Perangkat_PJOK_${pkg.kelas.replace(/\s+/g, '_')}_Smt1_2026-2027.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
