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
