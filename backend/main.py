from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.jira_service import JiraService
from services.ai_service import AIService
from services.calendar_service import CalendarService
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="JiraFlow QA Assistant API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

jira_svc = JiraService()
ai_svc = AIService()
cal_svc = CalendarService()

class DraftStory(BaseModel):
    text: str

class SubtaskRequest(BaseModel):
    parent_key: str

class MeetingSubtaskRequest(BaseModel):
    parent_key: str
    date: str
    hours: float

@app.get("/")
def read_root():
    return {"status": "JiraFlow API is running"}

# --- JIRA ENDPOINTS ---

@app.get("/jira/tasks")
def get_jira_tasks(assignee: str = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082"):
    return jira_svc.get_my_tasks(assignee)

@app.get("/jira/tasks/done")
def get_jira_done_tasks(assignee: str = "712020:2c8f81bb-28b8-40a6-88fd-14186d720082"):
    return jira_svc.get_done_tasks(assignee)

@app.get("/jira/issue/{issue_key}")
def get_issue_detail(issue_key: str):
    result = jira_svc.get_issue_detail(issue_key)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/jira/subtasks")
def create_subtasks(req: SubtaskRequest):
    result = jira_svc.create_standard_subtasks(req.parent_key)
    if not result or "error" in result:
        raise HTTPException(status_code=400, detail=result.get("error", "Error creating subtasks"))
    return result

@app.post("/jira/meetings-subtask")
def create_meeting_subtask(req: MeetingSubtaskRequest):
    result = jira_svc.create_meeting_subtask(req.parent_key, req.date, req.hours)
    if not result or "error" in result:
        raise HTTPException(status_code=400, detail=result.get("error", "Error creating meeting subtask"))
    return result

# --- AI ENDPOINTS ---

@app.post("/ai/refine")
def refine_story(story: DraftStory):
    refined = ai_svc.refine_story(story.text)
    if not refined or "Error" in refined:
        raise HTTPException(status_code=500, detail=refined)
    return {"refined_story": refined}

@app.post("/ai/test-cases")
def generate_tests(story: DraftStory):
    tests = ai_svc.generate_test_cases(story.text)
    if not tests or "Error" in tests:
        raise HTTPException(status_code=500, detail=tests)
    return {"test_cases": tests}

@app.post("/ai/daily-status")
def generate_daily(story: DraftStory):
    status = ai_svc.generate_daily_status(story.text)
    if not status or "Error" in status:
        raise HTTPException(status_code=500, detail=status)
    return {"daily_status": status}

# --- CALENDAR ENDPOINTS ---

@app.get("/calendar/events")
def get_events():
    events = cal_svc.list_upcoming_events()
    return events

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
