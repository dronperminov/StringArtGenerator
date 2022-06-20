StringArtGenerator.prototype.Clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height)
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
    let width = this.image.width
    let height = this.image.height
    let aspectRatio = width / height

    if (width > height) {
        width = this.width
        height = this.width / aspectRatio
    }
    else {
        height = this.height
        width = height * aspectRatio
    }

    let x = (this.width - width) / 2
    let y = (this.height - height) / 2

    this.Clear()
    this.ctx.save()
    this.ctx.arc(this.x0, this.y0, this.radius + PADDING / 2, 0, Math.PI * 2)
    this.ctx.clip()
    this.ctx.drawImage(this.image, x, y, width, height)
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
