import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FindGithubPRSettings, GithubPR } from './types';
import ToolbarIcon from './ToolbarIcon';
import SearchComponentWrapper from './SearchComponentWrapper';
import { UserIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

enum PRState {
    OPEN = 'open',
    CLOSED = 'closed',
    MERGED = 'merged'
}

interface GithubPRViewProps {
    settings: FindGithubPRSettings;
    fetchGithubPRs: (settings: FindGithubPRSettings, repository: string, query: string, signal?: AbortSignal) => Promise<GithubPR[]>;
    insertGithubPRLink: (pr: GithubPR) => void;
    app: any;
}

const GithubPRView: React.FC<GithubPRViewProps> = ({
    settings,
    fetchGithubPRs,
    insertGithubPRLink,
    app
}: GithubPRViewProps) => {
    const [prs, setPRs] = useState<GithubPR[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<PRState>(PRState.OPEN);
    const [isOwnPRsFilter, setIsOwnPRsFilter] = useState(true);
    const [selectedRepo, setSelectedRepo] = useState<string>(settings.repositories[0] || '');
    const [showTokenMessage, setShowTokenMessage] = useState(!settings.githubToken);
    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (settings.repositories.length > 0 && !settings.repositories.includes(selectedRepo)) {
            setSelectedRepo(settings.repositories[0]);
        }
    }, [settings.repositories, selectedRepo]);

    useEffect(() => {
        setShowTokenMessage(!settings.githubToken);
    }, [settings.githubToken]);


    const fetchPRs = useCallback(async (query: string) => {
        if (!selectedRepo) {
            setError('Please select a repository');
            return;
        }

        setLoading(true);
        setError(null);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            let searchQuery = query;
            if (isOwnPRsFilter) {
                searchQuery += ' author:@me';
            }
            searchQuery += ` is:${selectedState}`;

            const fetchedPRs = await fetchGithubPRs(
                settings,
                selectedRepo,
                searchQuery,
                abortControllerRef.current.signal
            );
            setPRs(fetchedPRs);
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                setError('Error fetching GitHub PRs');
                console.error(err);
            }
        } finally {
            if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                setLoading(false);
            }
        }
    }, [settings, fetchGithubPRs, isOwnPRsFilter, selectedState, selectedRepo]);

    const debouncedFetchPRs = useCallback((query: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        setLoading(true);

        debounceTimerRef.current = setTimeout(() => {
            fetchPRs(query);
        }, 300);
    }, [fetchPRs]);

    useEffect(() => {
        debouncedFetchPRs('');
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [debouncedFetchPRs]);

    if (showTokenMessage) {
        return (
            <div className="github-pr-view flex items-start justify-center h-full p-8 text-center">
                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-2">GitHub token not configured</p>
                    <p className="text-xs text-gray-500">
                        Please configure your GitHub token in the <a 
                            href="#" 
                            className="text-blue-500 hover:underline"
                            onClick={async(e) => {
                                e.preventDefault();
                                await app.setting.open();
                                await app.setting.openTabById("obsidian-find-gh-pull-request")
                            }}
                        >plugin settings</a>
                    </p>
                </div>
            </div>
        );
    }

    const filterByOwnPRs = () => {
        setIsOwnPRsFilter(prev => !prev);
        debouncedFetchPRs('');
    };

    const stateMenu = [
        { title: 'Open', onClick: () => applyStateFilter(PRState.OPEN), checked: selectedState === PRState.OPEN },
        { title: 'Closed', onClick: () => applyStateFilter(PRState.CLOSED), checked: selectedState === PRState.CLOSED },
        { title: 'Merged', onClick: () => applyStateFilter(PRState.MERGED), checked: selectedState === PRState.MERGED }
    ];

    const applyStateFilter = (state: PRState) => {
        setSelectedState(state);
        debouncedFetchPRs('');
    };

    return (
        <div className="github-pr-view flex flex-col h-full p-2">
            <div className="toolbar flex items-center justify-between mb-2">
                <div className="flex space-x-1">
                    <select
                        value={selectedRepo}
                        onChange={(e) => {
                            setSelectedRepo(e.target.value);
                            debouncedFetchPRs('');
                        }}
                        className="repo-select mr-2"
                    >
                        {settings.repositories.map(repo => (
                            <option key={repo} value={repo}>{repo}</option>
                        ))}
                    </select>
                    <ToolbarIcon
                        icon={<UserIcon className="w-4 h-4" />}
                        tooltip="Filter by my PRs"
                        onClick={filterByOwnPRs}
                        isSelected={isOwnPRsFilter}
                    />
                    <ToolbarIcon
                        icon={<ListBulletIcon className="w-4 h-4" />}
                        tooltip="Filter by PR state"
                        menu={stateMenu}
                    />
                </div>
                {loading && (
                    <div className="animate-spin">
                        <ArrowPathIcon className="w-4 h-4 text-gray-500" />
                    </div>
                )}
            </div>
            <div className="search-wrapper mb-2">
                <SearchComponentWrapper
                    onSearch={debouncedFetchPRs}
                    placeholder="Search GitHub PRs..."
                />
            </div>
            {error && <div className="github-error text-sm mb-2">{error}</div>}
            <div className="github-pr-list-container flex-grow overflow-y-auto">
                <ul className="github-pr-list">
                    {prs.map((pr) => (
                        <li
                            key={pr.number}
                            onClick={() => insertGithubPRLink(pr)}
                            className="github-pr-item p-4 hover:bg-hover cursor-pointer border-b last:border-b-0"
                        >
                            <div className="github-pr-header flex justify-between items-center mb-1">
                                <span className="github-pr-number text-sm font-medium text-muted">#{pr.number}</span>
                                <span className={`github-pr-state text-xs px-2 py-0.5 rounded ${
                                    pr.state === PRState.OPEN ? 'bg-green-100 text-green-800' :
                                    pr.state === PRState.CLOSED ? 'bg-red-100 text-red-800' :
                                    'bg-purple-100 text-purple-800'
                                }`}>
                                    {pr.state}
                                </span>
                            </div>
                            <div className="github-pr-title text-normal mb-1">{pr.title}</div>
                            <div className="github-pr-details flex justify-between text-xs text-muted">
                                <div className="github-pr-repo text-muted">
                                    {selectedRepo}
                                </div>
                                <div className="github-pr-author flex items-center">
                                    <img
                                        src={pr.user.avatar_url}
                                        alt={pr.user.login}
                                        className="w-4 h-4 rounded-full mr-1"
                                    />
                                    <span>{pr.user.login}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GithubPRView; 