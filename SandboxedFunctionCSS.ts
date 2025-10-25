// SandboxedFunction
export interface SandboxedFunctionCSS {
}

export interface SandboxedFunctionCSSError {
    column: number,
    index: number,
    line: number,
}

export interface SandboxedFunctionCSS_constructor {
    prototype: SandboxedFunctionCSS,
}

export const SandboxedFunctionCSS: SandboxedFunctionCSS_constructor = function (css: string) {
    if (new.target) throw new TypeError('SandboxedFunctionCSS is not a object');
    //const tokens = []; let i = 0, mode = 'selector';

    // while (i < css.length) {
    //     const char = css[i];
    //     if (char === undefined) throw new RangeError;
    //     // Skip whitespace
    //     if (/\s/.test(char)) {
    //         i++;
    //         continue;
    //     }
    //     if (mode === 'selector') {
    //         // Skip comments (/* */)
    //         if (char === '/' && css[i + 1] === '*') {
    //             i = css.indexOf('*/', i) + 2;
    //             if (i === -1) throw new Error('Unclosed comment');
    //             continue;
    //         }
    //     }
    //     // Handle identifiers (e.g., div, my-class, hover)
    //     if (/[a-zA-Z-*]/.test(char)) {
    //         let value = '';
    //         while (i < css.length && /[a-zA-Z0-9-*]/.test(css[i]!)) {
    //             value += css[i++];
    //         }
    //         tokens.push({type: 'identifier', value});
    //         continue;
    //     }
    //     i++;
    // }
    return parseSelectors(css);
} as SandboxedFunctionCSS_constructor;

// Array.from(document.querySelectorAll('style'), m => m.innerText).join('\n\n')
function tokenize(css: string) {
    const tokens = [];
    let i = 0;

    while (i < css.length) {
        let char = css[i]!;

        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        // Skip comments (/* */)
        if (char === '/' && css[i + 1] === '*') {
            i = css.indexOf('*/', i) + 2;
            if (i === -1) throw new Error('Unclosed comment');
            continue;
        }

        // Handle delimiters: , . # : > + ~
        if (/[,.#:+~>]/.test(char)) {
            tokens.push({type: 'delimiter', value: char});
            i++;
            continue;
        }

        // Handle identifiers (e.g., div, my-class, link)
        if (/[a-zA-Z-*]/.test(char)) {
            let value = '';
            while (i < css.length && /[a-zA-Z0-9-*]/.test(css[i]!)) {
                value += css[i++];
            }
            tokens.push({type: 'identifier', value});
            continue;
        }

        // Stop at { since we're only parsing selectors
        if (char === '{') {
            tokens.push({type: 'delimiter', value: '{'});
            i++;
            break;
        }

        // Skip declaration blocks
        if (char === '}') {
            i++;
            continue;
        }

        throw new Error(`Unexpected character at position ${i}: ${char}`);
    }

    return tokens;
}

function parseSelectors(css: string) {
    const tokens = tokenize(css);
    let i = 0;
    const selectorGroups = [];

    while (i < tokens.length) {
        const selectors = [];
        let currentSelector = [];

        // Parse until '{' or end
        // && tokens[i]!.value !== '{'
        while (i < tokens.length) {
            if (tokens[i]!.type === 'delimiter' && tokens[i]!.value === ',') {
                if (currentSelector.length) {
                    // @ts-ignore
                    selectors.push(parseSelectorGroup(currentSelector));
                    currentSelector = [];
                }
                i++;
                continue;
            }
            currentSelector.push(tokens[i]);
            i++;
        }

        // Add the last selector group
        if (currentSelector.length) {
            // @ts-ignore
            selectors.push(parseSelectorGroup(currentSelector));
        }

        if (selectors.length) {
            selectorGroups.push(selectors);
        }

        // Skip declaration block
        if (i < tokens.length && tokens[i]!.value === '{') {
            while (i < tokens.length && tokens[i]!.value !== '}') {
                i++;
            }
            if (i < tokens.length && tokens[i]!.value === '}') {
                i++;
            }
        }
    }

    return selectorGroups;
}

function parseSelectorGroup(tokens: { type: string, value: string }[]): any {
    const result = [];
    let i = 0;

    while (i < tokens.length) {
        if (tokens[i]!.type === 'identifier') {
            const selector = {
                type: 'tagSelector', tagName: tokens[i]!.value,
            };
            i++;

            // Check for class or pseudo-class
            while (i < tokens.length && tokens[i]!.type === 'delimiter' && /[.#:]/.test(tokens[i]!.value)) {
                if (tokens[i]!.value === '.') {
                    i++;
                    if (i < tokens.length && tokens[i]!.type === 'identifier') {
                        result.push({type: 'classSelector', tagName: tokens[i]!.value});
                        i++;
                    } else {
                        throw new Error('Expected identifier after .');
                    }
                } else if (tokens[i]!.value === ':') {
                    i++;
                    if (i < tokens.length && tokens[i]!.type === 'identifier') {
                        // @ts-ignore
                        selector.pseudoClass = tokens[i]!.value;
                        i++;
                    } else {
                        throw new Error('Expected identifier after :');
                    }
                } else if (tokens[i]!.value === '#') {
                    i++;
                    if (i < tokens.length && tokens[i]!.type === 'identifier') {
                        result.push({type: 'idSelector', tagName: tokens[i]!.value});
                        i++;
                    } else {
                        throw new Error('Expected identifier after #');
                    }
                } else {
                    break;
                }
            }

            result.push(selector);
            continue;
        }

        // Handle combinators (e.g., >)
        if (tokens[i]!.type === 'delimiter' && tokens[i]!.value === '>') {
            i++;
            const nextSelector = [];
            while (i < tokens.length && tokens[i]!.type !== 'delimiter') {
                nextSelector.push(tokens[i]!);
                i++;
            }
            if (nextSelector.length) {
                result.push({
                    type: 'directChildSelector',
                    selector: parseSelectorGroup(nextSelector)
                });
            }
            continue;
        }

        i++;
    }

    // Return a single selector object if only one, else array
    return result.length === 1 ? result[0] : result;
}
