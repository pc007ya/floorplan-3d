import {compileHome as baseCompile} from './compile-home.mjs';
import {applyBathrooms} from './bathrooms-v23.mjs';
import {applyFurniturePicking} from './furniture-picking.mjs';
export {validateHome, scaledHome} from './compile-home.mjs';
export function compileHome(engine, home){return applyFurniturePicking(applyBathrooms(baseCompile(engine,home),home))}
