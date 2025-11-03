import {SandboxedFunctionCSS} from "./SandboxedFunctionCSS.js";

// Test the parser
function test(css) {
    css = `${css}`;
    console.log('Input:', css);
    const out = SandboxedFunctionCSS(css);
    console.log('Parsed Selectors:', JSON.stringify(out, null, 2),css.length);
}

test('nav.main.nav-home{border-bottom-color:#00a8f3 ;}');
// test('nav.main.nav-home{border-bottom-color:#00a8f3;}');
// test('.fireplace {float: left}, .fireplace_chimney {float: left} ');
export {};
