---
name: plugin-cms
description: Tạo, sửa, kiểm thử và đóng gói plugin Laravel CMS với manifest, lifecycle, routes, admin console, widget, schema, hook, shortcode, asset, migration và permission; tách đúng trang quản lý trong admin menu khỏi trang cấu hình trong khu vực Plugins.
license: MIT
metadata:
  version: "2.1.0"
---

# CMS Plugin Builder

Mở rộng `C:\xampp\htdocs\cms` bằng plugin tự chứa trong `plugins/{slug}`. Giữ logic/chức năng trong plugin, không sửa core/theme chỉ để phục vụ một plugin.

## Workflow

1. Đọc [lifecycle-structure.md](references/lifecycle-structure.md) để xác định scope, slug, cấu trúc và lifecycle.
2. Đọc [manifest-routes.md](references/manifest-routes.md) trước khi viết manifest/routes/permission.
3. Nếu có widget, đọc [widgets-settings.md](references/widgets-settings.md); nếu có admin lớn, đọc [admin-console.md](references/admin-console.md).
4. Đọc [data-migrations.md](references/data-migrations.md) cho dữ liệu riêng và [frontend-hooks-shortcodes.md](references/frontend-hooks-shortcodes.md) cho frontend, hook hoặc shortcode.
5. Đọc [assets-package.md](references/assets-package.md), rồi chạy [validation.md](references/validation.md) trước khi handoff.

## Non-Negotiable

- Bắt buộc có `plugins/{slug}/plugin.json`; plugin active mới đăng ký route/view/widget/hook/asset.
- Dùng registry/manifest cho menu, permission và route; không sửa sidebar/core auth chỉ để vá điều hướng của một plugin.
- `admin_menu` chỉ mở trang nghiệp vụ/quản lý độc lập trong admin panel; trang này không dùng `admin.plugins._sidebar`.
- `settings_route` là lối vào cấu hình chi tiết từ nút Cấu hình và sidebar Danh sách plugin; sidebar này chỉ xuất hiện trong khu vực cấu hình plugin và không mở route nghiệp vụ.
- Không tạo tab nội bộ nối trang quản lý với trang cấu hình. Giữ hai luồng điều hướng độc lập.
- Giữ widget fields trong `settings_schema`; console cấu hình chỉ giữ plugin-wide settings và resource cấu hình, còn CRUD/workflow nghiệp vụ nằm ở trang quản lý.
- Deactivate không xóa data; migration/update phải bảo toàn dữ liệu.
- Plugin self-contained dùng `plugin-assets/{slug}`, không phụ thuộc theme cụ thể.
- Escape dữ liệu, CSRF form, giới hạn query, prefix CSS/JS và chống boot trùng.
- Đóng ZIP không chứa cache, vendor, node_modules, path máy dev hoặc theme cũ.

## Handoff

Báo path/plugin state, admin route, widget/shortcode/hook, migration, asset, lệnh kiểm tra và ZIP nếu có.
