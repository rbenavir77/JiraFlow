import os, requests, json
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv('backend/.env')
url = os.getenv('JIRA_URL', '').split('.net')[0] + '.net'
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
auth = HTTPBasicAuth(email, token)
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

jql = 'project = "TDECOM" AND assignee = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082" AND issuetype not in subtaskIssueTypes()'
payload = {'jql': jql, 'maxResults': 50, 'fields': ['summary', 'status']}
resp = requests.post(f'{url}/rest/api/3/search/jql', headers=headers, auth=auth, json=payload)

if resp.status_code == 200:
    issues = resp.json().get('issues', [])
    print(f"DEBUG: Found {len(issues)} issues")
    for i in issues:
        s = i['fields']['status']
        sc = s['statusCategory']
        print(f"{i['key']} | Name: {s['name']} | CatName: {sc.get('name')} | CatKey: {sc.get('key')}")
else:
    print(f"ERROR: {resp.status_code} - {resp.text}")
