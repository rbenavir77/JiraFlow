import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileUp, 
  CheckCircle2, 
  Loader2, 
  Copy,
  Info,
  ArrowRightLeft,
  FileCheck,
  X
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

interface ValidatorProps {
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const SalesValidator: React.FC<ValidatorProps> = ({ showNotification }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [qaFiles, setQaFiles] = useState<{ [key: string]: File | null }>({
    txpos: null,
    det: null,
    desc: null,
    pago: null,
    ant: null
  });

  const [prodFiles, setProdFiles] = useState<{ [key: string]: File | null }>({
    txpos: null,
    det: null,
    desc: null,
    pago: null,
    ant: null
  });

  const handleFileChange = (env: 'qa' | 'prod', key: string, file: File | null) => {
    if (env === 'qa') {
      setQaFiles(prev => ({ ...prev, [key]: file }));
    } else {
      setProdFiles(prev => ({ ...prev, [key]: file }));
    }
  };

  const handleCompare = async () => {
    if (!qaFiles.txpos || !prodFiles.txpos) {
      showNotification("Error: Debes cargar al menos el archivo 'txpos' tanto en QA como en PRODUCCIÓN.", "error");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      
      // QA files
      if (qaFiles.txpos) formData.append('qa_txpos', qaFiles.txpos);
      if (qaFiles.det) formData.append('qa_det', qaFiles.det);
      if (qaFiles.desc) formData.append('qa_desc', qaFiles.desc);
      if (qaFiles.pago) formData.append('qa_pago', qaFiles.pago);
      if (qaFiles.ant) formData.append('qa_ant', qaFiles.ant);

      // PROD files
      if (prodFiles.txpos) formData.append('prod_txpos', prodFiles.txpos);
      if (prodFiles.det) formData.append('prod_det', prodFiles.det);
      if (prodFiles.desc) formData.append('prod_desc', prodFiles.desc);
      if (prodFiles.pago) formData.append('prod_pago', prodFiles.pago);
      if (prodFiles.ant) formData.append('prod_ant', prodFiles.ant);

      const res = await axios.post(`${API_BASE}/sales/compare`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      showNotification("Auditoría comparativa finalizada con éxito.", "success");
    } catch (e: any) {
      const msg = e.response?.data?.detail || "Error al procesar la comparación. Verifica el formato de los archivos.";
      showNotification(msg, "error");
    }
    setIsLoading(false);
  };

  const copyReport = () => {
    if (result?.report) {
      navigator.clipboard.writeText(result.report);
      showNotification("Reporte copiado para Jira.", "success");
    }
  };

  const renderFileInputs = (env: 'qa' | 'prod') => {
    const files = env === 'qa' ? qaFiles : prodFiles;
    return (
      <div className="file-column" style={{ flex: 1, minWidth: '320px' }}>
        <div style={{ 
          padding: '12px', 
          borderRadius: '8px 8px 0 0', 
          background: env === 'qa' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          borderBottom: `2px solid ${env === 'qa' ? 'var(--warning-color)' : 'var(--success-color)'}`,
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: 0, color: env === 'qa' ? 'var(--warning-color)' : 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileUp size={18} /> AMBIENTE {env.toUpperCase()}
          </h4>
        </div>
        
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {[
            { id: 'txpos', label: 'itl.txpos (Cabecera) *', required: true },
            { id: 'det', label: 'itl.det_doc (Detalle)', required: false },
            { id: 'desc', label: 'itl.descuento (Desc)', required: false },
            { id: 'pago', label: 'itl.pago (Pagos)', required: false },
            { id: 'ant', label: 'itl.ant_vent (Cliente)', required: false }
          ].map(f => (
            <div key={f.id} style={{ 
              fontSize: '0.8rem', 
              background: files[f.id] ? 'rgba(88, 166, 255, 0.05)' : 'rgba(255,255,255,0.02)', 
              padding: '10px', 
              borderRadius: '6px', 
              border: `1px solid ${files[f.id] ? 'var(--accent-color)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', color: f.required && !files[f.id] ? '#f85149' : 'inherit' }}>
                  {f.label}
                </span>
                {files[f.id] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={14} color="var(--success-color)" />
                    <button 
                      onClick={() => handleFileChange(env, f.id, null)}
                      style={{ 
                        padding: '2px', 
                        background: 'rgba(248, 81, 73, 0.1)', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#f85149',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Quitar archivo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept=".csv,.xlsx,.xls,.json" 
                key={files[f.id] ? 'has-file' : 'no-file'}
                onChange={(e) => handleFileChange(env, f.id, e.target.files?.[0] || null)}
                style={{ width: '100%', fontSize: '0.75rem', opacity: files[f.id] ? 0.6 : 1 }}
              />
              {files[f.id] && (
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                   📎 {files[f.id]?.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="validator-container">
      <div className="glass-panel card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ArrowRightLeft className="text-accent" /> Comparador de Paridad QA vs PROD
          </h2>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px' }}>Auditoría Local</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.5' }}>
          Esta herramienta cruza los extractos de ambos ambientes para validar consistencia y detectar discrepancias de negocio. 
          <br /><small>Recuerda: Los archivos <strong>txpos</strong> son obligatorios en ambos lados para iniciar.</small>
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2.5rem', position: 'relative' }}>
          {renderFileInputs('qa')}
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 1rem'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <ArrowRightLeft size={20} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {renderFileInputs('prod')}
        </div>

        <button 
          onClick={handleCompare} 
          disabled={isLoading} 
          className={!qaFiles.txpos || !prodFiles.txpos ? 'secondary' : ''}
          style={{ 
            width: '100%', 
            padding: '1.2rem', 
            fontSize: '1.1rem', 
            fontWeight: 'bold', 
            background: (!qaFiles.txpos || !prodFiles.txpos) ? 'rgba(255,255,255,0.05)' : 'var(--accent-color)',
            boxShadow: (!qaFiles.txpos || !prodFiles.txpos) ? 'none' : '0 4px 15px rgba(88, 166, 255, 0.3)'
          }}
        >
          {isLoading ? <Loader2 className="spin" size={24} /> : <CheckCircle2 size={24} style={{ marginRight: '12px' }} />}
          EJECUTAR AUDITORÍA COMPARATIVA
        </button>

        {result && (
          <div className="result-section" style={{ marginTop: '3rem', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Reporte de Paridad</h3>
                <span className={`badge ${result.is_parity_ok ? 'badge-done' : 'badge-todo'}`} style={{ fontSize: '0.8rem', padding: '6px 15px' }}>
                  {result.is_parity_ok ? '✅ SINCRONIZADOS' : '❌ DIFERENCIAS DETECTADAS'}
                </span>
              </div>
              <button className="secondary" onClick={copyReport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Copy size={16} /> Copiar para Jira
              </button>
            </div>
            <pre className="report-box" style={{ 
              background: '#0d1117', 
              color: result.is_parity_ok ? '#39d353' : '#f85149', 
              padding: '2rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              fontFamily: '"Fira Code", monospace',
              fontSize: '0.95rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.4)',
              lineHeight: '1.4'
            }}>
              {result.report}
            </pre>
          </div>
        )}

        <div style={{ 
          marginTop: '2.5rem', 
          padding: '1.5rem', 
          background: 'rgba(88, 166, 255, 0.05)', 
          borderRadius: '10px', 
          display: 'flex', 
          gap: '15px', 
          alignItems: 'flex-start',
          border: '1px solid rgba(88, 166, 255, 0.1)'
        }}>
          <Info size={24} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <strong>Tip de QA:</strong> Si estás validando una venta específica, te recomiendo que tus archivos CSV solo contengan las filas de esa <code>vent_corr</code>. 
            El sistema tomará siempre el ID de la primera fila del archivo <strong>QA - txpos</strong> para buscarlo en el resto de los archivos.
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .text-accent { color: var(--accent-color); }
      `}} />
    </div>
  );
};

export default SalesValidator;
