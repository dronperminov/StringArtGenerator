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
    this.dragDropBox = document.getElementById('drag-drop-box')
    this.controlsBox = document.getElementById('controls-box')

    this.formTypeBox = document.getElementById('form-type-box')
    this.formTypeBox.addEventListener('change', () => this.UpdateForm())

    this.contrastBox = document.getElementById('contrast-box')
    this.contrastValue = document.getElementById('contrast-value')
    this.contrastBox.addEventListener('input', () => this.UpdateContrast())
    this.contrastBox.addEventListener('change', () => { this.UpdateContrast(); this.DrawLoadedImage() })

    this.brightnessBox = document.getElementById('brightness-box')
    this.brightnessValue = document.getElementById('brightness-value')
    this.brightnessBox.addEventListener('input', () => this.UpdateBrightness())
    this.brightnessBox.addEventListener('change', () => { this.UpdateBrightness(); this.DrawLoadedImage() })

    this.nailsCountBox = document.getElementById('nails-count-box')
    this.nailsCountBox.addEventListener('change', () => this.InitArt())

    this.linesCountBox = document.getElementById('lines-count-box')

    this.linesWeightBox = document.getElementById('lines-weight-box')
    this.linesWeightBox.addEventListener('input', () => this.UpdateWeight())
    this.linesWeightBox.addEventListener('change', () => this.UpdateWeight())
    this.linesWeightValue = document.getElementById('lines-weight-value')

    this.linesColorBox = document.getElementById('lines-color-box')
    this.infoBox = document.getElementById('info-box')

    this.generateBtn = document.getElementById('generate-btn')
    this.generateBtn.addEventListener('click', () => this.Generate())

    this.resetBtn = document.getElementById('reset-btn')
    this.resetBtn.addEventListener('click', () => this.Reset(!this.isLineDrawing))

    this.statusBox = document.getElementById('status-box')

    this.controls = [
        this.selectBtn,
        this.contrastBox,
        this.brightnessBox,
        this.formTypeBox,
        this.nailsCountBox,
        this.linesCountBox,
        this.linesWeightBox,
        this.linesColorBox,
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

StringArtGenerator.prototype.InitEvents = function() {
    this.canvas.addEventListener('mousedown', (e) => this.MouseDown(e))
    this.canvas.addEventListener('mousemove', (e) => this.MouseMove(e))
    this.canvas.addEventListener('mouseup', (e) => this.MouseUp(e))
    this.canvas.addEventListener('mouseleave', (e) => this.MouseUp(e))
    this.canvas.addEventListener('mousewheel', (e) => this.MouseWheel(e))

    this.touches = []
    this.canvas.addEventListener('touchstart', (e) => { this.TouchStart(e) })
    this.canvas.addEventListener('touchmove', (e) => { this.TouchMove(e) })
    this.canvas.addEventListener('touchend', (e) => { this.TouchEnd(e) })

    let generator = document.getElementById('generator-box')
    generator.addEventListener('dragover', (e) => this.DragOver(e))
    generator.addEventListener('dragleave', (e) => this.DragLeave(e))
    generator.addEventListener('drop', (e) => this.Drop(e))
}

StringArtGenerator.prototype.Interpolate = function(a, b, t) {
    return a * t + b * (1 - t)
}

StringArtGenerator.prototype.GetCircleNail = function(t) {
    let x = this.x0 + this.radius * Math.cos(t)
    let y = this.y0 + this.radius * Math.sin(t)

    return {x: x, y: y}
}

StringArtGenerator.prototype.GetRectNail = function(angle, x0, y0, width, height) {
    let t = angle / (2 * Math.PI)
    let aspectRatio = width / height
    let t1 = 0.5 / (1 + aspectRatio)
    let ts = [0, t1, 0.5, 0.5 + t1, 1]
    let x, y

    if (t < ts[1]) {
        x = x0 + width / 2
        y = this.Interpolate(y0 - height / 2, y0 + height / 2, (t - ts[0]) / (ts[1] - ts[0]))
    }
    else if (t < ts[2]) {
        x = this.Interpolate(x0 - width / 2, x0 + width / 2, (t - ts[1]) / (ts[2] - ts[1]))
        y = y0 + height / 2
    }
    else if (t < ts[3]) {
        x = x0 - width / 2
        y = this.Interpolate(y0 + height / 2, y0 - height / 2, (t - ts[2]) / (ts[3] - ts[2]))
    }
    else {
        x = this.Interpolate(x0 + width / 2, x0 - width / 2, (t - ts[3]) / (ts[4] - ts[3]))
        y = y0 - height / 2
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
            nail = this.GetRectNail(t, this.x0, this.y0, this.width - 2*PADDING, this.height - 2*PADDING)
        }
        else if (formType == ALBUM_FORM) {
            let size = this.width - 2*PADDING
            nail = this.GetRectNail(t, this.x0, this.y0, size, size / Math.sqrt(2))
        }
        else if (formType == PORTRAIT_FORM) {
            let size = this.height - 2*PADDING
            nail = this.GetRectNail(t, this.x0, this.y0, size / Math.sqrt(2), size)
        }
        else if (formType == IMAGE_FORM) {
            let width = this.imgWidth - 2 * PADDING
            let height = this.imgHeight - 2 * PADDING
            nail = this.GetRectNail(t, this.imgWidth / 2, this.imgHeight / 2, width, height)
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
        line.add(y1 * this.width * this.dpr + x1)
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

    line.add(y2 * this.width * this.dpr + x2)
    return line
}

StringArtGenerator.prototype.InitLinesAnimation = function(nail) {
    if (nail >= this.nails.length) {
        this.generateBtn.removeAttribute('disabled')
        this.statusBox.innerHTML = ''
        return
    }

    this.statusBox.innerHTML = `Инициализация линий (${nail + 1} / ${this.nails.length})`
    this.generateBtn.setAttribute('disabled', '')

    for (let i = 0; i < nail; i++) {
        let x1 = this.nails[nail].x * this.dpr
        let y1 = this.nails[nail].y * this.dpr

        let x2 = this.nails[i].x * this.dpr
        let y2 = this.nails[i].y * this.dpr

        let line = this.LineRasterization(x1, y1, x2, y2)
        this.lines[nail][i] = line
        this.lines[i][nail] = line
    }

    window.requestAnimationFrame(() => this.InitLinesAnimation(nail + 1))
}

StringArtGenerator.prototype.InitLines = function() {
    this.lines = []

    for (let i = 0; i < this.nails.length; i++)
        this.lines[i] = []

    this.InitLinesAnimation(0)
}

StringArtGenerator.prototype.InitArt = function() {
    this.generateBtn.setAttribute('disabled', '')
    this.InitNails()
    this.InitLines()
}

StringArtGenerator.prototype.InitBbox = function() {
    this.imgBbox = {
        xmin: 0,
        ymin: 0,
        xmax: this.width,
        ymax: this.height
    }

    let formType = this.formTypeBox.value

    if (formType == ALBUM_FORM) {
        let height = Math.round(this.width / Math.sqrt(2))
        this.imgBbox.ymin = Math.round((this.height - height) / 2)
        this.imgBbox.ymax = this.imgBbox.ymin + height
    }
    else if (formType == PORTRAIT_FORM) {
        let width = Math.round(this.height / Math.sqrt(2))
        this.imgBbox.xmin = Math.round((this.width - width) / 2)
        this.imgBbox.xmax = this.imgBbox.xmin + width
    }
    else if (formType == IMAGE_FORM) {
        this.imgBbox.xmax = this.imgWidth
        this.imgBbox.ymax = this.imgHeight
    }

    this.NormalizePoint()
}