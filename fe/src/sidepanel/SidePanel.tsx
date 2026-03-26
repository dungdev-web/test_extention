import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridApi, ICellRendererParams } from "ag-grid-community";
import { Button, Input, Typography, Checkbox } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import _ from "lodash";
import type { ImageData } from "../content/content";

const { Text } = Typography;

// ─── API ───────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:3000";

interface ImageItemPayload {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  srcType: string; // 'IMG' | 'CSS BG' | 'SOURCE'
  fileType?: string;
}

async function callUpload(images: ImageItemPayload[]) {
  const res = await fetch(`${API_BASE}/images/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getFileType(src: string): string | undefined {
  const ext = src.split(".").pop()?.toUpperCase().split("?")[0];
  return ["JPEG", "JPG", "PNG", "SVG", "WEBP", "GIF"].includes(ext ?? "")
    ? ext
    : undefined;
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#fff; }

.ag-theme-alpine .ag-root-wrapper  { border: none; }
.ag-theme-alpine .ag-header        { background:#fff; border-bottom:1px solid #e0e0e0; }
.ag-theme-alpine .ag-header-cell   { padding: 0 8px; }
.ag-theme-alpine .ag-header-cell-label { font-weight:600; font-size:13px; color:#222; }
.ag-theme-alpine .ag-row           { border-bottom:1px solid #f0f0f0; background:#fff; }
.ag-theme-alpine .ag-row:hover     { background:#f9fafb; }
.ag-theme-alpine .ag-cell          { padding:0; border:none; }
.ag-theme-alpine .ag-paging-panel  { border-top:1px solid #f0f0f0; color:#999; font-size:12px; padding:6px 12px; }

.act-btn {
  display:inline-flex; align-items:center; gap:5px;
  padding:4px 10px; border-radius:4px;
  font-size:12px; font-weight:500; cursor:pointer;
  width:116px; border:1px solid #ffa39e;
  background:#fff1f0; color:#cf1322;
  transition:all .15s;
  white-space:nowrap;
}
.act-btn:hover:not(:disabled) { background:#ffe0de; }
.act-btn:disabled { opacity:.5; cursor:not-allowed; }
.act-btn.success { border-color:#b7eb8f; background:#f6ffed; color:#389e0d; }
.act-btn.failed  { border-color:#ffa39e; background:#fff1f0; color:#cf1322; }

.size-btn {
  display:inline-flex; align-items:center; justify-content:center;
  gap:4px; padding:3px 10px; border-radius:4px; font-size:11px;
  cursor:pointer; border:1px solid #d9d9d9; background:#fff; color:#555;
  transition:all .15s; white-space:nowrap;
}
.size-btn.active  { background:#e6f4ff; border-color:#1677ff; color:#1677ff; font-weight:600; }
.size-btn:hover:not(.active) { background:#fafafa; border-color:#bbb; }
`;

// ─── Size presets ─────────────────────────────────────────────────────────────
const SIZE_PRESETS = [
  { label: "Tất cả", key: "all",    minW: 0,   minH: 0,   maxW: 99999, maxH: 99999 },
  { label: "🔹 Nhỏ", key: "small",  minW: 0,   minH: 0,   maxW: 100,   maxH: 100   },
  { label: "🔷 Vừa", key: "medium", minW: 101, minH: 101, maxW: 500,   maxH: 500   },
  { label: "🔶 Lớn", key: "large",  minW: 501, minH: 501, maxW: 99999, maxH: 99999 },
] as const;
type SizeKey = (typeof SIZE_PRESETS)[number]["key"];

// ─── Upload state type ────────────────────────────────────────────────────────
type UploadStatus = { loading?: string; status?: "success" | "failed" };

// ─── Action Cell ──────────────────────────────────────────────────────────────
interface ActionCellProps extends ICellRendererParams<ImageData> {
  onUpload: (img: ImageData, srcType: string) => Promise<void>;
  uploadState: Record<number, UploadStatus>;
}

const ActionCell: React.FC<ActionCellProps> = ({ data, onUpload, uploadState }) => {
  if (!data) return null;
  const state = uploadState[data.id] ?? {};

  const bgLoading  = state.loading === "CSS BG";
  const objLoading = state.loading === "IMG";
  const isSuccess  = state.status === "success";
  const isFailed   = state.status === "failed";

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      padding: "0 8px", justifyContent: "center", height: "100%",
    }}>
      {/* Background button */}
      <button
        className={`act-btn${isSuccess ? " success" : isFailed ? " failed" : ""}`}
        disabled={!!state.loading}
        onClick={() => onUpload(data, "CSS BG")}
      >
        {bgLoading ? "⏳" : isSuccess ? "✓" : isFailed ? "✕" : "✕"}
        {" "}Background
      </button>

      {/* Object button */}
      <button
        className={`act-btn${isSuccess ? " success" : isFailed ? " failed" : ""}`}
        disabled={!!state.loading}
        onClick={() => onUpload(data, "IMG")}
      >
        {objLoading ? "⏳" : isSuccess ? "✓" : isFailed ? "✕" : ""}
        {" "}Object
      </button>
    </div>
  );
};

