import os
import requests
import json
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv('backend/.env')
url = os.getenv('JIRA_URL', '').split('.net')[0] + '.net'
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
project_key = os.getenv('JIRA_PROJECT_KEY', 'TDECOM')
assignee_id = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082"

auth = HTTPBasicAuth(email, token)
headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

print(f"URL: {url}")
print(f"Email: {email}")
print(f"Project: {project_key}")
print(f"Assignee: {assignee_id}")

jql = f'project = "{project_key}" AND assignee = "{assignee_id}" AND issuetype not in subtaskIssueTypes()'
payload = {'jql': jql, 'maxResults': 10, 'fields': ['summary', 'status']}

try:
    resp = requests.post(f'{url}/rest/api/3/search/jql', headers=headers, auth=auth, json=payload)
    print(f"Status Code: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        issues = data.get('issues', [])
        print(f"Found {len(issues)} issues")
        for i in issues:
            s_name = i['fields']['status']['name']
            s_cat = i['fields']['status']['statusCategory']['name']
            print(f"  {i['key']}: {s_name} (Cat: {s_cat})")
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")
