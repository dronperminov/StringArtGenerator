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

    this.pixelCanvas = document.createElement('canvas')
    this.pixelCanvas.width = this.width
    this.pixelCanvas.height = this.height
    this.pixelCtx = this.pixelCanvas.getContext('2d')

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

    this.invertBox = document.getElementById('invert-box')
    this.invertBox.addEventListener('change', () => this.DrawLoadedImage())

    this.contrastBox = document.getElementById('contrast-box')
    this.contrastValue = document.getElementById('contrast-value')
    this.contrastBox.addEventListener('input', () => this.UpdateContrast())
    this.contrastBox.addEventListener('change', () => { this.UpdateContrast(); this.DrawLoadedImage() })

    this.brightnessBox = document.getElementById('brightness-box')
    this.brightnessValue = document.getElementById('brightness-value')
    this.brightnessBox.addEventListener('input', () => this.UpdateBrightness())
    this.brightnessBox.addEventListener('change', () => { this.UpdateBrightness(); this.DrawLoadedImage() })

    this.nailsModeBox = document.getElementById('nails-mode-box')
    this.nailsModeBox.addEventListener('change', () => this.InitNails())

    this.nailsCountBox = document.getElementById('nails-count-box')
    this.nailsCountBox.addEventListener('change', () => this.InitNails())

    this.linesCountBox = document.getElementById('lines-count-box')

    this.linesWeightBox = document.getElementById('lines-weight-box')
    this.linesWeightBox.addEventListener('input', () => this.UpdateWeight())
    this.linesWeightBox.addEventListener('change', () => this.UpdateWeight())
    this.linesWeightValue = document.getElementById('lines-weight-value')

    this.linesColorBox = document.getElementById('lines-color-box')

    this.backgroundColorBox = document.getElementById('background-color-box')
    this.backgroundColorBox.addEventListener('change', () => this.DrawLoadedImage())
    this.backgroundColorBox.addEventListener('input', () => this.DrawLoadedImage())

    this.infoBox = document.getElementById('info-box')

    this.generateBtn = document.getElementById('generate-btn')
    this.generateBtn.addEventListener('click', () => this.Generate())

    this.resetBtn = document.getElementById('reset-btn')
    this.resetBtn.addEventListener('click', () => this.Reset(!this.isLineDrawing))

    this.statusBox = document.getElementById('status-box')

    this.controls = [
        this.selectBtn,
        this.invertBox,
        this.contrastBox,
        this.brightnessBox,
        this.formTypeBox,
        this.nailsModeBox,
        this.nailsCountBox,
        this.linesCountBox,
        this.linesWeightBox,
        this.linesColorBox,
        this.backgroundColorBox,
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
    this.canvas.addEventListener('wheel', (e) => this.MouseWheel(e))

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

StringArtGenerator.prototype.InitBorderNails = function(nailsCount) {
    let angle = 2 * Math.PI / nailsCount
    let nails = []

    for (let i = 0; i < nailsCount; i++) {
        let nail = {x: 0, y: 0}
        let t = i * angle

        if (this.formType == CIRCLE_FORM) {
            nail = this.GetCircleNail(t)
        }
        else if (this.formType == RECT_FORM) {
            nail = this.GetRectNail(t, this.x0, this.y0, this.width - 2*PADDING, this.height - 2*PADDING)
        }
        else if (this.formType == ALBUM_FORM) {
            let size = this.width - 2*PADDING
            nail = this.GetRectNail(t, this.x0, this.y0, size, size / Math.sqrt(2))
        }
        else if (this.formType == PORTRAIT_FORM) {
            let size = this.height - 2*PADDING
            nail = this.GetRectNail(t, this.x0, this.y0, size / Math.sqrt(2), size)
        }
        else if (this.formType == IMAGE_FORM) {
            let width = this.imgWidth - 2 * PADDING
            let height = this.imgHeight - 2 * PADDING
            nail = this.GetRectNail(t, this.imgWidth / 2, this.imgHeight / 2, width, height)
        }

        nail.x = Math.round(nail.x)
        nail.y = Math.round(nail.y)

        nails.push(nail)
    }

    return nails
}

StringArtGenerator.prototype.InitGridNails = function(nailsCount) {
    let nails = []
    let width = this.imgBbox.xmax - this.imgBbox.xmin
    let height = this.imgBbox.ymax - this.imgBbox.ymin
    let aspectRatio = width / height


    let scale = this.formType == CIRCLE_FORM ? 2 / Math.sqrt(Math.PI) : 1
    let wc = Math.round(Math.sqrt(nailsCount * aspectRatio * scale))
    let hc = Math.round(Math.sqrt(nailsCount / aspectRatio * scale) * scale)

    let x0 = (this.imgBbox.xmin + this.imgBbox.xmax) / 2
    let y0 = (this.imgBbox.ymin + this.imgBbox.ymax) / 2

    for (let i = 0; i < hc; i++) {
        for (let j = 0; j < wc; j++) {
            let x = this.Interpolate(this.imgBbox.xmin + PADDING, this.imgBbox.xmax - PADDING, j / (wc - 1))
            let y = this.Interpolate(this.imgBbox.ymin + PADDING, this.imgBbox.ymax - PADDING, i / (hc - 1))

            if (this.formType == CIRCLE_FORM) {
                let dx = x - x0
                let dy = y - y0

                if (dx * dx + dy * dy > this.radius * this.radius)
                    continue
            }

            nails.push({
                x: Math.round(x),
                y: Math.round(y)
            })
        }
    }

    return nails
}

StringArtGenerator.prototype.InitGridRandom = function(nailsCount) {
    let nails = []

    for (let i = 0; i < nailsCount; i++) {
        let x, y

        if (this.formType == CIRCLE_FORM) {
            let t = Math.random() * 2 * Math.PI
            let radius = this.radius * Math.sqrt(Math.random())

            x = (this.imgBbox.xmin + this.imgBbox.xmax) / 2 + radius * Math.cos(t)
            y = (this.imgBbox.ymin + this.imgBbox.ymax) / 2 + radius * Math.sin(t)
        }
        else {
            x = this.imgBbox.xmin + Math.random() * (this.imgBbox.xmax - this.imgBbox.xmin)
            y = this.imgBbox.ymin + Math.random() * (this.imgBbox.ymax - this.imgBbox.ymin)
        }

        nails.push({
            x: Math.round(x),
            y: Math.round(y)
        })
    }

    return nails
}

StringArtGenerator.prototype.InitNails = function() {
    let nailsMode =this.nailsModeBox.value
    let nailsCount = +this.nailsCountBox.value
    this.nails = []

    if (nailsMode == BORDER_MODE) {
        this.nails = this.InitBorderNails(nailsCount)
    }
    else if (nailsMode == GRID_MODE) {
        this.nails = this.InitGridNails(nailsCount)
    }
    else if (nailsMode == RANDOM_MODE) {
        this.nails = this.InitGridRandom(nailsCount)
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

StringArtGenerator.prototype.InitBbox = function() {
    this.imgBbox = {
        xmin: 0,
        ymin: 0,
        xmax: this.width,
        ymax: this.height
    }

    if (this.formType == ALBUM_FORM) {
        let height = Math.round(this.width / Math.sqrt(2))
        this.imgBbox.ymin = Math.round((this.height - height) / 2)
        this.imgBbox.ymax = this.imgBbox.ymin + height
    }
    else if (this.formType == PORTRAIT_FORM) {
        let width = Math.round(this.height / Math.sqrt(2))
        this.imgBbox.xmin = Math.round((this.width - width) / 2)
        this.imgBbox.xmax = this.imgBbox.xmin + width
    }
    else if (this.formType == IMAGE_FORM) {
        this.imgBbox.xmax = this.imgWidth
        this.imgBbox.ymax = this.imgHeight
    }

    this.NormalizePoint()
}