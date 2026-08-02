---
name: widget-cms
description: Tạo, sửa và kiểm thử widget Laravel CMS theo renderer theme/core/plugin, layout builder, settings_schema, shortcode, hook, CSS/JS và zone contract.
license: MIT
version: 2.0.0
---

# CMS Widget Builder

Tạo widget hoàn chỉnh cho `C:\xampp\htdocs\cms` theo đúng ownership: theme widget cho một theme, core widget dùng chung, plugin widget cho chức năng độc lập hoặc xuyên theme.

## Workflow

1. Đọc [runtime-schema.md](references/runtime-schema.md) để xác định renderer, biến, schema và zone.
2. Chọn ownership; đọc [implementation.md](references/implementation.md) cho theme/core hoặc [plugin-boundary.md](references/plugin-boundary.md) cho plugin.
3. Tạo Blade, registry/manifest, schema và defaults cùng một contract; đọc [rendering-content.md](references/rendering-content.md) nếu có rich content, shortcode hoặc asset.
4. Chạy checklist trong [validation.md](references/validation.md), kiểm layout builder và frontend.

## Non-Negotiable

- Giữ `type`/`variant`/`style_key` khớp path Blade và registry.
- Dùng `settings_schema` cho mọi cấu hình block mới; key schema phải trùng key Blade đọc.
- Nút sửa block phải mở popup schema trong `Admin > Bố cục trang chủ`, không chuyển sang plugin settings.
- Scoped CSS/JS, ID unique theo `$block->id`, không tạo biến JS global.
- Dùng `cms_content()` cho rich content admin nhập; escape dữ liệu text/URL.
- Không đặt widget plugin vào core/theme hoặc sửa legacy controller khi schema giải quyết được.
- Không query không giới hạn trong Blade.

## Handoff

Báo type/variant, ownership, path Blade, schema, zone, asset/shortcode/hook, lệnh kiểm tra và trạng thái render.
