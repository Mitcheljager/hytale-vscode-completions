import typescriptEslint from "typescript-eslint";

export default [{
    files: ["**/*.ts"],
}, {
    ignores: ["out/**"],
    plugins: {
        "@typescript-eslint": typescriptEslint.plugin,
    },

    languageOptions: {
        parser: typescriptEslint.parser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "import",
            format: ["camelCase", "PascalCase"],
        }],

        quotes: ["warn", "double", {
            avoidEscape: true,
            allowTemplateLiterals: true,
        }],

        indent: ["warn", 4, {
            SwitchCase: 1,
        }],

        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn",
    },
}];
