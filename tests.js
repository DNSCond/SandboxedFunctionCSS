import {SandboxedFunctionCSS} from "./SandboxedFunctionCSS.js";

// Test the parser
function test() {
    const css = 'nav.main.nav-home{border-bottom-color:#00a8f3;}';
    console.log('Input:', css);
    const out = SandboxedFunctionCSS(css);
    console.log('Parsed Selectors:', JSON.stringify(out, null, 2));
}

test();
export {};
