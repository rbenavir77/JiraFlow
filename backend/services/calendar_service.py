import os
import datetime
import requests
from icalendar import Calendar
from dateutil import tz
from dotenv import load_dotenv

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_path, ".env"))

class CalendarService:
    def __init__(self, ics_filename='calendar.ics'):
        # Buscamos el archivo en la misma carpeta que el servicio o en el root del backend
        self.ics_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ics_filename)
        self.ics_url = os.getenv("CALENDAR_URL")

    def _get_ics_content(self):
        """Obtiene el contenido del ICS desde URL o archivo local."""
        if self.ics_url:
            try:
                resp = requests.get(self.ics_url, timeout=10)
                if resp.status_code == 200:
                    return resp.content
            except Exception as e:
                print(f"[CalendarService] Error fetching ICS from URL: {e}")
        
        if os.path.exists(self.ics_path):
            with open(self.ics_path, 'rb') as f:
                return f.read()
        return None

    def list_upcoming_events(self, max_results=30):
        content = self._get_ics_content()
        if not content:
            return {"error": "No se encontró fuente de calendario (archivo local o URL)."}

        try:
            from dateutil import rrule
            gcal = Calendar.from_ical(content)
            
            events = []
            now = datetime.datetime.now(tz.tzlocal())
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + datetime.timedelta(days=1)

            def normalize(dt):
                if isinstance(dt, datetime.date) and not isinstance(dt, datetime.datetime):
                    return datetime.datetime.combine(dt, datetime.time.min).replace(tzinfo=tz.tzlocal())
                elif dt.tzinfo is None:
                    return dt.replace(tzinfo=tz.tzlocal())
                return dt

            for component in gcal.walk('vevent'):
                summary = str(component.get('summary'))
                description = str(component.get('description', ''))
                dtstart_comp = component.get('dtstart')
                dtend_comp = component.get('dtend')

                if not dtstart_comp:
                    continue
                
                dtstart = normalize(dtstart_comp.dt)
                dtend = normalize(dtend_comp.dt) if dtend_comp else dtstart
                duration = dtend - dtstart
                duration_hours = round(duration.total_seconds() / 3600, 2)

                # Ignorar eventos de todo el día o muy largos (>= 24h) como "Casa"
                if duration_hours >= 24 or "casa" in summary.lower():
                    continue

                # Manejar eventos recurrentes (RRULE)
                rrule_comp = component.get('rrule')
                if rrule_comp:
                    try:
                        rule_text = rrule_comp.to_ical().decode('utf-8')
                        # Asegurarse de que el dtstart sea ingenuo (naive) para rrulestr si no tiene timezone o manejarlo con cuidado
                        # dateutil rrulestr suele preferir datetimes ingenuos si el string no especifica zona
                        # pero aquí dtstart ya está normalizado. rrulestr maneja dtstart con tz.
                        rule = rrule.rrulestr(rule_text, dtstart=dtstart)
                        
                        # Buscar ocurrencias para hoy
                        occurrences = rule.between(today_start, today_end, inc=True)
                        for occ in occurrences:
                            occ_start = normalize(occ)
                            # Solo agregar si es efectivamente hoy
                            if occ_start.date() == now.date():
                                events.append({
                                    "id": f"{component.get('uid')}_{occ_start.isoformat()}",
                                    "summary": summary,
                                    "description": description,
                                    "start": {"dateTime": occ_start.isoformat()},
                                    "end": {"dateTime": (occ_start + duration).isoformat()},
                                    "duration_hours": duration_hours
                                })
                    except Exception as e:
                        print(f"Error procesando RRULE para {summary}: {e}")
                        # Fallback simple
                        if dtstart.date() == now.date():
                            events.append({
                                "id": str(component.get('uid')),
                                "summary": summary,
                                "description": description,
                                "start": {"dateTime": dtstart.isoformat()},
                                "end": {"dateTime": dtend.isoformat()},
                                "duration_hours": duration_hours
                            })
                else:
                    # Evento único: solo si es hoy
                    if dtstart.date() == now.date():
                        events.append({
                            "id": str(component.get('uid')),
                            "summary": summary,
                            "description": description,
                            "start": {"dateTime": dtstart.isoformat()},
                            "end": {"dateTime": dtend.isoformat()},
                            "duration_hours": duration_hours
                        })

            # Ordenar por hora y limitar
            events.sort(key=lambda x: x['start']['dateTime'])
            return {
                "source": "URL" if self.ics_url else "Archivo Local",
                "events": events[:max_results]
            }

        except Exception as e:
            return {"error": f"Error procesando el calendario: {str(e)}"}

    def convert_event_to_jira_data(self, event):
        return {
            "summary": f"Acción de reunión: {event.get('summary')}",
            "description": f"Generado desde reunión: {event.get('description')}\nFecha: {event.get('start', {}).get('dateTime')}"
        }
