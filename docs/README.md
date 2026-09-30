# 模型文件

- [V2.3 衛浴試配](bathrooms-v23.md)：目前已接上引擎的衛浴外觀、材質切換、玻璃隔間提案與離線驗證。
- [V2 樣品屋逐區規格](showhouse-v2-model-spec.md)：原始規劃與照片索引；各功能實作狀態以版本文件為準。
- [V2 原始提案 JSON](../data/proposals/showhouse-v2.json)：歷史規劃資料，不可當家具方案匯入，該檔本身不控制運行時。
- [原圖與精度界線](model-notes.md)：描圖來源、未校正尺寸及用途。
- [離線開啟說明](open-model.md)：單檔操作方式。

主幾何仍為 `data/home.json`；編譯入口為 `js/compile-scene.mjs`。樣品屋照片不覆蓋原圖地磚註記，也不自動變更房間用途。原始照片不上傳。
