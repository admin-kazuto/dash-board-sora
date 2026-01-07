# System License Integration Guide

This guide provides the official documentation on how to connect your Python applications (Veo 3 or Sora) to the License Management Dashboard.

## 🚀 Official API Endpoint
The following endpoint is optimized for high availability on Vercel.

- **Endpoint**: `https://dash-board-sora.vercel.app/api/license-check`
- **Method**: `POST`
- **Format**: `JSON`

---

## 🛠️ Request Payload Structure

| Field | Type | Description |
| :--- | :--- | :--- |
| `license_key` | String | The license key provided by Admin (e.g., `VEO-XXXX-XXXX`) |
| `device_id` | String | Unique hardware identifier for the machine |
| `tool_id` | Number | **1** for Veo 3, **2** for Sora |

---

## 💻 Python Implementation Example

```python
import requests
import uuid
import os
import tempfile
import json

# --- CONFIGURATION ---
DASHBOARD_URL = "https://dash-board-sora.vercel.app"
API_URL = f"{DASHBOARD_URL}/api/license-check"
LICENSE_FILE = os.path.join(tempfile.gettempdir(), ".veo_license")
TOOL_ID = 1  # 1 for Veo, 2 for Sora

def get_hwid():
    """Returns a unique hardware identifier based on MAC address"""
    return str(uuid.getnode())

def verify_license(key):
    """Verifies the license key with the Dashboard"""
    try:
        payload = {
            "license_key": key,
            "device_id": get_hwid(),
            "tool_id": TOOL_ID
        }
        response = requests.post(API_URL, json=payload, timeout=10)
        
        if response.status_code == 405:
            return False, "Server Error (405). The API endpoint is likely offline."
            
        data = response.json()
        if data.get("success") and data.get("status") == "valid":
            return True, "Valid"
        
        return False, data.get("detail", "Invalid license key")
    except Exception as e:
        return False, str(e)

def save_license(key):
    """Caches key locally in temp folder"""
    try:
        with open(LICENSE_FILE, 'w', encoding='utf-8') as f:
            json.dump({"key": key}, f)
    except: pass

def load_license():
    """Loads cached key if available"""
    if os.path.exists(LICENSE_FILE):
        try:
            with open(LICENSE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f).get("key")
        except: return None
    return None
```

---

## 📋 Server Feedback Messages (`detail`)

| Message | Meaning | Recovery Steps |
| :--- | :--- | :--- |
| `License key not found` | Key is non-existent | Verify the characters in your key. |
| `License is inactive` | **Key is Blocked** | Contact support to re-activate. |
| `License expired` | Key has timed out | Purchase a subscription extension. |
| `This key is for Sora only` | Tool mismatch | Use a license valid for the active tool. |
| `Max devices reached` | Hardware limit reached| Ask Admin to reset devices on Dashboard. |

---

## ⚠️ Common Troubleshooting
- **405 Method Not Allowed:** Usually a deployment caching issue. Wait 1-2 minutes for Vercel to fully update after a push. Ensure your URL ends in `/api/license-check`.
- **JSON Parse Error:** If you get a "Expecting value" error, the server returned an HTML error page. Check your internet connection and verify the Dashboard URL is online.
