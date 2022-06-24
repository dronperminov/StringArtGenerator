function StringArtGenerator(canvas) {
    this.InitCanvas(canvas)
    this.InitSelectButton()
    this.InitControls()
    this.InitSave()
    this.InitEvents()
}

StringArtGenerator.prototype.SelectImage = function(e) {
    let files = this.fileInput.files

    if (files.length != 1)
        return

    let image = new Image()
    image.onload = () => this.LoadImage(image)
    image.src = URL.createObjectURL(files[0])

    this.fileInput.value = ''
}

StringArtGenerator.prototype.LoadImage = function(image) {
    this.image = image
    this.isLineDrawing = false

    this.Reset()

    if (this.formType === undefined || this.formType == IMAGE_FORM) {
        this.formType = this.formTypeBox.value
        this.InitNails()
    }

    this.generateBtn.removeAttribute('disabled')
}

StringArtGenerator.prototype.UpdateForm = function() {
    let needInitArt = this.formType != this.formTypeBox.value
    this.formType = this.formTypeBox.value

    this.InitBbox()
    this.DrawLoadedImage()

    if (needInitArt)
        this.InitNails()
}

StringArtGenerator.prototype.ToSignString = function(value) {
    if (value > 0)
        return `+${value}`

    if (value < 0)
        return `-${-value}`

    return '0'
}

StringArtGenerator.prototype.UpdateContrast = function() {
    let value = +this.contrastBox.value
    let contrast = 1 + value / 100

    this.contrastValue.innerHTML = this.ToSignString(value)
    this.contrastTable = []

    for (let i = 0; i < 256; i++)
        this.contrastTable[i] = this.LimitPixel((i - 128) * contrast + 128)
}

StringArtGenerator.prototype.UpdateBrightness = function() {
    let value = +this.brightnessBox.value
    let brightness = 1 + value / 100

    this.brightnessValue.innerHTML = this.ToSignString(+this.brightnessBox.value)
    this.brightnessTable = []

    for (let i = 0; i < 256; i++)
        this.brightnessTable[i] = this.LimitPixel(i * brightness)
}

StringArtGenerator.prototype.UpdateWeight = function() {
    let value = +this.linesWeightBox.value
    this.linesWeightValue.innerHTML = `${value}%`
}

StringArtGenerator.prototype.GetPixels = function() {
    this.pixelCtx.drawImage(this.canvas, 0, 0, this.width, this.height)
    let data = this.pixelCtx.getImageData(0, 0, this.width, this.height).data
    let pixels = []

    for (let i = 0; i < data.length; i += 4)
        pixels.push(this.GetLightness(data[i], data[i + 1], data[i + 2]))

    return pixels
}

StringArtGenerator.prototype.GetLineLightness = function(line) {
    let lightness = 0

    for (let index of line)
        lightness += this.pixels[index]

    return lightness / line.size
}

StringArtGenerator.prototype.GetNextNail = function(nail) {
    let nextNail = nail
    let nextLine = null
    let minLightness = Infinity

    for (let i = 0; i < this.nails.length; i++) {
        if (i == nail)
            continue

        let line = this.LineRasterization(this.nails[i].x, this.nails[i].y, this.nails[nail].x, this.nails[nail].y)
        let lightness = this.GetLineLightness(line)

        if (lightness < minLightness) {
            minLightness = lightness
            nextNail = i
            nextLine = line
        }
    }

    return {
        nail: nextNail,
        line: nextLine
    }
}

StringArtGenerator.prototype.RemoveLine = function(line, lineWeight) {
    for (let index of line)
        this.pixels[index] = Math.min(255, this.pixels[index] + lineWeight * this.dpr)
}

StringArtGenerator.prototype.TimeToString = function(delta) {
    delta = Math.floor(delta)

    let milliseconds = `${delta % 1000}`.padStart(3, '0')
    let seconds = `${Math.floor(delta / 1000) % 60}`.padStart(2, '0')
    let minutes = `${Math.floor(delta / 60000)}`.padStart(2, '0')

    return `${minutes}:${seconds}.${milliseconds}`
}

StringArtGenerator.prototype.ShowInfo = function(linesCount, totalCount, startTime) {
    let currTime = performance.now()
    let time = this.TimeToString(currTime - startTime)
    let lost = this.TimeToString((currTime - startTime) / (totalCount - linesCount) * linesCount)
    let avg = ((currTime - startTime) / (totalCount - linesCount)).toFixed(2)

    this.infoBox.innerHTML = `<b>Осталось линий:</b> ${linesCount}<br>`
    this.infoBox.innerHTML += `<b>Прошло времени:</b> ${time}<br>`
    this.infoBox.innerHTML += `<b>Осталось времени:</b> ${lost}<br>`
    this.infoBox.innerHTML += `<b>Ср. время линии:</b> ${avg} мс`
}

StringArtGenerator.prototype.GetActions = function() {
    let actions = '<b>Основные действия:</b><br>'

    if ('ontouchstart' in window) {
        actions += '<b>Масштабирование</b> - щипок<br>'
        actions += '<b>Перемещение</b> - касание'
    }
    else {
        actions += '<b>Масштабирование</b> - скроллинг<br>'
        actions += '<b>Перемещение</b> - левая кнопка мыши'
    }

    return actions
}

StringArtGenerator.prototype.GetLineWeight = function() {
    return this.LimitPixel(+this.linesWeightBox.value / 100 * 255)
}

