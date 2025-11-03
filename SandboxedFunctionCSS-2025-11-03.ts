// SandboxedFunction
export interface SandboxedFunctionCSS {
}

export interface SandboxedFunctionCSS_constructor {
    prototype: SandboxedFunctionCSS,

    // new(css: string):ParsedCSSBlock,
    //
    // (css: string):ParsedCSSBlock
}


// type CSSSelectorType = 'tagName' | 'className' | 'id';
//
// type CSSSelector = { type: CSSSelectorType, value: string };
// type CSSDeclaration = {};
// type CSSBlock = { selector: CSSSelector[] } & { properties: CSSDeclaration[] };
type lineProperties = { index: number, column: number, line: number };

export const SandboxedFunctionCSS: SandboxedFunctionCSS_constructor = function (css: string) {
    if (new.target) throw new TypeError('SandboxedFunctionCSS is not a object');
    const cssBlocks: unknown[] = [], errors: CSSError[] = [], warnings: CSSError[] = [];
    let lineProperties: lineProperties = {index: 0, column: 0, line: 0};
    css = `${css}`;
    while (true) {
        const selector = parseSelector(
            css, errors, warnings, lineProperties);
        if (selector.braceIndex !== undefined) {
            setLineData(lineProperties, css, selector.braceIndex);
            css = css.slice(selector.braceIndex);
            const {declarations, closingBraceIndex} = parseCSSBlock(
                css, errors, warnings, lineProperties);
            cssBlocks.push({
                selector: {
                    classList: selector.classes,
                    tagName: selector.tagName ?? null,
                    id: selector.id ?? null,
                },
                cssBlock: {declarations},
            });
            if (closingBraceIndex === undefined) break;
            setLineData(lineProperties, css, closingBraceIndex);
            css = css.slice(closingBraceIndex);
        } else break;
    }
    return {cssBlocks, errors, warnings};
} as SandboxedFunctionCSS_constructor;

type ParsedSelector = {
    tagName?: string;
    id?: string;
    classes: string[];
    braceIndex?: number; // index of the first `{` if present
    isAtRule?: boolean;  // true if selector starts with '@'
};

/**
 * Parses a simple CSS selector containing tag, id, and class names,
 * and stops at the first opening brace `{`. Returns the index of that brace.
 * Adds `isAtRule: true` if the selector starts with '@'.
 */
export function parseSelector(
    selector: string,
    errors: CSSError[],
    _warnings: CSSError[],
    lineProperties: lineProperties): ParsedSelector {
    const result: ParsedSelector = {classes: []};
    const trimmed = selector;

    // Detect if it's an at-rule
    if (trimmed.trimStart().startsWith("@")) {
        result.isAtRule = true;
    }

    // Find the position of the first opening brace
    const bracePos = trimmed.indexOf("{");
    // const linePos = getLineData(lineProperties, trimmed, bracePos);
    if (bracePos >= 0) {
        result.braceIndex = bracePos;
    } else {
        const linePos = getLineData(lineProperties, trimmed);
        errors.push(new CSSError('no opening brace encountered at [[%linePos%]]', {trimmed,...linePos}));
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
            result.id = idMatch[1] as string;
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


type CSSDeclarations = Record<string, string>;

type ParsedCSSBlock = {
    declarations: CSSDeclarations;
    closingBraceIndex?: number | undefined; // index of the first closing brace `}`
};

function parseCSSBlock(
    block: string,
    errors: CSSError[],
    warnings: CSSError[],
    lineProperties: lineProperties): ParsedCSSBlock {
    const declarations: CSSDeclarations = {};

    // Assume the first character is '{'
    const openIndex = 0;

    // Find the first closing brace after the opening brace
    let closingBraceIndex: number | undefined = block.indexOf("}", openIndex);
    if (closingBraceIndex === -1) {
        const linePos = getLineData(lineProperties, block,);
        // No closing brace, syntax error
        errors.push(new CSSError("Missing closing brace '}' [[%linePos%]]", {block, ...linePos}));
        closingBraceIndex = undefined;
    }

    // Extract the content inside the braces
    const content = block.slice(openIndex + 1, closingBraceIndex).trim();

    // Split by semicolons to get individual declarations
    const parts = content.split(";").map(p => p.trim()).filter(Boolean);

    for (const part of parts) {
        // Split by the first colon
        const colonIndex = part.indexOf(":");
        if (colonIndex === -1) {
            // Syntax error: missing colon
            errors.push(new CSSError("Missing colon ':' in declaration", {declaration: part}));
            continue;
        }

        const property = part.slice(0, colonIndex).trim();
        const value = part.slice(colonIndex + 1).trim();

        if (!property) {
            errors.push(new CSSError("Empty property name", {declaration: part}));
            continue;
        }

        // Check if the property name is valid
        if (!isValidPropertyName(property)) {
            warnings.push(new CSSError(`Invalid property name: ${property}`,
                {property, declaration: part}));
        }

        declarations[property] = value;
    }

    return {declarations, closingBraceIndex};
}

export function isValidPropertyName(_propertyName: string): boolean {
    return true;
}

class CustomError<T = unknown> extends Error {
    detail: T;

    constructor(message: string, detail: T) {
        super(message);
        this.detail = detail;
        this.name = new.target?.name ?? 'CustomError';
    }

    get [Symbol.toStringTag]() {
        return this.name;
    }

    static [Symbol.toStringTag] = "CustomError";
}

export function setLineData(lineProps: lineProperties, string: string, length = Infinity): lineProperties {
    if (typeof (string as unknown) !== "string") throw new TypeError('string isnt a string');
    string = string.slice(0, length);
    if (string.length === 0) return lineProps;
    lineProps.index += string.length;
    const lines = string.split(/\r\n|\r|\n/g),
        column = lines.at(-1)!.length;
    lineProps.line += lines.length - 1;
    lineProps.column = lines.length > 1
        ? column : lineProps.column + column;
    return lineProps;
}

export function getLineData(lineProps: lineProperties, string: string, length = Infinity): lineProperties {
    if (typeof (string as unknown) !== "string") throw new TypeError('string isnt a string');
    string = string.slice(0, length);
    if (string.length === 0) return lineProps;
    const lineProperties = Object.assign({}, lineProps);
    lineProperties.index += string.length;
    const lines = string.split(/\r\n|\r|\n/g),
        column = lines.at(-1)!.length;
    lineProperties.line += lines.length - 1;
    lineProperties.column = lines.length > 1
        ? column : lineProperties.column + column;
    return lineProperties;
}

export class CSSError extends CustomError<object & lineProperties> {
    constructor(message: string, lineProp: any & lineProperties) {
        message = message.replaceAll(/\[\[%linePos%]]/ig,
            `[line: ${lineProp.line}, column: ${lineProp.column}, index: ${lineProp.index}]`);
        super(message, lineProp);
    }

    toJSON() {
        const {message} = this, json = {...this};
        return Object.assign(json, {message})
    }
}
