# ABO 家具參考圖冊

已從 [CodePawl / ABO GLB](https://huggingface.co/datasets/codepawl/abo-glb) 的 7,953 個模型挑選 **12 件、8 類**公共區家具參考。這是外觀與模型來源清單，**尚未載入現有 3D 場景，也不是可匯入的家具方案 JSON**。

- 保留現有牆體、門窗、地磚、家具位置、沙發朝向及陽台通道。
- 不新增臥室家具、不恢復已取消的客浴設備。
- 本次只提交參考資料、下載工具和測試，**不提交 GLB／縮圖二進位檔**。下方預覽為固定版本的來源縮圖，需連網。
- 12 個選取模型合計 **14.88 MB**；不下載整個資料集。原始 metadata 約 8.3 MB，完整 WebP 模型集約 12.2 GB（來源說明值）。
- 資料來源與修改歷程見 [署名與授權](abo-attribution.md)；結構化索引見 [JSON](../data/references/abo-glb-furniture.json)。

## 尺寸怎麼看

下表是模型外框 **寬 X × 深 Z × 高 Y**，單位 cm，四捨五入至 0.1 cm。資料集以 m、Y 向上儲存；外框不是現場實測尺寸、座高、淨空或購買規格。商品標示尺寸可能與模型外框不同，JSON 同時保留來源商品尺寸，不能互相覆寫。

例如奶油白沙發外框約 230.1 × 95.7 cm，既有沙發提案約 240 × 90 cm；餐桌候選約 160.9 × 81.1 cm，既有提案約 132.5 × 77.5 cm。**候選並非直接相容**，放入前要逐件檢查走道、拉椅、開門、檯下淨空及朝向，不靠非等比縮放硬塞。

## 候選圖冊

每組可從圖片看外觀，再點 GLB 取得固定版本檔案。所有候選都只是試配來源，非樣品屋同款、施工規格、已確認採購品或購買建議。

### 沙發 A｜奶油白低背

![沙發 A｜奶油白低背，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B072M1WJF2.webp)

- 模型：`B072M1WJF2`；Rivet。
- 外框：**230.1 × 95.7 × 86.3 cm**；28,150 三角面；0.62 MB。
- 對照：`v2-sofa`。
- 用法：低背、細腳與淺色布面可作現有米灰沙發的外觀候選；不表示指定三人座規格。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B072M1WJF2/B072M1WJF2.glb)

### 沙發 B｜灰米厚坐墊

![沙發 B｜灰米厚坐墊，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B072635G2P.webp)

- 模型：`B072635G2P`；Stone & Beam。
- 外框：**229.9 × 104.0 × 92.2 cm**；32,452 三角面；2.55 MB。
- 對照：`v2-sofa`。
- 用法：灰米織布與厚坐墊為另一種輪廓選項；來源品名與模型外框有差異，需重核尺寸。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B072635G2P/B072635G2P.glb)

### 單椅 A｜棕皮低扶手

![單椅 A｜棕皮低扶手，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B075X4F3R5.webp)

- 模型：`B075X4F3R5`；Rivet。
- 外框：**75.3 × 85.1 × 88.3 cm**；20,582 三角面；0.88 MB。
- 對照：`v2-armchair`。
- 用法：棕色皮面、低扶手與木腳接近既有暖棕單椅方向。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B075X4F3R5/B075X4F3R5.glb)

### 單椅 B｜棕皮黑鋼架

![單椅 B｜棕皮黑鋼架，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B071J7Q9WN.webp)

- 模型：`B071J7Q9WN`；Rivet。
- 外框：**65.1 × 80.1 × 77.7 cm**；26,216 三角面；1.82 MB。
- 對照：`v2-armchair`。
- 用法：黑色鋼架與棕皮提供較輕巧、開放的輪廓替代。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B071J7Q9WN/B071J7Q9WN.glb)

### 餐桌｜胡桃木長桌

![餐桌｜胡桃木長桌，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B075YMXWZC.webp)

- 模型：`B075YMXWZC`；Rivet。
- 外框：**160.9 × 81.1 × 75.5 cm**；1,000 三角面；0.82 MB。
- 對照：`v2-dining`。
- 用法：僅作長桌比例與桌腳參考；木色不是既有白色桌面的替代定案，亦不代表已驗證可坐六人。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B075YMXWZC/B075YMXWZC.glb)

### 餐椅 A｜灰座黑框

![餐椅 A｜灰座黑框，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B07H37HWNR.webp)

- 模型：`B07H37HWNR`；Phoenix Home。
- 外框：**46.0 × 55.0 × 78.0 cm**；19,716 三角面；1.46 MB。
- 對照：`v2-chair-1`, `v2-chair-2`, `v2-chair-3`, `v2-chair-4`, `v2-chair-5`, `v2-chair-6`。
- 用法：灰色座背與深色細框較接近現有淺灰餐椅方向；需核對拉椅淨空。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B07H37HWNR/B07H37HWNR.glb)

### 餐椅 B｜白色菱格

![餐椅 B｜白色菱格，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B07HSJSH2Q.webp)

- 模型：`B07HSJSH2Q`；Rivet。
- 外框：**50.3 × 59.7 × 93.3 cm**；7,252 三角面；1.50 MB。
- 對照：`v2-chair-1`, `v2-chair-2`, `v2-chair-3`, `v2-chair-4`, `v2-chair-5`, `v2-chair-6`。
- 用法：淺色菱格座背與金屬框可作風格替代；來源商品為套裝，這裡的 GLB 外框是一張椅子。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B07HSJSH2Q/B07HSJSH2Q.glb)

