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
