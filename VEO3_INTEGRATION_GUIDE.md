# Hướng dẫn Tích hợp License cho Veo 3

Tài liệu này cung cấp hướng dẫn chi tiết cách tích hợp hệ thống kiểm tra License vào ứng dụng **Veo 3** bằng Python.

## 1. Thông số API
- **Endpoint**: `https://dash-board-sora.vercel.app/api/license-check`
- **Method**: `POST`
- **Tool ID**: `1` (Bắt buộc dùng ID 1 cho Veo 3)

## 2. Luồng xử lý (Workflow)
1. Khi mở App: Kiểm tra file lưu key tạm trong máy (`%TEMP%/.veo3_license`).
2. Nếu có key: Gọi API để xác thực. Nếu hợp lệ -> Vào App.
3. Nếu không có key hoặc key hết hạn/bị khóa: Hiển thị giao diện yêu cầu nhập License Key.
4. Sau khi nhập: Xác thực với Dashboard, nếu đúng -> Lưu vào Temp và vào App.

## 3. Mã nguồn Python mẫu (Sử dụng `requests`)

```python
import requests
import uuid
import os
import tempfile
import json

# Cấu hình
DASHBOARD_URL = "https://dash-board-sora.vercel.app"
LICENSE_FILE = os.path.join(tempfile.gettempdir(), ".veo3_license")
TOOL_ID = 1  # 1 cho Veo 3, 2 cho Sora

def get_device_id():
    """Lấy Hardware ID duy nhất của máy tính"""
    return str(uuid.getnode())

def check_license(key):
    """
    Xác thực License Key với Dashboard
    Trình trạng trả về:
    - True, "Valid": Key hợp lệ
    - False, "Lý do": Key không hợp lệ, bị khóa, hoặc sai Tool
    """
    url = f"{DASHBOARD_URL}/api/license-check"
    device_id = get_device_id()
    
    payload = {
        "license_key": key,
        "device_id": device_id,
        "tool_id": TOOL_ID
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        result = response.json()
        
        if result.get("success") and result.get("status") == "valid":
            return True, "Valid"
        else:
            # Các lỗi: 'License key not found', 'License is inactive', 'License expired', 'This key is for Sora only'
            return False, result.get("detail", "Lỗi xác thực không xác định")
    except Exception as e:
        return False, f"Không thể kết nối máy chủ: {str(e)}"

def save_license_locally(key):
    """Lưu key vào thư mục Temp để không phải nhập lại"""
    try:
        with open(LICENSE_FILE, 'w', encoding='utf-8') as f:
            json.dump({"key": key}, f)
    except:
        pass

def load_local_license():
    """Đọc key từ thư mục Temp nếu có"""
    if os.path.exists(LICENSE_FILE):
        try:
            with open(LICENSE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("key")
        except:
            return None
    return None

# --- VÍ DỤ CÁCH SỬ DỤNG KHI KHỞI ĐỘNG APP ---

def start_app_logic():
    local_key = load_local_license()
    
    if local_key:
        valid, msg = check_license(local_key)
        if valid:
            print(f"✅ License {local_key} hợp lệ. Đang vào Veo 3...")
            return True
        else:
            print(f"❌ Key cũ không còn hiệu lực: {msg}")
    
    # Nếu chưa có key hoặc key lỗi -> Yêu cầu user nhập mới (Logic UI)
    new_key = input("Nhập License Key của bạn: ").strip()
    valid, msg = check_license(new_key)
    if valid:
        save_license_locally(new_key)
        print("✅ Kích hoạt thành công!")
        return True
    else:
        print(f"❌ Kích hoạt thất bại: {msg}")
        return False
```

## 4. Các mã lỗi cần lưu ý
API sẽ trả về thông báo lỗi chi tiết trong trường `detail`. Bạn nên hiển thị nội dung này cho người dùng:
- **"License key not found"**: Key không tồn tại.
- **"License is inactive"**: Key đã bị Admin Khóa (Blocked).
- **"License expired"**: Key đã hết hạn sử dụng.
- **"This key is for Sora only"**: Người dùng nhập nhầm key Sora vào Veo 3.
- **"Max devices reached"**: Key đã đạt giới hạn máy sử dụng.

## 5. Lưu ý bảo mật
- Luôn gửi đúng `tool_id: 1` để Dashboard phân loại chính xác.
- Nên thực hiện kiểm tra License định kỳ hoặc mỗi lần khởi động App để đảm bảo Key không bị khóa bất ngờ bởi Admin.
