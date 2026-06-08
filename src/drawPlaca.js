import { MESES, placaNombre } from './utils'

export function drawPlaca(canvas, rows, mes, onReady) {
  const ctx = canvas.getContext("2d")
  const W = canvas.width
  const H = canvas.height

  const img = new Image()
  img.src = '/placa-bg.jpg'

  img.onload = () => {
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)

    const people = rows
      .filter(r => r.include)
      .slice()
      .sort((a, b) => a.diaN - b.diaN || a.sortKey.localeCompare(b.sortKey, "es"))
      .map(r => ({ dia: r.dia, nombre: placaNombre(r.nombre) }))

    const top = 80, bottom = H - 320, areaH = bottom - top
    const n = people.length

    if (n === 0) {
      ctx.fillStyle = "rgba(255,255,255,.8)"
      ctx.font = "500 22px 'Plus Jakarta Sans', sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("(Sin colaboradores seleccionados)", W / 2, top + 40)
    } else {
      const cols = n > 12 ? 2 : 1
      const perCol = Math.ceil(n / cols)
      let fs = Math.min(38, Math.floor(areaH / perCol) - 8)
      fs = Math.max(fs, 16)
      const lh = fs + Math.max(8, fs * 0.4)
      const blockH = lh * perCol
      const y0 = top + (areaH - blockH) / 2 + fs
      const centers = cols === 1 ? [W / 2] : [W * 0.28, W * 0.72]

      ctx.textAlign = "left"
      people.forEach((p, i) => {
        const col = Math.floor(i / perCol)
        const row = i % perCol
        const cx = centers[col]
        ctx.font = "700 " + fs + "px 'Plus Jakarta Sans', sans-serif"
        const sep = "  "
        const wD = ctx.measureText(p.dia).width
        const wS = ctx.measureText(sep).width
        const wN = ctx.measureText(p.nombre).width
        const x = cx - (wD + wS + wN) / 2
        const y = y0 + row * lh
        ctx.fillStyle = "#ffb84d"
        ctx.fillText(p.dia, x, y)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(sep + p.nombre, x + wD, y)
      })
    }

    const url = canvas.toDataURL("image/jpeg", 0.92)
    onReady(url)
  }

  img.onerror = () => {
    // Si no carga la imagen, genera placa con fondo degradado
    ctx.clearRect(0, 0, W, H)
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, "#0e1840")
    bg.addColorStop(0.45, "#15246b")
    bg.addColorStop(1, "#1b2f86")
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = "#ffb84d"
    ctx.fillRect(0, 0, W, 8)
    ctx.textAlign = "center"
    ctx.fillStyle = "rgba(255,255,255,.7)"
    ctx.font = "600 28px 'Plus Jakarta Sans', sans-serif"
    ctx.fillText("CUMPLEAÑOS DE", W / 2, 80)
    ctx.fillStyle = "#ffb84d"
    ctx.font = "800 72px 'Bricolage Grotesque', sans-serif"
    ctx.fillText(MESES[mes].toUpperCase(), W / 2, 162)
    const url = canvas.toDataURL("image/jpeg", 0.92)
    onReady(url)
  }
}