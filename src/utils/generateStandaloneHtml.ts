/**
 * Generates the complete standalone index.html file that can run completely offline
 * by just double clicking it in any web browser.
 */
export function generateStandaloneHtmlCode(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistem Pengolahan Nilai PJOK - UPTD SD NEGERI LOKOJULI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #1d4ed8;
      --primary-dark: #1e40af;
      --primary-light: #eff6ff;
      --primary-border: #bfdbfe;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-300: #cbd5e1;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
      --success: #15803d;
      --success-bg: #dcfce7;
      --danger: #b91c1c;
      --danger-bg: #fee2e2;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: var(--slate-800);
      line-height: 1.5;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace;
      font-variant-numeric: tabular-nums;
    }

    /* Container */
    .container {
      max-width: 1380px;
      margin: 0 auto;
      padding: 24px 20px;
    }

    /* Header */
    header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-title h1 {
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .header-title p {
      font-size: 0.9rem;
      color: #bfdbfe;
    }

    /* Class Navigation Tabs */
    .nav-tabs {
      display: flex;
      gap: 8px;
      background: white;
      padding: 6px;
      border-radius: 10px;
      border: 1px solid var(--slate-200);
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .nav-tab-btn {
      flex: 1;
      min-width: 100px;
      padding: 10px 16px;
      border: none;
      background: transparent;
      color: var(--slate-600);
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      text-align: center;
    }
    .nav-tab-btn:hover {
      background-color: var(--slate-100);
      color: var(--slate-900);
    }
    .nav-tab-btn.active {
      background-color: var(--primary);
      color: white;
      box-shadow: 0 2px 6px rgba(29, 78, 216, 0.25);
    }

    /* Layout Grid */
    .grid-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .grid-layout { grid-template-columns: 1fr; }
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 12px;
      border: 1px solid var(--slate-200);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--slate-200);
      background-color: #fafbfc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--slate-900);
    }
    .card-body {
      padding: 20px;
    }

    /* Form Styles */
    .form-group {
      margin-bottom: 14px;
    }
    label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--slate-700);
      margin-bottom: 5px;
    }
    input, select, textarea {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid var(--slate-300);
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      color: var(--slate-900);
      background-color: white;
      transition: border-color 0.15s ease;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* Auto calculation preview box */
    .calc-preview {
      background: var(--primary-light);
      border: 1px dashed var(--primary-border);
      border-radius: 8px;
      padding: 14px;
      margin: 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .calc-preview .label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary-dark);
    }
    .calc-preview .value {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--primary-dark);
    }
    .calc-preview .desc {
      font-size: 0.75rem;
      color: var(--slate-600);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-primary {
      background-color: var(--primary);
      color: white;
    }
    .btn-primary:hover { background-color: var(--primary-dark); }
    .btn-secondary {
      background-color: white;
      border-color: var(--slate-300);
      color: var(--slate-700);
    }
    .btn-secondary:hover { background-color: var(--slate-100); }
    .btn-success {
      background-color: #16a34a;
      color: white;
    }
    .btn-success:hover { background-color: #15803d; }
    .btn-danger {
      background-color: #dc2626;
      color: white;
    }
    .btn-danger:hover { background-color: var(--danger); }
    .btn-block { width: 100%; }

    /* Stats bar */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .stat-box {
      background: white;
      border: 1px solid var(--slate-200);
      padding: 12px 14px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-box .title {
      font-size: 0.75rem;
      color: var(--slate-600);
      font-weight: 500;
      margin-bottom: 2px;
    }
    .stat-box .num {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--slate-900);
    }

    /* Table Toolbar */
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 14px;
    }
    .search-input {
      max-width: 260px;
    }

    /* Data Table */
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--slate-200);
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }
    thead {
      background-color: #f1f5f9;
      color: var(--slate-700);
    }
    th {
      padding: 10px 12px;
      font-weight: 600;
      border-bottom: 1px solid var(--slate-200);
      white-space: nowrap;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--slate-200);
      white-space: nowrap;
    }
    tbody tr:hover { background-color: #f8fafc; }
    tbody tr:last-child td { border-bottom: none; }

    .badge-pass {
      background: var(--success-bg);
      color: var(--success);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
    }
    .badge-remedial {
      background: var(--danger-bg);
      color: var(--danger);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
    }
    .action-btn {
      padding: 4px 8px;
      font-size: 0.75rem;
      border-radius: 4px;
      border: 1px solid var(--slate-300);
      background: white;
      cursor: pointer;
      font-weight: 600;
    }
    .action-btn:hover { background: var(--slate-100); }
    .action-btn.del { color: var(--danger); border-color: #fca5a5; }
    .action-btn.del:hover { background: #fee2e2; }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .modal-box {
      background: white;
      border-radius: 14px;
      max-width: 540px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
    }
    .modal-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #1e3a8a, #1d4ed8);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-body {
      padding: 20px;
    }
    .modal-tabs {
      display: flex;
      border-bottom: 1px solid var(--slate-200);
      margin-bottom: 16px;
    }
    .modal-tab-btn {
      flex: 1;
      padding: 10px;
      border: none;
      background: transparent;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .modal-tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    /* Toast banner */
    .toast-banner {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0f172a;
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      z-index: 200;
      display: none;
    }
    .toast-banner.error { background: #991b1b; }

    /* Print styling */
    @media print {
      body { background: white; color: black; }
      .no-print { display: none !important; }
      .container { max-width: 100%; padding: 0; }
      .card { border: none; box-shadow: none; }
      .table-container { border: none; }
      th, td { border: 1px solid black !important; padding: 6px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header>
      <div class="header-top">
        <div class="header-title">
          <h1>Sistem Pengolahan Nilai PJOK</h1>
          <p>UPTD SD NEGERI LOKOJULI · Kurikulum Nasional & Penilaian Rapor</p>
        </div>
        <div class="header-actions no-print" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="openSelfModal('upload')">📁 Upload Berkas</button>
          <button class="btn btn-success" onclick="openSelfModal('single')">✍️ Isi Siswa Mandiri</button>
          <button class="btn btn-secondary" onclick="resetSampleData()">Muat Data Awal</button>
          <button class="btn btn-secondary" onclick="handleStandalonePrint()">Cetak Halaman</button>
        </div>
      </div>
    </header>

    <!-- Navigasi Kelas 1 - 6 -->
    <div class="nav-tabs no-print" id="classTabs">
      <button class="nav-tab-btn active" onclick="switchClass('Kelas 1')">Kelas 1</button>
      <button class="nav-tab-btn" onclick="switchClass('Kelas 2')">Kelas 2</button>
      <button class="nav-tab-btn" onclick="switchClass('Kelas 3')">Kelas 3</button>
      <button class="nav-tab-btn" onclick="switchClass('Kelas 4')">Kelas 4</button>
      <button class="nav-tab-btn" onclick="switchClass('Kelas 5')">Kelas 5</button>
      <button class="nav-tab-btn" onclick="switchClass('Kelas 6')">Kelas 6</button>
    </div>

    <!-- Main Grid -->
    <div class="grid-layout">
      <!-- Form Input Nilai Guru -->
      <div class="card no-print">
        <div class="card-header">
          <span class="card-title" id="formTitle">Form Input Nilai Guru</span>
          <span id="activeClassLabel" style="font-size: 0.8rem; color: var(--primary); font-weight: 700;">Kelas 1</span>
        </div>
        <div class="card-body">
          <form id="gradeForm" onsubmit="handleSubmit(event)">
            <input type="hidden" id="editStudentId" value="">

            <div class="form-group">
              <label>Pilih Siswa Terdaftar (Ubah Nilai Langsung)</label>
              <select id="quickStudentSelect" onchange="handleQuickSelectStudent()">
                <option value="">+ Tambah Siswa Baru / Ketik Nama Manual</option>
              </select>
            </div>
            
            <div class="grid-2">
              <div class="form-group">
                <label>Nomor Induk / NIS</label>
                <input type="text" id="studentNis" placeholder="Contoh: 101" required>
              </div>
              <div class="form-group">
                <label>Jenis Kelamin</label>
                <select id="studentGender">
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Nama Lengkap Siswa</label>
              <input type="text" id="studentName" placeholder="Masukkan nama siswa..." required>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Nilai Harian (NH)</label>
                <input type="number" id="dailyScore" min="0" max="100" step="any" placeholder="0-100" required oninput="updateLiveCalc()">
              </div>
              <div class="form-group">
                <label>Nilai Praktik (NP)</label>
                <input type="number" id="practicalScore" min="0" max="100" step="any" placeholder="0-100" required oninput="updateLiveCalc()">
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>PTS / STS</label>
                <input type="number" id="midtermScore" min="0" max="100" step="any" placeholder="0-100" required oninput="updateLiveCalc()">
              </div>
              <div class="form-group">
                <label>PAS / SAS</label>
                <input type="number" id="finalScore" min="0" max="100" step="any" placeholder="0-100" required oninput="updateLiveCalc()">
              </div>
            </div>

            <!-- Kalkulasi Otomatis -->
            <div class="calc-preview">
              <div>
                <div class="label">Kalkulasi Otomatis Nilai Rapor</div>
                <div class="desc">Rumus: (NH + NP + PTS + PAS) ÷ 4</div>
              </div>
              <div style="text-align: right;">
                <div class="value font-mono" id="liveScorePreview">0.00</div>
                <div class="desc font-mono" id="livePredPreview">Predikat: -</div>
              </div>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="submit" class="btn btn-primary btn-block" id="btnSubmit">Simpan Nilai Siswa</button>
              <button type="button" class="btn btn-secondary" id="btnCancelEdit" style="display: none;" onclick="cancelEdit()">Batal</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tabel & Rekapitulasi -->
      <div>
        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-box">
            <div class="title">Total Siswa</div>
            <div class="num font-mono" id="statCount">0</div>
          </div>
          <div class="stat-box">
            <div class="title">Rata-rata Kelas</div>
            <div class="num font-mono" id="statAvg">0.0</div>
          </div>
          <div class="stat-box">
            <div class="title">Nilai Tertinggi</div>
            <div class="num font-mono" id="statMax">0</div>
          </div>
          <div class="stat-box">
            <div class="title">Nilai Terendah</div>
            <div class="num font-mono" id="statMin">0</div>
          </div>
          <div class="stat-box">
            <div class="title">Tuntas (KKTP 70)</div>
            <div class="num font-mono" id="statPass">0%</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title" id="tableTitle">Rekapitulasi Nilai PJOK - Kelas 1</span>
            <div class="no-print" style="display: flex; gap: 8px;">
              <button class="btn btn-secondary" onclick="openSelfModal()">
                + Input Mandiri
              </button>
              <button class="btn btn-success" onclick="exportExcel()">
                📥 Export ke Excel
              </button>
            </div>
          </div>
          <div class="card-body">
            <!-- Table Toolbar -->
            <div class="table-toolbar no-print">
              <input type="text" id="searchInput" class="search-input" placeholder="🔍 Cari nama / NIS..." oninput="renderTable()">
              <div style="font-size: 0.8rem; color: var(--slate-600);">
                KKTP Standar: <b>70</b> · Rapor dihitung otomatis
              </div>
            </div>

            <!-- Table -->
            <div class="table-container">
              <table id="gradeTable">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">No</th>
                    <th style="text-align: center;">NIS</th>
                    <th>Nama Siswa</th>
                    <th style="text-align: center;">L/P</th>
                    <th style="text-align: right;">NH</th>
                    <th style="text-align: right;">NP</th>
                    <th style="text-align: right;">PTS</th>
                    <th style="text-align: right;">PAS</th>
                    <th style="text-align: right; background-color: #e0f2fe; color: #0369a1;">Nilai Rapor</th>
                    <th style="text-align: center;">Predikat</th>
                    <th style="text-align: center;">Status</th>
                    <th class="no-print" style="text-align: center; width: 100px;">Aksi</th>
                  </tr>
                </thead>
                <tbody id="tableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Pengisian Mandiri Siswa -->
  <div class="modal-overlay no-print" id="selfEntryModal">
    <div class="modal-box">
      <div class="modal-header">
        <h3 style="font-size: 1rem; font-weight: 700;">Pengisian Data Siswa Mandiri</h3>
        <button onclick="closeSelfModal()" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer;">✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-tabs">
          <button class="modal-tab-btn active" id="tabSingleBtn" onclick="switchModalTab('single')">Form Siswa Perorangan</button>
          <button class="modal-tab-btn" id="tabBatchBtn" onclick="switchModalTab('batch')">Tempel Daftar</button>
          <button class="modal-tab-btn" id="tabUploadBtn" onclick="switchModalTab('upload')">Upload Berkas CSV</button>
        </div>

        <!-- Mode 1: Single Form -->
        <div id="selfSingleView">
          <form onsubmit="handleSelfSingleSubmit(event)">
            <div class="form-group">
              <label>Pilih Kelas</label>
              <select id="selfClass">
                <option value="Kelas 1">Kelas 1</option>
                <option value="Kelas 2">Kelas 2</option>
                <option value="Kelas 3">Kelas 3</option>
                <option value="Kelas 4">Kelas 4</option>
                <option value="Kelas 5">Kelas 5</option>
                <option value="Kelas 6">Kelas 6</option>
              </select>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Nomor Induk / NIS</label>
                <input type="text" id="selfNis" placeholder="Contoh: 106">
              </div>
              <div class="form-group">
                <label>Jenis Kelamin</label>
                <select id="selfGender">
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Nama Lengkap Siswa *</label>
              <input type="text" id="selfName" placeholder="Masukkan nama siswa..." required>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label>Tinggi Badan (cm)</label>
                <input type="number" id="selfHeight" placeholder="Contoh: 135">
              </div>
              <div class="form-group">
                <label>Berat Badan (kg)</label>
                <input type="number" id="selfWeight" placeholder="Contoh: 32">
              </div>
            </div>

            <div class="form-group">
              <label>Cabang Olahraga yang Diminati</label>
              <select id="selfSport">
                <option value="Sepak Bola / Futsal">Sepak Bola / Futsal</option>
                <option value="Bola Voli">Bola Voli</option>
                <option value="Senam Kebugaran (SKJ)">Senam Kebugaran (SKJ)</option>
                <option value="Lari & Atletik">Lari & Atletik</option>
                <option value="Bulu Tangkis">Bulu Tangkis</option>
                <option value="Permainan Kasti">Permainan Kasti</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">Simpan Data Siswa Mandiri</button>
          </form>
        </div>

        <!-- Mode 2: Batch Form -->
        <div id="selfBatchView" style="display: none;">
          <form onsubmit="handleSelfBatchSubmit(event)">
            <div class="form-group">
              <label>Target Kelas</label>
              <select id="batchClass">
                <option value="Kelas 1">Kelas 1</option>
                <option value="Kelas 2">Kelas 2</option>
                <option value="Kelas 3">Kelas 3</option>
                <option value="Kelas 4">Kelas 4</option>
                <option value="Kelas 5">Kelas 5</option>
                <option value="Kelas 6">Kelas 6</option>
              </select>
            </div>

            <div class="form-group">
              <label>Tempel Baris Siswa (NIS, Nama, L/P)</label>
              <textarea id="batchText" rows="6" placeholder="Contoh:&#10;101, Ahmad Kurniawan, L&#10;102, Beatrice Lado, P&#10;103, Daud Rihi, L" required></textarea>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Tambahkan Semua Siswa</button>
          </form>
        </div>

        <!-- Mode 3: Upload CSV View -->
        <div id="selfUploadView" style="display: none;">
          <form onsubmit="handleSelfUploadSubmit(event)">
            <div class="form-group">
              <label>Target Kelas Yang Diisi</label>
              <select id="uploadClass">
                <option value="Kelas 1">Kelas 1</option>
                <option value="Kelas 2">Kelas 2</option>
                <option value="Kelas 3">Kelas 3</option>
                <option value="Kelas 4">Kelas 4</option>
                <option value="Kelas 5">Kelas 5</option>
                <option value="Kelas 6">Kelas 6</option>
              </select>
            </div>

            <div class="form-group">
              <label>Pilih Berkas CSV (.csv)</label>
              <input type="file" id="uploadCsvFile" accept=".csv, .txt" required>
              <div style="font-size: 11px; color: var(--slate-600); margin-top: 4px;">
                Format baris: NIS, Nama Siswa, L/P, NH, NP, PTS, PAS
              </div>
            </div>

            <div class="form-group">
              <label>Mode Penyimpanan</label>
              <select id="uploadMode">
                <option value="replace">Ganti Seluruh Data Siswa Kelas Ini</option>
                <option value="append">Gabungkan / Tambahkan ke Data Yang Ada</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Proses & Unggah Berkas CSV</button>
          </form>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Konfirmasi -->
  <div class="modal-overlay no-print" id="confirmModal" style="z-index: 150;">
    <div class="modal-box" style="max-width: 420px;">
      <div class="modal-header" style="background: #b91c1c;">
        <h3 style="font-size: 0.95rem; font-weight: 700;" id="confirmTitle">Konfirmasi</h3>
        <button type="button" onclick="closeConfirm()" style="background: none; border: none; color: white; font-size: 1.1rem; cursor: pointer;">✕</button>
      </div>
      <div class="modal-body">
        <p id="confirmMessage" style="font-size: 0.9rem; color: var(--slate-700); margin-bottom: 18px;"></p>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="closeConfirm()">Batal</button>
          <button type="button" class="btn btn-danger" id="confirmYesBtn">Ya, Lanjutkan</button>
        </div>
      </div>
    </div>
  </div>

  <div id="toastBanner" class="toast-banner no-print"></div>

  <script>
    let currentClass = 'Kelas 1';
    const KKTP = 70;
    
    const defaultData = {
      'Kelas 1': [
        { id: '101', nis: '101', name: 'Aditia Pratama', gender: 'L', nh: 84, np: 86, pts: 80, pas: 85, extra: 'Mandiri' },
        { id: '102', nis: '102', name: 'Bella Safitri', gender: 'P', nh: 88, np: 90, pts: 85, pas: 89 },
        { id: '103', nis: '103', name: 'Christian Dapa', gender: 'L', nh: 76, np: 78, pts: 72, pas: 75 },
        { id: '104', nis: '104', name: 'Delsi Kalumbang', gender: 'P', nh: 90, np: 92, pts: 88, pas: 91 },
        { id: '105', nis: '105', name: 'Efraim Bili', gender: 'L', nh: 68, np: 70, pts: 65, pas: 68 }
      ],
      'Kelas 2': [
        { id: '201', nis: '201', name: 'Farel Ronaldo', gender: 'L', nh: 85, np: 88, pts: 82, pas: 86 },
        { id: '202', nis: '202', name: 'Grace Natalia', gender: 'P', nh: 92, np: 90, pts: 89, pas: 93 },
        { id: '203', nis: '203', name: 'Hendrikus Lado', gender: 'L', nh: 78, np: 80, pts: 75, pas: 78 }
      ],
      'Kelas 3': [
        { id: '301', nis: '301', name: 'Johan Maramba', gender: 'L', nh: 80, np: 85, pts: 82, pas: 84 },
        { id: '302', nis: '302', name: 'Kezia Rambu', gender: 'P', nh: 88, np: 89, pts: 86, pas: 90 }
      ],
      'Kelas 4': [
        { id: '401', nis: '401', name: 'Oktovianus Dida', gender: 'L', nh: 82, np: 85, pts: 80, pas: 84 },
        { id: '402', nis: '402', name: 'Priskila Lodo', gender: 'P', nh: 88, np: 90, pts: 86, pas: 89 }
      ],
      'Kelas 5': [
        { id: '501', nis: '501', name: 'Tomi Robinson', gender: 'L', nh: 86, np: 92, pts: 85, pas: 88 },
        { id: '502', nis: '502', name: 'Ulfa Damayanti', gender: 'P', nh: 90, np: 90, pts: 88, pas: 92 }
      ],
      'Kelas 6': [
        { id: '601', nis: '601', name: 'Aldo Fernandez', gender: 'L', nh: 88, np: 94, pts: 90, pas: 92 },
        { id: '602', nis: '602', name: 'Bertha Rambu Ana', gender: 'P', nh: 92, np: 95, pts: 91, pas: 94 }
      ]
    };

    function getStoredData(cls) {
      const raw = localStorage.getItem('lokojuli_pjok_' + cls);
      if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
      }
      return defaultData[cls] || [];
    }

    function saveStoredData(cls, data) {
      localStorage.setItem('lokojuli_pjok_' + cls, JSON.stringify(data));
    }

    function calcRapor(nh, np, pts, pas) {
      return (Number(nh) + Number(np) + Number(pts) + Number(pas)) / 4;
    }

    function getPredicate(score) {
      if (score >= 88) return 'A';
      if (score >= 76) return 'B';
      if (score >= 65) return 'C';
      return 'D';
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    let toastTimer = null;
    function showToast(msg, isError) {
      const el = document.getElementById('toastBanner');
      el.innerText = msg;
      el.classList.toggle('error', Boolean(isError));
      el.style.display = 'block';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        el.style.display = 'none';
      }, 3500);
    }

    let pendingConfirmAction = null;
    function openConfirm(title, message, onYes, isPrimary) {
      document.getElementById('confirmTitle').innerText = title;
      document.getElementById('confirmMessage').innerText = message;
      const yesBtn = document.getElementById('confirmYesBtn');
      const headerEl = document.querySelector('#confirmModal .modal-header');
      headerEl.style.background = isPrimary ? '#1d4ed8' : '#b91c1c';
      yesBtn.className = isPrimary ? 'btn btn-primary' : 'btn btn-danger';
      pendingConfirmAction = onYes;
      yesBtn.onclick = function() {
        const fn = pendingConfirmAction;
        closeConfirm();
        if (fn) fn();
      };
      document.getElementById('confirmModal').style.display = 'flex';
    }

    function closeConfirm() {
      document.getElementById('confirmModal').style.display = 'none';
      pendingConfirmAction = null;
    }

    function updateLiveCalc() {
      const nh = parseFloat(document.getElementById('dailyScore').value) || 0;
      const np = parseFloat(document.getElementById('practicalScore').value) || 0;
      const pts = parseFloat(document.getElementById('midtermScore').value) || 0;
      const pas = parseFloat(document.getElementById('finalScore').value) || 0;

      const rapor = calcRapor(nh, np, pts, pas);
      const pred = getPredicate(rapor);
      document.getElementById('liveScorePreview').innerText = rapor.toFixed(2);
      document.getElementById('livePredPreview').innerText = 'Predikat: ' + pred + ' (' + (rapor >= KKTP ? 'Tuntas' : 'Remedial') + ')';
    }

    function switchClass(cls) {
      currentClass = cls;
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText === cls);
      });
      document.getElementById('activeClassLabel').innerText = cls;
      document.getElementById('tableTitle').innerText = 'Rekapitulasi Nilai PJOK - ' + cls;
      cancelEdit();
      renderTable();
    }

    function renderTable() {
      const data = getStoredData(currentClass);
      const quickSelect = document.getElementById('quickStudentSelect');
      if (quickSelect) {
        const currentEditingId = document.getElementById('editStudentId').value;
        quickSelect.innerHTML = '<option value="">+ Tambah Siswa Baru / Ketik Nama Manual</option>';
        data.forEach(std => {
          const opt = document.createElement('option');
          opt.value = std.id;
          const nr = calcRapor(std.nh, std.np, std.pts, std.pas);
          opt.text = (std.nis ? '[' + std.nis + '] ' : '') + std.name + ' (Rapor: ' + nr.toFixed(2) + ')';
          quickSelect.appendChild(opt);
        });
        quickSelect.value = currentEditingId || '';
      }
      const search = (document.getElementById('searchInput').value || '').toLowerCase();
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';

      const filtered = data.filter(s => 
        s.name.toLowerCase().includes(search) || (s.nis && s.nis.toLowerCase().includes(search))
      );

      let totalScore = 0;
      let maxScore = -1;
      let minScore = 999;
      let passCount = 0;

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 24px; color: #94a3b8;">Belum ada data siswa untuk ' + currentClass + '</td></tr>';
      } else {
        filtered.forEach((s, idx) => {
          const rapor = calcRapor(s.nh, s.np, s.pts, s.pas);
          const pred = getPredicate(rapor);
          const isPass = rapor >= KKTP;

          totalScore += rapor;
          if (rapor > maxScore) maxScore = rapor;
          if (rapor < minScore) minScore = rapor;
          if (isPass) passCount++;

          const tr = document.createElement('tr');
          const safeId = escapeHtml(s.id);
          tr.innerHTML = \`
            <td style="text-align: center;">\${idx + 1}</td>
            <td style="text-align: center;" class="font-mono">\${escapeHtml(s.nis || '-')}</td>
            <td style="font-weight: 600;">
              \${escapeHtml(s.name)}
              \${s.extra ? '<div style="font-size: 10px; color: #16a34a; font-weight: normal;">' + escapeHtml(s.extra) + '</div>' : ''}
            </td>
            <td style="text-align: center;">\${escapeHtml(s.gender || 'L')}</td>
            <td style="text-align: right;" class="font-mono">\${s.nh}</td>
            <td style="text-align: right;" class="font-mono">\${s.np}</td>
            <td style="text-align: right;" class="font-mono">\${s.pts}</td>
            <td style="text-align: right;" class="font-mono">\${s.pas}</td>
            <td style="text-align: right; font-weight: 700; background-color: #f0f9ff; color: #0284c7;" class="font-mono">\${rapor.toFixed(2)}</td>
            <td style="text-align: center; font-weight: 700;">\${pred}</td>
            <td style="text-align: center;">
              <span class="\${isPass ? 'badge-pass' : 'badge-remedial'}">\${isPass ? 'Tuntas' : 'Remedial'}</span>
            </td>
            <td class="no-print" style="text-align: center;">
              <button class="action-btn" onclick="editStudent('\${safeId}')">Edit</button>
              <button class="action-btn del" onclick="deleteStudent('\${safeId}')">Hapus</button>
            </td>
          \`;
          tbody.appendChild(tr);
        });
      }

      const count = filtered.length;
      document.getElementById('statCount').innerText = count;
      document.getElementById('statAvg').innerText = count > 0 ? (totalScore / count).toFixed(1) : '0.0';
      document.getElementById('statMax').innerText = count > 0 ? maxScore.toFixed(1) : '0';
      document.getElementById('statMin').innerText = count > 0 ? minScore.toFixed(1) : '0';
      document.getElementById('statPass').innerText = count > 0 ? Math.round((passCount / count) * 100) + '%' : '0%';
    }

    function handleQuickSelectStudent() {
      const selectedId = document.getElementById('quickStudentSelect').value;
      if (!selectedId) {
        cancelEdit();
      } else {
        editStudent(selectedId);
      }
    }

    function upsertByName(list, item, extraField) {
      const normName = (item.name || '').trim().toLowerCase();
      const idx = list.findIndex(s => (s.name || '').trim().toLowerCase() === normName);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...item,
          id: list[idx].id,
          nis: item.nis || list[idx].nis,
          extra: extraField !== undefined ? extraField : list[idx].extra
        };
        return true;
      }
      list.push(item);
      return false;
    }

    function handleSubmit(e) {
      e.preventDefault();
      const id = document.getElementById('editStudentId').value;
      const nis = document.getElementById('studentNis').value.trim();
      const name = document.getElementById('studentName').value.trim();
      const gender = document.getElementById('studentGender').value;
      const nh = parseFloat(document.getElementById('dailyScore').value) || 0;
      const np = parseFloat(document.getElementById('practicalScore').value) || 0;
      const pts = parseFloat(document.getElementById('midtermScore').value) || 0;
      const pas = parseFloat(document.getElementById('finalScore').value) || 0;

      let list = getStoredData(currentClass);
      const normName = name.toLowerCase();
      const existingByName = !id ? list.find(item => (item.name || '').trim().toLowerCase() === normName) : null;
      const targetId = id || (existingByName ? existingByName.id : '');

      if (targetId) {
        list = list.map(item => item.id === targetId ? { ...item, nis: nis || item.nis, name, gender, nh, np, pts, pas } : item);
      } else {
        const newStudent = {
          id: 'std_' + Date.now(),
          nis, name, gender, nh, np, pts, pas
        };
        list.push(newStudent);
      }

      saveStoredData(currentClass, list);
      cancelEdit();
      renderTable();
      showToast(targetId ? 'Nilai siswa "' + name + '" berhasil diperbarui (tanpa duplikasi nama).' : 'Nilai siswa berhasil disimpan.');
    }

    function editStudent(id) {
      const list = getStoredData(currentClass);
      const student = list.find(s => s.id === id);
      if (!student) return;

      document.getElementById('editStudentId').value = student.id;
      const quickSelect = document.getElementById('quickStudentSelect');
      if (quickSelect) quickSelect.value = student.id;
      document.getElementById('studentNis').value = student.nis;
      document.getElementById('studentName').value = student.name;
      document.getElementById('studentGender').value = student.gender || 'L';
      document.getElementById('dailyScore').value = student.nh;
      document.getElementById('practicalScore').value = student.np;
      document.getElementById('midtermScore').value = student.pts;
      document.getElementById('finalScore').value = student.pas;

      document.getElementById('formTitle').innerText = 'Edit Nilai Siswa';
      document.getElementById('btnSubmit').innerText = 'Perbarui Nilai';
      document.getElementById('btnCancelEdit').style.display = 'inline-block';
      updateLiveCalc();
    }

    function cancelEdit() {
      document.getElementById('gradeForm').reset();
      document.getElementById('editStudentId').value = '';
      const quickSelect = document.getElementById('quickStudentSelect');
      if (quickSelect) quickSelect.value = '';
      document.getElementById('formTitle').innerText = 'Form Input Nilai Guru';
      document.getElementById('btnSubmit').innerText = 'Simpan Nilai Siswa';
      document.getElementById('btnCancelEdit').style.display = 'none';
      document.getElementById('liveScorePreview').innerText = '0.00';
      document.getElementById('livePredPreview').innerText = 'Predikat: -';
    }

    function deleteStudent(id) {
      const list = getStoredData(currentClass);
      const target = list.find(s => s.id === id);
      const label = target ? target.name : 'siswa ini';
      openConfirm('Hapus Data Siswa', 'Yakin ingin menghapus data nilai "' + label + '"?', function() {
        const nextList = getStoredData(currentClass).filter(s => s.id !== id);
        saveStoredData(currentClass, nextList);
        if (document.getElementById('editStudentId').value === id) {
          cancelEdit();
        }
        renderTable();
        showToast('Data siswa "' + label + '" berhasil dihapus.');
      });
    }

    function resetSampleData() {
      openConfirm('Muat Data Awal', 'Muat ulang data contoh untuk UPTD SD Negeri Lokojuli? Data saat ini akan diganti.', function() {
        for (let i = 1; i <= 6; i++) {
          const c = 'Kelas ' + i;
          saveStoredData(c, defaultData[c] || []);
        }
        cancelEdit();
        renderTable();
        showToast('Data contoh berhasil dimuat ulang.');
      }, true);
    }

    /* Modal Pengisian Mandiri & Upload Functions */
    function openSelfModal(tab) {
      document.getElementById('selfEntryModal').style.display = 'flex';
      document.getElementById('selfClass').value = currentClass;
      document.getElementById('batchClass').value = currentClass;
      document.getElementById('uploadClass').value = currentClass;
      switchModalTab(tab || 'single');
    }
    function closeSelfModal() {
      document.getElementById('selfEntryModal').style.display = 'none';
    }
    function switchModalTab(tab) {
      document.getElementById('selfSingleView').style.display = tab === 'single' ? 'block' : 'none';
      document.getElementById('selfBatchView').style.display = tab === 'batch' ? 'block' : 'none';
      document.getElementById('selfUploadView').style.display = tab === 'upload' ? 'block' : 'none';
      document.getElementById('tabSingleBtn').classList.toggle('active', tab === 'single');
      document.getElementById('tabBatchBtn').classList.toggle('active', tab === 'batch');
      document.getElementById('tabUploadBtn').classList.toggle('active', tab === 'upload');
    }
    function handleSelfSingleSubmit(e) {
      e.preventDefault();
      const targetClass = document.getElementById('selfClass').value;
      const nis = document.getElementById('selfNis').value.trim() || String(Math.floor(100 + Math.random() * 900));
      const name = document.getElementById('selfName').value.trim();
      const gender = document.getElementById('selfGender').value;
      const h = document.getElementById('selfHeight').value;
      const w = document.getElementById('selfWeight').value;
      const sport = document.getElementById('selfSport').value;

      let extraText = 'Mandiri';
      if (h || w) extraText += ' · TB: ' + (h||'-') + 'cm, BB: ' + (w||'-') + 'kg';
      if (sport) extraText += ' · ' + sport;

      let list = getStoredData(targetClass);
      const wasUpdated = upsertByName(list, {
        id: 'std_self_' + Date.now(),
        nis, name, gender,
        nh: 78, np: 82, pts: 78, pas: 82,
        extra: extraText
      }, extraText);
      saveStoredData(targetClass, list);
      closeSelfModal();
      switchClass(targetClass);
      showToast(wasUpdated ? 'Data siswa ' + name + ' berhasil diperbarui!' : 'Data siswa ' + name + ' berhasil disimpan secara mandiri!');
    }
    function handleSelfBatchSubmit(e) {
      e.preventDefault();
      const targetClass = document.getElementById('batchClass').value;
      const text = document.getElementById('batchText').value;
      const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      let list = getStoredData(targetClass);

      lines.forEach((line, idx) => {
        const parts = line.split(/[,;\\t]/).map(p => p.trim());
        let nis = String(100 + idx + 1);
        let name = line;
        let gender = idx % 2 === 0 ? 'L' : 'P';
        if (parts.length >= 2) {
          nis = parts[0];
          name = parts[1];
          if (parts[2] && parts[2].toUpperCase().startsWith('P')) gender = 'P';
        }
        upsertByName(list, {
          id: 'std_batch_' + Date.now() + '_' + idx,
          nis, name, gender,
          nh: 75, np: 80, pts: 75, pas: 80,
          extra: 'Mandiri (Kolektif)'
        }, 'Mandiri (Kolektif)');
      });

      saveStoredData(targetClass, list);
      closeSelfModal();
      switchClass(targetClass);
      showToast('Berhasil memproses ' + lines.length + ' siswa ke ' + targetClass + '!');
    }
    function handleSelfUploadSubmit(e) {
      e.preventDefault();
      const targetClass = document.getElementById('uploadClass').value;
      const mode = document.getElementById('uploadMode').value;
      const fileInput = document.getElementById('uploadCsvFile');
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target.result;
        const lines = text.split(/\\r?\\n/).map(l => l.trim()).filter(l => l.length > 0);
        let parsed = [];
        let startIndex = 0;
        if (lines.length > 0 && (lines[0].toLowerCase().includes('nama') || lines[0].toLowerCase().includes('siswa'))) {
          startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(/[,;\\t]/).map(p => p.trim());
          if (parts.length >= 2) {
            const nis = parts[0];
            const name = parts[1];
            let gender = 'L';
            if (parts[2] && parts[2].toUpperCase().startsWith('P')) gender = 'P';
            const nh = parseFloat(parts[3]) || 75;
            const np = parseFloat(parts[4]) || 80;
            const pts = parseFloat(parts[5]) || 75;
            const pas = parseFloat(parts[6]) || 80;
            parsed.push({
              id: 'std_up_' + Date.now() + '_' + i,
              nis, name, gender, nh, np, pts, pas,
              extra: 'Diimpor dari berkas'
            });
          }
        }

        if (parsed.length === 0) {
          showToast('Tidak ada data siswa yang berhasil dibaca dari berkas CSV.', true);
          return;
        }

        let existing = getStoredData(targetClass);
        let updated;
        if (mode === 'replace') {
          updated = parsed;
        } else {
          updated = [...existing];
          parsed.forEach(p => upsertByName(updated, p, 'Diimpor dari berkas'));
        }
        saveStoredData(targetClass, updated);
        closeSelfModal();
        switchClass(targetClass);
        showToast('Berhasil mengunggah ' + parsed.length + ' siswa ke ' + targetClass + '!');
      };
      reader.readAsText(file);
    }

    function exportExcel() {
      const list = getStoredData(currentClass);
      if (list.length === 0) {
        showToast('Tidak ada data untuk diekspor!', true);
        return;
      }

      let rowsHtml = '';
      list.forEach((s, idx) => {
        const nr = calcRapor(s.nh, s.np, s.pts, s.pas);
        const pred = getPredicate(nr);
        const stat = nr >= KKTP ? 'Tuntas' : 'Remedial';

        rowsHtml += '<tr>' +
          '<td style="border: 1px solid #94a3b8; text-align: center;">' + (idx + 1) + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: center; mso-number-format:\\'\\\\@\\';">' + escapeHtml(s.nis || '-') + '</td>' +
          '<td style="border: 1px solid #94a3b8;">' + escapeHtml(s.name) + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: center;">' + (s.gender || 'L') + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: right;">' + s.nh + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: right;">' + s.np + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: right;">' + s.pts + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: right;">' + s.pas + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: right; font-weight: bold; background-color: #dbeafe;">' + nr.toFixed(2) + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: center; font-weight: bold;">' + pred + '</td>' +
          '<td style="border: 1px solid #94a3b8; text-align: center;">' + stat + '</td>' +
        '</tr>';
      });

      const template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
        '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Nilai PJOK</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
        '<style>th { background-color: #1e40af; color: white; border: 1px solid #1e3a8a; padding: 6px; }</style>' +
        '</head><body>' +
        '<table>' +
        '<tr><td colspan="11" style="font-size: 16pt; font-weight: bold; text-align: center;">UPTD SD NEGERI LOKOJULI</td></tr>' +
        '<tr><td colspan="11" style="font-size: 12pt; text-align: center;">DAFTAR NILAI PJOK - ' + currentClass.toUpperCase() + '</td></tr>' +
        '<tr><td colspan="11"></td></tr>' +
        '<tr>' +
          '<th>No</th><th>NIS</th><th>Nama Siswa</th><th>L/P</th><th>Nilai Harian (NH)</th><th>Nilai Praktik (NP)</th><th>PTS</th><th>PAS</th><th style="background-color: #0284c7;">Nilai Rapor</th><th>Predikat</th><th>Status</th>' +
        '</tr>' +
        rowsHtml +
        '</table></body></html>';

      const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Nilai_PJOK_' + currentClass.replace(' ', '_') + '_SDN_Lokojuli.xls';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function handleStandalonePrint() {
      let fired = false;
      const onBefore = function() { fired = true; };
      window.addEventListener('beforeprint', onBefore, { once: true });
      try {
        window.print();
      } catch (e) {
        showToast('Tekan Ctrl+P / Cmd+P untuk mencetak halaman ini.', true);
        return;
      }
      setTimeout(function() {
        window.removeEventListener('beforeprint', onBefore);
        if (!fired) {
          showToast('Dialog cetak diblokir preview. Tekan Ctrl+P / Cmd+P atau buka index.html di tab browser baru.', true);
        }
      }, 350);
    }

    // Inisialisasi awal
    window.onload = function() {
      if (!localStorage.getItem('lokojuli_pjok_Kelas 1')) {
        for (let i = 1; i <= 6; i++) {
          const c = 'Kelas ' + i;
          saveStoredData(c, defaultData[c] || []);
        }
      }
      renderTable();
    };
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtmlFile(): void {
  const code = generateStandaloneHtmlCode();
  const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'index.html';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