// ─── Image Cell ───────────────────────────────────────────────────────────────
const ImageCell: React.FC<ICellRendererParams<ImageData>> = ({ data }) => {
  const [err, setErr] = useState(false);
  if (!data) return null;
  const w = data.width || data.naturalWidth || 0;
  const h = data.height || data.naturalHeight || 0;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", padding: "6px 4px", gap: 4,
    }}>
      {!err ? (
        <img
          src={data.src}
          alt={data.alt}
          onError={() => setErr(true)}
          style={{
            maxWidth: 90, maxHeight: 52, objectFit: "contain",
            borderRadius: 2, border: "1px solid #e8e8e8",
            background: "#fafafa", display: "block",
          }}
        />
      ) : (
        <div style={{
          width: 70, height: 44, background: "#f5f5f5",
          border: "1px dashed #d9d9d9", borderRadius: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 10, color: "#bbb" }}>No img</Text>
        </div>
      )}
      {(w > 0 || h > 0) && (
        <Text style={{ fontSize: 11, color: "#888" }}>{w} × {h}</Text>
      )}
    </div>
  );
};

// ─── Info Cell ────────────────────────────────────────────────────────────────
const InfoCell: React.FC<ICellRendererParams<ImageData>> = ({ data }) => {
  if (!data) return null;
  return (
    <div style={{
      padding: "8px 6px", height: "100%",
      display: "flex", alignItems: "center", overflow: "hidden",
    }}>
      <Text
        copyable={{ text: data.src }}
        style={{
          fontSize: 11, color: "#333",
          wordBreak: "break-all", lineHeight: 1.5, whiteSpace: "normal",
        }}
      >
        {data.src}
      </Text>
    </div>
  );
};

