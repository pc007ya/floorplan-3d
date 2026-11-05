# Sand3D source attribution and modifications

These six furniture entries are manually reviewed **adaptations of official Sand3D repository examples**, not six separately downloaded dataset objects. They are not exact Blender renders or original exported meshes.

## Source and license

- Project: [Sand3D](https://github.com/Sandflow-ai/sand3d), by Sandflow.
- Upstream citation credits Thibault Neveu and Andréa Loy.
- Pinned revision: `0d589a5ba568fd72c8da97f8d039918650608a42` (2026-11-05).
- Repository example source license: **Apache License 2.0**. A copy is included at [docs/licenses/sand3d-Apache-2.0.txt](licenses/sand3d-Apache-2.0.txt).
- Original example source texts are retained under `docs/sources/sand3d/` for review. Local copies have one extra trailing newline; otherwise their source text is unchanged.
- Exact local-file and upstream-source SHA-256 hashes, immutable source URLs and download URLs are recorded in [sand3d-sources.json](../data/references/sand3d-sources.json).

The upstream README separately describes its Hugging Face datasets as CC BY 4.0. Those datasets are **not used here**. Dataset cards and individual object metadata were inaccessible during research, so no dataset object IDs, dataset-specific attribution or CC license are claimed for these Apache-licensed examples.

## Adaptations and change notice

This floorplan application's Three.js representations modify the original geometry construction, dimensions, materials and coordinate system. They use simplified primitive/custom meshes and locally selected colors. The original sources use millimetres and Z-up; the runtime adapts these to the application's units and Y-up. Dimensions and silhouettes are approximations.

- **sand3d-tufted-chair**: based on [`programs/tufted_chair.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/programs/tufted_chair.py). Manually approximated rolled tufted back, domed seat, nail trim and tapered legs.
- **sand3d-tufted-ottoman**: based on [`programs/tufted_chair.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/programs/tufted_chair.py). Back omitted to create a matching ottoman; tufted-chair seat and leg construction adapted.
- **sand3d-button-chair**: based on [`docs/examples/chair.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/docs/examples/chair.py). Button-back dining-chair silhouette adapted with simplified mesh construction.
- **sand3d-tapered-stool**: based on [`docs/examples/chair.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/docs/examples/chair.py). Back omitted; seat, tapered legs and rails adapted as a stool.
- **sand3d-table-lamp**: based on [`docs/examples/lamp.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/docs/examples/lamp.py). Revolved base, vertical stem and open conical shade approximated with Three.js meshes.
- **sand3d-floor-lamp**: based on [`docs/examples/lamp.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/docs/examples/lamp.py). Table-lamp construction adapted; stem and shade enlarged for a floor lamp.

There is no runtime Blender dependency, no dynamic execution of downloaded Python, and no claim of bit-for-bit geometric equivalence. Downloaded example programs were inspected as text, not executed. The floor-lamp stem and shade are enlarged relative to the table-lamp example.

## Source files

- [`programs/tufted_chair.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/programs/tufted_chair.py) → `docs/sources/sand3d/tufted_chair.py`
  - Local SHA-256: `d9e4695aee39239b8776d261683b4de56a64394f4db7a439122af7276846918f`
  - Upstream source SHA-256: `2d202db2b008af4f056d111df1edf2a2e872ace68478add6e447d2a83909f693`
- [`docs/examples/chair.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/docs/examples/chair.py) → `docs/sources/sand3d/chair.py`
  - Local SHA-256: `31bacd473411cb31639f586d47eb7796c4f34a4e1ff0e1c678e2faebd4ff6af5`
  - Upstream source SHA-256: `333fb94d40b190bb4fe44c5caca1e769f1d683714ea11cef7ca7795fa0f757fb`
- [`docs/examples/lamp.py`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/docs/examples/lamp.py) → `docs/sources/sand3d/lamp.py`
  - Local SHA-256: `e53ad875b581c42d4316e482c2dd2ccf9b0141dd20dd99c8d5d2686e513ce118`
  - Upstream source SHA-256: `66242f060d86131c7bd72f8bb54b7c8a6f76dda435a36713b6b48a3856a86bcf`
- [`LICENSE`](https://github.com/Sandflow-ai/sand3d/blob/0d589a5ba568fd72c8da97f8d039918650608a42/LICENSE) → `docs/licenses/sand3d-Apache-2.0.txt`
  - Local SHA-256: `8c6db340475136df3c1201d458fa5755698eace76e510471ecc9d857d6083dac`
  - Upstream source SHA-256: `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`
