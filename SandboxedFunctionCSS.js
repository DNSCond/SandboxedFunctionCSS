// SandboxedFunction
import { CSSError } from "./SandboxedFunctionCSS-2025-11-03.js";
export const SandboxedFunctionCSS = function (css) {
    if (new.target)
        throw new TypeError('SandboxedFunctionCSS is not a object');
    const cssBlocks = [], errors = [], warnings = [];
    return slitAndTransform(css, /\\*[{}]/, m => m);
};
function slitAndTransform(string, where, inbetween) {
    const regex = typeof where === "string"
        ? new RegExp(RegExp.escape(where), "g")
        : new RegExp(where.source, where.flags.includes("g") ? where.flags : where.flags + "g");
    const result = [];
    let lastIndex = 0;
    let match;
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
