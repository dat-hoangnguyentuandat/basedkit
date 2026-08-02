# Plugin Admin Console

Use a console for a plugin with several configuration, page-content or theme-block areas. Avoid one long page of `<details>`. Console thuộc khu vực cấu hình plugin, không phải nơi chứa màn hình vận hành nghiệp vụ chính.

```text
plugins/{slug}/
├── admin_console.php
├── routes/admin.php
└── resources/views/admin/
    ├── index.blade.php
    ├── console.blade.php
    └── console-{section}.blade.php
```

Group `overview`, `appearance`, `data`, `content` and `advanced` as needed. Each item has a stable `section/item` query so redirects preserve context.

Chỉ dùng `overview` cho trạng thái kỹ thuật hoặc hướng dẫn cấu hình. Đặt KPI nghiệp vụ, thống kê doanh thu, số đơn và danh sách gần đây ở đầu trang quản lý tương ứng.

Supported item types:

`overview`, `resource`, `settings`, `theme_block`, `page_content`, `json_config`, `action`, `custom_view`, `external_route`.

For `resource`, implement add, edit, cancel, delete, filter, pagination, export and correct redirect. Chỉ giữ resource cấu hình trong console. Đưa resource nghiệp vụ chính như đơn hàng, booking, đăng ký hoặc CRM ra route quản lý độc lập được khai báo bằng `admin_menu`.

For `theme_block`, keep the widget schema, scope by active theme/plugin block type, expose `frontend.url` and `frontend.selector`, and show an empty state instead of creating unintended blocks.

Chỉ wrap trang console/cấu hình bằng `layouts.admin`, `wc-layout` và `admin.plugins._sidebar`. Các trang danh sách, chi tiết và dashboard nghiệp vụ chỉ extend `layouts.admin`, không include `admin.plugins._sidebar` và không có tab quay sang cấu hình.

`external_route` trong console chỉ được dẫn tới một trang cấu hình chuyên sâu. Không dùng nó để đưa route nghiệp vụ trở lại sidebar Plugins.

Luồng bắt buộc:

- Menu chính admin panel → trang quản lý nghiệp vụ.
- Danh sách plugin → nút Cấu hình → `settings_route`.
- Sidebar Danh sách plugin → `settings_route`, không phải `admin_menu[].route`.
