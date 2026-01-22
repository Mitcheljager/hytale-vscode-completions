import * as assert from "assert";
import * as vscode from "vscode";
import { isHytaleProject } from "../project";

suite("project.ts", () => {
    let originalFindFiles: typeof vscode.workspace.findFiles;
    let originalWorkspaceFolders: readonly vscode.WorkspaceFolder[] | undefined;

    setup(() => {
        originalFindFiles = vscode.workspace.findFiles;
        originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    });

    teardown(() => {
        vscode.workspace.findFiles = originalFindFiles;

        Object.defineProperty(vscode.workspace, "workspaceFolders", {
            get: () => originalWorkspaceFolders,
            configurable: true
        });
    });

    function stubWorkspaceFolders(folders: vscode.WorkspaceFolder[] | undefined) {
        Object.defineProperty(vscode.workspace, "workspaceFolders", {
            get: () => folders,
            configurable: true
        });
    }

    function stubFindFiles(mockFiles: string[]) {
        vscode.workspace.findFiles = async (include: vscode.GlobPattern) => {
            const string = typeof include === "string" ? include : include.pattern;
            return mockFiles.filter(f => string.includes(f.split("/").pop()!)).map(f => vscode.Uri.file(f));
        };
    }

    test("Should return false if folder structure does not match", async () => {
        stubWorkspaceFolders(undefined);

        const result = await isHytaleProject();
        assert.strictEqual(result, false);
    });

    test("Should return true if .hytale file exists", async () => {
        stubWorkspaceFolders([{ uri: vscode.Uri.file("/some-folder") }] as vscode.WorkspaceFolder[]);
        stubFindFiles(["/some-folder/.hytale"]);

        const result = await isHytaleProject();
        assert.strictEqual(result, true);
    });

    test("Should return true if there is no .hytale file but has manifest and Common folder returns true", async () => {
        stubWorkspaceFolders([{ uri: vscode.Uri.file("/some-folder") }] as vscode.WorkspaceFolder[]);
        stubFindFiles([
            "/some-folder/manifest.json",
            "/some-folder/Common"
        ]);

        const result = await isHytaleProject();
        assert.strictEqual(result, true);
    });

    test("Should return true if there is no .hytale file but has manifest and Server folder returns true", async () => {
        stubWorkspaceFolders([{ uri: vscode.Uri.file("/some-folder") }] as vscode.WorkspaceFolder[]);
        stubFindFiles([
            "/some-folder/manifest.json",
            "/some-folder/Server"
        ]);

        const result = await isHytaleProject();
        assert.strictEqual(result, true);
    });

    test("Should return false if there is no .hytale file but has manifest but no Common/Server folder", async () => {
        stubWorkspaceFolders([{ uri: vscode.Uri.file("/some-folder") }] as vscode.WorkspaceFolder[]);
        stubFindFiles([
            "/some-folder/manifest.json"
        ]);

        const result = await isHytaleProject();
        assert.strictEqual(result, false);
    });
});