// ─── Main SidePanel ───────────────────────────────────────────────────────────
const SidePanel: React.FC = () => {
  const [images, setImages]   = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sizeKey, setSizeKey]   = useState<SizeKey>("all");
  const [uploadState, setUploadState] = useState<Record<number, UploadStatus>>({});
  const [bulkUploading, setBulkUploading] = useState(false);
  const gridApiRef = useRef<GridApi | null>(null);

  const preset = useMemo(
    () => SIZE_PRESETS.find((p) => p.key === sizeKey)!,
    [sizeKey],
  );

  // ── Scan ──────────────────────────────────────────────────────────────────
  const doScan = useCallback(() => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: "REQUEST_SCAN" }, (res) => {
      setLoading(false);
      if (res?.images) {
        setImages(res.images);
        setSelected(new Set());
        setUploadState({});
      }
    });
  }, []);

  useEffect(() => {
    doScan();
    const listener = (msg: { type: string; images?: ImageData[] }) => {
      if (
        (msg.type === "IMAGES_SCANNED" || msg.type === "IMAGES_UPDATED") &&
        msg.images
      ) setImages(msg.images);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [doScan]);

  // ── Search ────────────────────────────────────────────────────────────────
  const onSearch = useMemo(
    () => _.debounce((val: string) => {
      gridApiRef.current?.setGridOption("quickFilterText", val);
    }, 300),
    [],
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onSearch(e.target.value);
  };

  // ── Filter by size ────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => images.filter((img) => {
      const w = img.width || img.naturalWidth || 0;
      const h = img.height || img.naturalHeight || 0;
      return w >= preset.minW && w <= preset.maxW && h >= preset.minH && h <= preset.maxH;
    }),
    [images, preset],
  );

  // ── Select ────────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  // ── Upload single ─────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (img: ImageData, srcType: string) => {
    setUploadState((prev) => ({ ...prev, [img.id]: { loading: srcType } }));

    try {
      await callUpload([{
        url: img.src,
        width: img.width || img.naturalWidth,
        height: img.height || img.naturalHeight,
        alt: img.alt,
        srcType,
        fileType: getFileType(img.src),
      }]);
      setUploadState((prev) => ({ ...prev, [img.id]: { status: "success" } }));
    } catch (err) {
      setUploadState((prev) => ({ ...prev, [img.id]: { status: "failed" } }));
      console.error("Upload failed:", err);
    }
  }, []);

  // ── Upload bulk (selected) ────────────────────────────────────────────────
  const handleUploadSelected = useCallback(async (srcType: string) => {
    const targets = filtered.filter((img) => selected.has(img.id));
    if (!targets.length) return;

    setBulkUploading(true);

    // Mark all loading
    setUploadState((prev) => {
      const next = { ...prev };
      targets.forEach((img) => (next[img.id] = { loading: srcType }));
      return next;
    });

    const payload: ImageItemPayload[] = targets.map((img) => ({
      url: img.src,
      width: img.width || img.naturalWidth,
      height: img.height || img.naturalHeight,
      alt: img.alt,
      srcType,
      fileType: getFileType(img.src),
    }));

    try {
      const result = await callUpload(payload);

      setUploadState((prev) => {
        const next = { ...prev };
        result.results.forEach((r: { url: string; success: boolean }) => {
          const img = targets.find((i) => i.src === r.url);
          if (img) next[img.id] = { status: r.success ? "success" : "failed" };
        });
        return next;
      });
    } catch {
      setUploadState((prev) => {
        const next = { ...prev };
        targets.forEach((img) => (next[img.id] = { status: "failed" }));
        return next;
      });
    } finally {
      setBulkUploading(false);
    }
  }, [filtered, selected]);

  // ── Column defs ───────────────────────────────────────────────────────────
  const colDefs = useMemo(
    (): ColDef<ImageData>[] => [
      {
        headerName: "",
        width: 36,
        pinned: "left",
        sortable: false,
        resizable: false,
        headerComponent: () => (
          <Checkbox
            indeterminate={selected.size > 0 && selected.size < filtered.length}
            checked={filtered.length > 0 && selected.size === filtered.length}
            onChange={(e) =>
              setSelected(
                e.target.checked
                  ? new Set(filtered.map((i) => i.id))
                  : new Set(),
              )
            }
          />
        ),
        cellRenderer: (p: ICellRendererParams<ImageData>) => (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", height: "100%",
          }}>
            <Checkbox
              checked={selected.has(p.data!.id)}
              onChange={() => toggleSelect(p.data!.id)}
            />
          </div>
        ),
      },
      {
        headerName: "ID",
        field: "id",
        width: 52,
        sortable: true,
        cellStyle: {
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 12, color: "#888",
        },
      },
      {
        headerName: "Hình ảnh",
        field: "src",
        width: 110,
        sortable: false,
        cellRenderer: ImageCell,
      },
      {
        headerName: "Thông tin",
        field: "src",
        flex: 1,
        sortable: false,
        filter: true,
        cellRenderer: InfoCell,
        headerComponent: () => (
          <div style={{
            display: "flex", alignItems: "center",
            gap: 6, width: "100%", paddingRight: 4,
          }}>
            <span style={{
              fontWeight: 600, fontSize: 13,
              whiteSpace: "nowrap", color: "#222",
            }}>
              Thông tin
            </span>
            <Input
              size="small"
              placeholder="Search..."
              prefix={<SearchOutlined style={{ color: "#bbb", fontSize: 11 }} />}
              value={search}
              onChange={handleSearch}
              allowClear
              style={{ flex: 1, fontSize: 11 }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
      },
      {
        headerName: "Thao tác",
        width: 135,
        sortable: false,
        cellRendererParams: {
          onUpload: handleUpload,
          uploadState,
        },
        cellRenderer: ActionCell,
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [selected, filtered, toggleSelect, search, handleUpload, uploadState],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        height: "100vh", display: "flex",
        flexDirection: "column", background: "#fff",
      }}>
        {/* Header */}
        <div style={{ padding: "10px 14px 8px", borderBottom: "2px solid #f0f0f0" }}>
          <Text strong style={{ fontSize: 16, color: "#1a1a1a" }}>Quét ảnh</Text>
        </div>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap",
        }}>
          {/* Scan button */}
          <Button
            size="small"
            type="primary"
            loading={loading}
            onClick={doScan}
            style={{ fontSize: 12 }}
          >
            {loading ? "Đang quét..." : (
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 21-4.34-4.34" />
                <circle cx="11" cy="11" r="8" />
              </svg>
            )}
          </Button>

          {/* Size preset buttons */}
          <div style={{ display: "flex", gap: 4 }}>
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.key}
                className={`size-btn${sizeKey === p.key ? " active" : ""}`}
                onClick={() => setSizeKey(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Bulk upload buttons — chỉ hiện khi có ảnh được chọn */}
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                size="small"
                loading={bulkUploading}
                onClick={() => handleUploadSelected("CSS BG")}
                style={{
                  fontSize: 11, background: "#e6f4ff",
                  borderColor: "#1677ff", color: "#1677ff",
                }}
              >
                ↑ BG ({selected.size})
              </Button>
              <Button
                size="small"
                loading={bulkUploading}
                onClick={() => handleUploadSelected("IMG")}
                style={{
                  fontSize: 11, background: "#f6ffed",
                  borderColor: "#52c41a", color: "#389e0d",
                }}
              >
                ↑ Object ({selected.size})
              </Button>
            </div>
          )}

          <Text style={{ fontSize: 12, color: "#bbb", marginLeft: "auto" }}>
            {sizeKey !== "all"
              ? `${filtered.length} / ${images.length}`
              : images.length}{" "}ảnh
          </Text>
        </div>

        {/* AG Grid */}
        <div style={{ flex: 1, overflow: "hidden" }} className="ag-theme-alpine">
          <AgGridReact<ImageData>
            rowData={filtered}
            columnDefs={colDefs}
            rowHeight={90}
            headerHeight={40}
            onGridReady={(p) => { gridApiRef.current = p.api; }}
            animateRows
            pagination
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50]}
            suppressCellFocus
            getRowId={(p) => String(p.data.id)}
            overlayNoRowsTemplate={
              loading
                ? '<span style="color:#aaa;font-size:13px">Đang quét...</span>'
                : '<span style="color:#aaa;font-size:13px">Nhấn "Quét ảnh" để bắt đầu</span>'
            }
          />
        </div>
      </div>
    </>
  );
};

export default SidePanel;