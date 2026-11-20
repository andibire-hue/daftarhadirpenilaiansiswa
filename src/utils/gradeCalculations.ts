import { StudentGrade } from '../types';

export function calculateFinalScore(
  dailyScore: number,
  practicalScore: number,
  midtermScore: number,
  finalScore: number
): number {
  const sum = dailyScore + practicalScore + midtermScore + finalScore;
  const average = sum / 4;
  return Number(average.toFixed(2));
}

export function calculatePredicate(finalReportScore: number): 'A' | 'B' | 'C' | 'D' {
  if (finalReportScore >= 88) return 'A';
  if (finalReportScore >= 76) return 'B';
  if (finalReportScore >= 65) return 'C';
  return 'D';
}

export function calculateStatus(finalReportScore: number, kktp: number = 70): 'Tuntas' | 'Remedial' {
  return finalReportScore >= kktp ? 'Tuntas' : 'Remedial';
}

export function getPredicateDescription(predicate: 'A' | 'B' | 'C' | 'D'): string {
  switch (predicate) {
    case 'A': return 'Sangat Baik';
    case 'B': return 'Baik';
    case 'C': return 'Cukup';
    case 'D': return 'Perlu Bimbingan';
  }
}
