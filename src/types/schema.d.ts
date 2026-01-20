export type SchemaNode = {
    type: "string" | "number" | "boolean" | "array" | "object" | "null";
    children?: Record<string, SchemaNode>;
    values?: any[];
};
