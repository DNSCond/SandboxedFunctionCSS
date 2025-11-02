// type CSSSelectorType = 'tagName' | 'className' | 'id';
//
// type CSSSelector = { type: CSSSelectorType, value: string };
// type CSSDeclaration = {};
// type CSSBlock = { selector: CSSSelector[] } & { properties: CSSDeclaration[] };
export const SandboxedFunctionCSS = function (css) {
    if (new.target)
        throw new TypeError('SandboxedFunctionCSS is not a object');
    const cssBlocks = [], errors = [], warnings = [];
    css = `${css}`;
    while (true) {
        const selector = parseSelector(css);
        if (selector.braceIndex !== undefined) {
            css = css.slice(selector.braceIndex);
            const { declarations, closingBraceIndex } = parseCSSBlock(css);
            cssBlocks.push({
                selector: {
                    classList: selector.classes,
                    tagName: selector.tagName ?? null,
                    id: selector.id ?? null,
                },
                cssBlock: { declarations },
            });
            css = css.slice(closingBraceIndex);
        }
        else
            break;
    }
    return { cssBlocks, errors, warnings };
};
/**
 * Parses a simple CSS selector containing tag, id, and class names,
 * and stops at the first opening brace `{`. Returns the index of that brace.
 * Adds `isAtRule: true` if the selector starts with '@'.
 */
export function parseSelector(selector) {
    const result = { classes: [] };
    const trimmed = selector.trim();
    // Detect if it's an at-rule
    if (trimmed.startsWith("@")) {
        result.isAtRule = true;
    }
    // Find the position of the first opening brace
    const bracePos = trimmed.indexOf("{");
    if (bracePos >= 0) {
        result.braceIndex = bracePos;
    }
    // Only process the part before the brace
    const part = bracePos >= 0 ? trimmed.slice(0, bracePos) : trimmed;
    let rest = part.trim();
    // Skip tag, id, and class parsing if it's an at-rule
    if (!result.isAtRule) {
        // Match and extract the tag name (if it starts with a letter or '*')
        const tagMatch = /^[a-zA-Z][\w-]*|\*/.exec(rest);
        if (tagMatch) {
            result.tagName = tagMatch[0];
            rest = rest.slice(tagMatch[0].length);
        }
        // Extract id (if any)
        const idMatch = /#([\w-]+)/.exec(rest);
        if (idMatch) {
            result.id = idMatch[1];
            rest = rest.replace(idMatch[0], "");
        }
        // Extract all class names (e.g. ".foo.bar")
        const classMatches = rest.match(/\.([\w-]+)/g);
        if (classMatches) {
            result.classes = classMatches.map(cls => cls.slice(1));
        }
    }
    return result;
}
/**
 * Parses a CSS declaration block (the content inside `{ ... }`) and returns
 * an object mapping property names to their values. Stops parsing at the
 * first closing brace `}` and ignores everything after it.
 */
export function parseCSSBlock(block) {
    const declarations = {};
    // Assume the first character is '{'
    const openIndex = 0;
    // Find the first closing brace after the opening brace
    const closeIndex = block.indexOf("}", openIndex);
    if (closeIndex === -1) {
        // No closing brace, return empty declarations
        return { declarations };
    }
    // Extract the content inside the braces
    const content = block.slice(openIndex + 1, closeIndex).trim();
    // Split by semicolons to get individual declarations
    const parts = content.split(";").map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
        // Split by the first colon
        const colonIndex = part.indexOf(":");
        if (colonIndex === -1)
            continue; // invalid declaration
        const property = part.slice(0, colonIndex).trim();
        const value = part.slice(colonIndex + 1).trim();
        if (property) {
            declarations[property] = value;
        }
    }
    return {
        declarations,
        closingBraceIndex: closeIndex,
    };
}
export class CustomError extends Error {
    detail;
    MyMessage;
    constructor(message, detail) {
        super(message);
        this.MyMessage = message;
        this.detail = detail;
        this.name = new.target?.name ?? 'CustomError';
    }
    get [Symbol.toStringTag]() {
        return this.name;
    }
    static [Symbol.toStringTag] = "CustomError";
}
class CSSError extends CustomError {
}
