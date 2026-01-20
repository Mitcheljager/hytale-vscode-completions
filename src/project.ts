import * as vscode from "vscode";

export async function isHytaleProject(): Promise<boolean> {
    if (!vscode.workspace.workspaceFolders?.length) return false;

    if (await containsHytaleFile()) return true;
    if (!(await containsManifestFile())) return false;
    return containsServerOrCommonFolder();
}

async function hasFileOrFolder(path: string): Promise<boolean> {
    const exclude = "{**/node_modules/**,**/.git/**}";
    return !!(await vscode.workspace.findFiles(path, exclude, 1)).length;
}

async function containsHytaleFile(): Promise<boolean> {
    return await hasFileOrFolder("**/.hytale");
}

async function containsManifestFile(): Promise<boolean> {
    return await hasFileOrFolder("**/manifest.json");
}

async function containsServerOrCommonFolder() {
    const common = await hasFileOrFolder("{Common/**,**/Common/**}");
    const server = await hasFileOrFolder("{Server/**,**/Server/**}");

    return common || server;
}
