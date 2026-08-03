# Plugin Localization

Áp dụng cho mọi plugin có giao diện frontend hoặc admin, kể cả widget, form, trang cấu hình, thông báo validation và flash message.

## Contract bắt buộc

- Plugin tự sở hữu bộ dịch của nó; không đưa chuỗi nghiệp vụ plugin vào XML/resource của theme.
- Luôn cung cấp tối thiểu `vi` và `en`. Dùng `vi` làm locale mặc định và fallback khi thiếu key hoặc locale không hợp lệ.
- Chỉ thêm `ko`, `ja` hoặc locale khác khi theme hoặc task yêu cầu; không suy đoán trước danh sách locale của theme.
- Dùng key có namespace theo miền giao diện, ví dụ `cart.title`, `checkout.submit`, `validation.out_of_stock`; không dùng nguyên câu làm key.
- Dịch toàn bộ text người dùng nhìn thấy: title/meta, label, button, breadcrumb, empty state, confirm, validation, flash và nội dung email nếu plugin tạo email.
- Cho phép placeholder có tên như `{product}` hoặc `{order}` và escape giá trị đúng ngữ cảnh khi render.

## Locale lifecycle

Resolve locale theo thứ tự rõ ràng: locale hợp lệ từ request, locale đã lưu trong session, cấu hình i18n hiện tại của CMS, rồi `vi`. Chỉ whitelist locale plugin thực sự đóng gói.

Giữ locale xuyên suốt:

- Link GET truyền locale hoặc dựa vào session đã capture.
- Form POST/PATCH/DELETE có hidden locale.
- Validation và flash message dùng locale của request hiện tại.
- Redirect sau thao tác phải giữ locale, gồm cả trang thành công và lỗi quay lại form.

Nếu plugin chạy khi plugin i18n của CMS bị tắt, bộ dịch `vi`/`en` riêng vẫn phải hoạt động.

## Cấu trúc và kiểm thử

Ưu tiên một thư mục tự chứa, nhất quán với loader của plugin, ví dụ:

```text
plugins/{slug}/translations/
├── {slug}_vi.xml
└── {slug}_en.xml
```

Test tối thiểu:

1. Tải được catalogue `vi` và `en`.
2. Locale mặc định và key thiếu fallback về tiếng Việt.
3. Một route/view đại diện render đầy đủ bằng tiếng Anh, không còn chuỗi tiếng Việt hard-code.
4. Một form đại diện giữ locale qua POST, validation và redirect.
5. ZIP chứa đủ hai bộ dịch và loader tương ứng.
