import {compileHome as baseCompile} from './compile-home.mjs';
import {applyBathrooms} from './bathrooms-v23.mjs';
export {validateHome, scaledHome} from './compile-home.mjs';
export function compileHome(engine, home){return applyBathrooms(baseCompile(engine,home),home)}
