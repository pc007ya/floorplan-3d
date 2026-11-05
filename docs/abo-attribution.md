# ABO 家具參考：來源、署名與授權

## 來源與固定版本

- 原始資料：[Amazon Berkeley Objects](https://amazon-berkeley-objects.s3.amazonaws.com/index.html)；[原始 README](https://amazon-berkeley-objects.s3.amazonaws.com/README.md)。
- 瀏覽器最佳化版本：[CodePawl / abo-glb](https://huggingface.co/datasets/codepawl/abo-glb)。
- 本次鎖定 revision：`c6ac66142ecec2a2973b6e00072ec74940e1bec4`；[該版 dataset card](https://huggingface.co/datasets/codepawl/abo-glb/blob/c6ac66142ecec2a2973b6e00072ec74940e1bec4/README.md)。
- 查核日期：2026-11-05。每件模型 ID、版本固定 URL、縮圖 URL、大小與 SHA-256 見 [參考索引](../data/references/abo-glb-furniture.json)。

## 必須保留的署名

**Amazon Berkeley Objects (c) by Amazon.com.** 模型、影像及商品文字資料來源為 Amazon.com。

依官方 README，資料集、封裝與 benchmark 建置署名：Matthieu Guillaumin、Thomas Dideriksen、Kenan Deng、Himanshu Arora（Amazon.com），Jasmine Collins、Jitendra Malik（UC Berkeley）。

最佳化與縮圖封裝：**CodePawl**。CodePawl 並非 Amazon 關係企業；此專案、家具選集及使用方式均不表示 Amazon、UC Berkeley、CodePawl 或相關品牌背書。

## 授權範圍

原始 ABO 與此 CodePawl dataset card 均標示 **Creative Commons Attribution 4.0 International（CC BY 4.0）**。保留 [授權連結](https://creativecommons.org/licenses/by/4.0/) 與 [完整授權文本](licenses/abo-CC-BY-4.0.txt)；本 repo 的文本複製自 [官方授權檔](https://amazon-berkeley-objects.s3.amazonaws.com/LICENSE-CC-BY-4.0.txt)。

CC BY 4.0 允許在遵守條件下重製、分享及改作，包含商業用途，但不是無條件的「免版權」。須給予適當署名、提供來源與授權連結、標明修改，且不得施加與授權衝突的額外限制。授權不保證不侵權或適合特定用途，也不提供商標、專利、隱私或人格權許可；品牌、標誌與產品名稱仍屬其權利人。素材以現狀提供，沒有保固。法律條件以完整授權為準。

本檔說明適用於引用的 ABO 資料與 CodePawl 版本，不為整個 floorplan-3d repo 重新授權，也不表示商品可購得或產品規格可靠。

## 已做過的修改

1. CodePawl 依其 dataset card 對原始模型進行 dedup／prune／weld，將貼圖重編碼為 WebP、縮至最高 2048 px，並以 meshopt 壓縮幾何。該版說明指出本輪使用的 `objects/` 版本保留三角面與節點變換；另有 KTX2／簡化 LOD 版本，本選集未收錄其二進位檔。
2. 本專案從 metadata 選出 12 件家具、加入中文標籤／用途說明／既有 fixture ID 對照，並將尺寸顯示順序改為寬 × 深 × 高。這些是參考編排，不是模型幾何或材質修改。
3. 縮圖來自 CodePawl 固定版本，圖冊未修改圖片。GLB 和縮圖未放入 Git；驗證用下載只存於工作快取。

若日後調整材質、縮放、減面或合併到場景，交付模型、離線包、渲染作品與網站時應一併更新修改說明及署名，不只留在開發 repo。

研究出版引用：Jasmine Collins et al., *ABO: Dataset and Benchmarks for Real-World 3D Object Understanding*, CVPR 2022。[論文](https://arxiv.org/abs/2110.06199)。
