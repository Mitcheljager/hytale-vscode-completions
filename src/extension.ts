import * as vscode from "vscode";
import { getItems } from "./getItems";
import { type Item } from "./item";
import { itemDescriptionToMarkdown } from "./markdown";
import { isHytaleProject } from "./project";

const languages = ["plaintext", "json", "jsonc", "yaml", "java"];

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    let active = false;

    async function tryActivate() {
        if (active) return;
        if (!await isHytaleProject()) return;

        active = true;
        createExtension(context);
    }

    await tryActivate();

    const watcher = vscode.workspace.createFileSystemWatcher("{**/manifest.json,**/.hytale,**/Common/**,**/Server/**}");

    watcher.onDidCreate(tryActivate);
    watcher.onDidChange(tryActivate);

    context.subscriptions.push(watcher);
}

async function createExtension(context: vscode.ExtensionContext) {
    const items = await getItems(context);

    const completionProvider = createCompletions(items);
    context.subscriptions.push(completionProvider);

    const hoverProvider = createHover(items);
    context.subscriptions.push(hoverProvider);
}

function createCompletions(items: Item[]): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(languages, {
        provideCompletionItems() {
            return items.map(item => {
                const completion = new vscode.CompletionItem(item.id, vscode.CompletionItemKind.Constant);

                completion.detail = item.name;
                completion.documentation = new vscode.MarkdownString(itemDescriptionToMarkdown(item.description));
                completion.filterText = `${item.id} ${item.name}`;

                return completion;
            });
        },
    });
}

function createHover(items: Item[]): vscode.Disposable {
    return vscode.languages.registerHoverProvider(languages, {
        provideHover(document: vscode.TextDocument, position: vscode.Position) {
            const wordRange = document.getWordRangeAtPosition(position);

            if (!wordRange) return undefined;

            const word = document.getText(wordRange);
            const item = items.find(i => i.id === word);

            if (!item) return undefined;

            return new vscode.Hover(new vscode.MarkdownString(`### ${item.name}\n\n${itemDescriptionToMarkdown(item.description)}`), wordRange);
        },
    });
}

export function deactivate() {}
