import { App, PluginSettingTab, Setting } from 'obsidian';
import FindGithubPRPlugin from './main';

export default class FindGithubPRSettingTab extends PluginSettingTab {
    private plugin: FindGithubPRPlugin;

    constructor(app: App, plugin: FindGithubPRPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('GitHub Token')
            .setDesc('Enter your GitHub personal access token')
            .addText(text => text
                .setPlaceholder('ghp_xxxxxxxxxxxx')
                .setValue(this.plugin.settings.githubToken)
                .onChange(async (value) => {
                    this.plugin.settings.githubToken = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Repositories')
            .setDesc('Enter GitHub repositories (one per line, format: owner/repo)')
            .addTextArea(text => text
                .setPlaceholder('owner/repo\nanother-owner/another-repo')
                .setValue(this.plugin.settings.repositories.join('\n'))
                .onChange(async (value) => {
                    this.plugin.settings.repositories = value
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Insert Format')
            .setDesc('Format for inserted PR links. Available fields: {number}, {title}, {author}, {state}')
            .addText(text => text
                .setPlaceholder('#{number}: {title}')
                .setValue(this.plugin.settings.insertFormat)
                .onChange(async (value) => {
                    this.plugin.settings.insertFormat = value;
                    await this.plugin.saveSettings();
                }));
    }
} 