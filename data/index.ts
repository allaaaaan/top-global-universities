import { University } from './types';
import universitiesData from './universities.json';

export const universities: University[] = universitiesData as University[];

export function getUniversityById(id: string): University | undefined {
  return universities.find(uni => uni.id === id);
}

export function getUniversityByRank(rank: number): University | undefined {
  return universities.find(uni => uni.rank === rank);
}

export function getAllUniversities(): University[] {
  return universities;
}

export * from './types';

