import {SandboxedFunctionCSS} from "./SandboxedFunctionCSS.js";

// Test the parser
function test() {
    const css = 'p, div.my-class, a {} body{background-color:#0073a6;}nav.main.nav-home{border-bottom-color:#00a8f3;}';
    console.log('Input:', css);
    console.log('Parsed Selectors:', JSON.stringify(SandboxedFunctionCSS(css), null, 2));
}

test();
export {};
