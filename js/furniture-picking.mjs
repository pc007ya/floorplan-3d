/** Keep visual-only and effectively hidden architecture out of pointer picking. */
export function isPickingSurface(object) {
  for (let current = object; current; current = current.parent) {
    if (!current.visible || current.userData?.walkOnly) return false;
  }
  return true;
}

export function applyFurniturePicking(source) {
  const exact = (from, to, label) => {
    if (source.split(from).length !== 2) throw Error('Furniture picking adapter: ' + label);
    source = source.replace(from, () => to);
  };
  const marker = 'const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();';
  exact(marker, isPickingSurface.toString() + '\n' + marker, 'visibility helper');
  exact('    let o = h.object;\n    if (o.material === glassMat) continue;',
    '    let o = h.object;\n    if (!isPickingSurface(o) || o.material === glassMat) continue;', 'selection filter');
  exact('h.object.material !== glassMat && h.object.visible',
    'h.object.material !== glassMat && isPickingSurface(h.object)', 'ground placement filter');
  return source;
}
