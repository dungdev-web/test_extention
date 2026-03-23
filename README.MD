# Image Scanner Extension

Chrome Extension quét toàn bộ ảnh trên trang hiện tại và hiển thị trong SidePanel.

## Tech Stack

- **ReactJS** + TypeScript
- **Ant Design** — UI components
- **AG Grid React** — hiển thị danh sách ảnh dạng bảng
- **Lodash** — debounce search
- **TensorFlow.js** — xử lý AI trong browser (không cần API key)
  - `@tensorflow-models/body-pix` — xóa nền ảnh
  - `@tensorflow-models/coco-ssd` — nhận diện vật thể
- **Vite** — build tool

## Tính năng

- Quét tất cả ảnh trên trang: `<img>`, CSS `background-image`, `<picture>`, SVG `<image>`
- Hiển thị thumbnail, kích thước, URL
- Tìm kiếm theo URL
- Lọc theo kích thước: Nhỏ / Vừa / Lớn
- **Remove Background** — xóa nền ảnh bằng BodyPix (chạy offline)
- **Object Detection** — nhận diện vật thể bằng COCO-SSD (chạy offline)
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
    └── sidepanel.tsx     # React entry point
```

## Build production

```bash
npm run build
```

Output nằm trong thư mục `dist/`.