# 發布 V2.3 到 GitHub Pages

## 首次啟用

本 repo 的發布流程已加入 `.github/workflows/verify.yml`。流程本身不能取代 GitHub Pages 的首次啟用設定。

由 repo 擁有者開啟 `https://github.com/pc007ya/floorplan-3d/settings/pages`，在 **Build and deployment → Source** 選 **GitHub Actions**。不用再新增另一個範本 workflow，也不要選 `/docs` 作為網站目錄。

設定後，開啟 Actions 裡最新一次 **Verify traced home 3D**，對失敗的發布 job 按 **Re-run failed jobs**，或手動執行該 workflow。若部署被環境規則擋下，依照頁面顯示的核可流程處理，不繞過保護規則。

預期網站：`https://pc007ya.github.io/floorplan-3d/`。這是預期位址，不表示網站已發布成功；以 Actions 的部署結果及公開 `build-info.json` 內容為準。

## 後續發布

`master` 每次 push 依序執行資料測試、引擎編譯、一般 3D 測試、衛浴測試、專案子路徑 HTTP/WebGL 測試，再把同一份驗證過的 `_site` artifact 交給 GitHub Pages。任一驗證失敗即不部署。Pull request 只驗證、不部署。

部署完成後自動檢查公開 `build-info.json` 的來源 commit 是否與本次 `GITHUB_SHA` 相同。測試完成、artifact 上傳或程式提交都不等於網站已發布。

## 公開範圍

網站包只含自包含模型 HTML、離線副本、來源版本資訊、robots 設定與來源／Three.js 授權說明；不發布 repo 根目錄，不包含原始照片、建築圖掃描、EXIF、CI 日誌或原始碼 ZIP。

加入 `noindex` 與 `robots.txt` 是為了降低被搜尋引擎收錄的機會，**不是存取控制**。網站是公開的，任何取得網址的人都可能瀏覽或保存其中的模型資料。

## 線上與離線保存

GitHub Pages 網址和本機 HTML 是不同的瀏覽器儲存來源。既有離線家具布置不會自動出現在線上版；在舊版使用檔案選單匯出方案 JSON，再在線上版匯入。部署流程不包含你的本機保存資料。

模型仍為比例與外觀試配，尺寸尚未實測校正，不能用作施工圖。
