import {compileHome as baseCompile} from './compile-home.mjs';
import {applyBathrooms} from './bathrooms-v23.mjs';
import {applyFurniturePicking} from './furniture-picking.mjs';
import {applySand3DFurniture} from './sand3d-furniture.mjs';
import {applySand3DLaptop} from './sand3d-laptop.mjs';
export {validateHome, scaledHome} from './compile-home.mjs';
export function compileHome(engine, home){return applySand3DLaptop(applySand3DFurniture(applyFurniturePicking(applyBathrooms(baseCompile(engine,home),home))))}
