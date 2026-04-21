import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

def check_done_tasks():
    url = 'http://localhost:8000/jira/tasks/done'
    try:
        r = requests.get(url)
        if r.status_code != 200:
            print(f"Error: {r.status_code} - {r.text}")
            return
        
        data = r.json()
        print(f"Total done tasks returned: {len(data)}")
        
        with_docs = 0
        with_tqa = 0
        for task in data:
            if task.get('tqa'):
                with_tqa += 1
            if task.get('confluence_url'):
                with_docs += 1
                
        print(f"Tasks with TQA: {with_tqa}")
        print(f"Tasks with Docs: {with_docs}")
        
        if len(data) > 0:
            print("\nSample (first 5):")
            for task in data[:5]:
                print(f"Key: {task['key']}, TQA: {task['tqa']}, Docs: {task['confluence_url']}")
                
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    check_done_tasks()
