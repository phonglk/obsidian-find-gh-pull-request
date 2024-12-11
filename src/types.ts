export interface FindGithubPRSettings {
    githubToken: string;
    repositories: string[]; // Format: "owner/repo"
    insertFormat: string;
}

export interface GithubPR {
    url: string;
    repository_url: string;
    id: number;
    node_id: string;
    number: number;
    title: string;
    state: string;
    locked: boolean;
    user: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        type: string;
        site_admin: boolean;
    };
    labels: Array<{
        id: number;
        node_id: string;
        url: string;
        name: string;
        color: string;
        default: boolean;
        description: string | null;
    }>;
    comments: number;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    author_association: string;
    draft: boolean;
    pull_request: {
        url: string;
        html_url: string;
        diff_url: string;
        patch_url: string;
        merged_at: string | null;
    };
    body: string;
    reactions: {
        url: string;
        total_count: number;
        '+1': number;
        '-1': number;
        laugh: number;
        hooray: number;
        confused: number;
        heart: number;
        rocket: number;
        eyes: number;
    };
    html_url: string;
} 