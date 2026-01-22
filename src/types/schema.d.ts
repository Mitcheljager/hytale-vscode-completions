type NodeType = "string" | "number" | "boolean" | "array" | "object" | "null";

export type SchemaNode = {
    type: NodeType;
    children?: Record<string, SchemaNode>;
    values?: any[];
    arrayTypes?: NodeType[];
};
