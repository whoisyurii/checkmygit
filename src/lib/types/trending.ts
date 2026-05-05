import { RANKING_LANGUAGES } from './rankings';

export type TrendingWindow = 'daily' | 'weekly' | 'monthly';

export const TRENDING_WINDOWS: ReadonlyArray<TrendingWindow> = [
	'daily',
	'weekly',
	'monthly'
] as const;

export const DEFAULT_TRENDING_WINDOW: TrendingWindow = 'daily';

export function normalizeTrendingWindow(value: string | null): TrendingWindow {
	return TRENDING_WINDOWS.includes(value as TrendingWindow)
		? (value as TrendingWindow)
		: DEFAULT_TRENDING_WINDOW;
}

export function normalizeTrendingLanguage(value: string | null): string {
	if (!value) return '';
	const match = RANKING_LANGUAGES.find((l) => l.toLowerCase() === value.toLowerCase());
	return match ?? '';
}

export interface TrendingRepository {
	rank: number;
	owner: string;
	name: string;
	nameWithOwner: string;
	url: string;
	description: string | null;
	language: { name: string; color: string } | null;
	stargazerCount: number;
	forkCount: number;
	periodStars: number;
	avatarUrl: string;
}

export interface TrendingResult {
	success: boolean;
	data: TrendingRepository[];
	error?: string;
	source: 'live' | 'cache' | 'fallback';
}

export const WINDOW_LABEL: Record<TrendingWindow, string> = {
	daily: 'Today',
	weekly: 'This Week',
	monthly: 'This Month'
};

export const WINDOW_PERIOD_TEXT: Record<TrendingWindow, string> = {
	daily: 'today',
	weekly: 'this week',
	monthly: 'this month'
};
