# Hướng dẫn Tích hợp License Hệ thống (Veo 3 & Sora)

Tài liệu này cung cấp hướng dẫn tối ưu để kết nối ứng dụng Python của bạn với License Dashboard.

## 🚀 Thông tin API Chính thức
Cấu trúc API đã được tối ưu hóa để đảm bảo tốc độ và tính ổn định trên môi trường Vercel.

- **Endpoint**: `https://dash-board-sora-eyuo.vercel.app/api/license-check`
- **Phương thức**: 
    - `POST`: Dùng để xác thực và đăng ký thiết bị (Chính).
    - `GET`: Dùng để kiểm tra trạng thái hoạt động của API (Health Check).
- **Định dạng dữ liệu**: `JSON`

---

## 🛠️ Cấu trúc dữ liệu gửi lên (Payload)

| Trường | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `license_key` | String | Chìa khóa do Admin cấp (VD: `VEO-XXXX-XXXX`) |
| `device_id` | String | ID định danh máy tính (Khuyên dùng Hardware ID) |
| `tool_id` | Number | **1** cho Veo 3, **2** cho Sora Multi Cookies |

---

## 💻 Mã nguồn Python mẫu (Tích hợp nhanh)

Dưới đây là một module hoàn chỉnh hỗ trợ **Xác thực + Lưu key vào Temp**. Bạn có thể copy trực tiếp vào dự án.

```python
import requests
import uuid
import os
import tempfile
import json

# --- CẤU HÌNH ---
DASHBOARD_URL = "https://dash-board-sora-eyuo.vercel.app"
API_URL = f"{DASHBOARD_URL}/api/license-check"
LICENSE_FILE = os.path.join(tempfile.gettempdir(), ".veo3_license")
TOOL_ID = 1  # 1: Veo 3, 2: Sora

def get_hwid():
    """Lấy Hardware ID duy nhất của máy tính"""
    return str(uuid.getnode())

def check_license(key):
    """Xác thực chìa khóa với Dashboard"""
    try:
        payload = {
            "license_key": key,
            "device_id": get_hwid(),
            "tool_id": TOOL_ID
        }
        response = requests.post(API_URL, json=payload, timeout=10)
        
        # Xử lý các lỗi HTTP nếu có
        if response.status_code == 405:
            return False, "Lỗi Server (405): Vui lòng liên hệ Admin để cập nhật API."
            
        data = response.json()
        if data.get("success") and data.get("status") == "valid":
            return True, "Hợp lệ"
        return False, data.get("detail", "License không hợp lệ")
    except Exception as e:
        return False, f"Lỗi kết nối: {str(e)}"

def save_key(key):
    """Lưu key vào thư mục Temp"""
    try:
        with open(LICENSE_FILE, 'w', encoding='utf-8') as f:
            json.dump({"key": key}, f)
    except: pass

def load_key():
    """Đọc key đã lưu"""
    if os.path.exists(LICENSE_FILE):
        try:
            with open(LICENSE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f).get("key")
        except: return None
    return None

# --- LUỒNG XỬ LÝ KHI MỞ APP ---
def start_verification():
    saved_key = load_key()
    if saved_key:
        print(f"🔄 Đang kiểm tra License: {saved_key}")
        is_ok, msg = check_license(saved_key)
        if is_ok: return True

    new_key = input("🔑 Nhập License Key: ").strip()
    is_ok, msg = check_license(new_key)
    if is_ok:
        save_key(new_key)
        print("✅ Kích hoạt thành công!")
        return True
    
    print(f"❌ Thất bại: {msg}")
    return False

# --- TÍCH HỢP CHO SORA MULTI COOKIES ---
# Tool ID: 2
# Tính năng:
# 1. Mỗi lần mở app đều check license tự động.
# 2. Nếu license sai hoặc hết hạn, hiển thị UI yêu cầu nhập key.
# 3. Không cho phép truy cập nếu không có license hợp lệ.
```

---

## 📋 Bảng mã phản hồi lỗi (detail)

| Thông báo | Ý nghĩa | Cách xử lý |
| :--- | :--- | :--- |
| `License key not found` | Key không tồn tại | Kiểm tra lại từng ký tự của Key. |
| `License is inactive` | **Admin đã khóa Key** | Liên hệ Admin để mở khóa. |
| `License expired` | Key đã hết hạn | Gia hạn thêm thời gian sử dụng. |
| `This key is for Sora only` | Sai loại Tool | Dùng đúng Key được cấp cho Veo 3. |
| `Max devices reached` | Hết lượt đổi thiết bị | Nhờ Admin reset thiết bị trên Dashboard. |

---

## ⚠️ Giải quyết sự cố (Troubleshooting)
- **Lỗi 405 hoặc 404:** Thường xảy ra khi Vercel đang kẹt bản build cũ. Hãy đợi 1-2 phút hoặc kiểm tra lại URL có `/api/license-check` ở cuối không.
- **Lỗi "Expecting value":** Nghĩa là server trả về lỗi HTML thay vì JSON. Nguyên nhân thường do URL bị sai hoặc Server đang bảo trì.
