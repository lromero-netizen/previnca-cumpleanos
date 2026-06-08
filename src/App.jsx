import { useState, useRef, useCallback } from 'react'
import { MESES, EMPRESAS, clean, nameTokens, displayName, maskCuil, fmtMoney } from './utils'
import { parseTango, parseArca } from './parsers'
import { drawPlaca } from './drawPlaca'
import { exportExcel } from './exportExcel'

const IcoCheck   = () => <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6 9 17l-5-5"/></svg>
const IcoRefresh = () => <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
const IcoImage   = () => <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 16l4.5-6 3.5 4 3-4 5 6"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
const IcoDown    = () => <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/></svg>

function initFileState() {
  const d = {}
  EMPRESAS.forEach(e => { d[e.id] = { tango: null, arca: null, tangoName: "", arcaName: "", tErr: "", aErr: "" } })
  return d
}

function Stepper({ active, doneUpTo }) {
  const labels = ["Cargar archivos", "Validar", "Revisar", "Aceptar", "Generar placa"]
  return (
    <div className="steps">
      {labels.map((lbl, i) => {
        const n = i + 1
        return (
          <div key={n} className={`step${n === active ? " on" : ""}${n <= doneUpTo ? " done" : ""}`}>
            <span className="n">{n}</span> {lbl}
          </div>
        )
      })}
    </div>
  )
}

function CompanyCard({ empresa, fileState, onFile }) {
  const d = fileState[empresa.id]
  const slotClass = (ok, err) => ok ? "up ok" : err ? "up err" : "up"
  const slotText = (ok, name, err, label) =>
    ok ? `✓ ${name || label} — cargado correctamente` : err ? `✗ Error: ${err}` : "Seleccionar archivo…"
  return (
    <div className="card">
      <h3 className="card-title">{empresa.nombre}</h3>
      <div className="card-cc">{empresa.cc}</div>
      <div className="slot">
        <div className="slot-lab">
          <span className={`dot${d.tango ? " ok" : d.tErr ? " err" : ""}`} />
          Archivo Tango (.xlsx)
        </div>
        <label className={slotClass(d.tango, d.tErr)}>
          {slotText(d.tango, d.tangoName, d.tErr, "Tango")}
          <input type="file" accept=".xlsx,.xls" className="file-hidden" onChange={e => onFile(e, empresa.id, "tango")} />
        </label>
      </div>
      <div className="slot">
        <div className="slot-lab">
          <span className={`dot${d.arca ? " ok" : d.aErr ? " err" : ""}`} />
          Archivo ARCA (.txt)
        </div>
        <label className={slotClass(d.arca, d.aErr)}>
          {slotText(d.arca, d.arcaName, d.aErr, "ARCA")}
          <input type="file" accept=".txt" className="file-hidden" onChange={e => onFile(e, empresa.id, "arca")} />
        </label>
      </div>
    </div>
  )
}

