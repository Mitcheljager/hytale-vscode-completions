import * as vscode from "vscode";
import * as jsonc from "jsonc-parser";
import { type SchemaNode } from "./types/schema";

export function jsonToSchema(
    schema: any,
    document: vscode.TextDocument,
    position: vscode.Position
): SchemaNode | null {
    const path = getJsonPathAtPosition(document, position);
    let currentNode: any = schema;
    let lastValidNode: any = currentNode;

    for (const key of path) {
        if (!key) break;

        const children = currentNode.children;
        const isObject = typeof currentNode === "object" && !Array.isArray(currentNode);

        if (children?.[key]) {
            currentNode = children[key];
            lastValidNode = currentNode;
        } else if (isObject && currentNode[key]) {
            currentNode = currentNode[key];
            lastValidNode = currentNode;
        } else if (!!children) {
            lastValidNode = currentNode;
            break;
        } else {
            break;
        }
    }

    return lastValidNode;
}

export function getJsonPathAtPosition(document: vscode.TextDocument, position: vscode.Position): (string | number)[] {
    const offset = document.offsetAt(position);

    const tree = jsonc.parseTree(document.getText());
    if (!tree) return [];

    const node = jsonc.findNodeAtOffset(tree, offset);
    if (!node) return [];

    return jsonc.getNodePath(node);
}
