from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.jira_service import JiraService
from services.ai_service import AIService
from services.calendar_service import CalendarService
from services.evidence_service import EvidenceService
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
evidence_svc = EvidenceService()

class DraftStory(BaseModel):
    text: str

class SubtaskRequest(BaseModel):
    parent_key: str

class MeetingSubtaskRequest(BaseModel):
    parent_key: str
    date: str
    hours: float

class EvidenceRequest(BaseModel):
    directory_path: str

class EvidenceFolderRequest(BaseModel):
    initiative_name: str
    test_cases: List[str]

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

# --- EVIDENCE ENDPOINTS ---

@app.post("/evidence/generate")
def generate_evidence(req: EvidenceRequest):
    try:
        output_path = evidence_svc.generate_report(req.directory_path)
        return {"status": "success", "output_path": output_path}
    except Exception as e:
        # Devolver el mensaje de error directamente para que el front lo muestre
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/evidence/create-structure")
def create_evidence_structure(req: EvidenceFolderRequest):
    try:
        result = evidence_svc.create_evidence_structure(req.initiative_name, req.test_cases)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/evidence/pick-dir")
def pick_directory():
    path = evidence_svc.pick_directory()
    return {"path": path}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
