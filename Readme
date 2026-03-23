# Image Scanner Extension

Chrome Extension quét toàn bộ ảnh trên trang hiện tại và hiển thị trong SidePanel.

## Tech Stack

- **ReactJS** + TypeScript
- **Ant Design** — UI components
- **AG Grid React** — hiển thị danh sách ảnh dạng bảng
- **Lodash** — debounce search
- **TensorFlow.js** — xử lý AI trong browser (không cần API key)
- **Vite** — build tool

## Tính năng

- Quét tất cả ảnh trên trang: `<img>`, CSS `background-image`, `<picture>`, SVG `<image>`
- Hiển thị thumbnail, kích thước, URL
- Tìm kiếm theo URL
- Lọc theo kích thước: Nhỏ / Vừa / Lớn
- Badge số lượng ảnh trên icon extension
- Auto-detect ảnh mới (MutationObserver)

## Cài đặt & Chạy

```bash
npm install
npm run watch
```

Sau đó vào `chrome://extensions/` → **Load unpacked** → chọn thư mục `dist/`.

Mỗi lần sửa code, chờ terminal rebuild xong → nhấn **Reload** extension trong Chrome.

## Cấu trúc project

```
src/
├── background/
│   └── background.ts     # Service Worker — relay message, badge
├── content/
│   └── content.ts        # Inject vào trang — quét ảnh, highlight
└── sidepanel/
    ├── SidePanel.tsx     # React UI chính
    ├── sidepanel.html    # HTML entry
    └── sidepanels.tsx     # React entry point
```

## Build production

```bash
npm run build
```

Output nằm trong thư mục `dist/`.
