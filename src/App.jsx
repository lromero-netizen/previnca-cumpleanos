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
  EMPRESAS.forEach(e => { d[e.id] = { tango:null, arca:null, tangoName:"", arcaName:"", tErr:"", aErr:"" } })
  return d
}

function Stepper({ active, doneUpTo }) {
  const labels = ["Cargar archivos","Validar","Revisar","Aceptar","Generar placa"]
  return (
    <div className="steps">
      {labels.map((lbl, i) => {
        const n = i + 1
        return (
          <div key={n} className={`step${n===active?" on":""}${n<=doneUpTo?" done":""}`}>
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
  const slotText  = (ok, name, err, label) =>
    ok ? `✓ ${name||label} — cargado correctamente` : err ? `✗ Error: ${err}` : "Seleccionar archivo…"
  return (
    <div className="card">
      <h3 className="card-title">{empresa.nombre}</h3>
      <div className="card-cc">{empresa.cc}</div>
      <div className="slot">
        <div className="slot-lab">
          <span className={`dot${d.tango?" ok":d.tErr?" err":""}`} />
          Archivo Tango (.xlsx)
        </div>
        <label className={slotClass(d.tango, d.tErr)}>
          {slotText(d.tango, d.tangoName, d.tErr, "Tango")}
          <input type="file" accept=".xlsx,.xls" className="file-hidden" onChange={e => onFile(e, empresa.id, "tango")} />
        </label>
      </div>
      <div className="slot">
        <div className="slot-lab">
          <span className={`dot${d.arca?" ok":d.aErr?" err":""}`} />
          Archivo ARCA (.txt)
        </div>
        <label className={slotClass(d.arca, d.aErr)}>
          {slotText(d.arca, d.arcaName, d.aErr, "ARCA")}
          <input type="file" accept=".txt" className="file-hidden" onChange={e => onFile(e, empresa.id, "arca")} />
        </label>
      </div>
    </div>
  )
#!/bin/bash
set -e

PROJECT="previnca-cumpleanos"
mkdir -p "$PROJECT/src"
cd "$PROJECT"

echo "📁 Creando estructura de carpetas..."

# ── .gitignore ──────────────────────────────────────────────
cat > .gitignore << 'EOF'
node_modules
dist
.env
.DS_Store
EOF

# ── package.json ────────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "previnca-cumpleanos",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.4"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
EOF

# ── vite.config.js ──────────────────────────────────────────
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' }
})
EOF

# ── index.html ──────────────────────────────────────────────
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gratificaciones de Cumpleaños — Previnca Holding</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# ── src/main.jsx ─────────────────────────────────────────────
cat > src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
EOF

# ── src/utils.js ─────────────────────────────────────────────
cat > src/utils.js << 'EOF'
export const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
]
export const EMPRESAS = [
  { id: "caramuto", nombre: "Caramuto Rosario", cc: "Pompas fúnebres" },
  { id: "seguros",  nombre: "Previnca Seguros",  cc: "Seguros de vida" },
  { id: "salud",    nombre: "Previnca Salud",    cc: "Seguros de salud" },
  { id: "sacifi",   nombre: "SACIFI",            cc: "Productores y asesores" },
]
export function clean(s) {
  return (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim()
}
export function onlyDigits(s) { return (s||"").toString().replace(/\D/g,"") }
export function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-záéíóúñ])/g, m => m.toUpperCase())
}
export function nameTokens(s) {
  return clean(s).replace(/,/g," ").split(/\s+/).filter(Boolean).sort().join(" ")
}
export function displayName(raw) {
  if (!raw) return ""
  if (raw.includes(",")) {
    const p = raw.split(",")
    const ape = titleCase(p[0].trim().replace(/\s+/g," "))
    const nom = titleCase((p[1]||"").trim().replace(/\s+/g," "))
    return nom ? ape+", "+nom : ape
  }
  return titleCase(raw.trim())
}
export function placaNombre(full) {
  if (!full) return ""
  let ape, nom
  if (full.includes(",")) {
    const p = full.split(",")
    ape = (p[0].trim().split(/\s+/)[0]||"")
    nom = ((p[1]||"").trim().split(/\s+/)[0]||"")
  } else {
    const w = full.trim().split(/\s+/)
    ape = w[0]||""; nom = w[1]||""
  }
  return titleCase(nom) ? titleCase(ape)+", "+titleCase(nom) : titleCase(ape)
}
export function parseDate(v) {
  if (v instanceof Date) return { d:v.getDate(), m:v.getMonth(), txt:pad(v.getDate())+"/"+pad(v.getMonth()+1) }
  const s=(v||"").toString().trim()
  let match=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (match) return { d:+match[1], m:+match[2]-1, txt:pad(+match[1])+"/"+pad(+match[2]) }
  match=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (match) return { d:+match[3], m:+match[2]-1, txt:pad(+match[3])+"/"+pad(+match[2]) }
  return null
}
export function pad(n) { return n<10?"0"+n:""+n }
export function maskCuil(c) { const d=onlyDigits(c); return d.length>=11?"••-•••••"+d.slice(8):d }
export function formatCuil(c) { const d=onlyDigits(c); return d.length>=11?d.slice(0,2)+"-"+d.slice(2,10)+"-"+d.slice(10,11):d }
export function fmtMoney(n) { return (Number(n)||0).toLocaleString("es-AR",{minimumFractionDigits:0}) }
EOF

