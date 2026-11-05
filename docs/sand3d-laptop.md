# 圖片同款 Sand3D Laptop

已對照使用者提供的 Explorer 截圖及官方 render，確認是 **Laptop / Objaverse · Electronics / 106 parts**：`objaverse-d2b3ba347ffa4623a2ebc066050d8763`。

這件使用的是實際官方 GLB 的 106 個網格，不是重新畫的相似筆電。它與先前 6 件 Apache 範例轉寫家具分開標示。

## 使用方式

在家具庫最上方選「Sand3D 筆記型電腦」，點選或拖入場景。它可以移動、旋轉、調整寬深、機殼顏色及底部高度，並隨既有方案保存、匯出／匯入。

- 預設占地 350 × 293 mm，高約 251 mm。
- 預設底部高度 0 mm。若放到桌面，可將「底部高度」設成桌面高度，例如 740 mm，再調整位置。沒有自動吸附桌面的判定。
- 原模型沒有開闔關節，螢幕維持來源的開啟角度。
- 這是尺寸試配，不能當成商品規格、採購或施工依據。
- 原 27 件預設家具、格局與照片隱私保持不變。使用者截圖沒有加入公開 repo。

## 來源、授權及修改

原作：**"laptop" by sangar17**，[Sketchfab 原作](https://sketchfab.com/3d-models/laptop-d2b3ba347ffa4623a2ebc066050d8763)，CC BY 4.0。已另透過 Sketchfab 官方模型 API 驗證作者及授權。

重建：Sandflow / Sand3D 將原作重寫為 Sand3D 程式；資料集重建模型同為 **CC BY 4.0**。兩層署名均保留。

- [Sand3D Explorer 對應物件](https://sandflow-sand3d-explorer.hf.space/o/objaverse-d2b3ba347ffa4623a2ebc066050d8763)
- [資料列](https://huggingface.co/datasets/Sandflow/sand3d-objaverse/viewer/default/train?row=35451)
- [固定版本 USD](https://huggingface.co/datasets/Sandflow/sand3d-objaverse/blob/92dd5858c177734782734c20f20b2de522b229bf/usda/0007/objaverse-d2b3ba347ffa4623a2ebc066050d8763.usda)
- 資料集 revision：`92dd5858c177734782734c20f20b2de522b229bf`
- GLB：360,712 bytes；SHA-256 `c1ca61806c3548a215d9ec9a833e7c1263e600df1f81d1932952547b09c3020f`
- [完整來源、授權與雜湊](../data/references/sand3d-laptop.json)
- [CC BY 4.0 完整文本](licenses/sand3d-laptop-CC-BY-4.0.txt)，也完整嵌入離線 HTML。

本專案修改：建置時以 Three.js 官方 GLTFLoader 將 GLB 轉為 ObjectLoader 資料，保留 106 個網格、原材料與節點轉換；將模型置中、貼地，並接上尺寸、底部高度和機殼顏色編輯。預設寬深取毫米整數，因此深度有約 0.16 mm 的取整差異。沒有執行下載的 Python 程式。

## 開發與驗證

- `assets/sand3d/laptop.glb`：已鎖定雜湊的官方模型；同目錄 metadata 保留個別物件來源資訊。
- `scripts/convert-sand3d-laptop.mjs`：建置時轉換，可重現，不需 Blender；拒絕不符雜湊、外部 buffer、貼圖或必要擴充。
- `js/sand3d-laptop-data.mjs`：生成的純幾何／材質資料。
- `js/sand3d-laptop.mjs`：編輯器整合、獨立幾何複本、授權與圖例。
- `tests/sand3d-laptop.test.mjs`：幾何、來源、屬性與保存資料檢查。

離線包自包含，不向 Sand3D、Sketchfab 或其他網站發出模型／貼圖請求。靜態幾何預覽不等於 WebGL 瀏覽器驗證；真實瀏覽器結果以實際 CI 為準，目前建立 draft PR 仍待批准。
