function StringArtGenerator(canvas) {
    this.InitCanvas(canvas)
    this.InitSelectButton()
    this.InitControls()
    this.InitSave()
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
    this.Reset()
}

StringArtGenerator.prototype.GetPixels = function() {
    let data = this.ctx.getImageData(0, 0, this.width, this.height).data
    let pixels = []

    for (let i = 0; i < data.length; i += 4)
        pixels.push(data[i])

    return pixels
}

StringArtGenerator.prototype.GetLineLightness = function(i, j, pixels) {
    let line = i < j ? this.lines[j][i] : this.lines[i][j]
    let lightness = 0

    for (let index of line)
        lightness += pixels[index]

    return lightness / line.size
}

StringArtGenerator.prototype.GetNextNail = function(nail, pixels) {
    let nextNail = nail
    let maxLightness = Infinity

    for (let i = 0; i < this.nails.length; i++) {
        if (i == nail)
            continue

        let lightness = this.GetLineLightness(nail, i, pixels)

        if (lightness < maxLightness) {
            maxLightness = lightness
            nextNail = i
        }
    }

    return nextNail
}

StringArtGenerator.prototype.RemoveLine = function(i, j, pixels, lineWeight) {
    let line = i < j ? this.lines[j][i] : this.lines[i][j]

    for (let index of line)
        pixels[index] = Math.min(255, pixels[index] + lineWeight)
}

StringArtGenerator.prototype.TimeToString = function(delta) {
    delta = Math.floor(delta)

    let milliseconds = `${delta % 1000}`.padStart(3, '0')
    let seconds = `${Math.floor(delta / 1000) % 60}`.padStart(2, '0')
    let minutes = `${Math.floor(delta / 60000)}`.padStart(2, '0')

    return `${minutes}:${seconds}.${milliseconds}`
}

StringArtGenerator.prototype.ShowInfo = function(linesCount, startTime) {
    let currTime = performance.now()
    let time = this.TimeToString(currTime - startTime)
    let lost = this.TimeToString((currTime - startTime) / this.sequence.length * linesCount)
    let avg = this.TimeToString((currTime - startTime) / this.sequence.length)

    this.infoBox.innerHTML = `<b>Осталось линий:</b> ${linesCount}<br>`
    this.infoBox.innerHTML += `<b>Прошло времени:</b> ${time}<br>`
    this.infoBox.innerHTML += `<b>Осталось времени:</b> ${lost}<br>`
    this.infoBox.innerHTML += `<b>Ср. время линии:</b> ${avg}`
}

StringArtGenerator.prototype.Reset = function() {
    this.saveBox.style.display = 'none'
    this.infoBox.innerHTML = ''
    this.sequence = []

    this.resetBtn.setAttribute('disabled', '')
    this.generateBtn.removeAttribute('disabled')

    this.Clear()
    this.DrawLoadedImage()
}

StringArtGenerator.prototype.StartGenerate = function(){
    for (let control of this.controls)
        control.setAttribute('disabled', '')

    this.Reset()
    this.generateBtn.setAttribute('disabled', '')
}

StringArtGenerator.prototype.EndGenerate = function() {
    this.saveBox.style.display = ''

    for (let control of this.controls)
        control.removeAttribute('disabled')
}

StringArtGenerator.prototype.GenerateIteration = function(nail, linesCount, pixels, lineWeight, startTime) {
    this.sequence.push(nail)
    this.ShowInfo(linesCount, startTime)

    if (linesCount == 0) {
        this.EndGenerate()
        return
    }

    let nextNail = this.GetNextNail(nail, pixels)
    this.RemoveLine(nail, nextNail, pixels, lineWeight)
    this.DrawLine(this.nails[nail], this.nails[nextNail], lineWeight)

    window.requestAnimationFrame(() => this.GenerateIteration(nextNail, linesCount - 1, pixels, lineWeight, startTime))
}

StringArtGenerator.prototype.Generate = function() {
    this.StartGenerate()

    let linesCount = +this.linesCountBox.value
    let lineWeight = +this.linesWeightBox.value
    let pixels = this.GetPixels()
    let startTime = performance.now()

    this.InitNails()
    this.InitLines()
    this.Clear()
    this.DrawNails()

    this.GenerateIteration(0, linesCount, pixels, lineWeight, startTime)
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

    link.click()
}