# ── src/parsers.js ───────────────────────────────────────────
cat > src/parsers.js << 'EOF'
import * as XLSX from 'xlsx'
import { clean, onlyDigits, parseDate } from './utils'

export function parseTango(buf) {
  const wb = XLSX.read(buf, { type:"array", cellDates:true })
  const ws = wb.Sheets["Hoja2"] || wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, dateNF:"dd/mm/yyyy" })
  if (!rows.length) throw new Error("El archivo está vacío")
  const head = rows[0].map(h => clean(h))
  const ci=head.indexOf("CUIL"), ni=head.indexOf("NOMBRE"), fi=head.indexOf("FECHA")
  const bi=head.indexOf("BANCO"), cci=head.indexOf("CENTRO COSTO")
  if (ci<0||ni<0||fi<0) throw new Error("Faltan columnas obligatorias (CUIL, NOMBRE, FECHA)")
  const out=[]
  for (let i=1;i<rows.length;i++) {
    const r=rows[i]; if (!r||!r[ci]) continue
    const cuil=onlyDigits(r[ci]); if (cuil.length<11) continue
    out.push({ cuil, nombreRaw:(r[ni]||"").toString().trim(), banco:(r[bi]||"").toString().trim(),
      centro:cci>=0?(r[cci]||"").toString().trim():"", fecha:parseDate(r[fi]) })
  }
  if (!out.length) throw new Error("No se encontraron filas válidas")
  return out
}

export function parseArca(text) {
  const lines=text.split(/\r?\n/), byCuil=new Map()
  let salud=0
  for (const ln of lines) { if (/^01\s+\d{11}/.test(ln)) salud++ }
  if (salud>3) {
    let leg=0
    for (const ln of lines) {
      const m=ln.match(/^01\s+(\d{11})/); if (!m) continue
      byCuil.set(m[1],{name:"",active:true,hasName:false}); leg++
    }
    return {byCuil,hasNames:false,count:leg}
  }
  let leg=0
  for (const ln of lines) {
    const m=ln.match(/^\s*(\d{11})\s+(.+)$/); if (!m) continue
    const dates=(ln.match(/\d{2}\/\d{2}\/\d{4}/g)||[])
    byCuil.set(m[1],{name:m[2].slice(0,55).trim(),active:dates.length<2,hasName:true}); leg++
  }
  return {byCuil,hasNames:true,count:leg}
}
EOF

# ── src/drawPlaca.js ─────────────────────────────────────────
cat > src/drawPlaca.js << 'EOF'
import { MESES, placaNombre } from './utils'

export function drawPlaca(canvas, rows, mes) {
  const ctx=canvas.getContext("2d"), W=canvas.width, H=canvas.height
  ctx.clearRect(0,0,W,H)
  const bg=ctx.createLinearGradient(0,0,0,H)
  bg.addColorStop(0,"#0e1840"); bg.addColorStop(0.45,"#15246b"); bg.addColorStop(1,"#1b2f86")
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H)
  ctx.save(); ctx.globalAlpha=0.08
  ctx.beginPath(); ctx.arc(W*0.85,H*0.08,340,0,Math.PI*2); ctx.fillStyle="#ff8a3d"; ctx.fill()
  ctx.beginPath(); ctx.arc(W*0.1,H*0.15,220,0,Math.PI*2); ctx.fillStyle="#ff6b8a"; ctx.fill()
  ctx.restore()
  ctx.fillStyle="#ffb84d"; ctx.fillRect(0,0,W,8)
  ctx.textAlign="center"
  ctx.fillStyle="rgba(255,255,255,.7)"; ctx.font="600 28px 'Plus Jakarta Sans', sans-serif"
  ctx.fillText("CUMPLEAÑOS DE",W/2,80)
  ctx.fillStyle="#ffb84d"; ctx.font="800 72px 'Bricolage Grotesque', sans-serif"
  ctx.fillText(MESES[mes].toUpperCase(),W/2,162)
  ctx.strokeStyle="rgba(255,179,77,.4)"; ctx.lineWidth=2
  ctx.beginPath(); ctx.moveTo(60,188); ctx.lineTo(W-60,188); ctx.stroke()
  const people=rows.filter(r=>r.include).slice()
    .sort((a,b)=>a.diaN-b.diaN||a.sortKey.localeCompare(b.sortKey,"es"))
    .map(r=>({dia:r.dia,nombre:placaNombre(r.nombre)}))
  const top=215,bottom=H-80,areaH=bottom-top,n=people.length
  if (n===0) {
    ctx.fillStyle="rgba(255,255,255,.5)"; ctx.font="500 22px 'Plus Jakarta Sans', sans-serif"
    ctx.fillText("(Sin colaboradores seleccionados)",W/2,top+40)
  } else {
    const cols=n>12?2:1, perCol=Math.ceil(n/cols)
    let fs=Math.min(36,Math.floor(areaH/perCol)-8); fs=Math.max(fs,16)
    const lh=fs+Math.max(8,fs*0.4), blockH=lh*perCol, y0=top+(areaH-blockH)/2+fs
    const centers=cols===1?[W/2]:[W*0.28,W*0.72]
    ctx.textAlign="left"
    people.forEach((p,i)=>{
      const col=Math.floor(i/perCol),row=i%perCol,cx=centers[col]
      ctx.font="600 "+fs+"px 'Plus Jakarta Sans', sans-serif"
      const sep="  ",wD=ctx.measureText(p.dia).width,wS=ctx.measureText(sep).width,wN=ctx.measureText(p.nombre).width
      const x=cx-(wD+wS+wN)/2, y=y0+row*lh
      ctx.fillStyle="#ffb84d"; ctx.fillText(p.dia,x,y)
      ctx.fillStyle="#ffffff"; ctx.fillText(sep+p.nombre,x+wD,y)
    })
    ctx.textAlign="center"
  }
  ctx.fillStyle="rgba(255,255,255,.3)"; ctx.font="500 18px 'Plus Jakarta Sans', sans-serif"
  ctx.fillText("Previnca Holding · RR.HH.",W/2,H-30)
  return canvas.toDataURL("image/jpeg",0.92)
}
EOF

