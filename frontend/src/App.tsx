import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  FileText,
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
  RefreshCcw,
  PieChart,
  ShieldCheck,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';
import './index.css';
import SalesValidator from './components/SalesValidator';

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
  const [activeTab, setActiveTab] = useState<'jira' | 'ai' | 'archive' | 'calendar' | 'daily' | 'evidence' | 'validator'>('jira');
  const [calendarSource, setCalendarSource] = useState<string>("");
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const [evidencePath, setEvidencePath] = useState("");
  const [generatingFormat, setGeneratingFormat] = useState<'docx' | 'html' | null>(null);
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);

  // Metricas State
  const [metricsTotal, setMetricsTotal] = useState<number | "">("");
  const [metricsPassed, setMetricsPassed] = useState<number | "">("");
  const [metricsFailed, setMetricsFailed] = useState<number | "">("");
  const [metricsBlocked, setMetricsBlocked] = useState<number | "">("");
  const [metricsNA, setMetricsNA] = useState<number | "">("");
  const [metricsDefects, setMetricsDefects] = useState<number | "">("");

  const [totalHours, setTotalHours] = useState<number>(0);
  const [isSendingToJira, setIsSendingToJira] = useState(false);
  const [isRefreshingCalendar, setIsRefreshingCalendar] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subtasks Time Calculator State
  const [isCalculatingSubtasks, setIsCalculatingSubtasks] = useState(false);
  const [subtasksTimeData, setSubtasksTimeData] = useState<{
    parent_key: string,
    total_seconds: number,
    total_hours: number,
    total_days: number,
    readable_total: string,
    subtasks: any[]
  } | null>(null);
  const [subtasksCalculatorKey, setSubtasksCalculatorKey] = useState<string>("");
  const [isSubtasksDesgloseOpen, setIsSubtasksDesgloseOpen] = useState(false);

  // Historial Pagination and Search State
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);

  // Historial Defects Sub-tab State
  const [historyTab, setHistoryTab] = useState<'tasks' | 'defects'>('tasks');
  const [defects, setDefects] = useState<any[]>([]);
  const [isFetchingDefects, setIsFetchingDefects] = useState(false);

  useEffect(() => {
    if (activeTab === 'jira') fetchTasks();
    if (activeTab === 'archive') {
      fetchDoneTasks();
      setHistoryPage(1);
      setHistorySearch("");
    }
    if (activeTab === 'calendar') fetchMeetings();
    if (activeTab === 'daily') {
      const loadDailyTasks = async () => {
        let currentTasks = tasks;
        if (tasks.length === 0) {
          try {
            const res = await axios.get(`${API_BASE}/jira/tasks`);
            setTasks(res.data);
            currentTasks = res.data;
          } catch (e) {
            console.error("Error al pre-cargar asignaciones", e);
          }
        }
        // Intentar buscar la tarea en curso
        const inProgressTask = currentTasks.find(t => t.status.toLowerCase().includes('en curso') || t.status.toLowerCase().includes('progress'));
        if (inProgressTask) {
          setSubtasksCalculatorKey(inProgressTask.key);
          fetchSubtasksTime(inProgressTask.key);
        }
      };
      loadDailyTasks();
    }
  }, [activeTab]);

  const fetchSubtasksTime = async (key: string) => {
    if (!key) return;
    setIsCalculatingSubtasks(true);
    try {
      const res = await axios.get(`${API_BASE}/jira/task/${key}/subtasks-time`);
      setSubtasksTimeData(res.data);
      showNotification(`✅ Estimaciones sumadas con éxito para ${key}.`);
    } catch (e) {
      showNotification("No se pudieron cargar las estimaciones de subtareas.", 'error');
    } finally {
      setIsCalculatingSubtasks(false);
    }
  };


  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

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

  const fetchDefects = async () => {
    setIsFetchingDefects(true);
    try {
      const res = await axios.get(`${API_BASE}/jira/defects`);
      setDefects(res.data);
    } catch (e) {
      showNotification("No se pudieron cargar los defectos de Jira.", 'error');
    } finally {
      setIsFetchingDefects(false);
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
      let finalStatus = res.data.daily_status;

      const t = Number(metricsTotal) || 0;
      if (t > 0) {
        const p = Number(metricsPassed) || 0;
        const f = Number(metricsFailed) || 0;
        const b = Number(metricsBlocked) || 0;
        const na = Number(metricsNA) || 0;
        const defects = Number(metricsDefects) || 0;
        const validTotal = Math.max(0, t - na);
        const executed = p + f + b;
        const progress = validTotal > 0 ? (executed / validTotal) * 100 : 0;
        const successRate = (p + f) > 0 ? (p / (p + f)) * 100 : 0;

        const reportText = `\n\n📊 *Reporte de Avance QA*\n- *Casos Totales:* ${t}\n- *No Aplica (N/A):* ${na}\n- *Total Válido:* ${validTotal}\n\n✅ *Ejecutados:* ${executed} (${progress.toFixed(1)}%)\n  - Passed: ${p}\n  - Failed: ${f}\n  - Blocked: ${b}\n\n🎯 *Tasa de Éxito:* ${successRate.toFixed(1)}%\n🐞 *Defectos:* ${defects}`;
        finalStatus += reportText;
      }

      setGeneratedDaily(finalStatus);
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

  const generateEvidence = async (format: 'docx' | 'html' = 'docx') => {
    if (!evidencePath) {
      showNotification("Por favor ingresa la ruta de la carpeta.", 'error');
      return;
    }
    setGeneratingFormat(format);
    try {
      const res = await axios.post(`${API_BASE}/evidence/generate`, { directory_path: evidencePath, format });
      showNotification(`✅ Reporte generado con éxito en: ${res.data.output_path}`);
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || "Error al generar el reporte.";
      showNotification(errorMsg, 'error');
    }
    setGeneratingFormat(null);
  };

  // ── Exportar Iniciativas Finalizadas a Excel ──────────────────────────────
  const exportDoneTasksToExcel = () => {
    if (!doneTasks || doneTasks.length === 0) {
      showNotification('No hay iniciativas finalizadas para exportar.', 'error');
      return;
    }
    const rows = doneTasks.map((t: any) => ({
      'Clave': t.key,
      'Resumen / Iniciativa': t.summary,
      'Estado': t.status,
      'Fecha Asignación': t.created || '',
      'Fecha Término': t.resolved || '',
      'TQA Vinculado': t.tqa || '',
      'URL Jira': `https://comunidadesb.atlassian.net/browse/${t.key}`
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Ancho de columnas
    ws['!cols'] = [
      { wch: 14 },  // Clave
      { wch: 60 },  // Resumen
      { wch: 20 },  // Estado
      { wch: 18 },  // Fecha Asignación
      { wch: 18 },  // Fecha Término
      { wch: 16 },  // TQA
      { wch: 55 }   // URL
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Iniciativas Finalizadas');
    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    XLSX.writeFile(wb, `iniciativas_finalizadas_${fecha}.xlsx`);
    showNotification('✅ Excel de iniciativas exportado con éxito.');
  };

  // ── Exportar Defectos a Excel ─────────────────────────────────────────────
  const exportDefectsToExcel = () => {
    if (!defects || defects.length === 0) {
      showNotification('No hay defectos para exportar. Carga primero la pestaña "Mis Defectos".', 'error');
      return;
    }
    const rows = defects.map((t: any) => ({
      'Clave': t.key,
      'Resumen / Defecto': t.summary,
      'Prioridad': t.priority || '',
      'Estado': t.status,
      'Fecha Creación': t.created || '',
      'Fecha Cierre': t.resolved || '',
      'URL Jira': `https://comunidadesb.atlassian.net/browse/${t.key}`
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Ancho de columnas
    ws['!cols'] = [
      { wch: 14 },  // Clave
      { wch: 60 },  // Resumen
      { wch: 14 },  // Prioridad
      { wch: 20 },  // Estado
      { wch: 18 },  // Fecha Creación
      { wch: 18 },  // Fecha Cierre
      { wch: 55 }   // URL
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mis Defectos');
    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    XLSX.writeFile(wb, `mis_defectos_${fecha}.xlsx`);
    showNotification('✅ Excel de defectos exportado con éxito.');
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

  const createEvidenceFolders = async () => {
    if (!testCases) return;

    let csvContent = "";
    const match = testCases.match(/```(?:csv)?\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      csvContent = match[1];
    } else {
      csvContent = testCases.replace(/```csv/g, '').replace(/```/g, '').trim();
    }

    if (!csvContent || csvContent.length < 10) {
      showNotification("No hay casos de prueba válidos para crear carpetas.", 'error');
      return;
    }

    // Extraer nombres (saltando la cabecera si existe)
    const lines = csvContent.split('\n').filter(l => l.trim());
    let startIndex = 0;
    if (lines[0].includes('NOMBRE CASO PRUEBA')) {
      startIndex = 1;
    }

    const casesList = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/(^"|"$)/g, ''));
      if (cols.length >= 1 && cols[0]) {
        casesList.push(cols[0]);
      }
    }

    if (casesList.length === 0) {
      showNotification("No se detectaron nombres de casos de prueba.", 'error');
      return;
    }

    const inProgressTask = tasks.find(t => t.status.toLowerCase().includes('en curso') || t.status.toLowerCase().includes('progress'));
    let initiative = "";

    if (inProgressTask) {
      // Intentar extraer el prefijo entre corchetes, o usar el summary completo
      const match = inProgressTask.summary.match(/^\[(.*?)\]/);
      initiative = match ? `[${match[1]}]` : inProgressTask.summary;
    } else {
      initiative = prompt("No se encontró tarea 'En curso' en Jira. Ingresa manualmente el nombre de la Iniciativa para la carpeta Padre:", "") || "";
    }

    if (!initiative) return;

    setIsCreatingFolders(true);
    try {
      const res = await axios.post(`${API_BASE}/evidence/create-structure`, {
        initiative_name: initiative,
        test_cases: casesList
      });
      showNotification(`✅ Estructura creada en: ${res.data.result.path}`);
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || "Error al crear la estructura de carpetas.";
      showNotification(errorMsg, 'error');
    }
    setIsCreatingFolders(false);
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
    showNotification(`Total de horas para hoy: ${formatHours(hours)}`);
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
        const stepNum = cols[5];
        elements.push(
          <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '1rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '12px', fontSize: '1.05rem' }}>{cols[0]}</div>
            <div style={{ marginBottom: '6px' }}><strong>Descripción:</strong> {cols[6]}</div>
            <div style={{ marginBottom: '6px' }}><strong>Pasos:</strong> Paso {stepNum}: {cols[7]}</div>
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

  const renderRefinedStory = () => {
    if (!refinedStory) return null;

    // Intentar separar por los headers ### definidos en el prompt
    const sections = refinedStory.split(/### /);

    if (sections.length <= 1) {
      return <div className="result-box">{refinedStory}</div>;
    }

    const elements = [];
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;

      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();

      elements.push(
        <div key={i} style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '10px', fontSize: '0.95rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {title}
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '1.2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
            dangerouslySetInnerHTML={{
              __html: content
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-color)">$1</strong>')
                .replace(/^- (.*)/gm, '<div style="display: flex; gap: 8px; margin-bottom: 4px;"><span>•</span><span>$1</span></div>')
            }}
          />
        </div>
      );
    }

    return <div>{elements}</div>;
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
          <div className="logo-icon">
            <Zap size={24} fill="white" />
          </div>
          <div className="logo-text">
            <div className="brand-name">JiraFlow</div>
            <div className="slogan">QA Assistant</div>
          </div>
        </div>
        
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`nav-container ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <button 
            className={`nav-button ${activeTab === 'jira' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('jira'); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={16} /> Asignaciones
          </button>
          <button 
            className={`nav-button ${activeTab === 'ai' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('ai'); setIsMobileMenuOpen(false); }}
          >
            <BrainCircuit size={16} /> Refinador AI
          </button>
          <button 
            className={`nav-button ${activeTab === 'archive' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('archive'); setIsMobileMenuOpen(false); }}
          >
            <Archive size={16} /> Historial
          </button>
          <button 
            className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }}
          >
            <Calendar size={16} /> Calendario
          </button>
          <button 
            className={`nav-button ${activeTab === 'daily' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('daily'); setIsMobileMenuOpen(false); }}
          >
            <MessageSquare size={16} /> Daily Status
          </button>
          <button 
            className={`nav-button ${activeTab === 'evidence' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('evidence'); setIsMobileMenuOpen(false); }}
          >
            <FileText size={16} /> Documentación
          </button>
          <button 
            className={`nav-button ${activeTab === 'validator' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('validator'); setIsMobileMenuOpen(false); }}
          >
            <ShieldCheck size={16} /> Comparador de BD
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
                        📘 Confluence
                      </a>
                    )}
                    <div style={{ marginTop: '4px' }}>{task.summary}</div>
                    {task.created && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                        <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          📅 <strong>Asignación:</strong> {task.created}
                        </span>
                      </div>
                    )}
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

      {activeTab === 'archive' && (() => {
        const getPriorityBadgeStyle = (priority: string) => {
          switch (priority?.toLowerCase()) {
            case 'highest':
            case 'critical':
            case 'high':
            case 'alta':
            case 'crítico':
            case 'crítica':
              return { background: 'rgba(248, 81, 73, 0.15)', color: '#ff7b72', border: '1px solid rgba(248, 81, 73, 0.3)' };
            case 'medium':
            case 'media':
            case 'normal':
              return { background: 'rgba(210, 153, 34, 0.15)', color: '#d29922', border: '1px solid rgba(210, 153, 34, 0.3)' };
            default:
              return { background: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', border: '1px solid rgba(88, 166, 255, 0.3)' };
          }
        };

        const getStatusBadgeStyle = (status: string) => {
          const s = status?.toLowerCase() || '';
          // CERRADO / RESUELTO → Verde
          if (
            s.includes('done') || s.includes('resolved') || s.includes('closed') ||
            s.includes('finalizado') || s.includes('cerrado') || s.includes('fixed') ||
            s.includes('listo') || s.includes('completado') || s.includes('complete')
          ) {
            return {
              background: 'rgba(63, 185, 80, 0.18)',
              color: '#4caf6e',
              border: '1px solid rgba(63, 185, 80, 0.45)',
              fontWeight: '600'
            };
          }
          // DIFERIDO / POSTPUESTO → Amarillo
          if (
            s.includes('deferred') || s.includes('diferido') ||
            s.includes('postponed') || s.includes('postpuesto') || s.includes('on hold')
          ) {
            return {
              background: 'rgba(210, 153, 34, 0.18)',
              color: '#e3ab2b',
              border: '1px solid rgba(210, 153, 34, 0.45)',
              fontWeight: '600'
            };
          }
          // ABIERTO / EN PROGRESO / ACTIVO → Rojo
          return {
            background: 'rgba(248, 81, 73, 0.18)',
            color: '#ff6b6b',
            border: '1px solid rgba(248, 81, 73, 0.45)',
            fontWeight: '600'
          };
        };

        const currentItems = historyTab === 'tasks' ? doneTasks : defects;

        const filteredItems = currentItems.filter((task: any) => {
          const term = historySearch.toLowerCase().trim();
          if (!term) return true;
          return task.key.toLowerCase().includes(term) || task.summary.toLowerCase().includes(term);
        });

        const totalItems = filteredItems.length;
        const totalPages = Math.ceil(totalItems / historyItemsPerPage) || 1;
        const currentPage = Math.min(historyPage, totalPages);
        const startIndex = (currentPage - 1) * historyItemsPerPage;
        const endIndex = Math.min(startIndex + historyItemsPerPage, totalItems);
        const paginatedItems = filteredItems.slice(startIndex, endIndex);

        return (
          <main>
            <div className="glass-panel card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Historial de Trabajo</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
                    Consulta de iniciativas finalizadas y defectos reportados a tu nombre en Jira.
                  </p>
                </div>
                {/* Botón de Exportar Excel */}
                <button
                  onClick={historyTab === 'tasks' ? exportDoneTasksToExcel : exportDefectsToExcel}
                  className="secondary"
                  title={historyTab === 'tasks' ? 'Exportar iniciativas a Excel' : 'Exportar defectos a Excel'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(33, 135, 85, 0.15)',
                    border: '1px solid rgba(33, 135, 85, 0.4)',
                    color: '#4caf6e',
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <FileSpreadsheet size={16} />
                  Exportar Excel
                </button>
              </div>

              {/* Selector de Sub-pestañas Premium */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'fit-content', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => { setHistoryTab('tasks'); setHistoryPage(1); setHistorySearch(""); }}
                  className="secondary"
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.8rem',
                    background: historyTab === 'tasks' ? 'var(--accent-color)' : 'transparent',
                    color: historyTab === 'tasks' ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                    boxShadow: historyTab === 'tasks' ? '0 2px 8px var(--accent-glow)' : 'none',
                    transform: 'none',
                    borderRadius: '6px'
                  }}
                >
                  Iniciativas Finalizadas ({doneTasks.length})
                </button>
                <button
                  onClick={() => { setHistoryTab('defects'); setHistoryPage(1); setHistorySearch(""); fetchDefects(); }}
                  className="secondary"
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.8rem',
                    background: historyTab === 'defects' ? 'var(--accent-color)' : 'transparent',
                    color: historyTab === 'defects' ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                    boxShadow: historyTab === 'defects' ? '0 2px 8px var(--accent-glow)' : 'none',
                    transform: 'none',
                    borderRadius: '6px'
                  }}
                >
                  Mis Defectos / Errores ({defects.length})
                </button>
              </div>

              {/* Controles de Filtro y Paginación Superior */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder={historyTab === 'tasks' ? "🔍 Buscar por clave o resumen de iniciativa..." : "🔍 Buscar por clave o resumen de error/defecto..."}
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1); // Reset a primera página al filtrar
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.6rem 2rem 0.6rem 1rem',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  />
                  {historySearch && (
                    <button
                      onClick={() => {
                        setHistorySearch("");
                        setHistoryPage(1);
                      }}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: 0,
                        boxShadow: 'none'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Por página:</span>
                  <select
                    value={historyItemsPerPage}
                    onChange={(e) => {
                      setHistoryItemsPerPage(Number(e.target.value));
                      setHistoryPage(1); // Reset a primera página
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      color: 'white',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="issue-list">
                {isFetchingDefects && historyTab === 'defects' ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                    <Loader2 size={36} className="spin" style={{ marginBottom: '1rem', color: 'var(--accent-color)' }} />
                    <p>Cargando tus defectos desde Jira...</p>
                  </div>
                ) : paginatedItems.length > 0 ? paginatedItems.map((task: any) => (
                  <div key={task.key} className="issue-item">
                    <div>
                      <a href={`https://comunidadesb.atlassian.net/browse/${task.key}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
                        {task.key}
                      </a>

                      {/* Badge de Prioridad para Errores/Defectos */}
                      {historyTab === 'defects' && task.priority && (
                        <span className="badge" style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', ...getPriorityBadgeStyle(task.priority) }}>
                          {task.priority}
                        </span>
                      )}

                      {task.tqa && (
                        <a href={`https://comunidadesb.atlassian.net/browse/${task.tqa}`} target="_blank" rel="noopener noreferrer" className="badge badge-done" style={{ marginLeft: '8px', background: 'var(--success-color)', color: 'white', textDecoration: 'none' }} title="Ticket TQA vinculado">
                          {task.tqa}
                        </a>
                      )}
                      {task.confluence_url && (
                        <a href={task.confluence_url} target="_blank" rel="noopener noreferrer" className="badge" style={{ marginLeft: '8px', background: '#0052cc', color: 'white', textDecoration: 'none' }} title="Documentación en Confluence">
                          📘 Confluence
                        </a>
                      )}
                      <div style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{task.summary}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        {task.created && (
                          <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            📅 <strong>Asignación:</strong> {task.created}
                          </span>
                        )}
                        {task.resolved && (
                          <span style={{ background: 'rgba(63, 185, 80, 0.08)', border: '1px solid rgba(63, 185, 80, 0.25)', color: '#a5d6a7', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✅ <strong>Término:</strong> {task.resolved}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <span className="badge" style={historyTab === 'defects' ? getStatusBadgeStyle(task.status) : (task.status?.toLowerCase().includes('done') || task.status?.toLowerCase().includes('resolved') || task.status?.toLowerCase().includes('fixed') || task.status?.toLowerCase().includes('finalizado') ? { background: 'var(--success-color)', color: 'white' } : { background: 'var(--warning-color)', color: 'white' })}>{task.status}</span>
                    </div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>
                    No se encontraron {historyTab === 'tasks' ? 'iniciativas' : 'defectos'} {historySearch ? "que coincidan con la búsqueda." : "en el historial."}
                  </p>
                )}
              </div>

              {/* Footer de Paginación */}
              {totalItems > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Mostrando <strong>{startIndex + 1} - {endIndex}</strong> de <strong>{totalItems}</strong> {historyTab === 'tasks' ? 'iniciativas' : 'defectos'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setHistoryPage(1)}
                      disabled={currentPage === 1}
                      className="secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minWidth: '32px' }}
                      title="Primera página"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minWidth: '32px' }}
                    >
                      ‹
                    </button>

                    {/* Mostrar páginas numeradas dinámicamente */}
                    {(() => {
                      const pages = [];
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, startPage + 4);
                      
                      // Corrección de inicio si estamos al final de las páginas
                      const adjustedStartPage = Math.max(1, endPage - 4);
                      
                      for (let p = adjustedStartPage; p <= endPage; p++) {
                        pages.push(
                          <button
                            key={p}
                            onClick={() => setHistoryPage(p)}
                            className={currentPage === p ? "" : "secondary"}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.8rem',
                              minWidth: '32px',
                              background: currentPage === p ? 'var(--accent-color)' : 'transparent',
                              border: currentPage === p ? 'none' : '1px solid var(--border-color)',
                              color: currentPage === p ? 'white' : 'var(--text-primary)'
                            }}
                          >
                            {p}
                          </button>
                        );
                      }
                      return pages;
                    })()}

                    <button
                      onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minWidth: '32px' }}
                    >
                      ›
                    </button>
                    <button
                      onClick={() => setHistoryPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minWidth: '32px' }}
                      title="Última página"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        );
      })()}

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
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                {renderRefinedStory()}
              </div>
            )}
          </div>

          <div className="glass-panel card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>
                  <ClipboardCheck size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Casos de Prueba
                </h3>
                {testCases && (
                  <span className="badge" style={{ background: 'rgba(88, 166, 255, 0.15)', color: 'var(--accent-color)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(88, 166, 255, 0.3)' }}>
                    {(() => {
                      const match = testCases.match(/```(?:csv)?\n([\s\S]*?)\n```/);
                      const csv = match ? match[1] : testCases.replace(/```csv/g, '').replace(/```/g, '').trim();
                      const count = csv.split('\n').filter(line => line.trim() && line.split(';').length >= 10).length;
                      const hasHeader = csv.includes('NOMBRE CASO PRUEBA');
                      return hasHeader ? count - 1 : count;
                    })()} totales
                  </span>
                )}
              </div>
              {testCases && (
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <button onClick={createEvidenceFolders} disabled={isCreatingFolders} className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }} title="Crear estructura de carpetas en Certificaciones">
                    {isCreatingFolders ? <Loader2 size={14} className="spin" /> : <Archive size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                    Crear Carpetas
                  </button>
                  <button onClick={exportToCSV} className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    <Download size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Exportar CSV
                  </button>
                </div>
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
            <div className="calendar-header">
              <div>
                <h2>Próximas Reuniones</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Fuente: <span style={{ color: calendarSource === 'URL' ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 'bold' }}>{calendarSource}</span>
                  {calendarSource !== 'URL' && " (Configura CALENDAR_URL en .env para tiempo real)"}
                </p>
              </div>
              <div className="calendar-actions">
                <button onClick={fetchMeetings} className="secondary" disabled={isRefreshingCalendar} title="Sincronizar calendario ahora">
                  {isRefreshingCalendar ? <Loader2 size={16} className="spin" /> : <RefreshCcw size={16} style={{ marginRight: '6px' }} />}
                  Actualizar
                </button>
                <button onClick={sumTodayHours} className="secondary">
                  <ClipboardCheck size={16} style={{ marginRight: '6px' }} /> Calcular Horas Hoy
                </button>
                <button onClick={sendMeetingsToJira} disabled={isSendingToJira || totalHours <= 0}>
                  {isSendingToJira ? <Loader2 size={16} className="spin" /> : <PlusCircle size={16} style={{ marginRight: '6px' }} />}
                  Enviar a Jira
                </button>
              </div>
            </div>

            {totalHours > 0 && (
              <div className="glass-panel calendar-summary-panel">
                <div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total de horas calculadas para hoy:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{formatHours(totalHours)}</div>
                </div>
                <div className="calendar-summary-note">
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
                        ({formatHours(event.duration_hours)})
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

      {activeTab === 'evidence' && (
        <main>
          <div className="glass-panel card">
            <h2><FileText size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Generador de Evidencias</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Genera automáticamente un documento Word con las capturas de pantalla y videos de tus pruebas.
              El sistema buscará subcarpetas (una por cada Caso de Prueba) y procesará imágenes y videos.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Ruta local de la carpeta de evidencias:
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Ej: C:\Users\Nombre\Documents\Evidencias\Release_1"
                  value={evidencePath}
                  onChange={(e) => setEvidencePath(e.target.value)}
                  style={{
                    flex: '1 1 300px',
                    minWidth: '200px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.6rem',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
                {evidencePath && (
                  <button
                    className="secondary"
                    onClick={() => setEvidencePath("")}
                    style={{ padding: '0.6rem' }}
                    title="Limpiar ruta"
                  >
                    ✕
                  </button>
                )}
                <button
                  className="secondary"
                  onClick={async () => {
                    try {
                      const res = await axios.get(`${API_BASE}/evidence/pick-dir`);
                      if (res.data.path) setEvidencePath(res.data.path);
                    } catch (e) {
                      showNotification("No se pudo abrir el selector de carpetas.", "error");
                    }
                  }}
                  title="Seleccionar carpeta desde el equipo"
                  style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
                >
                  Buscar...
                </button>
                <button onClick={() => generateEvidence('docx')} disabled={generatingFormat !== null || !evidencePath} className="secondary" style={{ marginRight: '0.5rem', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                  {generatingFormat === 'docx' ? <Loader2 size={16} className="spin" /> : <FileText size={16} style={{ marginRight: '6px' }} />}
                  Generar Word
                </button>
                <button onClick={() => generateEvidence('html')} disabled={generatingFormat !== null || !evidencePath} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                  {generatingFormat === 'html' ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} style={{ marginRight: '6px' }} />}
                  Generar Web HTML
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(88, 166, 255, 0.05)', borderLeft: '4px solid var(--accent-color)' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>💡 Instrucciones de uso</h4>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-primary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
                <li>Crea una carpeta raíz para tu iniciativa.</li>
                <li>Dentro, crea una subcarpeta por cada Caso de Prueba (ej: <strong>CP01_Login</strong>).</li>
                <li>Guarda las imágenes (.png, .jpg) y videos (.mp4) dentro de cada subcarpeta.</li>
                <li>El sistema tomará capturas automáticas de los videos e insertará todo en el Word.</li>
                <li>El archivo final se guardará en la misma carpeta raíz que indicaste.</li>
              </ul>
            </div>
          </div>
        </main>
      )}

      {activeTab === 'validator' && (
        <main>
          <SalesValidator showNotification={showNotification} />
        </main>
      )}

      {activeTab === 'daily' && (
        <main className="grid">
          <div className="glass-panel card">
            <h3><MessageSquare size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Asistente de Daily Status</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
              Escribe libremente lo que hiciste <strong>hoy</strong>, lo que vas a hacer <strong>mañana</strong> y si tienes bloqueos. La IA lo redactará por ti.
            </p>
            <textarea
              className="ai-textarea"
              placeholder="Ej: Hoy revisé el ticket 1234, mañana voy a probar la subida a qa y no tengo bloqueos."
              value={draftDaily}
              onChange={(e) => setDraftDaily(e.target.value)}
              style={{ minHeight: '120px' }}
            />
            <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border-color)' }} />

            <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}><PieChart size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Métricas de Ejecución (Opcional)</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Si llenas estos campos, se calculará el % de avance y se incluirá en el reporte de Daily.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Casos Totales</label>
                <input
                  type="number"
                  value={metricsTotal}
                  onChange={(e) => setMetricsTotal(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ej: 20"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'white' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#22c55e' }}>Passed</label>
                  <input
                    type="number"
                    value={metricsPassed}
                    onChange={(e) => setMetricsPassed(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', padding: '0.6rem', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#ef4444' }}>Failed</label>
                  <input
                    type="number"
                    value={metricsFailed}
                    onChange={(e) => setMetricsFailed(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '0.6rem', color: 'white' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#f59e0b' }}>Blocked</label>
                  <input
                    type="number"
                    value={metricsBlocked}
                    onChange={(e) => setMetricsBlocked(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '0.6rem', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>N/A</label>
                  <input
                    type="number"
                    value={metricsNA}
                    onChange={(e) => setMetricsNA(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'white' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-color)' }}>Bugs Encontrados</label>
                <input
                  type="number"
                  value={metricsDefects}
                  onChange={(e) => setMetricsDefects(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--accent-color)', borderRadius: '6px', padding: '0.6rem', color: 'white' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={generateDailyStatus} disabled={isGeneratingDaily || !draftDaily}>
                {isGeneratingDaily ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                Generar Daily
              </button>
              <button
                onClick={() => {
                  setMetricsTotal(""); setMetricsPassed(""); setMetricsFailed(""); setMetricsBlocked(""); setMetricsNA(""); setMetricsDefects("");
                }}
                className="secondary"
              >
                Limpiar Métricas
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Calculadora de Tiempo de Subtareas */}
            <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardCheck size={20} style={{ color: 'var(--accent-color)' }} />
                  Tiempo en Subtareas
                </h3>
                <button 
                  onClick={() => fetchSubtasksTime(subtasksCalculatorKey)} 
                  disabled={isCalculatingSubtasks || !subtasksCalculatorKey} 
                  className="secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  title="Actualizar datos de Jira"
                >
                  {isCalculatingSubtasks ? <Loader2 size={12} className="spin" /> : <RefreshCcw size={12} style={{ marginRight: '4px' }} />}
                  Actualizar
                </button>
              </div>

              {/* Selector de tarea si hay varias o si no se detectó */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Seleccionar Tarea de Jira:
                </label>
                <select
                  value={subtasksCalculatorKey}
                  onChange={(e) => {
                    setSubtasksCalculatorKey(e.target.value);
                    fetchSubtasksTime(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Seleccionar Asignación --</option>
                  {tasks.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.key} - {t.summary} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              {subtasksTimeData ? (
                <div>
                  <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(88, 166, 255, 0.05)', borderLeft: '4px solid var(--accent-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Estimado en Subtareas:</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-color)', marginTop: '2px' }}>
                        {subtasksTimeData.total_hours} hrs ({subtasksTimeData.total_days} días)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        * Jornadas estándar de 8 horas de trabajo
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          const newText = draftDaily 
                            ? `${draftDaily}\n\n⏱️ *Tiempo total en subtareas:* ${subtasksTimeData.total_hours} horas (${subtasksTimeData.total_days} días laborables)`
                            : `⏱️ *Tiempo total en subtareas:* ${subtasksTimeData.total_hours} horas (${subtasksTimeData.total_days} días laborables)`;
                          setDraftDaily(newText);
                          showNotification("¡Tiempo de subtareas anexado a la descripción del Daily!");
                        }}
                        className="secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                      >
                        Insertar en Daily
                      </button>
                    </div>
                  </div>

                  {/* Sección colapsable de desglose */}
                  <div>
                    <button
                      onClick={() => setIsSubtasksDesgloseOpen(!isSubtasksDesgloseOpen)}
                      className="secondary"
                      style={{ width: '100%', justifyContent: 'space-between', padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      <span>{isSubtasksDesgloseOpen ? "▼ Ocultar Desglose de Subtareas" : "▶ Ver Desglose de Subtareas"} ({subtasksTimeData.subtasks.length})</span>
                    </button>
                    
                    {isSubtasksDesgloseOpen && (
                      <div style={{ marginTop: '0.5rem', maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {subtasksTimeData.subtasks.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {subtasksTimeData.subtasks.map(sub => (
                              <div key={sub.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                <div style={{ minWidth: 0, flex: 1, paddingRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <a href={`https://comunidadesb.atlassian.net/browse/${sub.key}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none', marginRight: '6px' }}>
                                    {sub.key}
                                  </a>
                                  <span style={{ color: 'var(--text-primary)' }} title={sub.summary}>{sub.summary}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                  <span className="badge" style={{ fontSize: '0.7rem', padding: '1px 5px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{sub.status}</span>
                                  <span style={{ fontWeight: 'bold', color: 'var(--success-color)', whiteSpace: 'nowrap' }}>{sub.original_estimate !== '0h' ? sub.original_estimate : 'Sin estimar'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>Esta tarea no contiene subtareas.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>
                  {subtasksCalculatorKey ? "Haz clic en Actualizar para calcular las estimaciones de subtareas." : "Selecciona una tarea de Jira arriba para calcular las estimaciones."}
                </p>
              )}
            </div>

            <div className="glass-panel card" style={{ marginBottom: 0 }}>
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

            {/* Dashboard Tachometer */}
            <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3><PieChart size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Dashboard de Avance</h3>
                <button onClick={() => {
                  const t = Number(metricsTotal) || 0;
                  const p = Number(metricsPassed) || 0;
                  const f = Number(metricsFailed) || 0;
                  const b = Number(metricsBlocked) || 0;
                  const na = Number(metricsNA) || 0;
                  const defects = Number(metricsDefects) || 0;
                  const validTotal = Math.max(0, t - na);
                  const executed = p + f + b;
                  const progress = validTotal > 0 ? (executed / validTotal) * 100 : 0;
                  const successRate = (p + f) > 0 ? (p / (p + f)) * 100 : 0;

                  const text = `📊 *Reporte de Avance QA*\n- *Casos Totales:* ${t}\n- *No Aplica (N/A):* ${na}\n- *Total Válido:* ${validTotal}\n\n✅ *Ejecutados:* ${executed} (${progress.toFixed(1)}%)\n  - Passed: ${p}\n  - Failed: ${f}\n  - Blocked: ${b}\n\n🎯 *Tasa de Éxito:* ${successRate.toFixed(1)}%\n🐞 *Defectos:* ${defects}`;
                  navigator.clipboard.writeText(text);
                  showNotification("¡Métricas copiadas al portapapeles para Jira!");
                }} className="secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <Copy size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Copiar para Jira
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {(() => {
                  const t = Number(metricsTotal) || 0;
                  const p = Number(metricsPassed) || 0;
                  const f = Number(metricsFailed) || 0;
                  const b = Number(metricsBlocked) || 0;
                  const na = Number(metricsNA) || 0;
                  const defects = Number(metricsDefects) || 0;

                  const validTotal = Math.max(0, t - na);
                  const executed = p + f + b;
                  const progress = validTotal > 0 ? (executed / validTotal) * 100 : 0;
                  const successRate = (p + f) > 0 ? (p / (p + f)) * 100 : 0;
                  const r = 80;
                  const dashArray = Math.PI * r;

                  const pProp = validTotal > 0 ? p / validTotal : 0;
                  const fProp = validTotal > 0 ? f / validTotal : 0;
                  const bProp = validTotal > 0 ? b / validTotal : 0;

                  const pDash = pProp * dashArray;
                  const fDash = fProp * dashArray;
                  const bDash = bProp * dashArray;

                  return (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <div style={{ position: 'relative', width: '280px', margin: '0 auto' }}>
                        <svg viewBox="0 0 200 120" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinecap="round" />
                          {(pDash + fDash + bDash) > 0 && (
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f59e0b" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${pDash + fDash + bDash} ${dashArray}`} />
                          )}
                          {(pDash + fDash) > 0 && (
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${pDash + fDash} ${dashArray}`} />
                          )}
                          {pDash > 0 && (
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${pDash} ${dashArray}`} />
                          )}
                        </svg>
                        <div style={{ position: 'absolute', top: '55px', left: '0', right: '0' }}>
                          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>{Math.round(progress)}%</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Avance General</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Válidos</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{validTotal}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Tasa Éxito</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: successRate >= 80 ? '#22c55e' : (successRate > 0 ? '#ef4444' : 'inherit') }}>{Math.round(successRate)}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Bugs</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: defects > 0 ? '#ef4444' : 'inherit' }}>{defects}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
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
