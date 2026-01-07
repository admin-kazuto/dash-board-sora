# License Integration Guide (Veo 3)

This guide explains how to integrate the license verification system into your Python application (Veo 3).

## API Endpoint
- **URL**: `https://dash-board-sora.vercel.app/api/license-check`
- **Method**: `POST`
- **Content-Type**: `application/json`

## Request Body
You must send the following fields in the JSON body:

| Field | Type | Description |
| :--- | :--- | :--- |
| `license_key` | String | The license key provided by the user (e.g., `VEO-XXXX-XXXX`). |
| `device_id` | String | A unique identifier for the machine (e.g., MAC address, UUID). |
| `tool_id` | Number | **Must be 1 for Veo 3** (Sora is 2). |

### Example Python Code (using `requests`)

```python
import requests
import uuid

def check_license(key):
    url = "https://dash-board-sora.vercel.app/api/license-check"
    device_id = str(uuid.getnode()) # Simple MAC-based ID
    
    payload = {
        "license_key": key,
        "device_id": device_id,
        "tool_id": 1  # 1 for Veo, 2 for Sora
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        result = response.json()
        
        if result.get("success") and result.get("status") == "valid":
            print("✅ License is valid!")
            return True
        else:
            reason = result.get("detail", "Unknown error")
            print(f"❌ License invalid: {reason}")
            return False
    except Exception as e:
        print(f"⚠️ Error checking license: {e}")
        return False
```

## Response Handling

The API will return a JSON object:

### Success (Valid)
```json
{
  "success": true,
  "status": "valid"
}
```

### Failure (Invalid/Expired/Wrong Tool)
```json
{
  "success": false,
  "status": "invalid",
  "detail": "This key is for Sora only" 
}
```

> [!IMPORTANT]
> Always enforce the `tool_id` on the client-side to prevent users from using a Sora license for Veo or vice versa.
