StringArtGenerator.prototype.Clear = function() {
    this.ctx.fillStyle = BACKGROUND_COLOR
    this.ctx.fillRect(0, 0, this.width, this.height)
}

StringArtGenerator.prototype.GetLightness = function(red, green, blue) {
    return Math.floor(0.2126 * red + 0.7152 * green + 0.0722 * blue)
}

StringArtGenerator.prototype.DrawGrayScale = function() {
    let data = this.ctx.getImageData(0, 0, this.width, this.height)
    let pixels = data.data
    
    for (let i = 0; i < pixels.length; i += 4) {
        let lightness = this.GetLightness(pixels[i], pixels[i + 1], pixels[i + 2])

        pixels[i] = lightness
        pixels[i + 1] = lightness
        pixels[i + 2] = lightness
    }

    this.ctx.putImageData(data, 0, 0)
}

StringArtGenerator.prototype.DrawLoadedImage = function() {
    this.Clear()
    this.ctx.save()
    this.ctx.strokeStyle = BORDER_COLOR
    this.ctx.beginPath()

    let formType = this.formTypeBox.value

    if (formType == CIRCLE_FORM)
        this.ctx.arc(this.x0, this.y0, this.radius + PADDING / 2, 0, Math.PI * 2)
    else if (formType == RECT_FORM)
        this.ctx.rect(0, 0, this.width, this.height)

    this.ctx.stroke()
    this.ctx.clip()
    this.ctx.drawImage(this.image, this.imgX, this.imgY, this.imgWidth * this.imgScale, this.imgHeight * this.imgScale)
    this.DrawGrayScale()
    this.ctx.restore()
}

StringArtGenerator.prototype.DrawNails = function() {
    this.ctx.fillStyle = NAIL_COLOR

    for (let nail of this.nails) {
        this.ctx.beginPath()
        this.ctx.arc(nail.x, nail.y, NAIL_RADIUS, 0, Math.PI * 2)
        this.ctx.fill()
    }
}

StringArtGenerator.prototype.DrawLine = function(nail1, nail2, lineWeight) {
    this.ctx.lineWidth = 1
    this.ctx.strokeStyle = `rgba(0, 0, 0, ${lineWeight / 255})`
    this.ctx.beginPath()
    this.ctx.moveTo(nail1.x, nail1.y)
    this.ctx.lineTo(nail2.x, nail2.y)
    this.ctx.stroke()
}
