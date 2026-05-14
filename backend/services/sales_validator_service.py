import pandas as pd
from decimal import Decimal
from datetime import datetime

class SalesValidatorService:
    def __init__(self):
        # Mapeo de tipos de documento SB/SII
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

    def compare_environments(self, qa_files: dict, prod_files: dict):
        try:
            res_qa = self._process_env_files(qa_files, "QA")
            if res_qa.get("status") == "error": return res_qa

            res_prod = self._process_env_files(prod_files, "PROD")
            if res_prod.get("status") == "error": return res_prod

            # Comparar todos los pilares de la venta
            parity_checks = {
                "total_igual": res_qa["data"]["vent_total"] == res_prod["data"]["vent_total"],
                "pagos_iguales": res_qa["data"]["pago_total"] == res_prod["data"]["pago_total"],
                "productos_iguales": res_qa["data"]["det_total"] == res_prod["data"]["det_total"],
                "descuentos_iguales": res_qa["data"]["desc_total"] == res_prod["data"]["desc_total"],
                "bonif_igual": res_qa["data"]["bonif_total"] == res_prod["data"]["bonif_total"]
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
            print(traceback.format_exc())
            return {"status": "error", "message": f"Error en la comparación: {str(e)}"}

    def _process_env_files(self, files: dict, env_name: str):
        if 'txpos' not in files or files['txpos'] is None:
            return {"status": "error", "message": f"Falta el archivo 'txpos' para {env_name}."}

        df_txpos = files['txpos']
        df_txpos.columns = [c.lower().strip() for c in df_txpos.columns]
        row = df_txpos.iloc[0]
        v_corr = str(row['vent_corr']).strip()
        
        def get_val(r, col, default=0):
            if col in r: return r[col]
            if col == 'vent_bp' and 'vent_total' in r: return r['vent_total']
            if col == 'vent_nro_doc' and 'num_doc' in r: return r['num_doc']
            return default

        def get_sum(key, col_variants):
            df = files.get(key)
            if df is not None and not df.empty:
                df.columns = [c.lower().strip() for c in df.columns]
                target_col = next((c for c in col_variants if c in df.columns), None)
                if not target_col or 'vent_corr' not in df.columns:
                    return 0
                mask = df['vent_corr'].astype(str).str.strip() == v_corr
                return pd.to_numeric(df[mask][target_col], errors='coerce').sum()
            return 0

        # Bonificación de Cabecera (Para información)
        v_desc = Decimal(str(get_val(row, 'vent_desc', 0)))
        v_bn = Decimal(str(get_val(row, 'vent_bn', 0)))
        bonif_header = v_desc # Usualmente vent_desc ya es el total

        res = {
            "vent_corr": v_corr,
            "num_doc": str(get_val(row, 'vent_nro_doc', 'N/A')),
            "tipo_doc_cod": str(get_val(row, 'vent_tipo_doc', 'N/A')),
            "vent_total": Decimal(str(get_val(row, 'vent_bp', 0))),
            "bonif_total": bonif_header,
            "det_total": Decimal(str(get_sum('det_doc', ['detd_tot', 'det_monto']))),
            "desc_total": Decimal(str(get_sum('descuento', ['desc_monto', 'monto']))),
            "pago_total": Decimal(str(get_sum('pago', ['fopa_monto', 'pago_monto']))),
        }

        # FUENTE DE VERDAD: La tabla itl.descuento ya trae tanto comerciales como seguros en SB.
        monto_esperado = res["det_total"] - res["desc_total"]
        
        # Si por alguna razón la tabla itl.desc está vacía pero hay bonif en cabecera, la usamos
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
