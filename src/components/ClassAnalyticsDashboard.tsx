import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { StudentGrade, ClassGrade } from '../types';

interface ClassAnalyticsDashboardProps {
  currentClass: ClassGrade;
  students: StudentGrade[];
  kktp: number;
}

type ChartMode = 'distribution' | 'kktp' | 'students';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: {
      label: string;
      fullLabel?: string;
      count?: number;
      percentage?: number;
      status?: string;
      score?: number;
      studentsList?: string[];
    };
  }>;
}

const DistributionTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  if (!item) return null;

  return (
    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-lg border border-slate-700 text-xs max-w-[240px]">
      <div className="font-bold text-slate-100 mb-1">
        {item.fullLabel || item.label}
      </div>
      {item.count !== undefined ? (
        <div className="space-y-0.5 text-slate-300">
          <div className="flex items-center justify-between gap-4">
            <span>Jumlah Siswa:</span>
            <span className="font-mono font-bold text-white">{item.count} anak</span>
          </div>
          {item.percentage !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span>Persentase:</span>
              <span className="font-mono font-semibold text-blue-300">
                {item.percentage}%
              </span>
            </div>
          )}
          {item.studentsList && item.studentsList.length > 0 && (
            <div className="pt-1.5 mt-1.5 border-t border-slate-700/80 text-[11px] text-slate-300">
              <span className="text-slate-400 block mb-0.5">Siswa:</span>
              <span className="line-clamp-3 leading-relaxed">
                {item.studentsList.join(', ')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-0.5 text-slate-300">
          <div className="flex items-center justify-between gap-4">
            <span>Nilai Rapor:</span>
            <span className="font-mono font-bold text-white">
              {item.score?.toFixed(2)}
            </span>
          </div>
          {item.status && (
            <div className="flex items-center justify-between gap-4">
              <span>Status:</span>
              <span
                className={
                  item.status === 'Tuntas'
                    ? 'font-semibold text-emerald-400'
                    : 'font-semibold text-red-400'
                }
              >
                {item.status}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ClassAnalyticsDashboard: React.FC<ClassAnalyticsDashboardProps> = ({
  currentClass,
  students,
  kktp,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [chartMode, setChartMode] = useState<ChartMode>('distribution');

  const analytics = useMemo(() => {
    const total = students.length;
    const aboveKktp = students.filter((s) => s.finalReportScore >= kktp);
    const belowKktp = students.filter((s) => s.finalReportScore < kktp);

    const distributionBuckets = [
      {
        label: 'D (< 65)',
        fullLabel: 'Predikat D · Perlu Bimbingan (< 65)',
        min: 0,
        max: 64.999,
        color: '#dc2626',
      },
      {
        label: 'C (65–75)',
        fullLabel: 'Predikat C · Cukup (65 – 75)',
        min: 65,
        max: 75.999,
        color: '#d97706',
      },
      {
        label: 'B (76–87)',
        fullLabel: 'Predikat B · Baik (76 – 87)',
        min: 76,
        max: 87.999,
        color: '#2563eb',
      },
      {
        label: 'A (88–100)',
        fullLabel: 'Predikat A · Sangat Baik (88 – 100)',
        min: 88,
        max: 100,
        color: '#059669',
      },
    ].map((bucket) => {
      const matched = students.filter(
        (s) => s.finalReportScore >= bucket.min && s.finalReportScore <= bucket.max
      );
      return {
        label: bucket.label,
        fullLabel: bucket.fullLabel,
        count: matched.length,
        percentage: total > 0 ? Math.round((matched.length / total) * 100) : 0,
        color: bucket.color,
        studentsList: matched.map((m) => m.name),
      };
    });

    const kktpComparisonData = [
      {
        label: `Di Atas KKTP (≥ ${kktp})`,
        fullLabel: `Tuntas · Nilai Rapor ≥ ${kktp}`,
        count: aboveKktp.length,
        percentage: total > 0 ? Math.round((aboveKktp.length / total) * 100) : 0,
        color: '#059669',
        studentsList: aboveKktp.map((m) => m.name),
      },
      {
        label: `Di Bawah KKTP (< ${kktp})`,
        fullLabel: `Remedial · Nilai Rapor < ${kktp}`,
        count: belowKktp.length,
        percentage: total > 0 ? Math.round((belowKktp.length / total) * 100) : 0,
        color: '#dc2626',
        studentsList: belowKktp.map((m) => m.name),
      },
    ];

    const perStudentData = [...students]
      .sort((a, b) => b.finalReportScore - a.finalReportScore)
      .map((s) => ({
        label: s.name.split(' ').slice(0, 2).join(' '),
        fullLabel: s.name,
        score: Number(s.finalReportScore.toFixed(2)),
        status: s.finalReportScore >= kktp ? 'Tuntas' : 'Remedial',
        color: s.finalReportScore >= kktp ? '#2563eb' : '#dc2626',
      }));

    const componentAverages =
      total > 0
        ? [
            {
              name: 'Harian (NH)',
              avg: Number(
                (students.reduce((acc, s) => acc + s.dailyScore, 0) / total).toFixed(1)
              ),
            },
            {
              name: 'Praktik (NP)',
              avg: Number(
                (students.reduce((acc, s) => acc + s.practicalScore, 0) / total).toFixed(1)
              ),
            },
            {
              name: 'PTS / STS',
              avg: Number(
                (students.reduce((acc, s) => acc + s.midtermScore, 0) / total).toFixed(1)
              ),
            },
            {
              name: 'PAS / SAS',
              avg: Number(
                (students.reduce((acc, s) => acc + s.finalScore, 0) / total).toFixed(1)
              ),
            },
          ]
        : [];

    return {
      total,
      aboveKktp,
      belowKktp,
      distributionBuckets,
      kktpComparisonData,
      perStudentData,
      componentAverages,
    };
  }, [students, kktp]);

  if (students.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dashboard Analisis Statistik Kelas · {currentClass}
              </h2>
              <p className="text-xs text-slate-500">
                Grafik distribusi nilai rapor dan ketuntasan KKTP akan tampil setelah data siswa tersedia.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6 no-print">
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Dashboard Analisis Statistik Kelas</span>
              <span className="text-blue-700">· {currentClass}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Distribusi nilai rapor &amp; ketuntasan KKTP ({kktp}) dari {analytics.total} siswa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isExpanded && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/70">
              <button
                type="button"
                onClick={() => setChartMode('distribution')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  chartMode === 'distribution'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Distribusi Predikat
              </button>
              <button
                type="button"
                onClick={() => setChartMode('kktp')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  chartMode === 'kktp'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Status KKTP
              </button>
              <button
                type="button"
                onClick={() => setChartMode('students')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  chartMode === 'students'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Per Siswa
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{isExpanded ? 'Sembunyikan' : 'Tampilkan Grafik'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Dashboard Body */}
      {isExpanded && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Main Bar Chart */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  {chartMode === 'distribution' &&
                    'Distribusi Jumlah Siswa Berdasarkan Rentang Nilai Rapor'}
                  {chartMode === 'kktp' &&
                    `Perbandingan Siswa Di Atas vs Di Bawah KKTP (${kktp})`}
                  {chartMode === 'students' &&
                    `Grafik Nilai Rapor Per Siswa Terhadap Garis KKTP (${kktp})`}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {chartMode === 'distribution' &&
                    'Arahkan kursor ke batang grafik untuk melihat daftar nama siswa pada rentang tersebut.'}
                  {chartMode === 'kktp' &&
                    'Menunjukkan jumlah peserta didik yang Tuntas (≥ KKTP) dan Remedial (< KKTP).'}
                  {chartMode === 'students' &&
                    'Garis putus-putus menandakan batas ketuntasan minimal (KKTP).'}
                </p>
              </div>
            </div>

            <div className="h-[260px] w-full">
              {chartMode === 'distribution' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.distributionBuckets}
                    margin={{ top: 20, right: 16, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<DistributionTooltip />}
                      cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={68}>
                      {analytics.distributionBuckets.map((entry, idx) => (
                        <Cell key={`dist-cell-${idx}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(val: any) => `${val} siswa`}
                        style={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartMode === 'kktp' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.kktpComparisonData}
                    margin={{ top: 20, right: 24, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<DistributionTooltip />}
                      cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={96}>
                      {analytics.kktpComparisonData.map((entry, idx) => (
                        <Cell key={`kktp-cell-${idx}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(val: any) => `${val} siswa`}
                        style={{ fontSize: 12, fill: '#1e293b', fontWeight: 700 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartMode === 'students' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.perStudentData}
                    margin={{ top: 20, right: 16, left: -12, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      interval={0}
                      angle={analytics.perStudentData.length > 7 ? -20 : 0}
                      textAnchor={analytics.perStudentData.length > 7 ? 'end' : 'middle'}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<DistributionTooltip />}
                      cursor={{ fill: 'rgba(241, 245, 249, 0.7)' }}
                    />
                    <ReferenceLine
                      y={kktp}
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                      label={{
                        value: `KKTP ${kktp}`,
                        position: 'insideTopRight',
                        fill: '#dc2626',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />
                    <Bar dataKey="score" radius={[5, 5, 0, 0]} maxBarSize={44}>
                      {analytics.perStudentData.map((entry, idx) => (
                        <Cell key={`std-cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right 4 Columns: KKTP Summary & Component Breakdown */}
          <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-6 space-y-4">
            {/* Ketuntasan KKTP Breakdown */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Ringkasan Ketuntasan (KKTP {kktp})</span>
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900">
                        Di Atas KKTP (Tuntas)
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Nilai Rapor ≥ {kktp}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-extrabold text-emerald-700">
                      {analytics.aboveKktp.length}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold">
                      {Math.round((analytics.aboveKktp.length / analytics.total) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-red-50/70 border border-red-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-red-900">
                        Di Bawah KKTP (Remedial)
                      </div>
                      <div className="text-[11px] text-red-700">
                        Nilai Rapor &lt; {kktp}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-base font-extrabold text-red-700">
                      {analytics.belowKktp.length}
                    </div>
                    <div className="text-[11px] text-red-600 font-semibold">
                      {Math.round((analytics.belowKktp.length / analytics.total) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Siswa Perlu Pendampingan / Rata-rata Komponen */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800 mb-2">
                Rata-rata Komponen Nilai
              </div>
              <div className="space-y-2">
                {analytics.componentAverages.map((comp) => (
                  <div key={comp.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">{comp.name}</span>
                      <span className="font-mono font-bold text-slate-800">
                        {comp.avg.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, comp.avg))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analytics.belowKktp.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-red-800 mb-1">
                  Perlu Remedial ({analytics.belowKktp.length} siswa):
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  {analytics.belowKktp
                    .map((s) => `${s.name} (${s.finalReportScore.toFixed(1)})`)
                    .join(' · ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
