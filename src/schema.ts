import * as vscode from "vscode";
import * as jsonc from "jsonc-parser";
import { type SchemaNode } from "./types/schema";

export function jsonToSchema(schema: any, document: vscode.TextDocument, position: vscode.Position): SchemaNode | null {
    const path = getJsonPathAtPosition(document, position);

    let currentNode: any = schema;
    let lastValidNode: any = currentNode;

    for (const key of path) {
        if (key === undefined || key === null || key === "") break;

        const children = currentNode.children;
        const isObject = typeof currentNode === "object" && !Array.isArray(currentNode);
        const isArray = typeof key === "number" && currentNode.type === "array";

        if (children?.[key]) {
            currentNode = children[key];
            lastValidNode = currentNode;
        } else if (isArray && currentNode?.values) {
            currentNode = currentNode.values?.length ? currentNode : currentNode.children;
            lastValidNode = currentNode;
        } else if (isObject && currentNode[key]) {
            currentNode = currentNode[key];
            lastValidNode = currentNode;
        } else {
            break;
        }
    }

    return lastValidNode;
}

export function getJsonPathAtPosition(document: vscode.TextDocument, position: vscode.Position): (string | number)[] {
    const node = getCurrentNode(document, position);
    if (!node) return [];

    return jsonc.getNodePath(node);
}

export function getExistingKeys(document: vscode.TextDocument, position: vscode.Position): Set<string> {
    const node = getEnclosingNode(document, position);
    const keys = new Set<string>();

    if (!node?.children) return keys;

    for (const property of node.children) {
        const keyNode = property.children?.[0];

        if (keyNode?.value) {
            keys.add(String(keyNode.value));
        }
    }

    return keys;
}

function getCurrentNode(document: vscode.TextDocument, position: vscode.Position): jsonc.Node | null {
    const offset = document.offsetAt(position);

    const tree = jsonc.parseTree(document.getText());
    if (!tree) return null;

    return jsonc.findNodeAtOffset(tree, offset) || null;
}

function getEnclosingNode(document: vscode.TextDocument, position: vscode.Position): jsonc.Node | null {
    let node = getCurrentNode(document, position);

    while (node) {
        if (node.type === "object") return node;
        node = node.parent!;
    }

    return null;
}

import schemaItems from "../schema/Items.json";
import schemaRoles from "../schema/Roles.json";

export function getSchemaForFile(document: vscode.TextDocument): any | undefined {
    const schemas = [{
        path: "/Item/Items",
        json: schemaItems
    }, {
        path: "/NPC/Roles",
        json: schemaRoles
    }];

    const fileName = document.uri.path;

    for (const { path, json } of schemas) {
        if (fileName.includes(path)) {
            return json;
        }
    }
}
