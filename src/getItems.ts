import * as vscode from "vscode";
import { Item } from "./item";

export async function getItems(context: vscode.ExtensionContext): Promise<Item[]> {
    try {
        const data = await getFileContents(context);

        const items = new Map<string, { name?: string; description?: string }>();

        for (const line of data.split(/\r?\n/)) {
            const match = line.match(/^items\.([\w_]+)\.(name|description)\s*=\s*(.+)$/);
            if (!match) continue;

            const [_, id, field, value] = match;

            if (field !== "name" && field !== "description") continue;

            const item = items.get(id) ?? {};

            item[field] = value;
            items.set(id, item);
        }

        return [...items.entries()].map(([id, v]) => ({
            id,
            name: v.name || "",
            description: v.description || "",
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getFileContents(context: vscode.ExtensionContext) {
    const langFileUri = vscode.Uri.joinPath(context.extensionUri, "src/data/server.lang");

    const fileData = await vscode.workspace.fs.readFile(langFileUri);
    return Buffer.from(fileData).toString("utf8");
}
