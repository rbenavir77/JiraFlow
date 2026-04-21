import os, requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv('backend/.env')
url = os.getenv('JIRA_URL', '').split('.net')[0] + '.net'
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
auth = HTTPBasicAuth(email, token)
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

jql = 'project = "TDECOM" AND assignee = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082" AND issuetype not in subtaskIssueTypes() ORDER BY updated DESC'
payload = {'jql': jql, 'maxResults': 100}
resp = requests.post(f'{url}/rest/api/3/search/jql', headers=headers, auth=auth, json=payload)

if resp.status_code == 200:
    issues = resp.json().get('issues', [])
    stats = {}
    for i in issues:
        s = i['fields']['status']['name']
        c = i['fields']['status']['statusCategory']['name']
        stats[s] = c
        # Print first few to verify
        if len(stats) < 20: 
            print(f"{i['key']} | {s} | Cat: {c}")
    print("\nUNIQUE STATUS -> CATEGORY MAPPING:")
    for s, c in stats.items():
        print(f"  {s} -> {c}")
else:
    print(f"ERROR: {resp.status_code}")
