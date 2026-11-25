import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { canvasPages, pageFrames } from '../../shared/pages'

type WidgetCategory = 'all' | 'form' | 'nav' | 'data' | 'layout'

interface WidgetDef {
  id: string
  label: string
  icon: string
  category: Exclude<WidgetCategory, 'all'>
  width: number
  html: string
}

const CATEGORIES: { id: WidgetCategory; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'form', label: 'Form' },
  { id: 'nav', label: 'Nút & Nav' },
  { id: 'data', label: 'Dữ liệu' },
  { id: 'layout', label: 'Bố cục' },
]

const WIDGETS: WidgetDef[] = [
  // ---------------- FORM ----------------
  {
    id: 'input',
    label: 'Ô nhập liệu',
    icon: '▭',
    category: 'form',
    width: 240,
    html: `<div style="display:flex;flex-direction:column;gap:6px;width:240px;font-family:Inter,system-ui,sans-serif;">
  <label style="font-size:12px;font-weight:600;color:#334155;">Tiêu đề trường <span style="color:#ef4444">*</span></label>
  <input type="text" placeholder="Nhập nội dung..." style="width:100%;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0f172a;background:#fff;" />
</div>`,
  },
  {
    id: 'search',
    label: 'Ô tìm kiếm',
    icon: '🔍',
    category: 'form',
    width: 260,
    html: `<div style="display:flex;align-items:center;gap:8px;width:260px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font-family:Inter,system-ui,sans-serif;">
  <span style="color:#94a3b8;font-size:13px;">🔍</span>
  <input type="search" placeholder="Tìm kiếm nhanh..." style="border:none;outline:none;width:100%;font-size:13px;color:#0f172a;background:transparent;" />
</div>`,
  },
  {
    id: 'combobox',
    label: 'Combobox',
    icon: '▾',
    category: 'form',
    width: 240,
    html: `<div style="display:flex;flex-direction:column;gap:6px;width:240px;font-family:Inter,system-ui,sans-serif;">
  <label style="font-size:12px;font-weight:600;color:#334155;">Chọn danh mục</label>
  <select style="width:100%;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0f172a;background:#fff;">
    <option>Lựa chọn 1</option>
    <option>Lựa chọn 2</option>
    <option>Lựa chọn 3</option>
  </select>
</div>`,
  },
  {
    id: 'multiselect',
    label: 'Chọn nhiều (Tags)',
    icon: '🏷',
    category: 'form',
    width: 280,
    html: `<div style="display:flex;flex-direction:column;gap:6px;width:280px;font-family:Inter,system-ui,sans-serif;">
  <label style="font-size:12px;font-weight:600;color:#334155;">Phòng ban áp dụng</label>
  <div style="display:flex;flex-wrap:wrap;gap:6px;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;">
    <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;">Sản phẩm ×</span>
    <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;">Kỹ thuật ×</span>
    <span style="font-size:12px;color:#94a3b8;padding:3px 4px;">+ Thêm...</span>
  </div>
</div>`,
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    icon: '☑',
    category: 'form',
    width: 220,
    html: `<label style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#0f172a;cursor:pointer;">
  <input type="checkbox" checked style="width:16px;height:16px;accent-color:#2563eb;" />
  <span>Cần phê duyệt gấp</span>
</label>`,
  },
  {
    id: 'radio',
    label: 'Radio Group',
    icon: '◉',
    category: 'form',
    width: 240,
    html: `<div style="display:flex;flex-direction:column;gap:8px;padding:12px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#0f172a;width:240px;">
  <div style="font-size:12px;font-weight:600;color:#475569;">Mức độ ưu tiên</div>
  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="radio" name="prio_w" checked style="accent-color:#2563eb;" /> Bình thường</label>
  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="radio" name="prio_w" style="accent-color:#2563eb;" /> Ưu tiên cao</label>
</div>`,
  },
  {
    id: 'switch',
    label: 'Công tắc',
    icon: '◐',
    category: 'form',
    width: 210,
    html: `<label style="display:inline-flex;align-items:center;gap:10px;padding:8px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#0f172a;cursor:pointer;">
  <input type="checkbox" checked style="width:18px;height:18px;accent-color:#16a34a;" />
  <span>Bật thông báo email</span>
</label>`,
  },
  {
    id: 'textarea',
    label: 'Ghi chú',
    icon: '≡',
    category: 'form',
    width: 280,
    html: `<div style="display:flex;flex-direction:column;gap:6px;width:280px;font-family:Inter,system-ui,sans-serif;">
  <label style="font-size:12px;font-weight:600;color:#334155;">Ghi chú chi tiết</label>
  <textarea rows="3" placeholder="Nhập mô tả..." style="width:100%;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0f172a;background:#fff;resize:vertical;"></textarea>
</div>`,
  },
  {
    id: 'date',
    label: 'Chọn ngày',
    icon: '📅',
    category: 'form',
    width: 220,
    html: `<div style="display:flex;flex-direction:column;gap:6px;width:220px;font-family:Inter,system-ui,sans-serif;">
  <label style="font-size:12px;font-weight:600;color:#334155;">Ngày áp dụng</label>
  <input type="date" style="width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0f172a;background:#fff;" />
</div>`,
  },
  {
    id: 'upload',
    label: 'Đính kèm file',
    icon: '📎',
    category: 'form',
    width: 260,
    html: `<label style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:260px;padding:18px;border:1.5px dashed #94a3b8;border-radius:10px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;cursor:pointer;text-align:center;">
  <span style="font-size:13px;font-weight:600;color:#1e293b;">📎 Tải lên tệp đính kèm</span>
  <span style="font-size:11px;color:#64748b;">PDF, DOCX, XLSX (tối đa 10MB)</span>
  <input type="file" style="display:none;" />
</label>`,
  },

  // ---------------- NAV & BUTTONS ----------------
  {
    id: 'button',
    label: 'Nút chính',
    icon: '▣',
    category: 'nav',
    width: 140,
    html: `<button type="button" style="padding:10px 18px;border-radius:10px;border:none;background:#2563eb;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 6px rgba(37,99,235,0.25);">Xác nhận</button>`,
  },
  {
    id: 'button-secondary',
    label: 'Nút phụ',
    icon: '▢',
    category: 'nav',
    width: 140,
    html: `<button type="button" style="padding:10px 18px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;cursor:pointer;">Hủy bỏ</button>`,
  },
  {
    id: 'action-bar',
    label: 'Nhóm nút duyệt',
    icon: '✓✕',
    category: 'nav',
    width: 260,
    html: `<div style="display:flex;gap:10px;width:260px;font-family:Inter,system-ui,sans-serif;">
  <button type="button" style="flex:1;padding:10px;border-radius:10px;border:none;background:#16a34a;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">✓ Phê duyệt</button>
  <button type="button" style="flex:1;padding:10px;border-radius:10px;border:1px solid #fecaca;background:#fff;color:#dc2626;font-size:13px;font-weight:600;cursor:pointer;">✕ Từ chối</button>
</div>`,
  },
  {
    id: 'tabs',
    label: 'Thanh Tabs',
    icon: '⊟',
    category: 'nav',
    width: 340,
    html: `<div style="display:inline-flex;gap:4px;padding:4px;background:#f1f5f9;border-radius:10px;font-family:Inter,system-ui,sans-serif;font-size:12.5px;font-weight:600;">
  <button type="button" style="padding:7px 14px;border-radius:8px;border:none;background:#fff;color:#0f172a;box-shadow:0 1px 2px rgba(0,0,0,0.06);cursor:pointer;">Tổng quan</button>
  <button type="button" style="padding:7px 14px;border-radius:8px;border:none;background:transparent;color:#64748b;cursor:pointer;">Chi tiết</button>
  <button type="button" style="padding:7px 14px;border-radius:8px;border:none;background:transparent;color:#64748b;cursor:pointer;">Lịch sử</button>
</div>`,
  },
  {
    id: 'breadcrumb',
    label: 'Breadcrumb',
    icon: '›',
    category: 'nav',
    width: 280,
    html: `<div style="display:inline-flex;align-items:center;gap:6px;font-family:Inter,system-ui,sans-serif;font-size:12.5px;color:#64748b;">
  <span>Trang chủ</span><span>/</span><span>Đề xuất</span><span>/</span><span style="color:#0f172a;font-weight:600;">Chi tiết #041</span>
</div>`,
  },
  {
    id: 'pagination',
    label: 'Phân trang',
    icon: '«»',
    category: 'nav',
    width: 240,
    html: `<div style="display:inline-flex;align-items:center;gap:4px;font-family:Inter,system-ui,sans-serif;font-size:12px;">
  <button type="button" style="padding:6px 10px;border:1px solid #e2e8f0;border-radius:7px;background:#fff;color:#64748b;cursor:pointer;">‹</button>
  <button type="button" style="padding:6px 10px;border:none;border-radius:7px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer;">1</button>
  <button type="button" style="padding:6px 10px;border:1px solid #e2e8f0;border-radius:7px;background:#fff;color:#334155;cursor:pointer;">2</button>
  <button type="button" style="padding:6px 10px;border:1px solid #e2e8f0;border-radius:7px;background:#fff;color:#334155;cursor:pointer;">3</button>
  <button type="button" style="padding:6px 10px;border:1px solid #e2e8f0;border-radius:7px;background:#fff;color:#64748b;cursor:pointer;">›</button>
</div>`,
  },

  // ---------------- DATA & CHARTS ----------------
  {
    id: 'table',
    label: 'Bảng dữ liệu',
    icon: '⊞',
    category: 'data',
    width: 440,
    html: `<div style="width:440px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-family:Inter,system-ui,sans-serif;font-size:12.5px;">
  <table style="width:100%;border-collapse:collapse;">
    <thead><tr style="background:#f8fafc;color:#475569;text-align:left;"><th style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">Mã</th><th style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">Hạng mục</th><th style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">Trạng thái</th></tr></thead>
    <tbody>
      <tr><td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;"><b>#001</b></td><td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">Hạng mục mẫu 1</td><td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#15803d;font-weight:600;">Hoàn tất</td></tr>
      <tr><td style="padding:10px 12px;"><b>#002</b></td><td style="padding:10px 12px;">Hạng mục mẫu 2</td><td style="padding:10px 12px;color:#d97706;font-weight:600;">Đang xử lý</td></tr>
    </tbody>
  </table>
</div>`,
  },
  {
    id: 'kpi',
    label: 'Thẻ KPI',
    icon: '▤',
    category: 'data',
    width: 210,
    html: `<div style="width:210px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;font-family:Inter,system-ui,sans-serif;">
  <div style="font-size:12px;color:#64748b;font-weight:500;">Tổng yêu cầu</div>
  <div style="font-size:24px;font-weight:700;color:#0f172a;margin-top:6px;">128</div>
  <div style="font-size:11px;color:#16a34a;margin-top:4px;font-weight:600;">↑ +14% tuần này</div>
</div>`,
  },
  {
    id: 'barchart',
    label: 'Biểu đồ cột',
    icon: '📊',
    category: 'data',
    width: 320,
    html: `<div style="width:320px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;font-family:Inter,system-ui,sans-serif;">
  <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:14px;">Tiến độ theo tuần</div>
  <div style="display:flex;align-items:flex-end;gap:12px;height:110px;padding-top:8px;">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;"><div style="width:100%;height:55px;background:#bfdbfe;border-radius:6px 6px 0 0;"></div><span style="font-size:10px;color:#64748b;">T2</span></div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;"><div style="width:100%;height:82px;background:#60a5fa;border-radius:6px 6px 0 0;"></div><span style="font-size:10px;color:#64748b;">T3</span></div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;"><div style="width:100%;height:68px;background:#93c5fd;border-radius:6px 6px 0 0;"></div><span style="font-size:10px;color:#64748b;">T4</span></div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;"><div style="width:100%;height:98px;background:#2563eb;border-radius:6px 6px 0 0;"></div><span style="font-size:10px;color:#64748b;">T5</span></div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;"><div style="width:100%;height:74px;background:#60a5fa;border-radius:6px 6px 0 0;"></div><span style="font-size:10px;color:#64748b;">T6</span></div>
  </div>
</div>`,
  },
  {
    id: 'progress',
    label: 'Thanh tiến độ',
    icon: '▰',
    category: 'data',
    width: 260,
    html: `<div style="width:260px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-family:Inter,system-ui,sans-serif;">
  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:#334155;margin-bottom:6px;"><span>Hoàn thành PoC</span><span>72%</span></div>
  <div style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;"><div style="width:72%;height:100%;background:#2563eb;border-radius:999px;"></div></div>
</div>`,
  },
  {
    id: 'stepper',
    label: 'Các bước duyệt',
    icon: '①②',
    category: 'data',
    width: 360,
    html: `<div style="display:flex;align-items:center;gap:8px;width:360px;padding:12px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;font-family:Inter,system-ui,sans-serif;font-size:12px;">
  <span style="padding:3px 9px;border-radius:999px;background:#16a34a;color:#fff;font-weight:700;">1</span><span style="font-weight:600;color:#0f172a;">Tạo phiếu</span>
  <div style="flex:1;height:2px;background:#16a34a;"></div>
  <span style="padding:3px 9px;border-radius:999px;background:#2563eb;color:#fff;font-weight:700;">2</span><span style="font-weight:600;color:#2563eb;">Duyệt</span>
  <div style="flex:1;height:2px;background:#e2e8f0;"></div>
  <span style="padding:3px 9px;border-radius:999px;background:#e2e8f0;color:#64748b;font-weight:700;">3</span><span style="color:#64748b;">Hoàn tất</span>
</div>`,
  },
  {
    id: 'timeline',
    label: 'Lịch sử duyệt',
    icon: '⋮',
    category: 'data',
    width: 280,
    html: `<div style="width:280px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px;font-family:Inter,system-ui,sans-serif;font-size:12.5px;">
  <div style="font-weight:700;color:#0f172a;">Lịch sử xử lý</div>
  <div style="display:flex;gap:10px;"><span style="width:9px;height:9px;border-radius:999px;background:#16a34a;margin-top:4px;flex:none;"></span><div><b>Minh (BA)</b> đã gửi yêu cầu<div style="font-size:11px;color:#64748b;">Hôm nay, 09:15</div></div></div>
  <div style="display:flex;gap:10px;"><span style="width:9px;height:9px;border-radius:999px;background:#f59e0b;margin-top:4px;flex:none;"></span><div><b>Lan</b> đang xem xét<div style="font-size:11px;color:#64748b;">Chờ phê duyệt</div></div></div>
</div>`,
  },
  {
    id: 'badge',
    label: 'Badge trạng thái',
    icon: '●',
    category: 'data',
    width: 120,
    html: `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;background:#dcfce7;color:#15803d;font-family:Inter,system-ui,sans-serif;font-size:12px;font-weight:600;">● Đã duyệt</span>`,
  },
  {
    id: 'avatar',
    label: 'Avatar + Tên',
    icon: '👤',
    category: 'data',
    width: 190,
    html: `<div style="display:inline-flex;align-items:center;gap:10px;padding:8px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;font-family:Inter,system-ui,sans-serif;">
  <div style="width:32px;height:32px;border-radius:999px;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">KB</div>
  <div><div style="font-size:12.5px;font-weight:600;color:#0f172a;">Khoa Bùi</div><div style="font-size:11px;color:#64748b;">Product Owner</div></div>
</div>`,
  },

  // ---------------- LAYOUT & POPUPS ----------------
  {
    id: 'header',
    label: 'Thanh Header',
    icon: '▔',
    category: 'layout',
    width: 520,
    html: `<div style="width:520px;display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;font-family:Inter,system-ui,sans-serif;">
  <div style="font-weight:700;font-size:15px;color:#0f172a;">⚡ Tên Ứng Dụng</div>
  <div style="display:flex;align-items:center;gap:14px;font-size:12.5px;color:#475569;"><span>Tổng quan</span><span>Báo cáo</span><button type="button" style="padding:6px 12px;border-radius:8px;border:none;background:#2563eb;color:#fff;font-weight:600;font-size:12px;">+ Tạo mới</button></div>
</div>`,
  },
  {
    id: 'sidebar',
    label: 'Menu trái',
    icon: '◧',
    category: 'layout',
    width: 210,
    html: `<div style="width:210px;background:#0f172a;color:#e2e8f0;border-radius:14px;padding:16px 12px;display:flex;flex-direction:column;gap:6px;font-family:Inter,system-ui,sans-serif;font-size:13px;">
  <div style="font-weight:700;color:#fff;padding:4px 10px 12px;font-size:14px;">Workspace</div>
  <div style="padding:8px 10px;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;">🏠 Tổng quan</div>
  <div style="padding:8px 10px;border-radius:8px;color:#cbd5e1;">📋 Danh sách</div>
  <div style="padding:8px 10px;border-radius:8px;color:#cbd5e1;">📊 Báo cáo</div>
  <div style="padding:8px 10px;border-radius:8px;color:#cbd5e1;">⚙ Cài đặt</div>
</div>`,
  },
  {
    id: 'modal',
    label: 'Popup / Modal',
    icon: '❐',
    category: 'layout',
    width: 360,
    html: `<div style="width:360px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 20px 40px rgba(15,23,42,0.16);font-family:Inter,system-ui,sans-serif;">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><b style="font-size:15px;color:#0f172a;">Xác nhận thao tác</b><span style="color:#94a3b8;cursor:pointer;">✕</span></div>
  <p style="font-size:13px;color:#475569;line-height:1.5;margin:0 0 16px;">Bạn có chắc chắn muốn gửi yêu cầu này sang bước phê duyệt tiếp theo không?</p>
  <div style="display:flex;justify-content:flex-end;gap:8px;">
    <button type="button" style="padding:8px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-size:12.5px;font-weight:600;">Đóng</button>
    <button type="button" style="padding:8px 14px;border-radius:8px;border:none;background:#2563eb;color:#fff;font-size:12.5px;font-weight:600;">Đồng ý</button>
  </div>
</div>`,
  },
  {
    id: 'card',
    label: 'Thẻ nội dung',
    icon: '❏',
    category: 'layout',
    width: 280,
    html: `<div style="width:280px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;font-family:Inter,system-ui,sans-serif;">
  <div style="font-size:14px;font-weight:700;color:#0f172a;">Tiêu đề thẻ</div>
  <p style="font-size:12.5px;color:#64748b;line-height:1.5;margin:6px 0 12px;">Mô tả ngắn gọn nội dung hoặc chức năng của khu vực này để khách hàng dễ hình dung.</p>
  <span style="font-size:12px;font-weight:600;color:#2563eb;">Xem chi tiết →</span>
</div>`,
  },
  {
    id: 'alert',
    label: 'Thông báo (Alert)',
    icon: '⚠',
    category: 'layout',
    width: 340,
    html: `<div style="width:340px;display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:10px;background:#fef3c7;border:1px solid #fde68a;color:#92400e;font-family:Inter,system-ui,sans-serif;font-size:12.5px;">
  <span>⚠️</span>
  <div><b>Lưu ý nghiệp vụ:</b> Các phiếu có giá trị trên 50 triệu cần thêm bước duyệt của Giám đốc.</div>
</div>`,
  },
  {
    id: 'sticky',
    label: 'Ghi chú (Sticky)',
    icon: '📝',
    category: 'layout',
    width: 220,
    html: `<div style="width:220px;padding:14px;border-radius:10px;background:#fef08a;color:#713f12;box-shadow:0 6px 16px rgba(0,0,0,0.08);font-family:Inter,system-ui,sans-serif;font-size:12.5px;line-height:1.5;">
  <b>Ghi chú BA:</b><br/>Cần xác nhận lại với khách hàng xem có cần xuất Excel ở màn này không.
</div>`,
  },
  {
    id: 'empty',
    label: 'Trạng thái rỗng',
    icon: '∅',
    category: 'layout',
    width: 300,
    html: `<div style="width:300px;padding:24px;border:1.5px dashed #cbd5e1;border-radius:14px;background:#f8fafc;text-align:center;font-family:Inter,system-ui,sans-serif;">
  <div style="font-size:24px;margin-bottom:6px;">📭</div>
  <div style="font-size:13px;font-weight:700;color:#0f172a;">Chưa có dữ liệu</div>
  <div style="font-size:12px;color:#64748b;margin-top:4px;">Bấm nút "Tạo mới" để bắt đầu thêm bản ghi đầu tiên.</div>
</div>`,
  },
  {
    id: 'rating',
    label: 'Đánh giá sao',
    icon: '★',
    category: 'layout',
    width: 190,
    html: `<div style="display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-family:Inter,system-ui,sans-serif;font-size:14px;color:#f59e0b;">
  <span>★★★★☆</span><span style="font-size:12px;font-weight:600;color:#334155;">4.2 / 5</span>
</div>`,
  },
]

