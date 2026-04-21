import os, requests, json
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv('backend/.env')
url = os.getenv('JIRA_URL', '').split('.net')[0] + '.net'
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
auth = HTTPBasicAuth(email, token)
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

# Test JQL with category names
jql_todo = 'project = "TDECOM" AND assignee = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082" AND statusCategory in ("Por hacer", "En curso") AND issuetype not in subtaskIssueTypes()'
jql_done = 'project = "TDECOM" AND assignee = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082" AND statusCategory in ("Listo") AND issuetype not in subtaskIssueTypes()'

for label, jql in [("ACTIVE_CATEGORIES", jql_todo), ("DONE_CATEGORIES", jql_done)]:
    payload = {'jql': jql, 'maxResults': 10, 'fields': ['summary', 'status']}
    resp = requests.post(f'{url}/rest/api/3/search/jql', headers=headers, auth=auth, json=payload)
    if resp.status_code == 200:
        issues = resp.json().get('issues', [])
        print(f"Results for {label}: {len(issues)}")
        for i in issues:
            print(f"  {i['key']} | {i['fields']['status']['name']} | {i['fields']['status']['statusCategory']['name']}")
    else:
        print(f"ERROR {label}: {resp.status_code} - {resp.text}")
