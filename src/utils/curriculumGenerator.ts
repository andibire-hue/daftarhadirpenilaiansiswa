import {
  AssessmentPackage,
  AtpRow,
  ClassCurriculumPackage,
  ClassGrade,
  CpRow,
  CurriculumStoreState,
  FasePembelajaran,
  LearningIdentity,
  LearningMaterialItem,
  ModulAjarItem,
  PromesRow,
  ProtaRow,
} from '../types';

export const ALL_CURRICULUM_CLASSES: ClassGrade[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export const CURRICULUM_FIXED_INFO = {
  schoolName: 'UPTD SD NEGERI LOKOJULI',
  subject: 'PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)',
  teacherName: 'Andi Mozes Leavingstone Bire, S.Pd.Gr.',
  academicYear: '2026/2027',
  semester: '1 (Ganjil)',
};

export function getFaseForClass(kelas: ClassGrade): FasePembelajaran {
  if (kelas === 'Kelas 1' || kelas === 'Kelas 2') return 'Fase A';
  if (kelas === 'Kelas 3' || kelas === 'Kelas 4') return 'Fase B';
  return 'Fase C';
}

export function createLearningIdentity(kelas: ClassGrade): LearningIdentity {
  return {
    schoolName: CURRICULUM_FIXED_INFO.schoolName,
    subject: CURRICULUM_FIXED_INFO.subject,
    teacherName: CURRICULUM_FIXED_INFO.teacherName,
    academicYear: CURRICULUM_FIXED_INFO.academicYear,
    semester: CURRICULUM_FIXED_INFO.semester,
    kelas,
    fase: getFaseForClass(kelas),
  };
}

/**
 * Exact verbatim CP Kelas 6 (Fase C) read from the attached file:
 * /public/assets/aistudio/CP_DAN_ATP_SMS_1_KELAS_1-6_5dc2e806
 */
export const ATTACHED_KELAS_6_CP_ROWS: CpRow[] = [
  {
    id: 'cp_k6_1',
    no: '1',
    elemen: 'Terampil bergerak',
    capaianPembelajaran:
      'Peserta didik menyesuaikan dan memodifikasi keterampilan gerak melintasi berbagai situasi gerak. Peserta didik mentransfer strategi gerak yang sudah dikuasai ke dalam berbagai situasi gerak yang berbeda. Peserta didik menginvestigasi berbagai konsep gerak yang dapat diterapkan untuk meningkatkan capaian keterampilan gerak.',
    sourceSheet: 'Lampiran CSV (CP Kelas 6 / Fase C)',
  },
  {
    id: 'cp_k6_2',
    no: '2',
    elemen: 'Belajar Melalui Gerak',
    capaianPembelajaran:
      'Peserta didik memprediksi dan menguji efektivitas penerapan strategi gerak dalam berbagai situasi gerak. Peserta didik merancang dan menguji peraturan alternatif dan modifikasi permainan untuk mendukung fair play dan partisipasi  inklusif.  Peserta  didik berpartisipasi secara positif dalam kelompok atau tim dengan memberi kontribusi pada aktivitas kelompok, mendorong orang lain dan menegosiasikan peran dan tanggung jawab',
    sourceSheet: 'Lampiran CSV (CP Kelas 6 / Fase C)',
  },
  {
    id: 'cp_k6_3',
    no: '3',
    elemen: 'Bergaya Hidup Aktif',
    capaianPembelajaran:
      'Peserta didik berpartisipasi dalam aktivitas jasmani untuk menggambarkan pengaruh aktivitas jasmani yang teratur terhadap kesehatan. Peserta didik berpartisipasi dalam aktivitas jasmani di luar ruang dan/atau lingkungan alam dan menggambarkan faktor-faktor yang mempengaruhi partisipasi, baik secara pribadi maupun kelompok. Peserta didik mengeksplorasi rekomendasi aktivitas jasmani serta pencegahan perilaku sedenter dan membahas strategi pencapaiannya.',
    sourceSheet: 'Lampiran CSV (CP Kelas 6 / Fase C)',
  },
  {
    id: 'cp_k6_4',
    no: '4',
    elemen: 'Memilih Hidup yang Menyehatkan',
    capaianPembelajaran:
      'Peserta didik mengidentifikasi risiko kesehatan akibat gaya hidup dan pencegahan melalui aktivitas jasmani berdasarkan rekomendasi otoritas kesehatan, memilih makanan sehat untuk menunjang aktivitas jasmani berdasarkan informasi kandungan gizi pada makanan, dan mempraktikkan penanganan cedera sedang sesuai pemahaman tentang prinsip pertolongan pertama',
    sourceSheet: 'Lampiran CSV (CP Kelas 6 / Fase C)',
  },
];

function matchCpTextForElemen(cpRows: CpRow[], elemen: string): string {
  if (cpRows.length === 0) {
    return 'Data Capaian Pembelajaran asli untuk kelas ini belum dimuat dari file .xlsx.';
  }
  const norm = elemen.trim().toLowerCase();
  const exact = cpRows.find((c) => c.elemen.trim().toLowerCase() === norm);
  if (exact) return `[${exact.elemen}] ${exact.capaianPembelajaran}`;
  const partial = cpRows.find(
    (c) =>
      c.elemen.trim().toLowerCase().includes(norm) ||
      norm.includes(c.elemen.trim().toLowerCase())
  );
  if (partial) return `[${partial.elemen}] ${partial.capaianPembelajaran}`;
  return cpRows.map((c) => `[${c.elemen}] ${c.capaianPembelajaran}`).join('\n');
}

function getAgeToneDescriptor(fase: FasePembelajaran, kelas: ClassGrade): string {
  if (fase === 'Fase A') {
    return `Peserta didik ${kelas} (${fase}, usia 6–8 tahun) belajar paling baik melalui aktivitas bermain aktif, peniruan gerak sederhana, instruksi singkat yang jelas, serta suasana gembira tanpa tekanan kompetisi berlebihan.`;
  }
  if (fase === 'Fase B') {
    return `Peserta didik ${kelas} (${fase}, usia 8–10 tahun) mulai mampu memadukan gerak dasar menjadi rangkaian gerak terkoordinasi, memahami aturan permainan sederhana, serta bekerja sama dalam kelompok kecil.`;
  }
  return `Peserta didik ${kelas} (${fase}, usia 10–12 tahun) mampu menganalisis strategi gerak, memodifikasi aturan permainan inklusif untuk mendukung fair play, serta memahami hubungan aktivitas jasmani dengan kebugaran dan kesehatan.`;
}

function getNttContextExample(
  kelas: ClassGrade,
  elemen: string,
  materi: string
): string {
  const combined = `${elemen} ${materi}`.toLowerCase();

  if (
    combined.includes('sehat') ||
    combined.includes('gizi') ||
    combined.includes('makan') ||
    combined.includes('cedera') ||
    combined.includes('p3k') ||
    combined.includes('kesehatan') ||
    combined.includes('hidup')
  ) {
    return `Mengaitkan kebiasaan hidup sehat di wilayah Nusa Tenggara Timur (Sabu, Raijua, Rote, Timor, dan Flores), seperti memilih pangan lokal bergizi (daun kelor, jagung bose, kacang hijau, ikan laut segar) sebelum dan sesudah berolahraga, membiasakan minum air bersih yang cukup saat cuaca terik sabana, serta pertolongan pertama sederhana saat lecet atau keseleo di halaman sekolah.`;
  }

  if (
    combined.includes('air') ||
    combined.includes('renang') ||
    combined.includes('akuatik')
  ) {
    return `Mengaitkan pengenalan keselamatan aktivitas air dengan kondisi pesisir pulau-pulau di NTT seperti Sabu, Raijua, Rote, dan Flores—menekankan pentingnya mengenali kedalaman air, tidak bermain di arus deras sendirian, dan melakukan pemanasan sebelum beraktivitas.`;
  }

  if (
    combined.includes('senam') ||
    combined.includes('irama') ||
    combined.includes('ritmik')
  ) {
    return `Menggunakan hitungan ketukan tepuk tangan bersama atau iringan lagu/musik daerah NTT (seperti irama ceria dari Rote, Sabu, Timor, atau Flores) untuk melatih kelenturan, keseimbangan, dan kekompakan gerak siswa ${kelas}.`;
  }

  if (
    combined.includes('kebugaran') ||
    combined.includes('aktif') ||
    combined.includes('jasmani') ||
    combined.includes('luar ruang')
  ) {
    return `Memanfaatkan aktivitas fisik sehari-hari anak di Sabu, Raijua, Rote, Timor, dan Flores seperti berjalan kaki teratur ke sekolah melalui medan datar maupun berbukit, lari estafet di halaman sekolah, serta permainan tradisional yang mengurangi kebiasaan diam terlalu lama (sedenter).`;
  }

  return `Menggunakan contoh gerak yang akrab dengan keseharian anak di Sabu, Raijua, Rote, Timor, dan Flores—seperti permainan kejar-kejaran, lempar tangkap sasaran sederhana, berlari zig-zag melewati patok kayu atau botol bekas di halaman tanah lapang, serta menjunjung tinggi sportivitas dan kebersamaan teman.`;
}

function getSimpleMovementExample(
  fase: FasePembelajaran,
  materi: string,
  tp: string
): string {
  const topic = materi || tp;
  if (fase === 'Fase A') {
    return `1) Pemanasan gerak menirukan hewan/alam sekitar secara perlahan.\n2) Latihan gerak inti "${topic}" dalam jarak pendek (5–10 meter) dengan tempo pelan lalu sedang.\n3) Permainan estafet berpasangan secara bergantian dan tertib.`;
  }
  if (fase === 'Fase B') {
    return `1) Pemanasan dinamis dengan lari kecil dan peregangan sendi utama.\n2) Praktik kombinasi gerak "${topic}" secara berurutan (awal, pelaksanaan, dan sikap akhir yang seimbang).\n3) Penerapan dalam permainan kelompok kecil 4–5 siswa dengan aturan sederhana.`;
  }
  return `1) Pemanasan spesifik dan mobilitas sendi sesuai kebutuhan aktivitas "${topic}".\n2) Latihan variasi serta modifikasi keterampilan gerak "${topic}" dalam berbagai arah dan situasi.\n3) Penerapan strategi gerak dan aturan permainan modifikasi yang adil (fair play) serta inklusif bagi seluruh siswa.`;
}

function getPracticalActivity3T(
  kelas: ClassGrade,
  materi: string,
  tp: string
): string {
  const topic = materi || tp;
  return `Aktivitas praktik lapangan ${kelas} untuk materi "${topic}" menggunakan sarana sederhana sekolah dasar 3T: siswa dibagi ke dalam kelompok kecil (4–6 anak) di halaman sekolah dengan batas garis kapur/tali rafia dan cone dari botol air mineral bekas. Setiap kelompok mencoba variasi gerak secara bergiliran, saling memberi semangat, dan menyesuaikan tingkat kesulitan agar semua teman dapat berpartisipasi aktif.`;
}

function getSafetyRules(kelas: ClassGrade): string {
  return `1) Memeriksa kondisi lapangan/halaman sekolah agar bebas dari batu tajam, pecahan kaca, atau genangan licin.\n2) Memakai pakaian olahraga/seragam yang nyaman dan alas kaki yang aman.\n3) Melakukan pemanasan sebelum praktik dan pendinginan setelah selesai.\n4) Mendengarkan aba-aba peluit guru, menjaga jarak aman antar siswa ${kelas}, dan segera melapor jika merasa pusing, lelah berlebihan, atau cedera.`;
}

export function buildCurriculumPackageForClass(
  kelas: ClassGrade,
  cpRows: CpRow[],
  atpRows: AtpRow[],
  cpSourceSheet: string | null,
  atpSourceSheet: string | null
): ClassCurriculumPackage {
  const fase = getFaseForClass(kelas);
  const identity = createLearningIdentity(kelas);

  let cumulativeMeetingStart = 1;

  const protaRows: ProtaRow[] = [];
  const promesRows: PromesRow[] = [];
  const materials: LearningMaterialItem[] = [];
  const modulAjarList: ModulAjarItem[] = [];

  atpRows.forEach((atp, idx) => {
    const jp = Number(atp.alokasiJp) || 0;
    const meetingCount = jp > 0 ? Math.max(1, Math.round(jp / 2)) : 1;
    const meetingEnd = cumulativeMeetingStart + meetingCount - 1;
    const pertemuanDisplay =
      atp.pertemuanLabel?.trim() ||
      (meetingCount === 1
        ? `Pertemuan ${cumulativeMeetingStart}`
        : `Pertemuan ${cumulativeMeetingStart}–${meetingEnd}`);
    cumulativeMeetingStart = meetingEnd + 1;

    const materiLabel =
      atp.lingkupMateri.trim() || `Materi Pokok ${atp.no || idx + 1}: ${atp.elemen}`;

    // 4. PROTA row
    protaRows.push({
      id: `prota_${kelas}_${idx + 1}`,
      atpId: atp.id,
      no: atp.no || String(idx + 1),
      elemen: atp.elemen,
      tujuanPembelajaran: atp.tujuanPembelajaran,
      lingkupMateri: materiLabel,
      alokasiJp: jp,
      distribusiPembelajaran: `Semester 1 · ${pertemuanDisplay} (${jp} JP)`,
    });

    // 5. PROMES row
    promesRows.push({
      id: `promes_${kelas}_${idx + 1}`,
      atpId: atp.id,
      no: atp.no || String(idx + 1),
      urutanPertemuan: pertemuanDisplay,
      elemen: atp.elemen,
      tujuanPembelajaran: atp.tujuanPembelajaran,
      materiPembelajaran: materiLabel,
      alokasiJp: jp,
      mingguPeriode: 'Disesuaikan guru (Minggu ... / Bulan ...)',
    });

    // 6. Materi Pembelajaran
    const contohGerakan = getSimpleMovementExample(
      fase,
      materiLabel,
      atp.tujuanPembelajaran
    );
    const aktivitasPraktik = getPracticalActivity3T(
      kelas,
      materiLabel,
      atp.tujuanPembelajaran
    );
    const manfaat = `Membantu peserta didik ${kelas} mencapai tujuan pembelajaran "${atp.tujuanPembelajaran}", melatih kebugaran jasmani, ketangkasan, kerja sama tim, dan kebiasaan hidup aktif serta sehat.`;
    const keselamatan = getSafetyRules(kelas);
    const konteksNtt = getNttContextExample(kelas, atp.elemen, materiLabel);

    materials.push({
      id: `mat_${kelas}_${idx + 1}`,
      atpId: atp.id,
      no: atp.no || String(idx + 1),
      elemen: atp.elemen,
      tujuanPembelajaran: atp.tujuanPembelajaran,
      lingkupMateri: materiLabel,
      penjelasanMateri: `Materi "${materiLabel}" pada elemen ${atp.elemen} dirancang khusus untuk peserta didik ${kelas} (${fase}). Fokus pembelajaran diarahkan langsung pada pencapaian tujuan: ${atp.tujuanPembelajaran}. Guru menjelaskan konsep gerak dengan bahasa sederhana, demonstrasi langsung yang jelas, dan pengulangan bertahap sesuai kemampuan siswa.`,
      contohGerakan,
      aktivitasPraktik,
      manfaatPembelajaran: manfaat,
      aturanKeselamatan: keselamatan,
      konteksNtt,
    });

    // 7. Modul Ajar (22 required components, strictly linked to ATP row)
    const matchedCp = atp.capaianPembelajaran?.trim()
      ? `[${atp.elemen}] ${atp.capaianPembelajaran.trim()}`
      : matchCpTextForElemen(cpRows, atp.elemen);

    modulAjarList.push({
      id: `modul_${kelas}_${idx + 1}`,
      atpId: atp.id,
      no: atp.no || String(idx + 1),
      elemen: atp.elemen,
      alokasiJp: jp,
      identitasModul: `${identity.schoolName} | Mapel: PJOK | ${kelas} (${fase}) | Semester 1 Tahun Ajaran ${identity.academicYear} | Guru: ${identity.teacherName} | Elemen: ${atp.elemen} | Alokasi: ${jp} JP (${pertemuanDisplay})`,
      kompetensiAwal: `Peserta didik ${kelas} telah mengenal gerak dasar sehari-hari (berjalan, berlari, melompat, melempar/menangkap, menjaga keseimbangan) dan siap berpartisipasi aktif mengikuti instruksi keselamatan di lapangan.`,
      capaianPembelajaran: matchedCp,
      tujuanPembelajaran: atp.tujuanPembelajaran,
      profilKarakter:
        'Keimanan dan ketakwaan kepada Tuhan YME (berdoa sebelum/sesudah praktik), Kesehatan (bugar dan peduli keselamatan), Kolaborasi (kerja sama tim dan fair play), Kemandirian (berani mencoba dan disiplin), serta Penalaran Kritis (memperbaiki strategi/teknik gerak).',
      saranaPrasarana:
        'Sarana adaptif sekolah dasar wilayah 3T: halaman sekolah atau tanah lapang yang aman, peluit guru, tali rafia/kapur garis pembatas, botol bekas berisi pasir/air sebagai cone, bola plastik/karet atau modifikasi bola kain/daun lontar sesuai ketersediaan sekolah.',
      karakteristikPesertaDidik: getAgeToneDescriptor(fase, kelas),
      pendekatanMetode:
        'Pendekatan Pembelajaran Mendalam (Deep Learning) berprinsip Berkesadaran (sadar posisi tubuh, napas, dan keselamatan), Bermakna (terhubung dengan gerak dan budaya sehari-hari anak NTT), serta Menggembirakan (permainan modifikasi inklusif). Metode: demonstrasi terbimbing, latihan bertahap, permainan kelompok kecil, dan refleksi bersama.',
      pemahamanBermakna: `Melalui penguasaan materi "${materiLabel}", peserta didik menyadari bahwa bergerak dengan teknik yang benar, sportif, dan aman membuat tubuh lebih kuat, ceria, dan terhindar dari cedera saat bermain maupun beraktivitas di lingkungan rumah dan sekolah.`,
      pertanyaanPemantik: `1) Gerakan apa yang paling sering kalian lakukan saat bermain bersama teman di halaman rumah atau sepulang sekolah?\n2) Mengapa kita perlu melakukan pemanasan dan menjaga sikap tubuh yang benar saat mempraktikkan "${materiLabel}"?\n3) Bagaimana cara agar semua teman dalam kelompok bisa ikut bermain dengan aman dan gembira?`,
      materiPembelajaran: `${materiLabel}\n- Konteks NTT: ${konteksNtt}\n- Contoh Gerak: ${contohGerakan}`,
      langkahPembelajaran: `Alur Pembelajaran Mendalam (Deep Learning) selama ${jp} JP (${pertemuanDisplay}): Pendahuluan Berkesadaran & Menggembirakan (±15% waktu) → Kegiatan Inti Eksplorasi, Latihan Terbimbing & Permainan Bermakna (±70% waktu) → Penutup Pendinginan & Refleksi (±15% waktu).`,
      kegiatanPendahuluan: `1) Guru membuka pembelajaran dengan salam, doa bersama, dan mengecek kesiapan fisik serta kehadiran siswa (Berkesadaran).\n2) Guru memeriksa area lapangan bersama siswa untuk memastikan keamanan dari batu atau benda tajam.\n3) Apersepsi mengaitkan pengalaman bermain siswa di lingkungan Sabu/Raijua/Rote/Timor/Flores dengan tujuan: "${atp.tujuanPembelajaran}".\n4) Pemanasan dinamis berbentuk permainan ringan yang ceria untuk menyiapkan otot dan sendi (Menggembirakan).`,
      kegiatanInti: `1) Memahami (Berkesadaran): Guru mendemonstrasikan gerakan inti "${materiLabel}" secara jelas; siswa mengamati posisi tubuh dan pola gerak yang benar.\n2) Mengaplikasikan (Bermakna & Menggembirakan): Siswa mempraktikkan gerak secara individu, berpasangan, lalu dalam permainan kelompok kecil yang dimodifikasi agar inklusif bagi semua siswa.\n3) Merefleksi dalam Aksi: Guru memberi umpan balik langsung dan mendorong siswa saling memberi dorongan positif (fair play) serta memperbaiki gerak secara mandiri.`,
      kegiatanPenutup: `1) Siswa melakukan gerakan pendinginan dan pengaturan napas bersama guru.\n2) Guru memfasilitasi refleksi singkat tentang kesulitan, kemajuan, dan perasaan siswa selama praktik.\n3) Guru memberikan apresiasi atas usaha dan sportivitas seluruh siswa, menyampaikan pesan keselamatan serta kebiasaan minum air dan menjaga kebersihan setelah berolahraga, lalu menutup dengan doa.`,
      asesmenDiagnostik:
        'Pertanyaan lisan awal dan pengamatan cepat kesiapan fisik serta penguasaan gerak dasar siswa saat pemanasan.',
      asesmenFormatif:
        'Observasi langsung proses gerak siswa selama kegiatan inti menggunakan daftar cek ketercapaian indikator keterampilan, sikap sportivitas, dan kepatuhan aturan keselamatan.',
      asesmenSumatif: `Penilaian unjuk kerja praktik dan pemahaman konsep "${materiLabel}" di akhir lingkup tujuan pembelajaran "${atp.tujuanPembelajaran}" dengan acuan KKTP sekolah.`,
      rubrikPenilaian:
        'Skor 4 (Sangat Baik): melakukan seluruh rangkaian gerak tepat, seimbang, percaya diri, dan sportif; Skor 3 (Baik): gerak sesuai prosedur dengan sedikit koreksi; Skor 2 (Cukup): mampu meniru sebagian gerak dengan bimbingan guru; Skor 1 (Perlu Bimbingan): masih ragu/belum menguasai pola gerak dasar dan memerlukan pendampingan khusus.',
      remedialPengayaan:
        'Remedial: pendampingan gerak bertahap dengan jarak/target lebih dekat dan tempo lebih lambat bersama tutor sebaya atau guru. Pengayaan: tantangan variasi gerak lebih kompleks atau menjadi pemimpin pemanasan/kapten kelompok inklusif.',
      refleksiGuru: `1) Apakah tujuan "${atp.tujuanPembelajaran}" telah dicapai oleh mayoritas siswa ${kelas}?\n2) Bagian aktivitas mana yang paling membuat siswa berkesadaran, bermakna, dan gembira?\n3) Modifikasi alat/lapangan apa yang perlu diperbaiki pada pertemuan berikutnya?`,
      refleksiPesertaDidik: `1) Gerakan apa yang sudah kamu kuasai hari ini pada materi "${materiLabel}"?\n2) Bagian mana yang masih terasa sulit dan ingin kamu latih lagi?\n3) Bagaimana perasaanmu saat bermain dan bekerja sama dengan teman-teman tadi?`,
    });
  });

  const totalJpSemester1 = atpRows.reduce(
    (acc, r) => acc + (Number(r.alokasiJp) || 0),
    0
  );

  const assessmentPackage: AssessmentPackage = {
    sikapKarakter: `Observasi sikap peserta didik ${kelas} selama pembelajaran PJOK Semester 1: (1) Berdoa dan bersyukur, (2) Kerja sama dan tidak mengejek teman (fair play & inklusif), (3) Disiplin mengikuti aba-aba keselamatan guru, (4) Kejujuran dalam permainan dan pengukuran hasil.`,
    pengetahuan: `Penilaian lisan, tanya jawab reflektif, atau lembar soal singkat sesuai tingkat ${kelas} (${fase}) tentang pemahaman konsep gerak, aturan permainan aman, manfaat aktivitas jasmani, dan pola hidup sehat berdasarkan seluruh tujuan pembelajaran pada ATP.`,
    keterampilanGerak: `Penilaian praktik lapangan yang mengukur ketepatan sikap awal, pelaksanaan gerak, dan sikap akhir/keseimbangan sesuai setiap Tujuan Pembelajaran pada ATP ${kelas}. Nilai praktik dikonversi ke skala 0–100 (Nilai Praktik / NP) agar terhubung langsung dengan Buku Nilai PJOK.`,
    rubrikIndikator: [
      {
        aspek: 'Sikap Awal & Kesiapan Gerak',
        skor4: 'Posisi tubuh tepat, fokus penuh, dan siap tanpa arahan ulang.',
        skor3: 'Posisi tubuh benar dengan sedikit pengingat dari guru.',
        skor2: 'Posisi tubuh kurang seimbang dan masih perlu dicontohkan ulang.',
        skor1: 'Belum memahami sikap awal yang aman dan tepat.',
      },
      {
        aspek: 'Pelaksanaan Keterampilan Gerak',
        skor4: 'Gerak terkoordinasi, lancar, aman, dan sesuai tujuan pembelajaran ATP.',
        skor3: 'Gerak cukup lancar dan tepat meskipun sesekali kurang stabil.',
        skor2: 'Gerak masih terputus-putus namun menunjukkan usaha mengikuti prosedur.',
        skor1: 'Belum mampu melakukan pola gerak inti tanpa bantuan langsung.',
      },
      {
        aspek: 'Sikap Akhir, Fair Play & Keselamatan',
        skor4: 'Mendarat/berhenti seimbang, menjaga keselamatan, dan menyemangati teman.',
        skor3: 'Sikap akhir cukup terkendali dan mematuhi aturan permainan.',
        skor2: 'Kadang kehilangan keseimbangan atau lupa menjaga jarak aman.',
        skor1: 'Kurang memperhatikan keselamatan diri maupun teman saat praktik.',
      },
    ],
    refleksiGuru: `Catatan evaluasi guru (Andi Mozes Leavingstone Bire, S.Pd.Gr.) terhadap ketercapaian seluruh ${atpRows.length} Tujuan Pembelajaran ATP ${kelas} Semester 1 (${totalJpSemester1} JP), efektivitas media 3T, dan tindak lanjut remedial/pengayaan.`,
    refleksiPesertaDidik: `Pertanyaan pemandu refleksi bagi siswa ${kelas}: Apa hal baru yang paling menyenangkan dalam pelajaran PJOK semester ini, keterampilan apa yang paling dikuasai, dan kebiasaan sehat apa yang akan dilakukan di rumah?`,
  };

  return {
    kelas,
    fase,
    identity,
    cpSourceSheet,
    atpSourceSheet,
    cpRows,
    atpRows,
    protaRows,
    promesRows,
    materials,
    modulAjarList,
    assessmentPackage,
    totalJpSemester1,
    updatedAt: new Date().toISOString(),
  };
}

export function createInitialCurriculumStore(): CurriculumStoreState {
  const classes = {} as Record<ClassGrade, ClassCurriculumPackage>;
  ALL_CURRICULUM_CLASSES.forEach((cls) => {
    const initialCp = cls === 'Kelas 6' ? ATTACHED_KELAS_6_CP_ROWS : [];
    const cpSheet =
      cls === 'Kelas 6' ? 'Lampiran CSV (CP Kelas 6 / Fase C)' : null;
    classes[cls] = buildCurriculumPackageForClass(cls, initialCp, [], cpSheet, null);
  });

  return {
    sourceFileName: 'CP_DAN_ATP_SMS_1_KELAS_1-6_5dc2e806 (Lampiran CSV: CP Kelas 6)',
    importedAt: new Date().toISOString(),
    detectedSheets: ['Sheet1 (CP Kelas 6 / Fase C)'],
    classes,
  };
}
