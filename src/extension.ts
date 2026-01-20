import * as vscode from "vscode";

const ITEMS = [
    {
        id: "Plant_Crop_Berry_Block",
        name: "Berry Bush",
        description: "Stage 0: Berry Bush\nHarvest: 1-2 berries per day\nRegrows after 1 day",
    },
];

export function activate(context: vscode.ExtensionContext) {
    const completionProvider = createCompletions();
    context.subscriptions.push(completionProvider);

    const hoverProvider = createHover();
    context.subscriptions.push(hoverProvider);
}

function createCompletions(): vscode.Disposable {
    return vscode.languages.registerCompletionItemProvider("plaintext", {
        provideCompletionItems() {
            return ITEMS.map(item => {
                const completion = new vscode.CompletionItem(item.id, vscode.CompletionItemKind.Constant);

                completion.detail = item.name;
                completion.documentation = new vscode.MarkdownString(item.description);
                completion.filterText = `${item.id} ${item.name}`;

                return completion;
            });
        },
    });
}

function createHover(): vscode.Disposable {
    return vscode.languages.registerHoverProvider("plaintext", {
        provideHover(document: vscode.TextDocument, position: vscode.Position) {
            const wordRange = document.getWordRangeAtPosition(position);

            if (!wordRange) return undefined;

            const word = document.getText(wordRange);
            const item = ITEMS.find(i => i.id === word);

            if (!item) return undefined;

            return new vscode.Hover(new vscode.MarkdownString(`### ${item.name}\n\n${item.description}`), wordRange);
        },
    });
}

export function deactivate() {}
