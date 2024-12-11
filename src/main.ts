import './styles.css';
import { Plugin, WorkspaceLeaf, ItemView, MarkdownView, Notice } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import * as React from 'react';
import { FindGithubPRSettings, GithubPR } from './types';
import GithubPRView from './GithubPRView';
import { fetchGithubPRs } from './githubApi';
import FindGithubPRSettingTab from './FindGithubPRSettingTab';

const DEFAULT_SETTINGS: FindGithubPRSettings = {
	githubToken: '',
	repositories: [],
	insertFormat: '#{number}: {title}'
};

export default class FindGithubPRPlugin extends Plugin {
	settings: FindGithubPRSettings;
	private lastActiveMarkdownView: MarkdownView | null = null;
	views: GithubPRItemView[] = [];

	async onload() {
		await this.loadSettings();
		
		this.addCommand({
			id: 'toggle-github-pr-view',
			name: 'Toggle GitHub PR View',
			callback: this.toggleGithubPRView.bind(this)
		});

		this.addSettingTab(new FindGithubPRSettingTab(this.app, this));
		this.registerView('github-pr-view', (leaf) => new GithubPRItemView(leaf, this));

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf?.view instanceof MarkdownView) {
					this.lastActiveMarkdownView = leaf.view;
				}
			})
		);

		this.app.workspace.getLeavesOfType('github-pr-view').forEach(leaf => {
			if (leaf.view instanceof GithubPRItemView) {
				this.views.push(leaf.view);
			}
		});
	}

	async toggleGithubPRView() {
		const existing = this.app.workspace.getLeavesOfType('github-pr-view');
		if (existing.length) {
			this.app.workspace.revealLeaf(existing[0]);
		} else {
			const leaf = this.app.workspace.getRightLeaf(false);
			if (leaf) await leaf.setViewState({ type: 'github-pr-view', active: true });
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		await this.loadSettings();
		this.views.forEach(view => view.renderView());
	}

	insertGithubPRLink(pr: GithubPR) {
		const activeView = this.lastActiveMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView && activeView.editor) {
			const editor = activeView.editor;
			const cursor = editor.getCursor();
			const insertText = this.formatInsertText(pr);
			const linkText = `[${insertText}](${pr.html_url})`;
			editor.replaceRange(linkText, cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + linkText.length });
		} else {
			new Notice('Please open a markdown file to insert the GitHub PR link');
		}
	}

	private formatInsertText(pr: GithubPR): string {
		return this.settings.insertFormat.replace(/{(\w+)}/g, (match, field) => {
			switch (field) {
				case 'number':
					return pr.number.toString();
				case 'title':
					return pr.title;
				case 'author':
					return pr.user.login;
				case 'state':
					return pr.state;
				default:
					return match;
			}
		});
	}
}

class GithubPRItemView extends ItemView {
	private plugin: FindGithubPRPlugin;
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: FindGithubPRPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return 'github-pr-view';
	}

	getDisplayText(): string {
		return 'Find GitHub PRs';
	}

	async onOpen() {
		const { containerEl } = this;
		containerEl.empty();
		this.root = createRoot(containerEl);
		this.renderView();
		this.plugin.views.push(this);
	}

	async onClose() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		const index = this.plugin.views.indexOf(this);
		if (index > -1) {
			this.plugin.views.splice(index, 1);
		}
	}

	public renderView() {
		if (this.root) {
			this.root.render(
				React.createElement(React.StrictMode, null,
					React.createElement(GithubPRView, {
						settings: this.plugin.settings,
						fetchGithubPRs,
						insertGithubPRLink: this.plugin.insertGithubPRLink.bind(this.plugin),
						app: this.app
					})
				)
			);
		}
	}

	getIcon(): string {
		return 'git-pull-request';
	}
}
