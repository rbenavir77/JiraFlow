import pandas as pd
from decimal import Decimal, InvalidOperation
from datetime import datetime

class SalesValidatorService:
    def __init__(self):
        self.doc_types = {
            "1": "Factura",
            "33": "Factura Electrónica",
            "35": "Boleta Electrónica",
            "38": "Boleta Exenta",
            "39": "Boleta Electrónica",
            "41": "Boleta Exenta Electrónica",
            "56": "Nota de Débito",
            "61": "Nota de Crédito"
        }

    def _get_doc_label(self, code):
        code_str = str(code).strip()
        return self.doc_types.get(code_str, f"Documento Tipo {code_str}")

    def _to_decimal(self, val):
        """Convierte cualquier valor a Decimal de forma segura."""
        if val is None or pd.isna(val):
            return Decimal('0')
        try:
            # Limpiar strings de símbolos monetarios o espacios
            clean_val = str(val).replace('$', '').replace(',', '').strip()
            if not clean_val: return Decimal('0')
            return Decimal(clean_val)
        except (InvalidOperation, ValueError):
            return Decimal('0')

    def compare_environments(self, qa_files: dict, prod_files: dict):
        try:
            res_qa = self._process_env_files(qa_files, "QA")
            if res_qa.get("status") == "error": return res_qa

            res_prod = self._process_env_files(prod_files, "PROD")
            if res_prod.get("status") == "error": return res_prod

            parity_checks = {
                "total_igual": abs(res_qa["data"]["vent_total"] - res_prod["data"]["vent_total"]) <= 1,
                "pagos_iguales": abs(res_qa["data"]["pago_total"] - res_prod["data"]["pago_total"]) <= 1,
                "productos_iguales": abs(res_qa["data"]["det_total"] - res_prod["data"]["det_total"]) <= 1,
                "descuentos_iguales": abs(res_qa["data"]["desc_total"] - res_prod["data"]["desc_total"]) <= 1,
                "bonif_igual": abs(res_qa["data"]["bonif_total"] - res_prod["data"]["bonif_total"]) <= 1
            }

            is_parity_ok = all(parity_checks.values())
            report = self._generate_comparison_report(res_qa, res_prod, parity_checks, is_parity_ok)

            return {
                "status": "success",
                "is_parity_ok": is_parity_ok,
                "qa_results": res_qa,
                "prod_results": res_prod,
                "parity_checks": parity_checks,
                "report": report
            }

        except Exception as e:
            import traceback
            error_msg = f"Error en la comparación: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            return {"status": "error", "message": f"Error técnico: {str(e)}"}

    def _process_env_files(self, files: dict, env_name: str):
        if 'txpos' not in files or files['txpos'] is None:
            return {"status": "error", "message": f"Falta el archivo 'txpos' para {env_name}."}

        df_txpos = files['txpos']
        df_txpos.columns = [c.lower().strip() for c in df_txpos.columns]
        
        corr_col = next((c for c in ['vent_corr', 'vent_cor'] if c in df_txpos.columns), None)
        if not corr_col:
            return {"status": "error", "message": f"No se encontró la columna de correlativo (vent_corr) en txpos ({env_name}). Columnas vistas: {list(df_txpos.columns)}"}

        row = df_txpos.iloc[0]
        v_corr = str(row[corr_col]).strip()
        
        def get_val(r, col_variants, default=0):
            for col in col_variants:
                if col in r: return r[col]
            return default

        def get_sum(key, col_variants):
            df = files.get(key)
            if df is not None and not df.empty:
                # Normalizar columnas
                df.columns = [c.lower().strip() for c in df.columns]
                target_col = next((c for c in col_variants if c in df.columns), None)
                file_corr_col = next((c for c in ['vent_corr', 'vent_cor'] if c in df.columns), None)
                
                if not target_col or not file_corr_col:
                    return Decimal('0')
                
                # Filtrar por correlativo y sumar
                mask = df[file_corr_col].astype(str).str.strip() == v_corr
                filtered_df = df[mask]
                if filtered_df.empty: return Decimal('0')
                
                # Sumar usando la conversión segura a Decimal
                total = sum(self._to_decimal(val) for val in filtered_df[target_col])
                return total
            return Decimal('0')

        # Procesar datos
        res = {
            "vent_corr": v_corr,
            "num_doc": str(get_val(row, ['vent_nro_doc', 'num_doc', 'vent_nro_do'], 'N/A')),
            "tipo_doc_cod": str(get_val(row, ['vent_tipo_doc', 'tipo_doc'], 'N/A')),
            "vent_total": self._to_decimal(get_val(row, ['vent_bp', 'vent_total', 'total'])),
            "bonif_total": self._to_decimal(get_val(row, ['vent_desc', 'bonif', 'descuento_seguro'])),
            "det_total": get_sum('det_doc', ['detd_tot', 'det_monto', 'monto_total']),
            "desc_total": get_sum('descuento', ['desc_monto', 'monto', 'valor_descuento']),
            "pago_total": get_sum('pago', ['fopa_monto', 'pago_monto', 'monto_pago']),
        }

        # Lógica SB: Detalle - Descuento = Pago
        monto_esperado = res["det_total"] - res["desc_total"]
        if res["desc_total"] == 0 and res["bonif_total"] > 0:
            monto_esperado -= res["bonif_total"]

        is_consistent = abs(res["pago_total"] - monto_esperado) <= 1

        return {
            "status": "success",
            "env": env_name,
            "is_consistent": is_consistent,
            "data": res,
            "monto_esperado": monto_esperado
        }

    def _generate_comparison_report(self, res_qa, res_prod, parity, is_parity_ok):
        dt = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        def fmt_curr(val): return f"$ {val:,.0f}"
        
        qa = res_qa['data']
        prod = res_prod['data']
        qa_label = self._get_doc_label(qa['tipo_doc_cod'])

        report = f"""============================================================
📊 AUDITORÍA DE PARIDAD QA VS PRODUCCIÓN - SB
============================================================
Venta ID : {qa['vent_corr']} | Folio: {qa['num_doc']}
Tipo Doc : {qa_label} ({qa['tipo_doc_cod']})
Fecha    : {dt}
------------------------------------------------------------
DESGLOSE DE VALORES         | QA            | PRODUCCIÓN
------------------------------------------------------------
(+) Total Bruto (detd_tot)  | {fmt_curr(qa['det_total']):<13} | {fmt_curr(prod['det_total']):<13} {'✅' if parity['productos_iguales'] else '❌'}
(-) Total Descuentos (desc) | {fmt_curr(qa['desc_total']):<13} | {fmt_curr(prod['desc_total']):<13} {'✅' if parity['descuentos_iguales'] else '❌'}
------------------------------------------------------------
(=) TOTAL A PAGAR CALCULADO | {fmt_curr(res_qa['monto_esperado']):<13} | {fmt_curr(res_prod['monto_esperado']):<13}
------------------------------------------------------------
(*) Pago Real (fopa_monto)  | {fmt_curr(qa['pago_total']):<13} | {fmt_curr(prod['pago_total']):<13} {'✅' if parity['pagos_iguales'] else '❌'}
------------------------------------------------------------
[Info Bonif Cabecera: {fmt_curr(qa['bonif_total'])}]
------------------------------------------------------------

Veredicto FINAL DE PARIDAD (QA vs PROD):
{ '✅ AMBIENTES SINCRONIZADOS: Los datos son idénticos.' if is_parity_ok else '❌ ALERTA: Se detectaron diferencias entre ambientes.' }
============================================================
"""
        return report
