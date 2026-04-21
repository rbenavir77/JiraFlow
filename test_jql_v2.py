import os, requests, json
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv('backend/.env')
url = os.getenv('JIRA_URL', '').split('.net')[0] + '.net'
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
auth = HTTPBasicAuth(email, token)
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

# Test JQL with statusCategory
active_jql = 'project = "TDECOM" AND assignee = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082" AND statusCategory != Done AND issuetype not in subtaskIssueTypes() ORDER BY updated DESC'
done_jql = 'project = "TDECOM" AND assignee = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082" AND statusCategory = Done AND issuetype not in subtaskIssueTypes() ORDER BY updated DESC'

for label, jql in [("ACTIVE", active_jql), ("DONE", done_jql)]:
    payload = {'jql': jql, 'maxResults': 5, 'fields': ['summary', 'status']}
    resp = requests.post(f'{url}/rest/api/3/search/jql', headers=headers, auth=auth, json=payload)
    if resp.status_code == 200:
        issues = resp.json().get('issues', [])
        print(f"Results for {label}: {len(issues)}")
        for i in issues:
            print(f"  {i['key']} | {i['fields']['status']['name']}")
    else:
        print(f"ERROR {label}: {resp.status_code} - {resp.text}")
