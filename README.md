# Image Scanner Extension

> Chrome Extension quét toàn bộ ảnh trên trang hiện tại và hiển thị trong SidePanel.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=flat&logo=tensorflow&logoColor=white)

---

## Tính năng

- Quét tất cả ảnh trên trang: `<img>`, CSS `background-image`, `<picture>`, SVG `<image>`
- Hiển thị thumbnail, kích thước và URL ảnh dạng bảng (AG Grid)
- Tìm kiếm ảnh theo URL
- Lọc theo kích thước: **Nhỏ** / **Vừa** / **Lớn**
- Badge số lượng ảnh trên icon extension
- Tự động phát hiện ảnh mới bằng **MutationObserver**
- Xử lý AI trực tiếp trên trình duyệt với **TensorFlow.js** (không cần API key)

---

## Tech Stack

| Công nghệ | Mục đích |
|-----------|----------|
| **ReactJS** + TypeScript | UI chính của SidePanel |
| **Ant Design** | UI components |
| **AG Grid React** | Hiển thị danh sách ảnh dạng bảng |
| **TensorFlow.js** | Xử lý AI trong browser |
| **Lodash** | Debounce search |
| **Vite** | Build tool |

---

## Cấu trúc project

```
src/
├── background/
│   └── background.ts     # Service Worker — relay message, badge
├── content/
│   └── content.ts        # Inject vào trang — quét ảnh, highlight
└── sidepanel/
    ├── SidePanel.tsx      # React UI chính
    ├── sidepanel.html     # HTML entry
    └── sidepanels.tsx     # React entry point
```

---

## Cài đặt & Chạy

### 1. Clone repo

```bash
git clone https://github.com/dungdev-web/test_extention.git
cd test_extention
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Chạy development mode

```bash
npm run watch
```

### 4. Load extension vào Chrome

1. Mở Chrome và truy cập `chrome://extensions/`
2. Bật **Developer mode** (góc trên phải)
3. Nhấn **Load unpacked**
4. Chọn thư mục `dist/`

> Mỗi lần sửa code, chờ terminal rebuild xong → nhấn **Reload** extension trong Chrome.

---


## 📄 License

MIT
