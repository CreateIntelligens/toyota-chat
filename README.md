# 和泰教育訓練聊天室 (Hotai Training Chatroom)

這是一個專為和泰教育訓練設計的 AI 聊天室前端應用程式。基於 React 19、Vite 和 Tailwind CSS v4 構建，具備現代化的 UI 介面，並支援與 Gemini File Search API 進行串接，實現知識庫檢索對話。

## 🌟 核心功能

- **現代化專業 UI**：採用和泰汽車品牌配色（紅、黑、灰白），介面直覺且美觀。
- **對話管理**：支援開啟新對話、查看歷史對話紀錄以及前端刪除功能。
- **知識庫整合**：串接 Gemini 2.5 Flash 模型，針對教育訓練內容進行智慧問答。
- **全響應式設計**：完美適配桌機與行動裝置，支援側邊欄收合。
- **Docker 支持**：提供 `docker-compose` 快速部署方案。

## 🚀 快速開始

### 環境要求
- Docker & Docker Compose
- 或 Node.js 20+

### 環境設定
在 `frontend` 目錄下建立 `.env` 檔案，並填入以下資訊：

```env
VITE_API_BASE_URL=http://your-api-endpoint:port
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_STORE_NAME=your-file-search-store-name
```

### 使用 Docker 部署 (推薦)
1. 在專案根目錄執行：
   ```bash
   docker-compose up --build
   ```
2. 開啟瀏覽器造訪 `http://localhost:8080`。

### 本地開發
1. 進入前端目錄：
   ```bash
   cd frontend
   ```
2. 安裝依賴：
   ```bash
   npm install
   ```
3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

## 🛠 技術棧
- **Frontend**: React 19, TypeScript, Vite 7
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **API Client**: Axios, Date-fns
- **Deployment**: Docker, Nginx (Alpine)

## 📄 授權說明
由 **創造智能** 出品。和泰汽車教育訓練專用系統。

---
*注意：本專案為前端應用，需搭配指定的後端 API 伺服器方能運行。*
