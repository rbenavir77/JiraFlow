import requests
import json

base_url = 'http://localhost:8000'
try:
    print('Testing /jira/tasks...')
    r1 = requests.get(f'{base_url}/jira/tasks')
    print(f"Status /jira/tasks: {r1.status_code}")
    tasks = r1.json()
    print(f'TASKS (ACTIVE): {len(tasks)}')
    for t in tasks[:3]: 
        print(f"  {t['key']} - {t['status']}")

    print('\nTesting /jira/tasks/done...')
    r2 = requests.get(f'{base_url}/jira/tasks/done')
    print(f"Status /jira/tasks/done: {r2.status_code}")
    done = r2.json()
    print(f'TASKS (DONE): {len(done)}')
    for d in done[:3]: 
        print(f"  {d['key']} - {d['status']}")
except Exception as e:
    print(f'ERROR: {e}')
