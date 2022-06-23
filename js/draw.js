StringArtGenerator.prototype.Clear = function(ctx) {
    ctx.clearRect(0, 0, this.width, this.height)
}

StringArtGenerator.prototype.GetLightness = function(red, green, blue) {
    return Math.floor(0.2126 * red + 0.7152 * green + 0.0722 * blue)
}

StringArtGenerator.prototype.LimitPixel = function(value) {
    if (value < 0)
        return 0

    if (value > 255)
        return 255

    return Math.round(value)
}

StringArtGenerator.prototype.DrawForm = function() {
    let formType = this.formTypeBox.value

    this.ctx.strokeStyle = BORDER_COLOR
    this.ctx.beginPath()

    if (formType == CIRCLE_FORM) {
        this.ctx.arc(this.x0, this.y0, this.radius + PADDING / 2, 0, Math.PI * 2)
    }
    else if (formType == RECT_FORM) {
        this.ctx.rect(0, 0, this.width, this.height)
    }
    else if (formType == ALBUM_FORM) {
        let height = this.width / Math.sqrt(2)
        this.ctx.rect(0, (this.height - height) / 2, this.width, height)
    }
    else if (formType == PORTRAIT_FORM) {
        let width = this.height / Math.sqrt(2)
        this.ctx.rect((this.width - width) / 2, 0, width, this.height)
    }
    else if (formType == IMAGE_FORM) {
        this.ctx.rect(0, 0, this.imgWidth, this.imgHeight)
    }

    this.ctx.fillStyle = this.backgroundColorBox.value
    this.ctx.fill()
}

StringArtGenerator.prototype.DrawGrayScale = function() {
    this.Clear(this.fakeCtx)
    this.fakeCtx.drawImage(this.image, this.imgX, this.imgY, this.imgWidth * this.imgScale, this.imgHeight * this.imgScale)

    let data = this.fakeCtx.getImageData(0, 0, this.width * this.dpr, this.height * this.dpr)
    let pixels = data.data
    let invert = this.invertBox.checked

    for (let i = 0; i < pixels.length; i += 4) {
        let lightness = this.GetLightness(pixels[i], pixels[i + 1], pixels[i + 2])

        if (invert)
            lightness = 255 - lightness

        lightness = this.brightnessTable[lightness]
        lightness = this.contrastTable[lightness]

        pixels[i] = lightness
        pixels[i + 1] = lightness
        pixels[i + 2] = lightness
    }

    this.fakeCtx.putImageData(data, 0, 0)
    this.ctx.drawImage(this.fakeCanvas, 0, 0, this.width, this.height)
}

StringArtGenerator.prototype.DrawLoadedImage = function() {
    this.Clear(this.ctx)

    this.ctx.save()
    this.DrawForm()
    this.ctx.clip()
    this.DrawGrayScale()
    this.ctx.stroke()
    this.ctx.restore()
}

StringArtGenerator.prototype.DrawNails = function() {
    this.DrawForm()
    this.ctx.fillStyle = NAIL_COLOR

    for (let nail of this.nails) {
        this.ctx.beginPath()
        this.ctx.arc(nail.x, nail.y, NAIL_RADIUS, 0, Math.PI * 2)
        this.ctx.fill()
    }
}

StringArtGenerator.prototype.DrawLine = function(nail1, nail2, lineColor) {
    this.ctx.lineWidth = 1
    this.ctx.strokeStyle = lineColor
    this.ctx.beginPath()
    this.ctx.moveTo(nail1.x, nail1.y)
    this.ctx.lineTo(nail2.x, nail2.y)
    this.ctx.stroke()
}