# ── src/exportExcel.js ───────────────────────────────────────
cat > src/exportExcel.js << 'EOF'
import * as XLSX from 'xlsx'
import { MESES, formatCuil } from './utils'

export function exportExcel(rows, mes, inclCuil) {
  const people=rows.filter(r=>r.include).slice()
    .sort((a,b)=>a.empresa.localeCompare(b.empresa)||(a.banco||"").localeCompare(b.banco||"")||(a.centro||"").localeCompare(b.centro||"")||a.sortKey.localeCompare(b.sortKey,"es"))
  const baseCols=["Empresa","Banco","Centro de costo","Día","Apellido y nombre"]
  const cols=inclCuil?[...baseCols,"CUIL","Importe a depositar"]:[...baseCols,"Importe a depositar"]
  const impCol=cols.length-1
  const aoa=[["Cumpleañeros de "+MESES[mes]+" 2026 — Acreditación de gratificación"],[],cols]
  let granTotal=0,curEmp=null,subTot=0,subCnt=0
  const flushSub=()=>{
    if(curEmp===null)return
    const row=new Array(cols.length).fill("")
    row[3]="Total "+curEmp+" ("+subCnt+")"; row[impCol]=subTot
    aoa.push(row); aoa.push(new Array(cols.length).fill(""))
  }
  people.forEach(p=>{
    if(p.empresa!==curEmp){flushSub();curEmp=p.empresa;subTot=0;subCnt=0}
    const imp=+p.importe||0; subTot+=imp; subCnt++; granTotal+=imp
    const row=[p.empresa,p.banco||"(sin banco)",p.centro||"(sin centro)",p.dia,p.nombre]
    if(inclCuil)row.push(formatCuil(p.cuil))
    row.push(imp); aoa.push(row)
  })
  flushSub()
  const totRow=new Array(cols.length).fill("")
  totRow[3]="TOTAL GENERAL DEL MES"; totRow[impCol]=granTotal; aoa.push(totRow)
  const ws=XLSX.utils.aoa_to_sheet(aoa)
  ws["!cols"]=[{wch:22},{wch:26},{wch:18},{wch:8},{wch:30}].concat(inclCuil?[{wch:16}]:[]).concat([{wch:18}])
  ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:cols.length-1}}]
  for(let R=3;R<aoa.length;R++){const cell=ws[XLSX.utils.encode_cell({r:R,c:impCol})];if(cell&&typeof cell.v==="number")cell.z="#,##0"}
  const grp={}
  people.forEach(p=>{const k=[p.empresa,p.banco||"(sin banco)",p.centro||"(sin centro)"].join("||");if(!grp[k])grp[k]={c:0,i:0};grp[k].c++;grp[k].i+=(+p.importe||0)})
  const raoa=[["Resumen por empresa, banco y centro de costo — "+MESES[mes]+" 2026"],[],["Empresa","Banco","Centro de costo","Cantidad","Importe"]]
  Object.keys(grp).sort().forEach(k=>{const [e,b,c]=k.split("||");raoa.push([e,b,c,grp[k].c,grp[k].i])})
  const byEmp={}
  people.forEach(p=>{if(!byEmp[p.empresa])byEmp[p.empresa]={c:0,i:0};byEmp[p.empresa].c++;byEmp[p.empresa].i+=(+p.importe||0)})
  raoa.push([],["Total por empresa","","","",""])
  Object.keys(byEmp).sort().forEach(e=>raoa.push([e,"","",byEmp[e].c,byEmp[e].i]))
  raoa.push([],["TOTAL DEL MES","","",people.length,granTotal])
  const rs=XLSX.utils.aoa_to_sheet(raoa)
  rs["!cols"]=[{wch:22},{wch:26},{wch:18},{wch:10},{wch:16}]
  rs["!merges"]=[{s:{r:0,c:0},e:{r:0,c:4}}]
  for(let R=3;R<raoa.length;R++){const cell=rs[XLSX.utils.encode_cell({r:R,c:4})];if(cell&&typeof cell.v==="number")cell.z="#,##0"}
  const wb=XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,ws,"Listado"); XLSX.utils.book_append_sheet(wb,rs,"Resumen")
  XLSX.writeFile(wb,"Cumpleaños_"+MESES[mes]+"_2026_por_banco.xlsx")
}
EOF

