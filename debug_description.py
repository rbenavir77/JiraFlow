import os, requests, json
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv('backend/.env')
url = os.getenv('JIRA_URL', '').split('.net')[0] + '.net'
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
auth = HTTPBasicAuth(email, token)
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

def get_detail(key):
    resp = requests.get(f"{url}/rest/api/3/issue/{key}", headers=headers, auth=auth)
    if resp.status_code != 200:
        print(f"Error {resp.status_code}")
        return
    
    raw = resp.json()
    fields = raw.get("fields", {})
    desc_raw = fields.get("description")
    
    print(f"--- RAW DESCRIPTION DATA TYPE: {type(desc_raw)} ---")
    if isinstance(desc_raw, dict):
        print(json.dumps(desc_raw, indent=2)[:1000])
    else:
        print(desc_raw)
    
    # Simular logic actual de jira_service.py
    description = ""
    if desc_raw:
        if isinstance(desc_raw, dict):
            for block in desc_raw.get("content", []):
                for inline in block.get("content", []):
                    if inline.get("type") == "text":
                        description += inline.get("text", "") + " "
    
    print(f"\n--- PARSED DESCRIPTION LENGHT: {len(description)} ---")
    print(f"PARSED: {description[:500]}")

if __name__ == "__main__":
    get_detail("TDECOM-8995")
