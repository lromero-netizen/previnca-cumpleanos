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