### 吧椅 A｜米色木框

![吧椅 A｜米色木框，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B075YNTYVL.webp)

- 模型：`B075YNTYVL`；Stone & Beam。
- 外框：**46.3 × 48.0 × 101.1 cm**；11,188 三角面；2.28 MB。
- 對照：`v2-bar-1`, `v2-bar-2`, `v2-bar-3`。
- 用法：米色椅墊搭深木框，參考中島外側椅子；模型總高不等於座高。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B075YNTYVL/B075YNTYVL.glb)

### 吧椅 B｜淺灰低背

![吧椅 B｜淺灰低背，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B075YP32X2.webp)

- 模型：`B075YP32X2`；Rivet。
- 外框：**41.7 × 45.9 × 83.5 cm**；39,704 三角面；1.19 MB。
- 對照：`v2-bar-1`, `v2-bar-2`, `v2-bar-3`。
- 用法：淺灰低背、木腳為較簡潔選項；須另外核對座高與檯面底部淨空。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B075YP32X2/B075YP32X2.glb)

### 主茶几｜黑色收納

![主茶几｜黑色收納，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B07J29V51Q.webp)

- 模型：`B07J29V51Q`；AmazonBasics。
- 外框：**101.6 × 48.3 × 45.7 cm**；2,312 三角面；0.11 MB。
- 對照：`v2-coffee-1`。
- 用法：深色矩形量體與下層收納參考；不是石紋款，升降功能也未驗證為可動機構。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B07J29V51Q/B07J29V51Q.glb)

### 邊几｜白石紋黑框

![邊几｜白石紋黑框，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B07B7GB7BZ.webp)

- 模型：`B07B7GB7BZ`；Rivet。
- 外框：**45.5 × 45.5 × 43.0 cm**；16,168 三角面；0.20 MB。
- 對照：`v2-coffee-2`。
- 用法：白石紋與黑色交叉框可作副茶几外觀選項；不自動改動既有深色配色。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B07B7GB7BZ/B07B7GB7BZ.glb)

### 地毯｜米色環紋

![地毯｜米色環紋，CodePawl 提供的 ABO 縮圖](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/thumbs/B071LQHVJZ.webp)

- 模型：`B071LQHVJZ`；Stone & Beam。
- 外框：**213.5 × 152.4 × 1.3 cm**；1,256 三角面；1.45 MB。
- 對照：`v2-rug`。
- 用法：低彩度米色環紋作軟裝候選；保持既有地磚，不把地毯當成地坪材質。
- [固定版本 GLB](https://huggingface.co/datasets/codepawl/abo-glb/resolve/c6ac66142ecec2a2973b6e00072ec74940e1bec4/objects/B071LQHVJZ/B071LQHVJZ.glb)

## 選取下載與後續接入

先列出下載計畫，不會連網或寫檔：

```sh
node scripts/fetch-abo-reference.mjs B072M1WJF2 B075X4F3R5
```

確定模型後加上 `--download`，只下載指定 ID，驗證大小、SHA-256 與 GLB 2.0 標頭，存到 Git 忽略的 `assets/reference-cache/abo/`：

```sh
node scripts/fetch-abo-reference.mjs --download B072M1WJF2 B075X4F3R5
```

已有同雜湊檔案會跳過；不同內容不覆寫。腳本不支援全資料集下載，不會修改主場景或自動發布網站。下載時須保留 [署名](abo-attribution.md) 和 [授權文本](licenses/abo-CC-BY-4.0.txt)。

後續若接到 Three.js：沿用 repo 固定的 `three@0.160.0`，以 `GLTFLoader.setMeshoptDecoder(MeshoptDecoder)` 解壓，確認瀏覽器支援 WebP。此選集需要 `EXT_meshopt_compression`、`EXT_texture_webp` 與 `KHR_mesh_quantization`，不能只讀副檔名就假設舊載入器可用。KTX2／LOD 版本另需 KTX2Loader 與轉碼器，本輪未納入下載清單。

保持模型原比例，讀取實際 Box3，再核對來源 metadata；大多模型落地在 Y=0，不要假設每件都一樣。場景使用 m，而 `data/home.json` 平面座標仍是 trace units，必須透過既有比例轉接，不能直接把 m 當作平面座標。保留原 fixture ID、位置、旋轉、2D footprint、點選／拖曳／存檔行為，並重新驗證朝向和碰撞。

模型離線版目前是自包含的。不要把外部 Hugging Face 連結直接塞入 runtime 破壞零 HTTP 離線要求；確定導入時再明確處理本地打包、解碼器、資源釋放及授權交付。

## 已驗證與未驗證

- 2026-11-05：固定資料集 revision、讀取 7,953 行 metadata、核對原始 ABO 授權、逐張查看 12 張縮圖。
- 已實際取得這 12 個 GLB，驗證 byte size、SHA-256、GLB 2.0 標頭與所需擴充。檔案只留在工作快取，不加入 Git。
- 索引、fixture 對應、下載計畫／錯誤輸入與檔案驗證由 `node --test tests/*.test.mjs` 檢查。
- 尚未完成：實際場景家具替換、碰撞／淨空驗證、商品尺寸實測、動畫／可動構件驗證或 Blender 匯入驗收。
