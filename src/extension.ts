import * as vscode from "vscode";
import { getItems } from "./getItems";
import { type Item } from "./types/item";
import { itemDescriptionToMarkdown } from "./markdown";
import { isHytaleProject } from "./project";
import { getExistingKeys, getSchemaForFile, jsonToSchema } from "./schema";

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

    const completionProvider = createItemCompletions(items);
    context.subscriptions.push(completionProvider);

    const hoverProvider = createHover(items);
    context.subscriptions.push(hoverProvider);

    const schemaProvider = createJsonSchema();
    context.subscriptions.push(schemaProvider);
}

function createItemCompletions(items: Item[]): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(languages, {
        provideCompletionItems() {
            return items.map(item => {
                const completion = new vscode.CompletionItem(item.id, vscode.CompletionItemKind.Constant);

                completion.detail = item.name;
                completion.documentation = new vscode.MarkdownString(itemDescriptionToMarkdown(item.description));
                completion.filterText = `${item.id} ${item.name}`;
                completion.sortText = "1_" + item.id;

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

function createJsonSchema(): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider(["json", "jsonc"], {
        provideCompletionItems(document, position) {
            const json = getSchemaForFile(document);

            const node = jsonToSchema(json, document, position);
            if (!node) return;

            if (node.values?.length) {
                return node.values.map((value: string) => {
                    const item = new vscode.CompletionItem(JSON.stringify(value), vscode.CompletionItemKind.Value);

                    item.sortText = "0_" + value;

                    return item;
                });
            }

            const existingKeys = getExistingKeys(document, position);

            return Object.entries(node.children || node).filter(([key]) => !existingKeys.has(key)) .map(([key, value]: [string, any]) => {
                const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);

                item.detail = value.type;
                item.sortText = "0_" + key;

                return item;
            });
        }
    }, '"');
}

export function deactivate() {}
