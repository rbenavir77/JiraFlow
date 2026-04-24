import os
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_path, ".env"))

class JiraService:
    def __init__(self):
        url = os.getenv("JIRA_URL", "")
        if url and "atlassian.net" in url:
            url = url.split(".net")[0] + ".net"

        self.url = url
        self.email = os.getenv("JIRA_EMAIL")
        self.token = os.getenv("JIRA_API_TOKEN")
        self.project_key = os.getenv("JIRA_PROJECT_KEY", "TDECOM")

        if self.url and self.email and self.token:
            self.auth = HTTPBasicAuth(self.email, self.token)
            self.headers = {"Accept": "application/json", "Content-Type": "application/json"}
        else:
            self.auth = None

    def _search_jql(self, jql, max_results=50, fields=None):
        """Ejecuta una query JQL usando POST /rest/api/3/search/jql."""
        if not self.auth:
            return []
        payload = {"jql": jql, "maxResults": max_results}
        if fields:
            payload["fields"] = fields
        resp = requests.post(
            f"{self.url}/rest/api/3/search/jql",
            headers=self.headers,
            auth=self.auth,
            json=payload
        )
        if resp.status_code != 200:
            print(f"[JiraService] JQL error {resp.status_code}: {resp.text[:300]}")
            return []
        return resp.json().get("issues", [])

    def _get_issue(self, issue_key):
        """Obtiene un issue individual."""
        if not self.auth:
            return None
        resp = requests.get(
            f"{self.url}/rest/api/3/issue/{issue_key}",
            headers=self.headers,
            auth=self.auth
        )
        if resp.status_code != 200:
            return None
        return resp.json()

    def _parse_issues(self, issues):
        """Parsea la lista de issues al formato que usa el frontend de forma eficiente."""
        if not issues:
            return []
            
        tasks_list = []
        tqa_to_parent = {} # Mapa de TQA_key -> index en tasks_list
        
        # Primero pre-procesamos los issues y recolectamos los TQA que necesitamos consultar
        for idx, issue in enumerate(issues):
            fields = issue.get("fields", {})
            tqa_key = None
            for link in fields.get("issuelinks", []):
                inward = link.get("inwardIssue", {})
                outward = link.get("outwardIssue", {})
                if inward and inward.get("key", "").startswith("TQA-"):
                    tqa_key = inward["key"]
                    break
                if outward and outward.get("key", "").startswith("TQA-"):
                    tqa_key = outward["key"]
                    break

            confluence_url = fields.get("customfield_10126")
            
            # Si no hay link en el padre pero hay un TQA asociado, lo anotamos para el bulk fetch
            if not confluence_url and tqa_key:
                if tqa_key not in tqa_to_parent:
                    tqa_to_parent[tqa_key] = []
                tqa_to_parent[tqa_key].append(idx)

            tasks_list.append({
                "key": issue["key"],
                "summary": fields.get("summary", ""),
                "status": fields.get("status", {}).get("name", ""),
                "tqa": tqa_key,
                "confluence_url": confluence_url,
            })

        # Búsqueda masiva (Bulk Fetch) de los links en los TQA recolectados
        if tqa_to_parent:
            tqa_keys = list(tqa_to_parent.keys())
            # Jira tiene límites en el tamaño del JQL, procesamos de a 50 por si acaso
            for i in range(0, len(tqa_keys), 50):
                chunk = tqa_keys[i:i+50]
                jql_bulk = f"key in ({','.join(chunk)})"
                tqa_details = self._search_jql(jql_bulk, fields=["customfield_10126"], max_results=50)
                
                for t_issue in tqa_details:
                    t_key = t_issue["key"]
                    t_url = t_issue.get("fields", {}).get("customfield_10126")
                    if t_url:
                        # Asignar la URL a todos los padres que apuntaban a este TQA
                        for p_idx in tqa_to_parent.get(t_key, []):
                            tasks_list[p_idx]["confluence_url"] = t_url

        return tasks_list

    def get_my_tasks(self, assignee_id="712020:2c8f81bb-28b8-40a6-88fd-14186d720082"):
        """Tareas activas (To Do + En curso)."""
        jql = (
            f'project = "{self.project_key}" AND assignee = "{assignee_id}" '
            f'AND statusCategory != Done AND issuetype not in subtaskIssueTypes() '
            f'ORDER BY updated DESC'
        )
        issues = self._search_jql(jql, max_results=60,
                                   fields=["summary","status","issuelinks","customfield_10126","issuetype"])
        return self._parse_issues(issues)

    def get_done_tasks(self, assignee_id="712020:2c8f81bb-28b8-40a6-88fd-14186d720082"):
        """Tareas finalizadas."""
        jql = (
            f'project = "{self.project_key}" AND assignee = "{assignee_id}" '
            f'AND statusCategory = Done AND issuetype not in subtaskIssueTypes() '
            f'ORDER BY updated DESC'
        )
        issues = self._search_jql(jql, max_results=60,
                                   fields=["summary","status","issuelinks","customfield_10126","issuetype"])
        return self._parse_issues(issues)

    def get_issue_detail(self, issue_key):
        """Detalle completo de un issue: summary + descripción en texto plano."""
        raw = self._get_issue(issue_key)
        if not raw:
            return {"error": "Issue no encontrado"}

        fields = raw.get("fields", {})
        desc_raw = fields.get("description")
        description = ""
        if desc_raw:
            if isinstance(desc_raw, dict):
                description = self._parse_adf_to_text(desc_raw)
            else:
                description = str(desc_raw)

        return {
            "key": raw["key"],
            "summary": fields.get("summary", ""),
            "description": description.strip(),
            "status": fields.get("status", {}).get("name", ""),
            "issuetype": fields.get("issuetype", {}).get("name", ""),
            "assignee": fields.get("assignee", {}).get("displayName", ""),
            "reporter": fields.get("reporter", {}).get("displayName", ""),
            "priority": fields.get("priority", {}).get("name", ""),
            "labels": fields.get("labels", []),
            "components": [c.get("name", "") for c in fields.get("components", [])],
            "created": fields.get("created", ""),
            "updated": fields.get("updated", ""),
            "resolution": fields.get("resolution", {}).get("name") if fields.get("resolution") else None,
            "duedate": fields.get("duedate"),
        }

    def _parse_adf_to_text(self, node):
        """Convierte el contenido ADF de Jira a texto plano."""
        if isinstance(node, str):
            return node
        if not isinstance(node, dict):
            return ""

        node_type = node.get("type")
        result = ""

        if node_type == "doc":
            for child in node.get("content", []):
                result += self._parse_adf_to_text(child)
            return result

        if node_type == "text":
            text = node.get("text", "")
            for mark in node.get("marks", []):
                if mark.get("type") == "link":
                    href = mark.get("attrs", {}).get("href")
                    if href:
                        if "figma.com" in href:
                            text += " (Referencia Figma)"
                        else:
                            text += f" ({href})"
            return text

        if node_type == "paragraph":
            for child in node.get("content", []):
                result += self._parse_adf_to_text(child)
            return result.strip() + "\n\n"

        if node_type == "heading":
            for child in node.get("content", []):
                result += self._parse_adf_to_text(child)
            return f"\n{result.strip()}\n\n"

        if node_type == "bulletList":
            for item in node.get("content", []):
                item_text = self._parse_adf_to_text(item)
                if item_text:
                    for line in item_text.strip().split("\n"):
                        if line:
                            result += f"• {line}\n"
            return result + "\n"

        if node_type == "orderedList":
            index = 1
            for item in node.get("content", []):
                item_text = self._parse_adf_to_text(item)
                if item_text:
                    for line in item_text.strip().split("\n"):
                        if line:
                            result += f"{index}. {line}\n"
                    index += 1
            return result + "\n"

        if node_type == "listItem":
            for child in node.get("content", []):
                result += self._parse_adf_to_text(child)
            return result

        if node_type == "blockquote":
            for child in node.get("content", []):
                result += self._parse_adf_to_text(child)
            return f"> {result.strip()}\n\n"

        if node_type == "codeBlock":
            result += "\n```\n"
            for child in node.get("content", []):
                result += self._parse_adf_to_text(child)
            result += "\n```\n\n"
            return result

        if node_type == "panel":
            for child in node.get("content", []):
                result += self._parse_adf_to_text(child)
            return f"\n{result.strip()}\n\n"

        if node_type == "inlineCard":
            url = node.get("attrs", {}).get("url", "")
            if "figma.com" in url:
                return "Referencia Figma"
            return url

        if node_type == "mediaSingle":
            return node.get("content", [{}])[0].get("attrs", {}).get("url", "")

        if node_type == "emoji":
            return node.get("attrs", {}).get("shortName", "")

        if node_type == "mention":
            return node.get("attrs", {}).get("text", node.get("attrs", {}).get("id", ""))

        if node_type == "hardBreak":
            return "\n"

        for child in node.get("content", []):
            result += self._parse_adf_to_text(child)

        return result
    def create_standard_subtasks(self, parent_key):
        """Genera automáticamente las 7 subtareas estándar del flujo QA."""
        if not self.auth:
            return {"error": "Jira client not initialized"}

        subtasks_names = [
            "Creación de artefactos en X-ray (Tablero Team-QA)",
            "Reunion de Entendimiento",
            "Diseño de casos de prueba",
            "Gestionar y Validar Ambientación QA",
            "Ejecución de Pruebas y documentación de la Certificación",
            "Preparación Comité de PAP",
            "Paso producción",
        ]

        created = []
        for summary in subtasks_names:
            payload = {
                "fields": {
                    "project": {"key": self.project_key},
                    "summary": summary,
                    "description": {
                        "type": "doc",
                        "version": 1,
                        "content": [{"type": "paragraph", "content": [{"type": "text", "text": f"Subtarea automática para {parent_key}"}]}]
                    },
                    "issuetype": {"name": "Subtarea"},
                    "parent": {"key": parent_key},
                }
            }
            resp = requests.post(
                f"{self.url}/rest/api/3/issue",
                headers=self.headers,
                auth=self.auth,
                json=payload
            )
            if resp.status_code in (200, 201):
                created.append(resp.json().get("key", "?"))
            else:
                print(f"[Subtask error] {resp.status_code}: {resp.text[:200]}")

        return {"parent": parent_key, "subtasks_created": created}

    def create_meeting_subtask(self, parent_key, date_str, hours):
        """Crea una subtarea de reuniones con estimación original."""
        if not self.auth:
            return {"error": "Jira client not initialized"}

        # Formatear a minutos totales para evitar problemas de interpretación con puntos/comas decimales
        total_minutes = int(round(hours * 60))
        time_str = f"{total_minutes}m"
        
        # Para la descripción legible
        h_desc = total_minutes // 60
        m_desc = total_minutes % 60
        readable_time = f"{h_desc}h {m_desc}m" if h_desc > 0 and m_desc > 0 else (f"{h_desc}h" if h_desc > 0 else f"{m_desc}m")

        payload = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": f"reuniones {date_str}",
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": f"Seguimiento de reuniones para el día {date_str}. "},
                                {"type": "text", "text": f"Total calculado: {readable_time}. ", "marks": [{"type": "strong"}]},
                                {"type": "text", "text": f"(DEBUG: RAW_VALUE={hours}h | {time_str})", "marks": [{"type": "em"}]}
                            ]
                        }
                    ]
                },
                "issuetype": {"name": "Subtarea"},
                "parent": {"key": parent_key},
                "timetracking": {
                    "originalEstimate": time_str,
                    "remainingEstimate": time_str
                }
            }
        }
        resp = requests.post(
            f"{self.url}/rest/api/3/issue",
            headers=self.headers,
            auth=self.auth,
            json=payload
        )
        if resp.status_code in (200, 201):
            return resp.json()
        else:
            return {"error": resp.text}