# ── src/index.css ─────────────────────────────────────────────
cat > src/index.css << 'EOF'
:root {
  --navy:#15246b;--navy-2:#1b2f86;--navy-deep:#0e1840;
  --paper:#f4f6fc;--ink:#13204e;--muted:#5d6a93;--line:#dfe4f3;
  --coral:#ff6b8a;--gold:#ffb84d;--mango:#ff8a3d;
  --green:#1fb47a;--green-bg:#e6f7f0;
  --amber:#e8a200;--amber-bg:#fff5dc;
  --red:#e23b53;--red-bg:#fdebee;
  --grey:#aab2cf;--grey-bg:#eef0f7;
  --shadow:0 18px 40px -22px rgba(16,28,80,.55);--r:16px;
}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 500px at 100% -10%,rgba(255,138,61,.10),transparent 60%),radial-gradient(1000px 480px at -10% 0%,rgba(255,107,138,.10),transparent 55%),var(--paper);color:var(--ink);font-family:"Plus Jakarta Sans",system-ui,sans-serif;-webkit-font-smoothing:antialiased;padding:28px 18px 80px}
.wrap{max-width:1040px;margin:0 auto}
h1,h2,h3{font-family:"Bricolage Grotesque",system-ui,sans-serif;margin:0;letter-spacing:-.02em}
.top{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:6px}
.badge{font-weight:800;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,var(--navy),var(--navy-2));padding:7px 12px;border-radius:999px}
.page-title{font-size:clamp(26px,4vw,40px);font-weight:800;line-height:1.02}
.sub{color:var(--muted);font-size:15px;margin:8px 0 22px;max-width:62ch}
.steps{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
.step{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 14px}
.step .n{width:20px;height:20px;border-radius:50%;background:var(--grey-bg);color:var(--muted);display:grid;place-items:center;font-size:12px;font-weight:800}
.step.on{color:var(--navy);border-color:#c3cdf2;box-shadow:0 4px 14px -8px rgba(21,36,107,.5)}
.step.on .n{background:var(--navy);color:#fff}
.step.done .n{background:var(--green);color:#fff}
.panel{background:#fff;border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:22px;margin-bottom:20px}
.panel-title{font-size:19px;display:flex;align-items:center;gap:10px;margin-bottom:4px}
.panel-title .k{width:26px;height:26px;border-radius:8px;background:var(--navy);color:#fff;display:grid;place-items:center;font-size:14px;font-weight:800;font-family:"Plus Jakarta Sans"}
.hint{color:var(--muted);font-size:13.5px;margin:4px 0 16px}
.month-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.month-label{font-weight:600;font-size:14px}
.year-tag{font-weight:700;color:var(--navy)}
.importe-box{display:flex;align-items:center;gap:8px;background:#fbfcff;border:1.5px solid var(--line);border-radius:12px;padding:8px 12px}
.importe-label{font-weight:600;font-size:13px;color:var(--navy)}
.importe-sym{color:var(--muted);font-weight:700}
select,input[type=text],input[type=number]{font-family:inherit;font-size:14px;color:var(--ink);background:#fff;border:1.5px solid var(--line);border-radius:10px;padding:9px 12px}
select:focus,input:focus{outline:none;border-color:var(--navy-2);box-shadow:0 0 0 3px rgba(27,47,134,.12)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.card{border:1.5px solid var(--line);border-radius:14px;padding:16px;background:#fbfcff}
.card-title{font-size:16px;margin-bottom:2px}
.card-cc{font-size:12px;color:var(--muted);margin-bottom:14px}
.slot{margin-top:10px}
.slot-lab{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;margin-bottom:6px}
.dot{width:10px;height:10px;border-radius:50%;background:var(--grey);flex:none;box-shadow:0 0 0 3px var(--grey-bg)}
.dot.ok{background:var(--green);box-shadow:0 0 0 3px var(--green-bg)}
.dot.err{background:var(--red);box-shadow:0 0 0 3px var(--red-bg)}
.up{display:block;width:100%;text-align:left;font-size:12.5px;color:var(--muted);border:1.5px dashed #cfd6ee;border-radius:10px;padding:9px 11px;background:#fff;cursor:pointer;transition:.15s}
.up:hover{border-color:var(--navy-2);color:var(--navy)}
.up.ok{border-style:solid;border-color:var(--green);background:var(--green-bg);color:#0f7a52;font-weight:600}
.up.err{border-style:solid;border-color:var(--red);background:var(--red-bg);color:#b21f37;font-weight:600}
.btn{font-family:inherit;font-weight:700;font-size:14.5px;border:none;border-radius:11px;padding:12px 20px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:9px}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn.primary{background:linear-gradient(135deg,var(--navy),var(--navy-2));color:#fff;box-shadow:0 12px 22px -12px rgba(21,36,107,.8)}
.btn.primary:not(:disabled):hover{transform:translateY(-1px)}
.btn.accent{background:linear-gradient(135deg,var(--mango),var(--coral));color:#fff;box-shadow:0 12px 22px -12px rgba(255,107,138,.8)}
.btn.accent:not(:disabled):hover{transform:translateY(-1px)}
.btn.ghost{background:#fff;border:1.5px solid var(--line);color:var(--navy)}
.bar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:20px}
.sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:16px}
.stat{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fbfcff}
.stat .v{font-family:"Bricolage Grotesque";font-size:30px;font-weight:800;line-height:1}
.stat .l{font-size:12.5px;color:var(--muted);margin-top:6px}
.state{display:inline-flex;align-items:center;gap:9px;font-weight:700;font-size:15px;padding:10px 16px;border-radius:11px}
.state.ok{background:var(--green-bg);color:#0f7a52}
.state.rev{background:var(--amber-bg);color:#9a6b00}
.state.err{background:var(--red-bg);color:#b21f37}
.tablewrap{overflow:auto;border:1px solid var(--line);border-radius:12px;margin-top:6px}
table{border-collapse:collapse;width:100%;min-width:880px;font-size:13px}
th{background:#f3f5fc;text-align:left;font-weight:700;color:var(--navy);padding:11px 12px;position:sticky;top:0;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:8px 12px;border-bottom:1px solid #eef1f9;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr.exc td{opacity:.45}
td input[type=text]{width:100%;min-width:90px;padding:6px 8px;font-size:12.5px;border-radius:8px}
td input[type=number]{width:96px;padding:6px 8px;font-size:12.5px;border-radius:8px}
.pill{font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap}
.pill.ok{background:var(--green-bg);color:#0f7a52}
.pill.rev{background:var(--amber-bg);color:#9a6b00}
.pill.err{background:var(--red-bg);color:#b21f37}
.cuil{font-variant-numeric:tabular-nums;color:var(--muted);font-size:12px}
.chk{width:18px;height:18px;accent-color:var(--navy)}
.note{font-size:12.5px;color:var(--muted);background:#f7f9ff;border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:8px;padding:10px 13px;margin-top:14px}
.placa-area{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start}
.placa-img{width:300px;max-width:100%;border-radius:14px;box-shadow:var(--shadow);border:1px solid var(--line)}
.ok-msg{display:inline-flex;align-items:center;gap:8px;color:#0f7a52;font-weight:700;font-size:14px}
.total-box{text-align:right;font-weight:700;color:var(--navy);margin-top:10px}
.total-amount{font-size:18px}
.divider{border-top:1px solid var(--line);margin-top:24px;padding-top:20px}
.foot{text-align:center;color:var(--muted);font-size:12px;margin-top:30px}
.ic{width:16px;height:16px;flex:none}
.file-hidden{display:none}
EOF

# ── src/App.jsx ───────────────────────────────────────────────
cat > src/App.jsx << 'APPEOF'
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
  EMPRESAS.forEach(e => { d[e.id] = { tango:null, arca:null, tangoName:"", arcaName:"", tErr:"", aErr:"" } })
  return d
}

function Stepper({ active, doneUpTo }) {
  const labels = ["Cargar archivos","Validar","Revisar","Aceptar","Generar placa"]
  return (
    <div className="steps">
      {labels.map((lbl, i) => {
        const n = i + 1
        return (
          <div key={n} className={`step${n===active?" on":""}${n<=doneUpTo?" done":""}`}>
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
  const slotText  = (ok, name, err, label) =>
    ok ? `✓ ${name||label} — cargado correctamente` : err ? `✗ Error: ${err}` : "Seleccionar archivo…"
  return (
    <div className="card">
      <h3 className="card-title">{empresa.nombre}</h3>
      <div className="card-cc">{empresa.cc}</div>
      <div className="slot">
        <div className="slot-lab">
          <span className={`dot${d.tango?" ok":d.tErr?" err":""}`} />
          Archivo Tango (.xlsx)
        </div>
        <label className={slotClass(d.tango, d.tErr)}>
          {slotText(d.tango, d.tangoName, d.tErr, "Tango")}
          <input type="file" accept=".xlsx,.xls" className="file-hidden" onChange={e => onFile(e, empresa.id, "tango")} />
        </label>
      </div>
      <div className="slot">
        <div className="slot-lab">
          <span className={`dot${d.arca?" ok":d.aErr?" err":""}`} />
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
  const [mes,         setMes]         = useState(new Date().getMonth())
  const [importeBase, setImporteBase] = useState(0)
  const [fileState,   setFileState]   = useState(initFileState)
  const [rows,        setRows]        = useState([])
  const [validated,   setValidated]   = useState(false)
  const [accepted,    setAccepted]    = useState(false)
  const [placaUrl,    setPlacaUrl]    = useState(null)
  const [inclCuil,    setInclCuil]    = useState(false)
  const [excelOk,     setExcelOk]     = useState(false)
  const [stepActive,  setStepActive]  = useState(1)
  const [stepDone,    setStepDone]    = useState(0)
  const canvasRef = useRef(null)
  const resultRef = useRef(null)
  const placaRef  = useRef(null)

  const anyComplete = EMPRESAS.some(e => fileState[e.id].tango && fileState[e.id].arca)
  const anyPartial  = EMPRESAS.some(e => { const d=fileState[e.id]; return (d.tango||d.arca)&&!(d.tango&&d.arca) })
  const loadHint    = anyPartial ? "Hay empresas con un solo archivo cargado: completá ambos para incluirlas."
    : anyComplete ? "Listo para validar." : "Cargá al menos una empresa con sus dos archivos."
  const errIncl     = rows.some(r => r.include && r.status==="err")
  const anyFileErr  = EMPRESAS.some(e => fileState[e.id].tErr || fileState[e.id].aErr)
  const inclCount   = rows.filter(r => r.include).length
  const canAccept   = validated && rows.length>0 && inclCount>0 && !errIncl && !anyFileErr
  const acceptHint  = !validated?"":rows.length===0?"No hay cumpleaños para aprobar.":anyFileErr?"Hay archivos con error: corregí la carga.":errIncl?"Quitá o corregí los casos en baja antes de aprobar.":inclCount===0?"No hay nadie marcado para incluir.":"Revisado. Podés aprobar."
  const totIncl     = rows.filter(r=>r.include).reduce((s,r)=>s+(+r.importe||0),0)
  const countOk     = rows.filter(r=>r.status==="ok").length
  const countRev    = rows.filter(r=>r.status==="rev").length
  const countErr    = rows.filter(r=>r.status==="err").length

  const handleFile = useCallback((e, empId, kind) => {
    const f = e.target.files[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setFileState(prev => {
        const next = { ...prev, [empId]: { ...prev[empId] } }
        try {
          if (kind==="tango") { next[empId].tango=parseTango(reader.result); next[empId].tangoName=f.name; next[empId].tErr="" }
          else { next[empId].arca=parseArca(new TextDecoder("utf-8").decode(reader.result)); next[empId].arcaName=f.name; next[empId].aErr="" }
        } catch(err) {
          if(kind==="tango"){next[empId].tango=null;next[empId].tErr=err.message}
          else{next[empId].arca=null;next[empId].aErr=err.message}
        }
        return next
      })
      resetDownstream()
    }
    reader.readAsArrayBuffer(f)
  }, [])

  function resetDownstream() {
    setValidated(false); setAccepted(false); setPlacaUrl(null)
    setRows([]); setStepActive(1); setStepDone(0)
  }

  function applyImporte() {
    setRows(prev => prev.map(r => ({ ...r, importe: importeBase }))); setAccepted(false)
  }

  function runValidation() {
    const newRows=[], extras={tangoNoArca:0,arcaNoTango:0}
    EMPRESAS.forEach(e => {
      const d=fileState[e.id]; if(!(d.tango&&d.arca)) return
      const arcaCuils=d.arca.byCuil, tangoCuils=new Set(d.tango.map(t=>t.cuil))
      arcaCuils.forEach((_,c)=>{ if(!tangoCuils.has(c)) extras.arcaNoTango++ })
      d.tango.forEach(t => {
        if(!t.fecha||t.fecha.m!==mes) return
        const a=arcaCuils.get(t.cuil)
        let status="ok",obs=""
        if(!a){status="rev";obs="No figura en ARCA — verificar alta";extras.tangoNoArca++}
        else if(!a.active){status="err";obs="Figura como baja en ARCA"}
        else if(a.hasName&&nameTokens(a.name)!==nameTokens(t.nombreRaw)){status="rev";obs="Nombre difiere entre Tango y ARCA"}
        if(!t.banco&&status==="ok"){status="rev";obs="Falta banco en Tango"}
        newRows.push({ cuil:t.cuil, empresa:e.nombre, dia:t.fecha.txt, diaN:t.fecha.d,
          nombre:displayName(t.nombreRaw), sortKey:clean(t.nombreRaw).replace(/,/g," ").replace(/\s+/g," ").trim(),
          banco:t.banco||"", centro:t.centro||"", importe:importeBase||0, status, obs, include:status!=="err" })
      })
    })
    newRows.sort((a,b)=>a.diaN-b.diaN||a.sortKey.localeCompare(b.sortKey,"es"))
    setRows(newRows); setValidated(true); setAccepted(false); setPlacaUrl(null)
    const hasRev=newRows.some(r=>r.status==="rev"), hasErr=newRows.some(r=>r.status==="err")
    setStepActive(hasRev||hasErr?3:4); setStepDone(2)
    setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100)
  }

  function editRow(i, field, value) {
    setRows(prev=>{ const next=[...prev]; next[i]={...next[i],[field]:field==="include"?value:field==="importe"?(+value||0):value}; return next })
    setAccepted(false)
  }

  function handleAccept() {
    setAccepted(true); setStepActive(5); setStepDone(4)
    setTimeout(()=>placaRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100)
  }

  function handleGenerar() {
    const url=drawPlaca(canvasRef.current,rows,mes); setPlacaUrl(url); setStepDone(5)
  }

  function handleDescargar() {
    const a=document.createElement("a"); a.href=placaUrl; a.download=`Cumpleaños_${MESES[mes]}_2026.jpg`; a.click()
  }

  function handleExcel() { exportExcel(rows,mes,inclCuil); setExcelOk(true) }

  let stateClass="rev", stateTxt=`No hay cumpleaños en ${MESES[mes]} entre las empresas cargadas.`
  if(rows.length>0){
    if(countErr>0){stateClass="err";stateTxt=`Requiere revisión — hay ${countErr} caso(s) con baja o discrepancia crítica.`}
    else if(countRev>0){stateClass="rev";stateTxt=`Requiere revisión — hay ${countRev} caso(s) para chequear antes de aprobar.`}
    else{stateClass="ok";stateTxt="Validación OK — la información está lista para aprobar."}
  }

  return (
    <div className="wrap">
      <div className="top"><span className="badge">Previnca Holding · RR.HH.</span></div>
      <h1 className="page-title">Gratificaciones de cumpleaños</h1>
      <p className="sub">Cargá los archivos de Tango y ARCA por empresa, validá quiénes cumplen años, revisá y corregí lo que haga falta, y generá la placa del mes.</p>
      <Stepper active={stepActive} doneUpTo={stepDone} />

      <div className="panel">
        <h2 className="panel-title"><span className="k">1</span> Cargar archivos por empresa</h2>
        <div className="month-row">
          <span className="month-label">Mes a publicar:</span>
          <select value={mes} onChange={e=>{setMes(+e.target.value);resetDownstream()}}>
            {MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <span className="year-tag">2026</span>
          <span style={{flex:1}}/>
          <div className="importe-box">
            <span className="importe-label">Importe gratificación</span>
            <span className="importe-sym">$</span>
            <input type="number" min="0" step="100" placeholder="0" style={{width:120}} value={importeBase||""} onChange={e=>setImporteBase(+e.target.value||0)}/>
            <button className="btn ghost" style={{padding:"7px 12px",fontSize:13}} onClick={applyImporte}>Aplicar a todos</button>
          </div>
        </div>
        <p className="hint">El importe es manual porque puede variar mes a mes. Se aplica a todos los cumpleañeros y después podés ajustarlo persona por persona en la tabla.</p>
        <p className="hint">Tango aporta la fecha de nacimiento y el banco. ARCA confirma que el colaborador esté activo. Cada archivo se marca en <b style={{color:"var(--green)"}}>verde</b> al cargarse bien.</p>
        <div className="cards">
          {EMPRESAS.map(e=><CompanyCard key={e.id} empresa={e} fileState={fileState} onFile={handleFile}/>)}
        </div>
        <div className="bar">
          <button className="btn primary" disabled={!anyComplete} onClick={runValidation}><IcoCheck/> Validar información</button>
          <span className="hint" style={{margin:0}}>{loadHint}</span>
        </div>
      </div>

      {validated && (
        <div className="panel" ref={resultRef}>
          <h2 className="panel-title"><span className="k">2</span> Estado de validación</h2>
          <div className="sum">
            <div className="stat"><div className="v">{rows.length}</div><div className="l">Cumpleaños del mes</div></div>
            <div className="stat"><div className="v" style={{color:"var(--green)"}}>{countOk}</div><div className="l">Coincidencias correctas</div></div>
            <div className="stat"><div className="v" style={{color:"var(--amber)"}}>{countRev}</div><div className="l">Requieren revisión</div></div>
            <div className="stat"><div className="v" style={{color:"var(--red)"}}>{countErr}</div><div className="l">Discrepancias / baja</div></div>
          </div>
          <span className={`state ${stateClass}`}>{stateTxt}</span>
          <h3 style={{fontSize:16,margin:"22px 0 4px"}}>Detalle editable</h3>
          <p className="hint" style={{marginTop:2}}>Podés corregir nombre, empresa, banco, fecha y observaciones, e incluir o excluir a cada persona de la placa. Tras editar, volvé a validar.</p>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Incluir</th><th>Día</th><th>Apellido y nombre</th><th>Empresa</th><th>Banco</th><th>Importe $</th><th>CUIL</th><th>Estado</th><th>Observaciones</th></tr></thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} className={r.include?"":"exc"}>
                    <td style={{textAlign:"center"}}><input type="checkbox" className="chk" checked={r.include} onChange={e=>editRow(i,"include",e.target.checked)}/></td>
                    <td><input type="text" value={r.dia} style={{width:64}} onChange={e=>editRow(i,"dia",e.target.value)}/></td>
                    <td><input type="text" value={r.nombre} onChange={e=>editRow(i,"nombre",e.target.value)}/></td>
                    <td><input type="text" value={r.empresa} onChange={e=>editRow(i,"empresa",e.target.value)}/></td>
                    <td><input type="text" value={r.banco} onChange={e=>editRow(i,"banco",e.target.value)}/></td>
                    <td><input type="number" min="0" step="100" value={r.importe||0} onChange={e=>editRow(i,"importe",e.target.value)}/></td>
                    <td className="cuil">{maskCuil(r.cuil)}</td>
                    <td><span className={`pill ${r.status}`}>{r.status==="ok"?"OK":r.status==="rev"?"Revisar":"Baja/Error"}</span></td>
                    <td><input type="text" value={r.obs||""} placeholder="—" onChange={e=>editRow(i,"obs",e.target.value)}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inclCount>0&&totIncl>0&&<div className="total-box">Total a depositar ({inclCount} persona{inclCount>1?"s":""}): <span className="total-amount">${fmtMoney(totIncl)}</span></div>}
          <div className="bar">
            <button className="btn ghost" onClick={runValidation}><IcoRefresh/> Volver a validar</button>
            <button className="btn primary" disabled={!canAccept} onClick={handleAccept}><IcoCheck/> Aceptar</button>
            <span className="hint" style={{margin:0}}>{acceptHint}</span>
          </div>
        </div>
      )}

      {accepted && (
        <div className="panel" ref={placaRef}>
          <h2 className="panel-title"><span className="k">3</span> Placa del mes</h2>
          <p className="hint">Información confirmada para {MESES[mes]}. Generá la placa para publicar en la plataforma interna.</p>
          <div className="bar" style={{marginTop:0}}>
            <button className="btn accent" onClick={handleGenerar}><IcoImage/> Generar placa</button>
            {placaUrl&&<button className="btn primary" onClick={handleDescargar}><IcoDown/> Descargar placa</button>}
          </div>
          <div className="placa-area" style={{marginTop:18}}>
            <canvas ref={canvasRef} width={952} height={1288} style={{display:"none"}}/>
            {placaUrl&&<><img className="placa-img" src={placaUrl} alt="Placa de cumpleaños"/><div><div className="ok-msg" style={{marginBottom:10}}><IcoCheck/> La placa se generó correctamente.</div><p className="hint">Incluye solo nombre, apellido y día. No contiene CUIL ni datos sensibles.</p></div></>}
          </div>
          <div className="divider">
            <h3 style={{fontSize:16,marginBottom:2}}>Listado para acreditación (Excel)</h3>
            <p className="hint" style={{marginTop:4}}>Un único archivo con todos los cumpleañeros del mes, ordenados por empresa y banco, más un resumen de cantidades por banco.</p>
            <label style={{display:"inline-flex",alignItems:"center",gap:9,fontSize:13,fontWeight:600,marginBottom:14,cursor:"pointer"}}>
              <input type="checkbox" className="chk" checked={inclCuil} onChange={e=>setInclCuil(e.target.checked)}/>
              Incluir CUIL completo (necesario para la transferencia)
            </label>
            <div className="bar" style={{marginTop:0}}>
              <button className="btn primary" onClick={handleExcel}><IcoDown/> Descargar listado Excel</button>
              {excelOk&&<span className="ok-msg"><IcoCheck/> Listado generado.</span>}
            </div>
            <p className="hint" style={{marginTop:10}}>{inclCuil?"El listado incluirá el CUIL completo. Usalo solo para la transferencia y resguardá el archivo.":"Por defecto el listado no incluye CUIL. Marcá la casilla solo si el archivo se usa para transferir."}</p>
          </div>
        </div>
      )}
      <div className="foot">Herramienta interna · Los datos cargados se procesan en tu navegador y no se almacenan.</div>
    </div>
  )
}
