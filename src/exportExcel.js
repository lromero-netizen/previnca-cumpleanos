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
