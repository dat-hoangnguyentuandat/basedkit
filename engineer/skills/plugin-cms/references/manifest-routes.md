# Manifest And Routes

## Minimal Manifest

```json
{
  "name": "demo-announcement",
  "title": "Demo Announcement",
  "version": "1.0.0",
  "author": "CMS",
  "description": "Plugin demo.",
  "provider": "Plugins\\DemoAnnouncement\\Plugin"
}
```

Optional keys: `settings_route`, `permissions`, `route_permissions`, `admin_menu`, `settings_schema`, `widgets`.

## Registration

- `admin_menu`: mục nghiệp vụ/quản lý trong menu chính của admin panel.
- `settings_route`: route cấu hình chi tiết của plugin; nút Cấu hình và sidebar Danh sách plugin phải ưu tiên route này.
- `permissions`: use the plugin slug, not generic `settings`.
- `route_permissions`: map named routes to plugin permission.
- `settings_schema`: plugin-wide settings, not a block's settings.
- `widgets`: widget label, zones and block schema.

## Management And Configuration Routes

Khai báo hai route độc lập khi plugin vừa có nghiệp vụ vừa có cấu hình:

```json
{
  "settings_route": "admin.plugins.sell.settings",
  "admin_menu": [
    {
      "group": "Cửa hàng",
      "route": "admin.plugins.sell.orders",
      "icon": "inbox",
      "label": "Đơn hàng",
      "permission": "sell"
    }
  ]
}
```

| Vị trí điều hướng | Route đích | Khung giao diện |
| --- | --- | --- |
| Menu chính admin panel | `admin_menu[].route` | Trang quản lý độc lập, chỉ dùng `layouts.admin` |
| Nút Cấu hình ở danh sách plugin | `settings_route` | Trang cấu hình plugin |
| Sidebar Danh sách plugin | `settings_route` | Chỉ dùng trong trang cấu hình plugin |

Không dùng `admin_menu[].route` làm đích cho sidebar Danh sách plugin khi đã có `settings_route`. Không đặt `admin.plugins._sidebar` trong danh sách, chi tiết hoặc dashboard nghiệp vụ như đơn hàng, đăng ký, booking hay CRM. Không tạo thanh tab trong plugin để nối route quản lý với route cấu hình.

`routes/admin.php` is automatically wrapped by core with `/admin/plugins/{slug}` and route name prefix `admin.plugins.{slug}.`; `routes/api.php` uses `/api/plugins/{slug}` and `api.plugins.{slug}.`. Keep `routes/web.php` plugin-scoped and inspect actual core behavior before assuming middleware.

Use namespaced views such as `plugin-{slug}::admin.index`. Chỉ trang cấu hình nằm trong Plugins sidebar area; các trang nghiệp vụ dùng vùng nội dung admin độc lập. Do not edit the main admin layout.
