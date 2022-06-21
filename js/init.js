StringArtGenerator.prototype.InitCanvas = function(canvas) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')
    this.width = this.canvas.clientWidth
    this.height = this.canvas.clientHeight

    this.dpr = window.devicePixelRatio || 1
    this.canvas.width = this.width * this.dpr
    this.canvas.height = this.height * this.dpr
    this.ctx.scale(this.dpr, this.dpr)
    this.canvas.style.width = this.width + "px"
    this.canvas.style.height = this.height + "px"

    this.fakeCanvas = document.createElement('canvas')
    this.fakeCanvas.width = this.width * this.dpr
    this.fakeCanvas.height = this.height * this.dpr
    this.fakeCtx = this.fakeCanvas.getContext('2d')
    this.fakeCtx.scale(this.dpr, this.dpr)

    this.canvas.addEventListener('mousedown', (e) => this.MouseDown(e))
    this.canvas.addEventListener('mousemove', (e) => this.MouseMove(e))
    this.canvas.addEventListener('mouseup', (e) => this.MouseUp(e))
    this.canvas.addEventListener('mouseleave', (e) => this.MouseUp(e))
    this.canvas.addEventListener('mousewheel', (e) => this.MouseWheel(e))

    this.x0 = this.width / 2
    this.y0 = this.height / 2
    this.radius = Math.min(this.width, this.height) / 2 - PADDING
}

StringArtGenerator.prototype.InitSelectButton = function() {
    this.fileInput = document.createElement('input')
    this.fileInput.type = 'file'
    this.fileInput.accept = 'image/*'
    this.fileInput.addEventListener('change', (e) => this.SelectImage(e))

    this.selectBtn = document.getElementById('select-btn')
    this.selectBtn.addEventListener('click', () => this.fileInput.click())
}

StringArtGenerator.prototype.InitControls = function() {
    this.controlsBox = document.getElementById('controls-box')

    this.formTypeBox = document.getElementById('form-type-box')
    this.formTypeBox.addEventListener('change', () => this.DrawLoadedImage())

    this.contrastBox = document.getElementById('contrast-box')
    this.contrastValue = document.getElementById('contrast-value')
    this.contrastBox.addEventListener('input', () => this.UpdateContrast())
    this.contrastBox.addEventListener('change', () => this.DrawLoadedImage())

    this.brightnessBox = document.getElementById('brightness-box')
    this.brightnessValue = document.getElementById('brightness-value')
    this.brightnessBox.addEventListener('input', () => this.UpdateBrightness())
    this.brightnessBox.addEventListener('change', () => this.DrawLoadedImage())

    this.nailsCountBox = document.getElementById('nails-count-box')
    this.linesCountBox = document.getElementById('lines-count-box')
    this.linesWeightBox = document.getElementById('lines-weight-box')
    this.infoBox = document.getElementById('info-box')

    this.generateBtn = document.getElementById('generate-btn')
    this.generateBtn.addEventListener('click', () => this.Generate())

    this.resetBtn = document.getElementById('reset-btn')
    this.resetBtn.addEventListener('click', () => this.Reset(!this.isLineDrawing))

    this.controls = [
        this.selectBtn,
        this.contrastBox,
        this.brightnessBox,
        this.formTypeBox,
        this.nailsCountBox,
        this.linesCountBox,
        this.linesWeightBox,
        this.resetBtn
    ]

    this.UpdateContrast()
    this.UpdateBrightness()
}

StringArtGenerator.prototype.InitSave = function() {
    this.saveBox = document.getElementById('save-box')

    this.saveTypeBox = document.getElementById('save-type-box')
    this.saveBtn = document.getElementById('save-btn')
    this.saveBtn.addEventListener('click', () => this.Save())
}

StringArtGenerator.prototype.Interpolate = function(a, b, t) {
    return a * t + b * (1 - t)
}

StringArtGenerator.prototype.GetCircleNail = function(t) {
    let x = this.x0 + this.radius * Math.cos(t)
    let y = this.y0 + this.radius * Math.sin(t)

    return {x: x, y: y}
}

StringArtGenerator.prototype.GetRectNail = function(t, width, height) {
    let half = Math.PI / 2
    let x, y

    if (t < half) {
        x = this.x0 + width / 2
        y = this.Interpolate(this.y0 - height / 2, this.y0 + height / 2, t / half)
    }
    else if (t < 2 * half) {
        x = this.Interpolate(this.x0 - width / 2, this.x0 + width / 2, (t - half) / half)
        y = this.y0 + height / 2
    }
    else if (t < 3*half) {
        x = this.x0 - width / 2
        y = this.Interpolate(this.y0 + height / 2, this.y0 - height / 2, (t - 2*half) / half)
    }
    else {
        x = this.Interpolate(this.x0 + width / 2, this.x0 - width / 2, (t - 3*half) / half)
        y = this.y0 - height / 2
    }

    return {x: x, y: y}
}

StringArtGenerator.prototype.InitNails = function() {
    this.nails = []

    let nailsCount = +this.nailsCountBox.value
    let angle = 2 * Math.PI / nailsCount
    let formType = this.formTypeBox.value

    for (let i = 0; i < nailsCount; i++) {
        let nail = {x: 0, y: 0}
        let t = i * angle

        if (formType == CIRCLE_FORM) {
            nail = this.GetCircleNail(t)
        }
        else if (formType == RECT_FORM) {
            nail = this.GetRectNail(t, this.width - 2*PADDING, this.height - 2*PADDING)
        }
        else if (formType == ALBUM_FORM) {
            let size = this.width - 2*PADDING
            nail = this.GetRectNail(t, size, size / Math.sqrt(2))
        }
        else if (formType == PORTRAIT_FORM) {
            let size = this.height - 2*PADDING
            nail = this.GetRectNail(t, size / Math.sqrt(2), size)
        }

        nail.x = Math.round(nail.x)
        nail.y = Math.round(nail.y)

        this.nails.push(nail)
    }
}

StringArtGenerator.prototype.LineRasterization = function(x1, y1, x2, y2) {
    let line = new Set()

    let delta_x = Math.abs(x2 - x1)
    let delta_y = Math.abs(y2 - y1)

    let sign_x = Math.sign(x2 - x1)
    let sign_y = Math.sign(y2 - y1)

    let error = delta_x - delta_y

    while (x1 != x2 || y1 != y2) {
        line.add(y1 * this.width + x1)
        error2 = error * 2

        if (error2 > -delta_y) {
            error -= delta_y
            x1 += sign_x
        }

        if (error2 < delta_x) {
            error += delta_x
            y1 += sign_y
        }
    }

    line.add(y2 * this.width + x2)
    return line
}

StringArtGenerator.prototype.InitLines = function() {
    this.lines = []

    for (let i = 0; i < this.nails.length; i++) {
        this.lines[i] = []

        for (let j = 0; j < i; j++)
            this.lines[i][j] = this.LineRasterization(this.nails[i].x, this.nails[i].y, this.nails[j].x, this.nails[j].y)
    }
}
