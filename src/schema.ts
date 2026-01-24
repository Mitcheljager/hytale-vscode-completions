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

export function isInsideString(document: vscode.TextDocument, position: vscode.Position): boolean {
    const node = getCurrentNode(document, position);
    if (!node) return false;

    return node.type === "string";
}

export function getSnippetForValueType(type: jsonc.NodeType, key: string): vscode.SnippetString {
    if (type === "object") return new vscode.SnippetString(`"${key}": {\n\t$0\n}`);
    if (type === "array") return new vscode.SnippetString(`"${key}": [$0]`);
    if (type === "number") return new vscode.SnippetString(`"${key}": 0`);
    if (type === "boolean") return new vscode.SnippetString(`"${key}": true`);
    return new vscode.SnippetString(`"${key}": "$0"`);
}

import schemaItems from "../schema/Items.json";
import schemaRoles from "../schema/Roles.json";
import schemaGroups from "../schema/Groups.json";
import schemaFlocks from "../schema/Flocks.json";
import schemaSpawn from "../schema/Spawn.json";
import schemaDrops from "../schema/Drops.json";
import schemaBarterShops from "../schema/BarterShops.json";
import schemaWeathers from "../schema/Weathers.json";
import schemaWorld from "../schema/World.json";
import schemaProjectiles from "../schema/Projectiles.json";
import schemaGameplayConfigs from "../schema/GameplayConfigs.json";
import schemaFarming from "../schema/Farming.json";
import schemaEnvironments from "../schema/Environments.json";
import schemaPrefabList from "../schema/PrefabList.json";
import schemaCamera from "../schema/Camera.json";
import schemaAmbienceFX from "../schema/schemaAmbienceFX.json";
import schemaAudioCategories from "../schema/schemaAudioCategories.json";
import schemaEQ from "../schema/schemaEQ.json";
import schemaItemSounds from "../schema/schemaItemSounds.json";
import schemaReverb from "../schema/schemaReverb.json";
import schemaSoundEvents from "../schema/schemaSoundEvents.json";
import schemaSoundSets from "../schema/schemaSoundSets.json";

export function getSchemaForFile(document: vscode.TextDocument): any | undefined {
    const schemas = [
        { path: "/Item/Items", json: schemaItems },
        { path: "/NPC/Roles", json: schemaRoles },
        { path: "/NPC/Groups", json: schemaGroups },
        { path: "/NPC/Flocks", json: schemaFlocks },
        { path: "/NPC/Spawn", json: schemaSpawn },
        { path: "/Drops", json: schemaDrops },
        { path: "/BarterShops", json: schemaBarterShops },
        { path: "/Weathers", json: schemaWeathers },
        { path: "/World", json: schemaWorld },
        { path: "/Projectiles", json: schemaProjectiles },
        { path: "/GameplayConfigs", json: schemaGameplayConfigs },
        { path: "/Farming", json: schemaFarming },
        { path: "/Environments", json: schemaEnvironments },
        { path: "/PrefabList", json: schemaPrefabList },
        { path: "/Camera", json: schemaCamera },
        { path: "/Audio/AmbienceFX", json: schemaAmbienceFX },
        { path: "/Audio/AudioCategories", json: schemaAudioCategories },
        { path: "/Audio/EQ", json: schemaEQ },
        { path: "/Audio/ItemSounds", json: schemaItemSounds },
        { path: "/Audio/Reverb", json: schemaReverb },
        { path: "/Audio/SoundEvents", json: schemaSoundEvents },
        { path: "/Audio/SoundSets", json: schemaSoundSets }
    ];

    const fileName = document.uri.path;

    for (const { path, json } of schemas) {
        if (fileName.includes(path)) {
            return json;
        }
    }
}
