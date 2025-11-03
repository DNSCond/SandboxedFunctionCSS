// SandboxedFunction
import {CSSError} from "./SandboxedFunctionCSS-2025-11-03.js";

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
    return slitAndTransform(css, /\\*[{}]/, m => m);
};

function slitAndTransform(
    string: string,
    where: RegExp | string,
    inbetween: (match: string) => string | false
): string[] {
    const regex =
        typeof where === "string" // @ts-expect-error
            ? new RegExp(RegExp.escape(where), "g")
            : new RegExp(where.source, where.flags.includes("g") ? where.flags : where.flags + "g");

    const result: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(string)) !== null) {
        const replacement = inbetween(match[0]);

        if (replacement === false) {
            // skip this match entirely — treat as if it never happened
            continue;
        }

        // push text before the match
        result.push(string.slice(lastIndex, match.index));

        // push transformed output
        result.push(replacement);

        // update the position
        lastIndex = regex.lastIndex;
    }

    // add trailing part
    result.push(string.slice(lastIndex));

    return result;
}