function insertWidgetIntoHtml(html: string, widget: WidgetDef, x: number, y: number): string {
  const block = `\n<div data-doop-widget="${widget.id}" style="position:absolute;left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:30;">\n${widget.html}\n</div>\n`
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${block}</body>`)
  return `${html}${block}`
}

let cascadeOffset = 0

export function WidgetsPalette({ leftOffset = 16 }: { leftOffset?: number }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<WidgetCategory>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState<{ widget: WidgetDef; x: number; y: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const visibleWidgets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return WIDGETS.filter((w) => {
      if (category !== 'all' && w.category !== category) return false
      if (q && !w.label.toLowerCase().includes(q) && !w.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [category, query])

  async function addWidgetToFrame(widget: WidgetDef, targetFrameId?: string, dropX?: number, dropY?: number) {
    const state = useStore.getState()
    const canvas = state.canvas
    if (!canvas) return

    const pageId = state.activePageId ?? canvasPages(canvas)[0]!.id
    const framesOnPage = pageFrames(canvas, pageId)
    const frame =
      (targetFrameId ? canvas.frames.find((f) => f.id === targetFrameId) : undefined) ??
      (state.selectedId ? canvas.frames.find((f) => f.id === state.selectedId) : undefined) ??
      framesOnPage[0] ??
      canvas.frames[0]

    if (!frame) {
      setToast('Hãy tạo ít nhất 1 màn hình (Frame) trước khi thêm widget')
      setTimeout(() => setToast(null), 2500)
      return
    }

    const offset = (cascadeOffset++ % 6) * 24
    const x = dropX ?? Math.max(24, Math.min(frame.width - widget.width - 24, 48 + offset))
    const y = dropY ?? Math.max(24, Math.min(frame.height - 90, 64 + offset))

    setBusy(true)
    try {
      const nextHtml = insertWidgetIntoHtml(frame.html ?? '', widget, x, y)
      const updated = await api.updateFrame(frame.id, { html: nextHtml })
      useStore.getState().upsertFrame(updated)
      useStore.getState().select(frame.id)
      setToast(`Đã thêm "${widget.label}" vào ${frame.name}`)
      setTimeout(() => setToast(null), 2000)
    } catch {
      setToast('Không thể thêm widget vào màn hình này')
      setTimeout(() => setToast(null), 2500)
    } finally {
      setBusy(false)
    }
  }

  function startDrag(widget: WidgetDef, e: React.PointerEvent) {
    if (e.button !== 0) return
    const startX = e.clientX
    const startY = e.clientY
    let moved = false

    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return
      moved = true
      setDragging({ widget, x: ev.clientX, y: ev.clientY })
    }

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDragging(null)

      if (!moved) {
        addWidgetToFrame(widget)
        return
      }

      const state = useStore.getState()
      const canvas = state.canvas
      if (!canvas) return
      const pageId = state.activePageId ?? canvasPages(canvas)[0]!.id
      const framesOnPage = pageFrames(canvas, pageId)
      const worldX = (ev.clientX - state.viewport.x) / state.viewport.zoom
      const worldY = (ev.clientY - state.viewport.y) / state.viewport.zoom

      const hit = framesOnPage.find(
        (f) => worldX >= f.x && worldX <= f.x + f.width && worldY >= f.y && worldY <= f.y + f.height,
      )
      if (hit) {
        const localX = Math.max(8, Math.min(hit.width - 40, worldX - hit.x - widget.width / 2))
        const localY = Math.max(8, Math.min(hit.height - 40, worldY - hit.y - 20))
        addWidgetToFrame(widget, hit.id, localX, localY)
      } else {
        addWidgetToFrame(widget)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <>
      <div
        className="pointer-events-auto absolute bottom-4 z-50 flex flex-col items-start gap-2 transition-[left] duration-150"
        style={{ left: leftOffset }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {toast && (
          <div className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">{toast}</div>
        )}

        {open && (
          <div className="flex max-h-[500px] w-[360px] flex-col rounded-2xl border border-line bg-surface p-3 shadow-pop">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink">Kho kéo thả Widgets</div>
                <div className="text-[11px] text-ink-soft">Kéo thả vào màn hình hoặc click để chèn</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-1.5 py-0.5 text-xs text-ink-faint hover:bg-surface-2 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm widget (combobox, bảng, popup, biểu đồ...)"
              className="mb-2 w-full shrink-0 rounded-lg border border-line bg-surface-2/60 px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-blue-500 focus:outline-none"
            />

            <div className="mb-2.5 flex shrink-0 flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    category === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-surface-2 text-ink-soft hover:text-ink'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5">
              {visibleWidgets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  disabled={busy}
                  onPointerDown={(e) => startDrag(w, e)}
                  className="flex select-none flex-col items-center justify-center gap-1 rounded-xl border border-line bg-surface-2/50 px-2 py-2.5 text-center transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 active:scale-95 disabled:opacity-50"
                >
                  <span className="text-base leading-none">{w.icon}</span>
                  <span className="text-[11px] font-medium leading-tight text-ink">{w.label}</span>
                </button>
              ))}
              {visibleWidgets.length === 0 && (
                <div className="col-span-3 py-6 text-center text-xs text-ink-faint">Không tìm thấy widget phù hợp</div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1.5 rounded-pill border px-3.5 py-2 text-xs font-semibold shadow-pop transition-colors ${
            open
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-line bg-surface text-ink hover:bg-surface-2'
          }`}
        >
          <span>⊞</span>
          <span>Widgets</span>
        </button>
      </div>

      {dragging && (
        <div
          style={{ left: dragging.x + 12, top: dragging.y + 12 }}
          className="pointer-events-none fixed z-[100] rounded-lg border border-blue-500 bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xl"
        >
          {dragging.widget.icon} {dragging.widget.label}
        </div>
      )}
    </>
  )
}
