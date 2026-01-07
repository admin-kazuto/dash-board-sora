# Hướng dẫn Tích hợp License Hệ thống (Veo 3 & Sora)

Tài liệu này hướng dẫn cách kết nối ứng dụng của bạn (Python) với hệ thống quản lý License Dashboard.

## 🚀 Thông tin API mới nhất
Để tránh lỗi **405 (Method Not Allowed)**, vui lòng sử dụng endpoint đã được tối ưu hóa sau:

- **Endpoint**: `https://dash-board-sora.vercel.app/api/license-check`
- **Phương thức**: `POST`
- **Định dạng dữ liệu**: `JSON`

---

## 🛠️ Cấu trúc dữ liệu gửi lên (Payload)

| Trường | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `license_key` | String | Key người dùng nhập (VD: `VEO-XXXX-XXXX` hoặc `SORA-XXXX-XXXX`) |
| `device_id` | String | ID định danh máy tính (Dùng địa chỉ MAC hoặc UUID) |
| `tool_id` | Number | **1** cho Veo 3, **2** cho Sora |

---

## 💻 Mã nguồn Python mẫu (Khuyên dùng)

Dưới đây là một module hoàn chỉnh để bạn tích hợp vào dự án **Veo 3**. Module này hỗ trợ:
1. Xác thực License.
2. Lưu key vào thư mục Temp để người dùng không phải nhập lại nhiều lần.
3. Xử lý lỗi chi tiết (Hết hạn, bị khóa, sai thiết bị).

```python
import requests
import uuid
import os
import tempfile
import json

# --- CẤU HÌNH ---
# Sử dụng domain chính xác để tránh lỗi 405
DASHBOARD_URL = "https://dash-board-sora.vercel.app"
API_ENDPOINT = f"{DASHBOARD_URL}/api/license-check"
LICENSE_FILE = os.path.join(tempfile.gettempdir(), ".veo3_license")
TOOL_ID = 1  # ⚠️ Thay thành 2 nếu là App Sora

def get_hwid():
    """Lấy Hardware ID duy nhất của thiết bị"""
    return str(uuid.getnode())

def verify_license(key):
    """
    Xác thực chìa khóa với Dashboard
    Returns: (bool, str) -> (Thành công?, Tin nhắn phản hồi)
    """
    try:
        payload = {
            "license_key": key,
            "device_id": get_hwid(),
            "tool_id": TOOL_ID
        }
        
        response = requests.post(API_ENDPOINT, json=payload, timeout=10)
        
        # Kiểm tra nếu API trả về lỗi 405 hoặc lỗi máy chủ
        if response.status_code == 405:
            return False, "Lỗi server (405): Vui lòng kiểm tra lại endpoint API."
            
        result = response.json()
        
        if result.get("success") and result.get("status") == "valid":
            return True, "License hợp lệ!"
        else:
            # Lấy chi tiết lỗi từ server (Hết hạn, bị khóa,...)
            error_msg = result.get("detail", "License không hợp lệ.")
            return False, error_msg
            
    except Exception as e:
        return False, f"Lỗi kết nối: {str(e)}"

def save_license(key):
    """Lưu key vào máy (thư mục temp)"""
    try:
        with open(LICENSE_FILE, 'w', encoding='utf-8') as f:
            json.dump({"key": key}, f)
    except: pass

def load_license():
    """Đọc key đã lưu"""
    if os.path.exists(LICENSE_FILE):
        try:
            with open(LICENSE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f).get("key")
        except: return None
    return None

# --- VÍ DỤ TÍCH HỢP VÀO APP ---

def activate_app():
    # 1. Thử đọc key cũ đã lưu trong Temp
    saved_key = load_license()
    
    if saved_key:
        print(f"🔄 Đang kiểm tra key cũ: {saved_key}...")
        is_ok, msg = verify_license(saved_key)
        if is_ok:
            print("✅ Đăng nhập thành công!")
            return True
        else:
            print(f"❌ Lỗi: {msg}")

    # 2. Nếu chưa có key hoặc key cũ hỏng -> Yêu cầu nhập mới
    print("\n--- KÍCH HOẠT VEO 3 ---")
    new_key = input("Vui lòng nhập License Key: ").strip()
    
    is_ok, msg = verify_license(new_key)
    if is_ok:
        save_license(new_key)
        print("✅ Kích hoạt thành công! Key đã được lưu.")
        return True
    else:
        print(f"❌ Không thể kích hoạt: {msg}")
        return False

if __name__ == "__main__":
    if activate_app():
        print("🚀 Khởi động Veo 3...")
    else:
        print("🛑 Ứng dụng đã dừng.")
```

---

## 📋 Danh sách mã phản hồi từ Server

Khi `success` là `false`, hãy kiểm tra giá trị `detail` để báo cho người dùng:

| Nội dung `detail` | Ý nghĩa |
| :--- | :--- |
| `License key not found` | Key không tồn tại trên hệ thống. |
| `License is inactive` | **Key đã bị Admin khóa.** |
| `License expired` | Key đã hết hạn sử dụng. |
| `This key is for Sora only` | Key này chỉ dùng cho Sora, không dùng được cho Veo. |
| `Max devices reached` | Đã hết lượt dùng cho thiết bị này. |

---

## ⚠️ Lưu ý quan trọng
- **Bắt buộc** dùng `/api/license-check` (không dùng `/api/license/check`).
- Nếu gặp lỗi `Expecting value: line 1 column 1`, có nghĩa là API trả về HTML (thường là lỗi 405 hoặc 404) thay vì JSON. Hãy kiểm tra lại URL.
- Key lưu ở Temp sẽ bị xóa nếu người dùng dọn dẹp hệ thống, app sẽ yêu cầu nhập lại khi đó.