StringArtGenerator.prototype.GetLineColor = function() {
    let color = this.linesColorBox.value
    let weight = this.GetLineWeight()

    return `${color}${weight.toString(16).padStart(2, '0')}`
}

StringArtGenerator.prototype.ResetImage = function() {
    this.imgWidth = this.image.width
    this.imgHeight = this.image.height
    let aspectRatio = this.imgWidth / this.imgHeight

    if (this.imgWidth > this.imgHeight) {
        this.imgWidth = this.width
        this.imgHeight = Math.round(this.width / aspectRatio)
    }
    else {
        this.imgHeight = this.height
        this.imgWidth = Math.round(this.imgHeight * aspectRatio)
    }

    this.imgX = 0
    this.imgY = 0
    this.imgScale = 1

    this.InitBbox()
}

StringArtGenerator.prototype.Reset = function(needResetImage = true) {
    if (needResetImage)
        this.ResetImage()

    this.saveBox.style.display = 'none'
    this.infoBox.innerHTML = this.GetActions()
    this.isGenerating = false
    this.isLineDrawing = false

    for (let control of this.controls)
        control.removeAttribute('disabled')

    this.DrawLoadedImage()
}

StringArtGenerator.prototype.StartGenerate = function() {
    this.isGenerating = !this.isGenerating

    if (!this.isGenerating)
        return

    this.saveBox.style.display = 'none'
    this.infoBox.innerHTML = ''

    if (!this.isLineDrawing) {
        this.sequence = []
        this.DrawLoadedImage()

        this.pixels = this.GetPixels()
        this.isLineDrawing = true
        this.Clear(this.ctx)
        this.DrawNails()
    }

    for (let control of this.controls)
        control.setAttribute('disabled', '')

    this.generateBtn.value = 'Прервать'
}

StringArtGenerator.prototype.EndGenerate = function() {
    this.saveBox.style.display = ''
    this.isGenerating = false
    this.generateBtn.value = 'Запустить'

    this.resetBtn.removeAttribute('disabled')
    this.selectBtn.removeAttribute('disabled')
    this.linesCountBox.removeAttribute('disabled')
}

StringArtGenerator.prototype.GenerateIteration = function(nail, linesCount, totalCount, lineWeight, lineColor, startTime) {
    this.sequence.push(nail)
    this.ShowInfo(linesCount, totalCount, startTime)

    if (linesCount == 0 || !this.isGenerating) {
        this.EndGenerate()
        return
    }

    let next = this.GetNextNail(nail)
    this.RemoveLine(next.line, lineWeight)
    this.DrawLine(this.nails[nail], this.nails[next.nail], lineColor)

    window.requestAnimationFrame(() => this.GenerateIteration(next.nail, linesCount - 1, totalCount, lineWeight, lineColor, startTime))
}

StringArtGenerator.prototype.Generate = function() {
    this.StartGenerate()

    let linesCount = +this.linesCountBox.value
    let lineWeight = this.GetLineWeight()
    let lineColor = this.GetLineColor()
    let startTime = performance.now()

    this.GenerateIteration(0, linesCount, linesCount, lineWeight, lineColor, startTime)
}

StringArtGenerator.prototype.ToStringArt = function() {
    return JSON.stringify({
        'nails': this.nails,
        'color': this.GetLineColor(),
        'background': this.backgroundColorBox.value,
        'sequence': this.sequence
    }, null, '    ')
}

StringArtGenerator.prototype.ToSVG = function() {
    let svg = `<svg viewBox="0 0 ${this.width} ${this.height}" width="512" height="512" version="1.1" xmlns="http://www.w3.org/2000/svg">\n`

    if (this.formType == CIRCLE_FORM) {
        svg += `    <circle cx="${this.x0}" cy="${this.y0}" r="${this.radius + PADDING / 2}" fill="${this.backgroundColorBox.value}" />\n`
    }
    else {
        let x = this.imgBbox.xmin
        let y = this.imgBbox.ymin
        let width = this.imgBbox.xmax - this.imgBbox.xmin
        let height = this.imgBbox.ymax - this.imgBbox.ymin

        svg += `    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${this.backgroundColorBox.value}" />\n`
    }

    for (let nail of this.nails)
        svg += `    <circle cx="${nail.x}" cy="${nail.y}" r="${NAIL_RADIUS}" fill="${NAIL_COLOR}" />\n`

    for (let i = 1; i < this.sequence.length; i++) {
        let p1 = this.nails[this.sequence[i - 1]]
        let p2 = this.nails[this.sequence[i]]

        svg += `    <path d="M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}" line-width="1" stroke="${this.GetLineColor()}" fill="none" />\n`
    }

    svg += '</svg>'

    return svg
}

StringArtGenerator.prototype.Save = function() {
    let type = this.saveTypeBox.value
    let link = document.createElement("a")

    if (type == 'stringart') {
        link.href = URL.createObjectURL(new Blob([this.ToStringArt()], { type: 'application/json' }))
        link.download = 'art.stringart'
    }
    else if (type == 'png') {
        link.href = this.canvas.toDataURL()
        link.download = 'art.png'
    }
    else if (type == 'svg') {
        link.href = URL.createObjectURL(new Blob([this.ToSVG()], { type: 'svg' }))
        link.download = 'art.svg'
    }

    link.click()
}

StringArtGenerator.prototype.SetScale = function(scale, x, y) {
    let dx = (x - this.imgX) / this.imgScale
    let dy = (y - this.imgY) / this.imgScale

    this.imgScale = scale
    this.imgX = x - dx * this.imgScale
    this.imgY = y - dy * this.imgScale
}
