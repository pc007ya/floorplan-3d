# 直接打開第一版 3D

Actions artifact 中的 `dist/home-3d-offline.html` 是可攜式單一網頁，內含本戶型幾何與 Three.js r160 的必要程式。不含原始圖面、住址欄位或字型檔。一般瀏覽器可直接開啟此 HTML，不需要先部署網站或載入 CDN；瀏覽器必須支援 WebGL 與 import maps。受組織管理的瀏覽器若禁止本機 HTML，請使用該組織允許的靜態伺服器方式。

滑鼠左鍵拖曳旋轉、滾輪縮放、右鍵平移。T 切換平面／3D；「剖切牆」看室內配置，「全高牆」看暫定完整高度；「漫遊」從入口開始。

可攜版已將第一畫面調整為全屋視角。它載入的是此版草模比例；校正比例請使用 repo 首頁，或修改 `data/home.json` 重新編譯。匯入／匯出家具方案 JSON 使用編輯器的檔案選單。

重建：`node scripts/build.mjs --vendor`，再執行 `node scripts/pack-offline.mjs`。CI 除一般 3D 檢查外，另關閉網路並從 file URL 開啟單檔，檢查 WebGL、零 HTTP 請求與剖切按鈕狀態。請查看當次 Actions 結果是否通過。

本模型是依原圖人工描繪的比例草模。所有尺寸、面積、門窗高度與房間用途仍需核對；不可直接用作施工依據。
