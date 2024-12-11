import { requestUrl, RequestUrlParam } from 'obsidian';
import { FindGithubPRSettings, GithubPR } from './types';

export async function fetchGithubPRs(
    settings: FindGithubPRSettings, 
    repository: string, 
    query: string,
    signal?: AbortSignal
): Promise<GithubPR[]> {
    try {
        const searchQuery = encodeURIComponent(`repo:${repository} is:pull-request ${query}`);
        const requestParams: RequestUrlParam = {
            url: `https://api.github.com/search/issues?q=${searchQuery}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${settings.githubToken}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };

        let aborted = false;
        if (signal) {
            signal.addEventListener('abort', () => {
                aborted = true;
            });
        }

        const response = await Promise.race([
            requestUrl(requestParams),
            new Promise<never>((_, reject) => {
                if (signal) {
                    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
                }
            })
        ]);

        if (aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        return response.json.items;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            return [];
        }
        console.error('Error fetching GitHub PRs:', error);
        throw error;
    }
} 