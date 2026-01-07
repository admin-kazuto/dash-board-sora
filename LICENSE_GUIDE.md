# System License Integration Guide

This guide explains how to connect your Python applications (Veo 3 or Sora) to the License Management Dashboard.

## 🚀 Latest API Endpoint
To avoid **405 (Method Not Allowed)** errors, please use this optimized endpoint:

- **Endpoint**: `https://dash-board-sora.vercel.app/api/license-check`
- **Method**: `POST`
- **Payload**: `JSON`

---

## 🛠️ Request Payload Structure

| Field | Type | Description |
| :--- | :--- | :--- |
| `license_key` | String | User-provided key (e.g., `VEO-XXXX-XXXX`) |
| `device_id` | String | Unique hardware identifier (MAC-based) |
| `tool_id` | Number | **1** for Veo 3, **2** for Sora |

---

## 💻 Python Example Code

```python
import requests
import uuid
import os
import tempfile
import json

# --- CONFIGURATION ---
DASHBOARD_URL = "https://dash-board-sora.vercel.app"
API_ENDPOINT = f"{DASHBOARD_URL}/api/license-check"
LICENSE_FILE = os.path.join(tempfile.gettempdir(), ".veo_license")
TOOL_ID = 1  # 1 for Veo, 2 for Sora

def get_hwid():
    return str(uuid.getnode())

def verify_license(key):
    try:
        payload = {
            "license_key": key,
            "device_id": get_hwid(),
            "tool_id": TOOL_ID
        }
        r = requests.post(API_ENDPOINT, json=payload, timeout=10)
        
        if r.status_code == 405:
            return False, "Server Error (405). Please use /api/license-check endpoint."
            
        result = r.json()
        if result.get("success") and result.get("status") == "valid":
            return True, "Valid"
        return False, result.get("detail", "Invalid license")
    except Exception as e:
        return False, str(e)

# ... Implementation logic for temp storage is identical to the VEO3 guide ...
```

---

## 📋 Server Responses

| `detail` message | Meaning |
| :--- | :--- |
| `License key not found` | Key doesn't exist. |
| `License is inactive` | **Key has been blocked by Admin.** |
| `License expired` | Key is no longer valid. |
| `This key is for Sora only` | Tool mismatch (Sora key used for Veo). |
| `Max devices reached` | Device limit exceeded. |

---

## ⚠️ Troubleshooting Tips
- If you receive a **405 error**, check that your URL ends in `/api/license-check` exactly.
- If the response is not valid JSON (`Expecting value...`), the server likely returned a 404 or 405 HTML page.
