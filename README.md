# ArXiv Paper Summary App

一個使用 OpenAI GPT-4 為 arXiv 論文生成結構化摘要的網頁應用。

## 功能特點

- 瀏覽最新的 arXiv 論文（可選擇顯示 10-50 篇）
- 使用 GPT-4 生成 OOCM 格式的論文摘要：
  - Observation: 關鍵問題或議題
  - Objective: 研究目標
  - Challenge: 技術難點
  - Main Idea: 解決方案
- 支持多個研究領域：
  - Computer Vision
  - Artificial Intelligence
  - Machine Learning
  - Computation and Language
  - Robotics
- 簡潔的用戶界面
- 按需生成摘要，節省 API 使用量

## 技術棧

- Frontend: 
  - HTML5
  - JavaScript
  - Tailwind CSS
- Backend: 
  - Python
  - FastAPI
  - arxiv API
  - OpenAI GPT-4 API

## 快速開始

1. 克隆倉庫：
   ```bash
   git clone <repository-url>
   cd ArXiv-Paper-Summary-App
   ```

2. 創建虛擬環境：
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. 安裝依賴：
   ```bash
   pip install -r requirements.txt
   ```

4. 運行應用：
   ```bash
   uvicorn app.main:app --reload
   ```

5. 打開瀏覽器訪問：
   ```
   http://localhost:8000
   ```

6. 輸入你的 OpenAI API Key 開始使用

## 項目結構

```
├── app/
│   ├── api/            # API 端點
│   │   └── papers.py   # 論文相關 API
│   └── main.py         # FastAPI 應用配置
├── static/             # 靜態文件
│   ├── index.html      # 主頁面
│   └── js/
│       └── main.js     # 前端邏輯
└── requirements.txt    # 項目依賴
```

## API 端點

- `GET /api/papers/`: 獲取最新的 arXiv 論文列表
  - 參數：
    - `category`: 論文類別 (默認: cs.CV)
    - `max_results`: 返回結果數量 (默認: 10)
    - `days`: 查詢天數範圍 (默認: 7)

- `GET /api/papers/{paper_id}/summary`: 生成論文摘要
  - Header:
    - `X-API-Key`: OpenAI API Key
  - 返回：OOCM 格式的摘要

## 注意事項

- 需要 OpenAI API Key 才能生成摘要
- 摘要生成基於論文的 abstract，不是完整論文
- API 使用受 OpenAI 的速率限制
