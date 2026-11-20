import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';
import { StudentGrade, ClassGrade, SchoolInfo } from '../types';
import { calculateFinalScore, calculatePredicate, calculateStatus } from '../utils/gradeCalculations';

interface SelfRegistrationModalProps {
  isOpen: boolean;
  defaultClass: ClassGrade;
  schoolInfo: SchoolInfo;
  onClose: () => void;
  onSaveSelfStudent: (targetClass: ClassGrade, student: Omit<StudentGrade, 'id' | 'updatedAt'>) => void;
  onBatchAddStudents: (targetClass: ClassGrade, students: Array<Omit<StudentGrade, 'id' | 'updatedAt'>>) => void;
}

const ALL_CLASSES: ClassGrade[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

const SPORTS_LIST = [
  'Sepak Bola / Futsal',
  'Bola Voli',
  'Senam Kebugaran Jasmani (SKJ)',
  'Lari & Atletik',
  'Bulu Tangkis',
  'Permainan Kasti',
  'Renang',
  'Tenis Meja',
  'Aktivitas Kebugaran Mandiri',
];

export const SelfRegistrationModal: React.FC<SelfRegistrationModalProps> = ({
  isOpen,
  defaultClass,
  schoolInfo,
  onClose,
  onSaveSelfStudent,
  onBatchAddStudents,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [selectedClass, setSelectedClass] = useState<ClassGrade>(defaultClass);

  // Single form states
  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [favoriteSport, setFavoriteSport] = useState(SPORTS_LIST[0]);
  const [includeGrades, setIncludeGrades] = useState(false);
  const [dailyScore, setDailyScore] = useState('80');
  const [practicalScore, setPracticalScore] = useState('85');
  const [midtermScore, setMidtermScore] = useState('80');
  const [finalScore, setFinalScore] = useState('85');
  const [notes, setNotes] = useState('');

  // Batch import state
  const [batchText, setBatchText] = useState('');
  const [batchPreview, setBatchPreview] = useState<Array<{ nis: string; name: string; gender: 'L' | 'P' }>>([]);

  // Success view state
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedClass(defaultClass);
      setSubmittedName(null);
      setNis('');
      setName('');
      setGender('L');
      setHeightCm('');
      setWeightKg('');
      setFavoriteSport(SPORTS_LIST[0]);
      setIncludeGrades(false);
      setDailyScore('80');
      setPracticalScore('85');
      setMidtermScore('80');
      setFinalScore('85');
      setNotes('');
      setBatchText('');
      setBatchPreview([]);
    }
  }, [isOpen, defaultClass]);

  if (!isOpen) return null;

  // Single submit handler
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nh = includeGrades ? parseFloat(dailyScore) || 0 : 75;
    const np = includeGrades ? parseFloat(practicalScore) || 0 : 80;
    const pts = includeGrades ? parseFloat(midtermScore) || 0 : 75;
    const pas = includeGrades ? parseFloat(finalScore) || 0 : 80;

    const finalReportScore = calculateFinalScore(nh, np, pts, pas);
    const predicate = calculatePredicate(finalReportScore);
    const status = calculateStatus(finalReportScore, schoolInfo.kktp);

    const studentData: Omit<StudentGrade, 'id' | 'updatedAt'> = {
      nis: nis.trim() || String(Math.floor(100 + Math.random() * 900)),
      name: name.trim(),
      gender,
      dailyScore: nh,
      practicalScore: np,
      midtermScore: pts,
      finalScore: pas,
      finalReportScore,
      predicate,
      status,
      notes: notes.trim() || `Pendaftaran mandiri siswa - Minat: ${favoriteSport}`,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      favoriteSport,
      isSelfRegistered: true,
    };

    onSaveSelfStudent(selectedClass, studentData);
    setSubmittedName(name.trim());
  };

  // Parse batch text
  const parseBatchText = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const result: Array<{ nis: string; name: string; gender: 'L' | 'P' }> = [];

    lines.forEach((line, idx) => {
      // Possible separators: comma, tab, semicolon
      let parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        // format: NIS, Nama, (L/P)
        const parsedNis = parts[0];
        const parsedName = parts[1];
        let parsedGender: 'L' | 'P' = 'L';
        if (parts[2]) {
          const g = parts[2].toUpperCase();
          if (g.startsWith('P')) parsedGender = 'P';
        }
        if (parsedName) {
          result.push({ nis: parsedNis, name: parsedName, gender: parsedGender });
        }
      } else {
        // Just name format
        result.push({
          nis: String(100 + idx + 1),
          name: line,
          gender: idx % 2 === 0 ? 'L' : 'P',
        });
      }
    });

    return result;
  };

  const handleBatchTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setBatchText(val);
    setBatchPreview(parseBatchText(val));
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchPreview.length === 0) return;

    const newStudents: Array<Omit<StudentGrade, 'id' | 'updatedAt'>> = batchPreview.map((item) => {
      const nh = 75;
      const np = 80;
      const pts = 75;
      const pas = 80;
      const finalReportScore = calculateFinalScore(nh, np, pts, pas);

      return {
        nis: item.nis,
        name: item.name,
        gender: item.gender,
        dailyScore: nh,
        practicalScore: np,
        midtermScore: pts,
        finalScore: pas,
        finalReportScore,
        predicate: calculatePredicate(finalReportScore),
        status: calculateStatus(finalReportScore, schoolInfo.kktp),
        notes: 'Diinput secara mandiri (kolektif kelas)',
        isSelfRegistered: true,
      };
    });

    onBatchAddStudents(selectedClass, newStudents);
    setSubmittedName(`${batchPreview.length} Siswa ${selectedClass}`);
  };

  const handleResetForm = () => {
    setSubmittedName(null);
    setNis('');
    setName('');
    setHeightCm('');
    setWeightKg('');
    setNotes('');
    setBatchText('');
    setBatchPreview([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-800 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pengisian Data Siswa Mandiri
              </h3>
              <p className="text-xs text-blue-200">
                {schoolInfo.schoolName} · PJOK
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

        {/* Tab Selection */}
        {!submittedName && (
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'single'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Input Siswa Perorangan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'batch'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Input Sekaligus (Tempel Daftar)</span>
            </button>
          </div>
        )}

        {/* Body Modal */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {submittedName ? (
            /* Success confirmation screen */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in duration-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Data Siswa Berhasil Disimpan!
                </h4>
                <p className="text-sm text-slate-600 max-w-sm mx-auto mt-1">
                  Data <b>{submittedName}</b> telah otomatis dimasukkan ke dalam daftar{' '}
                  <span className="font-semibold text-blue-700">{selectedClass}</span> dan tersimpan di sistem.
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-left max-w-md mx-auto text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Informasi Penilaian PJOK</span>
                </div>
                <p>• Data langsung muncul pada tabel rekapitulasi kelas {selectedClass}.</p>
                <p>• Guru PJOK dapat sewaktu-waktu memperbarui nilai harian, praktik lapangan, dan ujian.</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Isi Data Siswa Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Selesai & Lihat Tabel
                </button>
              </div>
            </div>
          ) : activeTab === 'single' ? (
            /* Mode 1: Input Siswa Perorangan */
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Formulir ini dapat diisi langsung oleh siswa, orang tua, atau perwakilan kelas untuk mendata keikutsertaan mata pelajaran PJOK.
                </span>
              </div>

              {/* Pilihan Kelas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kelas <span className="text-red-500">*</span>
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

              {/* NIS & Nama Siswa */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Induk / NIS
                  </label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 106"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Siswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ketik nama lengkap siswa..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('L')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center cursor-pointer ${
                      gender === 'L'
                        ? 'bg-blue-50 text-blue-700 border-blue-600 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Laki-laki (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('P')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center cursor-pointer ${
                      gender === 'P'
                        ? 'bg-blue-50 text-blue-700 border-blue-600 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Perempuan (P)
                  </button>
                </div>
              </div>

              {/* Data Kebugaran & Minat PJOK */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Data Fisik & Minat Olahraga (Opsional)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tinggi Badan (cm)
                    </label>
                    <input
                      type="number"
                      min="80"
                      max="190"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="Contoh: 135"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Berat Badan (kg)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="90"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="Contoh: 32"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cabang Olahraga yang Disukai / Diminati
                  </label>
                  <select
                    value={favoriteSport}
                    onChange={(e) => setFavoriteSport(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                  >
                    {SPORTS_LIST.map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opsi Pengisian Nilai Langsung */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeGrades}
                    onChange={(e) => setIncludeGrades(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Sertakan input nilai awal (opsional)
                  </span>
                </label>

                {includeGrades && (
                  <div className="grid grid-cols-4 gap-2 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        NH
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={dailyScore}
                        onChange={(e) => setDailyScore(e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        NP
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={practicalScore}
                        onChange={(e) => setPracticalScore(e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        PTS
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={midtermScore}
                        onChange={(e) => setMidtermScore(e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        PAS
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={finalScore}
                        onChange={(e) => setFinalScore(e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono border rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <span>Simpan Data Mandiri</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: Input Massal Sekaligus (Batch Import) */
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">
                  Cara Pengisian Cepat (Tempel / Copy-Paste):
                </p>
                <p>
                  Tempel daftar nama siswa dari berkas Word/Excel atau buku induk.
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Format contoh: <code>101, Nama Siswa, L</code> atau cukup satu nama per baris.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Kelas <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempel Baris Data Siswa
                </label>
                <textarea
                  rows={6}
                  value={batchText}
                  onChange={handleBatchTextChange}
                  placeholder={`Contoh:\n101, Ahmad Kurniawan, L\n102, Beatrice Lado, P\n103, Daud Rihi, L`}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              {batchPreview.length > 0 && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-blue-900 mb-1.5 flex items-center justify-between">
                    <span>Terdeteksi {batchPreview.length} Siswa:</span>
                    <span className="text-[11px] font-normal text-blue-700">Siap ditambahkan ke {selectedClass}</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-slate-700">
                    {batchPreview.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{idx + 1}.</span>
                        <span className="font-mono text-blue-700 font-semibold">{item.nis}</span>
                        <span>{item.name}</span>
                        <span className="text-slate-400">({item.gender})</span>
                      </div>
                    ))}
                    {batchPreview.length > 5 && (
                      <div className="text-[11px] text-slate-500 italic">
                        ...dan {batchPreview.length - 5} siswa lainnya.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={batchPreview.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs cursor-pointer"
                >
                  <span>Tambahkan {batchPreview.length} Siswa ke {selectedClass}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
