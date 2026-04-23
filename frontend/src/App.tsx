import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  BrainCircuit,
  Calendar,
  PlusCircle,
  CheckCircle2,
  ClipboardCheck,
  Zap,
  Sparkles,
  Loader2,
  Download,
  MessageSquare,
  Copy,
  Archive,
  RefreshCcw
} from 'lucide-react';
import './index.css';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [doneTasks, setDoneTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [draftStory, setDraftStory] = useState("");
  const [refinedStory, setRefinedStory] = useState("");
  const [testCases, setTestCases] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [draftDaily, setDraftDaily] = useState("");
  const [generatedDaily, setGeneratedDaily] = useState("");
  const [isGeneratingDaily, setIsGeneratingDaily] = useState(false);

  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jira' | 'ai' | 'archive' | 'calendar' | 'daily'>('jira');
  const [calendarSource, setCalendarSource] = useState<string>("");
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const [totalHours, setTotalHours] = useState<number>(0);
  const [isSendingToJira, setIsSendingToJira] = useState(false);
  const [isRefreshingCalendar, setIsRefreshingCalendar] = useState(false);

  useEffect(() => {
    if (activeTab === 'jira') fetchTasks();
    if (activeTab === 'archive') fetchDoneTasks();
    if (activeTab === 'calendar') fetchMeetings();
  }, [activeTab]);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jira/tasks`);
      setTasks(res.data);
    } catch (e) {
      showNotification("No se pudieron cargar las tareas de Jira.", 'error');
    }
  };

  const fetchDoneTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jira/tasks/done`);
      setDoneTasks(res.data);
    } catch (e) {
      showNotification("No se pudieron cargar las tareas finalizadas.", 'error');
    }
  };

  const fetchMeetings = async () => {
    setIsRefreshingCalendar(true);
    try {
      const res = await axios.get(`${API_BASE}/calendar/events`);
      if (res.data && res.data.events) {
        setMeetings(res.data.events);
        setCalendarSource(res.data.source);
      } else {
        setMeetings(Array.isArray(res.data) ? res.data : []);
        setCalendarSource("Desconocido");
      }
    } catch (e) {
      showNotification("No se pudieron cargar los eventos del calendario.", 'error');
    }
    setIsRefreshingCalendar(false);
  };

  const createSubtasks = async (parentKey: string) => {
    setLoadingKey(parentKey);
    try {
      const res = await axios.post(`${API_BASE}/jira/subtasks`, { parent_key: parentKey });
      const created = res.data.subtasks_created || [];
      showNotification(`✅ ${created.length} subtareas creadas para ${parentKey}: ${created.join(', ')}`);
    } catch (e) {
      showNotification(`❌ Error al crear subtareas para ${parentKey}. Revisa los logs del API.`, 'error');
    }
    setLoadingKey(null);
  };

  const sendToAI = async (task: any) => {
    setLoadingKey(`ai-${task.key}`);
    try {
      const res = await axios.get(`${API_BASE}/jira/issue/${task.key}`);
      const detail = res.data;

      const text = `Historia: ${detail.summary}\n\nDescripción: ${detail.description || '(Sin descripción en Jira)'}\n`;

      setDraftStory(text);
      setRefinedStory('');
      setTestCases('');
      setActiveTab('ai');
      showNotification(`Historia "${detail.summary}" cargada en el Copilot AI.`);
    } catch (e) {
      showNotification(`❌ No se pudo obtener el detalle de ${task.key}.`, 'error');
    }
    setLoadingKey(null);
  };

  const refineStory = async () => {
    setIsRefining(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/refine`, { text: draftStory });
      setRefinedStory(res.data.refined_story);
    } catch (e: any) {
      const errorDetail = e.response?.data?.detail || "El servicio de AI no está disponible.";
      showNotification(errorDetail, 'error');
    }
    setIsRefining(false);
  };

  const generateTests = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/test-cases`, { text: refinedStory || draftStory });
      setTestCases(res.data.test_cases);
    } catch (e: any) {
      const errorDetail = e.response?.data?.detail || "El servicio de AI no está disponible.";
      showNotification(errorDetail, 'error');
    }
    setIsGenerating(false);
  };

  const generateDailyStatus = async () => {
    setIsGeneratingDaily(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/daily-status`, { text: draftDaily });
      setGeneratedDaily(res.data.daily_status);
    } catch (e: any) {
      const errorDetail = e.response?.data?.detail || "El servicio de AI no está disponible.";
      showNotification(errorDetail, 'error');
    }
    setIsGeneratingDaily(false);
  };

  const copyDailyToClipboard = () => {
    if (generatedDaily) {
      navigator.clipboard.writeText(generatedDaily);
      showNotification("¡Daily copiado al portapapeles!");
    }
  };

  const exportToCSV = () => {
    if (!testCases) return;

    let csvContent = "";

    // Intenta extraer el contenido del bloque ```csv ... ```
    const match = testCases.match(/```(?:csv)?\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      csvContent = match[1];
    } else {
      // Fallback: si no hay bloque de código, asume que todo el texto es el CSV
      csvContent = testCases.replace(/```csv/g, '').replace(/```/g, '').trim();
    }

    if (!csvContent || csvContent.length < 10) {
      showNotification("No hay datos CSV válidos para exportar.", 'error');
      return;
    }

    // Agregamos BOM (\uFEFF) para que Excel resuelva bien los acentos al abrir el CSV
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "casos_prueba_xray.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sumTodayHours = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];

    const hours = meetings
      .filter(m => m.start.dateTime.startsWith(today))
      .reduce((acc, m) => acc + (m.duration_hours || 0), 0);

    setTotalHours(Math.round(hours * 100) / 100);
    showNotification(`Total de horas para hoy: ${hours}h`);
  };

  const sendMeetingsToJira = async () => {
    // Buscar la primera tarea en curso
    const inProgressTask = tasks.find(t => t.status.toLowerCase().includes('en curso') || t.status.toLowerCase().includes('progress'));

    if (!inProgressTask) {
      showNotification("No se encontró ninguna tarea 'En curso' para vincular las reuniones.", 'error');
      return;
    }

    if (totalHours <= 0) {
      showNotification("Calcula primero las horas de hoy antes de enviar.", 'error');
      return;
    }

    setIsSendingToJira(true);
    try {
      const today = new Date().toLocaleDateString('es-CL');
      await axios.post(`${API_BASE}/jira/meetings-subtask`, {
        parent_key: inProgressTask.key,
        date: today,
        hours: totalHours
      });
      showNotification(`✅ Subtarea "reuniones ${today}" creada en ${inProgressTask.key} con ${totalHours}h.`);
    } catch (e) {
      showNotification("Error al enviar reuniones a Jira.", 'error');
    }
    setIsSendingToJira(false);
  };

  const renderReadableTestCases = () => {
    if (!testCases) return null;

    let csvContent = "";
    const match = testCases.match(/```(?:csv)?\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      csvContent = match[1];
    } else {
      csvContent = testCases.replace(/```csv/g, '').replace(/```/g, '').trim();
    }

    const lines = csvContent.split('\n');

    // Si no parece un CSV válido de X-ray de nuestro prompt, mostramos raw
    if (lines.length < 2) return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{testCases}</pre>;

    const elements = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Separador por ; pero ignorando ; dentro de comillas
      const cols = line.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/(^"|"$)/g, ''));

      if (cols.length >= 10) {
        elements.push(
          <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '12px', fontSize: '1.05rem' }}>{cols[0]}</div>
            <div style={{ marginBottom: '6px' }}><strong>Descripción:</strong> {cols[6]}</div>
            <div style={{ marginBottom: '6px' }}><strong>Pasos:</strong> {cols[7]}</div>
            <div style={{ marginBottom: '4px' }}><strong>Re. Esperado:</strong> {cols[9]}</div>
          </div>
        );
      }
    }

    return elements.length > 0 ? (
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
          Vista de lectura rápida. Selecciona el texto para copiarlo a Jira manualmente o usa el botón superior para descargar el archivo de carga masiva X-ray.
        </div>
        {elements}
      </div>
    ) : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{testCases}</pre>;
  };

  return (
    <div className="container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      <header>
        <div className="logo">
          <Zap size={28} /> JiraFlow QA Assistant
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button className={activeTab === 'jira' ? '' : 'secondary'} onClick={() => setActiveTab('jira')}>
            <LayoutDashboard size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Asignaciones
          </button>
          <button className={activeTab === 'ai' ? '' : 'secondary'} onClick={() => setActiveTab('ai')}>
            <BrainCircuit size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Refinador AI
          </button>
          <button className={activeTab === 'archive' ? '' : 'secondary'} onClick={() => setActiveTab('archive')}>
            <Archive size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Historial
          </button>
          <button className={activeTab === 'calendar' ? '' : 'secondary'} onClick={() => setActiveTab('calendar')}>
            <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Calendario
          </button>
          <button className={activeTab === 'daily' ? '' : 'secondary'} onClick={() => setActiveTab('daily')}>
            <MessageSquare size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Daily Status
          </button>
        </nav>
      </header>

      {activeTab === 'jira' && (
        <main>
          <div className="glass-panel card">
            <h2>Mis Asignaciones</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Haz clic en <strong>Subtareas</strong> para generar el flujo QA estándar, o en <strong>Refinar con AI</strong> para mejorar la historia con  Copilot.
            </p>
            <div className="issue-list">
              {tasks.length > 0 ? tasks.map(task => (
                <div key={task.key} className="issue-item">
                  <div>
                    <a href={`https://comunidadesb.atlassian.net/browse/${task.key}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
                      {task.key}
                    </a>
                    {task.tqa && (
                      <a href={`https://comunidadesb.atlassian.net/browse/${task.tqa}`} target="_blank" rel="noopener noreferrer" className="badge badge-todo" style={{ marginLeft: '8px', background: 'var(--warning-color)', color: 'white', textDecoration: 'none' }} title="Ticket TQA vinculado">
                        {task.tqa}
                      </a>
                    )}
                    {task.confluence_url && (
                      <a href={task.confluence_url} target="_blank" rel="noopener noreferrer" className="badge" style={{ marginLeft: '8px', background: '#0052cc', color: 'white', textDecoration: 'none' }} title="Documentación en Confluence">
                        📘 Docs
                      </a>
                    )}
                    <div style={{ marginTop: '4px' }}>{task.summary}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <span className="badge badge-todo">{task.status}</span>
                    <button
                      onClick={() => sendToAI(task)}
                      disabled={loadingKey === `ai-${task.key}`}
                      className="secondary"
                      title="Enviar historia al Copilot AI para refinarla"
                    >
                      {loadingKey === `ai-${task.key}`
                        ? <Loader2 size={14} className="spin" />
                        : <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                      Refinar con AI
                    </button>
                    <button
                      onClick={() => createSubtasks(task.key)}
                      disabled={loadingKey === task.key}
                      title="Generar 7 subtareas estándar de certificación"
                    >
                      {loadingKey === task.key
                        ? <Loader2 size={14} className="spin" />
                        : <PlusCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                      Subtareas
                    </button>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
                  No se encontraron tareas pendientes.
                </p>
              )}
            </div>
          </div>
        </main>
      )}

      {activeTab === 'archive' && (
        <main>
          <div className="glass-panel card">
            <h2>Historial (Finalizadas)</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Tus últimos tickets que ya están en estado "Done". (Mostrando hasta 50 recientes).
            </p>
            <div className="issue-list">
              {doneTasks.length > 0 ? doneTasks.map(task => (
                <div key={task.key} className="issue-item">
                  <div>
                    <a href={`https://comunidadesb.atlassian.net/browse/${task.key}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontWeight: 'bold', textDecoration: 'none' }}>
                      {task.key}
                    </a>
                    {task.tqa && (
                      <a href={`https://comunidadesb.atlassian.net/browse/${task.tqa}`} target="_blank" rel="noopener noreferrer" className="badge badge-done" style={{ marginLeft: '8px', background: 'var(--success-color)', color: 'white', textDecoration: 'none' }} title="Ticket TQA vinculado">
                        {task.tqa}
                      </a>
                    )}
                    {task.confluence_url && (
                      <a href={task.confluence_url} target="_blank" rel="noopener noreferrer" className="badge" style={{ marginLeft: '8px', background: '#0052cc', color: 'white', textDecoration: 'none' }} title="Documentación en Confluence">
                        📘 Docs
                      </a>
                    )}
                    <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{task.summary}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <span className="badge badge-done">{task.status}</span>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
                  No se encontraron tareas recientes finalizadas.
                </p>
              )}
            </div>
          </div>
        </main>
      )}

      {activeTab === 'ai' && (
        <main className="grid">
          <div className="glass-panel card">
            <h3><BrainCircuit size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Refinador de Historias</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
              Pega un borrador o usa el botón <strong>"Refinar con AI"</strong> desde el dashboard para cargar una historia automáticamente.
            </p>
            <textarea
              className="ai-textarea"
              placeholder="Ej: Necesito que el sistema permita al usuario iniciar sesión..."
              value={draftStory}
              onChange={(e) => setDraftStory(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={refineStory} disabled={isRefining || isGenerating || !draftStory}>
                {isRefining ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                Refinar Historia
              </button>
              <button onClick={generateTests} className="secondary" disabled={isRefining || isGenerating || (!draftStory && !refinedStory)}>
                {isGenerating ? <Loader2 size={14} className="spin" /> : <ClipboardCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                Generar Casos de Prueba
              </button>
            </div>

            {refinedStory && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-color)' }}>✅ Historia Refinada</h4>
                <div className="result-box">{refinedStory}</div>
              </div>
            )}
          </div>

          <div className="glass-panel card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3><ClipboardCheck size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Casos de Prueba Generados</h3>
              {testCases && (
                <button onClick={exportToCSV} className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <Download size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Exportar CSV a X-ray
                </button>
              )}
            </div>

            {testCases ? (
              <div className="result-box" style={{ overflowY: 'auto', maxHeight: '600px' }}>
                {renderReadableTestCases()}
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>Refina una historia primero y luego haz clic en "Generar Casos de Prueba".</p>
              </div>
            )}
          </div>
        </main>
      )}

      {activeTab === 'calendar' && (
        <main>
          <div className="glass-panel card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2>Próximas Reuniones</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Fuente: <span style={{ color: calendarSource === 'URL' ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold' }}>{calendarSource}</span>
                  {calendarSource !== 'URL' && " (Configura CALENDAR_URL en .env para tiempo real)"}
                </p>
              </div>
              <div>
                <button onClick={fetchMeetings} className="secondary" disabled={isRefreshingCalendar} title="Sincronizar calendario ahora">
                  {isRefreshingCalendar ? <Loader2 size={16} className="spin" /> : <RefreshCcw size={16} style={{ marginRight: '6px' }} />}
                  Actualizar
                </button>
                <button onClick={sumTodayHours} className="secondary" style={{ marginLeft: '0.5rem' }}>
                  <ClipboardCheck size={16} style={{ marginRight: '6px' }} /> Calcular Horas Hoy
                </button>
                <button onClick={sendMeetingsToJira} disabled={isSendingToJira || totalHours <= 0} style={{ marginLeft: '0.5rem' }}>
                  {isSendingToJira ? <Loader2 size={16} className="spin" /> : <PlusCircle size={16} style={{ marginRight: '6px' }} />}
                  Enviar a Jira
                </button>
              </div>
            </div>

            {totalHours > 0 && (
              <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(88, 166, 255, 0.05)' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total de horas calculadas para hoy:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{totalHours} horas</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Esto se enviará como "Estimación Original" <br /> a tu tarea en curso en Jira.
                </div>
              </div>
            )}
            <div className="issue-list">
              {Array.isArray(meetings) && meetings.length > 0 ? meetings.map((event: any) => (
                <div key={event.id} className="issue-item">
                  <div>
                    <strong>{event.summary}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {new Date(event.start.dateTime || event.start.date).toLocaleString('es-CL')}
                      <span style={{ marginLeft: '10px', color: 'var(--accent-color)' }}>
                        ({event.duration_hours}h)
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
                  No hay eventos próximos en tu calendario.
                </p>
              )}
            </div>
          </div>
        </main>
      )}

      {activeTab === 'daily' && (
        <main className="grid">
          <div className="glass-panel card">
            <h3><MessageSquare size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Asistente de Daily Status</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
              Escribe libremente lo que recuerdes que hiciste ayer, lo que vas a hacer hoy y si tienes bloqueos. La IA lo redactará por ti.
            </p>
            <textarea
              className="ai-textarea"
              placeholder="Ej: Ayer revisé el ticket 1234, hoy voy a probar la subida a qa y no tengo bloqueos."
              value={draftDaily}
              onChange={(e) => setDraftDaily(e.target.value)}
              style={{ minHeight: '120px' }}
            />
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={generateDailyStatus} disabled={isGeneratingDaily || !draftDaily}>
                {isGeneratingDaily ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                Generar Daily
              </button>
            </div>
          </div>

          <div className="glass-panel card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3><CheckCircle2 size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Resultado</h3>
              {generatedDaily && (
                <button onClick={copyDailyToClipboard} className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <Copy size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Copiar
                </button>
              )}
            </div>

            {generatedDaily ? (
              <div className="result-box" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                {generatedDaily}
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
                <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>Escribe tus notas y genera tu Daily formal y sin iconos.</p>
              </div>
            )}
          </div>
        </main>
      )}

      <footer style={{
        marginTop: 'auto',
        padding: '2rem 1rem',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-color)'
      }}>
        <p>© 2026 Jiraflow QA Assistant — Desarrollado por <strong>Ricardo Benavides Rozas</strong></p>
        <p style={{ marginTop: '4px', opacity: 0.7 }}>QA Senior — Empresas SB</p>
      </footer>
    </div>
  );
}

export default App;
