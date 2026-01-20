export function itemDescriptionToMarkdown(text: string) {
    return text.replace(/\\n/g, "\n");
}
