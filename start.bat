@echo off

REM 啟動 uvicorn，使用 --reload 參數實現熱重載
start uvicorn app.main:app --reload

REM 等待 uvicorn 啟動 (可選，根據實際情況調整延遲時間)
timeout /t 5 /nobreak >nul

REM 打開瀏覽器訪問 localhost:8000
start chrome "http://localhost:8000"

REM 退出批次檔
exit