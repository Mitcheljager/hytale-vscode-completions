// This file is entirely a ChatGPT special. The goal is to read files from Hytale and parse them into a schema for json files.
// Each type of json will have its own schema.

import * as fs from "fs";
import * as path from "path";
import type { SchemaNode } from "./types/schema";

function getType(value: any): SchemaNode["type"] {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    switch (typeof value) {
        case "string": return "string";
        case "number": return "number";
        case "boolean": return "boolean";
        case "object": return "object";
        default: return "string";
    }
}

function mergeSchema(existing: SchemaNode | undefined, value: any): SchemaNode {
    const type = getType(value);
    if (!existing) existing = { type };

    if (type === "object" && value !== null) {
        existing.children = existing.children || {};

        for (const key of Object.keys(value)) {
            existing.children[key] = mergeSchema(existing.children[key], value[key]);
        }
    } else if (type === "array") {
        if (!existing.children) existing.children = {};

        for (const item of value) {
            if (getType(item) === "object") {
                for (const key of Object.keys(item)) {
                    existing.children[key] = mergeSchema(existing.children[key], item[key]);
                }
            }
        }
    } else {
        existing.type = type;

        if (type === "object" || type === "string") {
            existing.values ||= [];
            if (!existing.values.includes(value)) existing.values.push(value);
        }
    }

    return existing;
}

function readJsonFiles(dir: string): any[] {
    const results: any[] = [];

    if (!fs.existsSync(dir)) {
        console.error("Folder does not exist:", dir);
        return results;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...readJsonFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".json")) {
            try {
                const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
                results.push(data);
            } catch (e) {
                console.warn("Failed to parse JSON:", fullPath);
            }
        }
    }
    return results;
}

function generateSchema(folderPath: string): Record<string, SchemaNode> {
    const files = readJsonFiles(folderPath);
    const schema: Record<string, SchemaNode> = {};

    for (const json of files) {
        if (typeof json !== "object" || json === null) continue;
        for (const key of Object.keys(json)) {
            schema[key] = mergeSchema(schema[key], json[key]);
        }
    }

    return schema;
}

const folderArg = process.argv[2];
const filenameArg = process.argv[3];
if (!folderArg || !filenameArg) {
    console.error("Usage: node generateSchema.js <folder-path> <output-filename>");
    process.exit(1);
}

const absoluteFolder = path.resolve(folderArg);
const schema = generateSchema(absoluteFolder);

const outputPath = path.join(process.cwd(), `schema/${filenameArg}`);
fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
console.log("Schema generated:", outputPath);
