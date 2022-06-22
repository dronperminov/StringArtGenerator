function StringArtGenerator(canvas) {
    this.InitCanvas(canvas)
    this.InitSelectButton()
    this.InitControls()
    this.InitSave()
    this.InitEvents()
    this.InitArt()
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
    this.controlsBox.style.display = ''
    this.isLineDrawing = false

    this.Reset()
}

StringArtGenerator.prototype.UpdateForm = function() {
    this.DrawLoadedImage()
    this.InitArt()
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

StringArtGenerator.prototype.GetPixels = function() {
    let data = this.ctx.getImageData(0, 0, this.width * this.dpr, this.height * this.dpr).data
    let pixels = []

    for (let i = 0; i < data.length; i += 4)
        pixels.push(data[i])

    return pixels
}

StringArtGenerator.prototype.GetLineLightness = function(i, j) {
    let line = i < j ? this.lines[j][i] : this.lines[i][j]
    let lightness = 0

    for (let index of line)
        lightness += this.pixels[index]

    return lightness / line.size
}

StringArtGenerator.prototype.GetNextNail = function(nail) {
    let nextNail = nail
    let maxLightness = Infinity

    for (let i = 0; i < this.nails.length; i++) {
        if (i == nail)
            continue

        let lightness = this.GetLineLightness(nail, i)

        if (lightness < maxLightness) {
            maxLightness = lightness
            nextNail = i
        }
    }

    return nextNail
}

StringArtGenerator.prototype.RemoveLine = function(i, j, lineWeight) {
    let line = i < j ? this.lines[j][i] : this.lines[i][j]

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

StringArtGenerator.prototype.ResetImage = function() {
    this.imgWidth = this.image.width
    this.imgHeight = this.image.height
    let aspectRatio = this.imgWidth / this.imgHeight

    if (this.imgWidth > this.imgHeight) {
        this.imgWidth = this.width
        this.imgHeight = this.width / aspectRatio
    }
    else {
        this.imgHeight = this.height
        this.imgWidth = this.imgHeight * aspectRatio
    }

    this.imgX = 0
    this.imgY = 0
    this.imgScale = 1
}

StringArtGenerator.prototype.Reset = function(needResetImage = true) {
    if (needResetImage)
        this.ResetImage()

    this.saveBox.style.display = 'none'
    this.infoBox.innerHTML = '<b>Основные действия:</b><br><b>Масштабирование</b> - скроллинг<br><b>Перемещение</b> - левая кнопка мыши'
    this.isGenerating = false
    this.isLineDrawing = false

    for (let control of this.controls)
        control.removeAttribute('disabled')

    this.generateBtn.removeAttribute('disabled')
    this.DrawLoadedImage()
}

StringArtGenerator.prototype.StartGenerate = function() {
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

    this.isGenerating = true

    for (let control of this.controls)
        control.setAttribute('disabled', '')

    this.generateBtn.setAttribute('disabled', '')
}

StringArtGenerator.prototype.EndGenerate = function() {
    this.saveBox.style.display = ''
    this.isGenerating = false

    this.generateBtn.removeAttribute('disabled')
    this.resetBtn.removeAttribute('disabled')
    this.selectBtn.removeAttribute('disabled')
    this.linesCountBox.removeAttribute('disabled')
}

StringArtGenerator.prototype.GenerateIteration = function(nail, linesCount, totalCount, lineWeight, startTime) {
    this.sequence.push(nail)
    this.ShowInfo(linesCount, totalCount, startTime)

    if (linesCount == 0) {
        this.EndGenerate()
        return
    }

    let nextNail = this.GetNextNail(nail)
    this.RemoveLine(nail, nextNail, lineWeight)
    this.DrawLine(this.nails[nail], this.nails[nextNail], lineWeight)

    window.requestAnimationFrame(() => this.GenerateIteration(nextNail, linesCount - 1, totalCount, lineWeight, startTime))
}

StringArtGenerator.prototype.Generate = function() {
    this.StartGenerate()

    let linesCount = +this.linesCountBox.value
    let lineWeight = +this.linesWeightBox.value
    let startTime = performance.now()

    this.GenerateIteration(0, linesCount, linesCount, lineWeight, startTime)
}

StringArtGenerator.prototype.ToSVG = function() {
    let lineWeight = +this.linesWeightBox.value
    let svg = `<svg viewBox="0 0 ${this.width} ${this.height}" width="512" height="512" version="1.1" xmlns="http://www.w3.org/2000/svg">\n`

    for (let nail of this.nails)
        svg += `    <circle cx="${nail.x}" cy="${nail.y}" r="${NAIL_RADIUS}" fill="${NAIL_COLOR}" />\n`

    for (let i = 1; i < this.sequence.length; i++) {
        let p1 = this.nails[this.sequence[i - 1]]
        let p2 = this.nails[this.sequence[i]]

        svg += `    <path d="M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}" line-width="1" stroke="rgba(0, 0, 0, ${lineWeight / 255})" fill="none" />\n`
    }

    svg += '</svg>'

    return svg
}

StringArtGenerator.prototype.Save = function() {
    let type = this.saveTypeBox.value
    let link = document.createElement("a")

    if (type == 'stringart') {
        content = `${this.nails.length}\n${this.sequence.join(',')}`
        link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
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
