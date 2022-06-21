StringArtGenerator.prototype.Clip = function(value, min, max) {
    if (min > max)
        [min, max] = [max, min]

    if (value > max)
        return max
    
    if (value < min)
        return min

    return value
}

StringArtGenerator.prototype.NormalizePoint = function() {
    this.imgX = this.Clip(this.imgX, 0, this.imgWidth - this.width * this.imgScale)
    this.imgY = this.Clip(this.imgY, 0, this.imgHeight - this.height * this.imgScale)
}

StringArtGenerator.prototype.MouseDown = function(e) {
    this.isPressed = true
    this.prevX = e.offsetX
    this.prevY = e.offsetY
}

StringArtGenerator.prototype.MouseMove = function(e) {
    if (!this.isPressed || this.isGenerating || this.isLineDrawing)
        return

    let dx = e.offsetX - this.prevX
    let dy = e.offsetY - this.prevY

    this.imgX += dx
    this.imgY += dy

    this.prevX = e.offsetX
    this.prevY = e.offsetY

    this.NormalizePoint()
    this.DrawLoadedImage()
}

StringArtGenerator.prototype.MouseUp = function(e) {
    this.isPressed = false
}

StringArtGenerator.prototype.MouseWheel = function(e) {
    if (this.isGenerating || this.isLineDrawing)
        return

    let dx = (e.offsetX - this.imgX) / this.imgScale
    let dy = (e.offsetY - this.imgY) / this.imgScale
    let scaleIndex = SCALES.indexOf(this.imgScale) - Math.sign(e.deltaY)

    this.imgScale = SCALES[Math.max(0, Math.min(SCALES.length - 1, scaleIndex))]
    this.imgX = e.offsetX - dx * this.imgScale
    this.imgY = e.offsetY - dy * this.imgScale

    this.NormalizePoint()
    this.DrawLoadedImage()
}