export default function App() {
  const [mes,        setMes]        = useState(new Date().getMonth())
  const [importeBase,setImporteBase]= useState(0)
  const [fileState,  setFileState]  = useState(initFileState)
  const [rows,       setRows]       = useState([])
  const [validated,  setValidated]  = useState(false)
  const [accepted,   setAccepted]   = useState(false)
  const [placaUrl,   setPlacaUrl]   = useState(null)
  const [inclCuil,   setInclCuil]   = useState(false)
  const [excelOk,    setExcelOk]    = useState(false)
  const [stepActive, setStepActive] = useState(1)
  const [stepDone,   setStepDone]   = useState(0)

  const canvasRef = useRef(null)
  const resultRef = useRef(null)
  const placaRef  = useRef(null)

  const anyComplete = EMPRESAS.some(e => fileState[e.id].tango && fileState[e.id].arca)
  const anyPartial  = EMPRESAS.some(e => {
    const d = fileState[e.id]
    return (d.tango || d.arca) && !(d.tango && d.arca)
  })
  const loadHint = anyPartial
    ? "Hay empresas con un solo archivo cargado: completá ambos para incluirlas."
    : anyComplete ? "Listo para validar." : "Cargá al menos una empresa con sus dos archivos."

  const errIncl    = rows.some(r => r.include && r.status === "err")
  const anyFileErr = EMPRESAS.some(e => fileState[e.id].tErr || fileState[e.id].aErr)
  const inclCount  = rows.filter(r => r.include).length
  const canAccept  = validated && rows.length > 0 && inclCount > 0 && !errIncl && !anyFileErr

  const acceptHint = !validated ? ""
    : rows.length === 0 ? "No hay cumpleaños para aprobar."
    : anyFileErr ? "Hay archivos con error: corregí la carga."
    : errIncl ? "Quitá o corregí los casos en baja antes de aprobar."
    : inclCount === 0 ? "No hay nadie marcado para incluir."
    : "Revisado. Podés aprobar."

  const totIncl  = rows.filter(r => r.include).reduce((s, r) => s + (+r.importe || 0), 0)
  const countOk  = rows.filter(r => r.status === "ok").length
  const countRev = rows.filter(r => r.status === "rev").length
  const countErr = rows.filter(r => r.status === "err").length

  const handleFile = useCallback((e, empId, kind) => {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setFileState(prev => {
        const next = { ...prev, [empId]: { ...prev[empId] } }
        try {
          if (kind === "tango") {
            next[empId].tango     = parseTango(reader.result)
            next[empId].tangoName = f.name
            next[empId].tErr      = ""
          } else {
            next[empId].arca     = parseArca(new TextDecoder("utf-8").decode(reader.result))
            next[empId].arcaName = f.name
            next[empId].aErr     = ""
          }
        } catch (err) {
          if (kind === "tango") { next[empId].tango = null; next[empId].tErr = err.message }
          else                  { next[empId].arca  = null; next[empId].aErr = err.message }
        }
        return next
      })
      resetDownstream()
    }
    reader.readAsArrayBuffer(f)
  }, [])

  function resetDownstream() {
    setValidated(false)
    setAccepted(false)
    setPlacaUrl(null)
    setRows([])
    setStepActive(1)
    setStepDone(0)
  }

  function applyImporte() {
    setRows(prev => prev.map(r => ({ ...r, importe: importeBase })))
    setAccepted(false)
  }

  function runValidation() {
    const newRows = []
    EMPRESAS.forEach(e => {
      const d = fileState[e.id]
      if (!(d.tango && d.arca)) return
      const arcaCuils  = d.arca.byCuil
      const tangoCuils = new Set(d.tango.map(t => t.cuil))
      arcaCuils.forEach((_, c) => { if (!tangoCuils.has(c)) {} })
      d.tango.forEach(t => {
        if (!t.fecha || t.fecha.m !== mes) return
        const a = arcaCuils.get(t.cuil)
        let status = "ok", obs = ""
        if (!a)             { status = "rev"; obs = "No figura en ARCA — verificar alta" }
        else if (!a.active) { status = "err"; obs = "Figura como baja en ARCA" }
        else if (a.hasName && nameTokens(a.name) !== nameTokens(t.nombreRaw))
                            { status = "rev"; obs = "Nombre difiere entre Tango y ARCA" }
        if (!t.banco && status === "ok") { status = "rev"; obs = "Falta banco en Tango" }
        newRows.push({
          cuil:    t.cuil,
          empresa: e.nombre,
          dia:     t.fecha.txt,
          diaN:    t.fecha.d,
          nombre:  displayName(t.nombreRaw),
          sortKey: clean(t.nombreRaw).replace(/,/g, " ").replace(/\s+/g, " ").trim(),
          banco:   t.banco || "",
          centro:  t.centro || "",
          importe: importeBase || 0,
          status, obs,
          include: status !== "err",
        })
      })
    })
    newRows.sort((a, b) => a.diaN - b.diaN || a.sortKey.localeCompare(b.sortKey, "es"))
    setRows(newRows)
    setValidated(true)
    setAccepted(false)
    setPlacaUrl(null)
    const hasRev = newRows.some(r => r.status === "rev")
    const hasErr = newRows.some(r => r.status === "err")
    setStepActive(hasRev || hasErr ? 3 : 4)
    setStepDone(2)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  }

  function editRow(i, field, value) {
    setRows(prev => {
      const next = [...prev]
      next[i] = {
        ...next[i],
        [field]: field === "include" ? value : field === "importe" ? (+value || 0) : value
      }
      return next
    })
    setAccepted(false)
  }

  function handleAccept() {
    setAccepted(true)
    setStepActive(5)
    setStepDone(4)
    setTimeout(() => placaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  }

  function handleGenerar() {
    window.addEventListener("placaReady", (e) => {
      setPlacaUrl(e.detail)
      setStepDone(5)
    }, { once: true })
    drawPlaca(canvasRef.current, rows, mes)
  }

  function handleDescargar() {
    const a = document.createElement("a")
    a.href     = placaUrl
    a.download = `Cumpleaños_${MESES[mes]}_2026.jpg`
    a.click()
  }

  function handleExcel() {
    exportExcel(rows, mes, inclCuil)
    setExcelOk(true)
  }

  let stateClass = "rev"
  let stateTxt   = `No hay cumpleaños en ${MESES[mes]} entre las empresas cargadas.`
  if (rows.length > 0) {
    if (countErr > 0)      { stateClass = "err"; stateTxt = `Requiere revisión — hay ${countErr} caso(s) con baja o discrepancia crítica.` }
    else if (countRev > 0) { stateClass = "rev"; stateTxt = `Requiere revisión — hay ${countRev} caso(s) para chequear antes de aprobar.` }
    else                   { stateClass = "ok";  stateTxt = "Validación OK — la información está lista para aprobar." }
  }

  return (
    <div className="wrap">
      <div className="top"><span className="badge">Previnca Holding · RR.HH.</span></div>
      <h1 className="page-title">Gratificaciones de cumpleaños</h1>
      <p className="sub">Cargá los archivos de Tango y ARCA por empresa, validá quiénes cumplen años, revisá y corregí lo que haga falta, y generá la placa del mes.</p>

      <Stepper active={stepActive} doneUpTo={stepDone} />

      {/* Panel 1: Carga */}
      <div className="panel">
        <h2 className="panel-title"><span className="k">1</span> Cargar archivos por empresa</h2>
        <div className="month-row">
          <span className="month-label">Mes a publicar:</span>
          <select value={mes} onChange={e => { setMes(+e.target.value); resetDownstream() }}>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <span className="year-tag">2026</span>
          <span style={{ flex: 1 }} />
          <div className="importe-box">
            <span className="importe-label">Importe gratificación</span>
            <span className="importe-sym">$</span>
            <input type="number" min="0" step="100" placeholder="0" style={{ width: 120 }}
              value={importeBase || ""}
              onChange={e => setImporteBase(+e.target.value || 0)} />
            <button className="btn ghost" style={{ padding: "7px 12px", fontSize: 13 }} onClick={applyImporte}>
              Aplicar a todos
            </button>
          </div>
        </div>
        <p className="hint">El importe es manual porque puede variar mes a mes. Se aplica a todos los cumpleañeros y después podés ajustarlo persona por persona en la tabla.</p>
        <p className="hint">Tango aporta la fecha de nacimiento y el banco. ARCA confirma que el colaborador esté activo. Cada archivo se marca en <b style={{ color: "var(--green)" }}>verde</b> al cargarse bien.</p>
        <div className="cards">
          {EMPRESAS.map(e => <CompanyCard key={e.id} empresa={e} fileState={fileState} onFile={handleFile} />)}
        </div>
        <div className="bar">
          <button className="btn primary" disabled={!anyComplete} onClick={runValidation}>
            <IcoCheck /> Validar información
          </button>
          <span className="hint" style={{ margin: 0 }}>{loadHint}</span>
        </div>
      </div>

      {/* Panel 2/3: Resultados */}
      {validated && (
        <div className="panel" ref={resultRef}>
          <h2 className="panel-title"><span className="k">2</span> Estado de validación</h2>
          <div className="sum">
            <div className="stat"><div className="v">{rows.length}</div><div className="l">Cumpleaños del mes</div></div>
            <div className="stat"><div className="v" style={{ color: "var(--green)" }}>{countOk}</div><div className="l">Coincidencias correctas</div></div>
            <div className="stat"><div className="v" style={{ color: "var(--amber)" }}>{countRev}</div><div className="l">Requieren revisión</div></div>
            <div className="stat"><div className="v" style={{ color: "var(--red)" }}>{countErr}</div><div className="l">Discrepancias / baja</div></div>
          </div>
          <span className={`state ${stateClass}`}>{stateTxt}</span>
          <h3 style={{ fontSize: 16, margin: "22px 0 4px" }}>Detalle editable</h3>
          <p className="hint" style={{ marginTop: 2 }}>Podés corregir nombre, empresa, banco, fecha y observaciones, e incluir o excluir a cada persona de la placa.</p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Incluir</th><th>Día</th><th>Apellido y nombre</th><th>Empresa</th>
                  <th>Banco</th><th>Importe $</th><th>CUIL</th><th>Estado</th><th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={r.include ? "" : "exc"}>
                    <td style={{ textAlign: "center" }}>
                      <input type="checkbox" className="chk" checked={r.include}
                        onChange={e => editRow(i, "include", e.target.checked)} />
                    </td>
                    <td><input type="text" value={r.dia} style={{ width: 64 }} onChange={e => editRow(i, "dia", e.target.value)} /></td>
                    <td><input type="text" value={r.nombre} onChange={e => editRow(i, "nombre", e.target.value)} /></td>
                    <td><input type="text" value={r.empresa} onChange={e => editRow(i, "empresa", e.target.value)} /></td>
                    <td><input type="text" value={r.banco} onChange={e => editRow(i, "banco", e.target.value)} /></td>
                    <td><input type="number" min="0" step="100" value={r.importe || 0} onChange={e => editRow(i, "importe", e.target.value)} /></td>
                    <td className="cuil">{maskCuil(r.cuil)}</td>
                    <td><span className={`pill ${r.status}`}>{r.status === "ok" ? "OK" : r.status === "rev" ? "Revisar" : "Baja/Error"}</span></td>
                    <td><input type="text" value={r.obs || ""} placeholder="—" onChange={e => editRow(i, "obs", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inclCount > 0 && totIncl > 0 && (
            <div className="total-box">
              Total a depositar ({inclCount} persona{inclCount > 1 ? "s" : ""}):&nbsp;
              <span className="total-amount">${fmtMoney(totIncl)}</span>
            </div>
          )}
          <div className="bar">
            <button className="btn ghost" onClick={runValidation}><IcoRefresh /> Volver a validar</button>
            <button className="btn primary" disabled={!canAccept} onClick={handleAccept}><IcoCheck /> Aceptar</button>
            <span className="hint" style={{ margin: 0 }}>{acceptHint}</span>
          </div>
        </div>
      )}

      {/* Panel 5: Placa */}
      {accepted && (
        <div className="panel" ref={placaRef}>
          <h2 className="panel-title"><span className="k">3</span> Placa del mes</h2>
          <p className="hint">Información confirmada para {MESES[mes]}. Generá la placa para publicar en la plataforma interna.</p>
          <div className="bar" style={{ marginTop: 0 }}>
            <button className="btn accent" onClick={handleGenerar}><IcoImage /> Generar placa</button>
            {placaUrl && (
              <button className="btn primary" onClick={handleDescargar}><IcoDown /> Descargar placa</button>
            )}
          </div>
          <div className="placa-area" style={{ marginTop: 18 }}>
            <canvas ref={canvasRef} width={952} height={1288} style={{ display: "none" }} />
            {placaUrl && (
              <>
                <img className="placa-img" src={placaUrl} alt="Placa de cumpleaños" />
                <div>
                  <div className="ok-msg" style={{ marginBottom: 10 }}>
                    <IcoCheck /> La placa se generó correctamente.
                  </div>
                  <p className="hint">Incluye solo nombre, apellido y día. No contiene CUIL ni datos sensibles.</p>
                </div>
              </>
            )}
          </div>
          <div className="divider">
            <h3 style={{ fontSize: 16, marginBottom: 2 }}>Listado para acreditación (Excel)</h3>
            <p className="hint" style={{ marginTop: 4 }}>Un único archivo con todos los cumpleañeros del mes, ordenados por empresa y banco.</p>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 600, marginBottom: 14, cursor: "pointer" }}>
              <input type="checkbox" className="chk" checked={inclCuil} onChange={e => setInclCuil(e.target.checked)} />
              Incluir CUIL completo (necesario para la transferencia)
            </label>
            <div className="bar" style={{ marginTop: 0 }}>
              <button className="btn primary" onClick={handleExcel}><IcoDown /> Descargar listado Excel</button>
              {excelOk && <span className="ok-msg"><IcoCheck /> Listado generado.</span>}
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              {inclCuil
                ? "El listado incluirá el CUIL completo. Usalo solo para la transferencia y resguardá el archivo."
                : "Por defecto el listado no incluye CUIL. Marcá la casilla solo si el archivo se usa para transferir."}
            </p>
          </div>
        </div>
      )}

      <div className="foot">Herramienta interna · Los datos cargados se procesan en tu navegador y no se almacenan.</div>
    </div>
  )
}