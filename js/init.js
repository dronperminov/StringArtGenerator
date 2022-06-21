StringArtGenerator.prototype.InitCanvas = function(canvas) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')
    this.width = this.canvas.clientWidth
    this.height = this.canvas.clientHeight
    this.canvas.width = this.width
    this.canvas.height = this.height

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
    this.formTypeBox.addEventListener('change', () => this.Reset())

    this.nailsCountBox = document.getElementById('nails-count-box')
    this.linesCountBox = document.getElementById('lines-count-box')
    this.linesWeightBox = document.getElementById('lines-weight-box')
    this.infoBox = document.getElementById('info-box')

    this.generateBtn = document.getElementById('generate-btn')
    this.generateBtn.addEventListener('click', () => this.Generate())

    this.resetBtn = document.getElementById('reset-btn')
    this.resetBtn.addEventListener('click', () => this.Reset())

    this.controls = [
        this.selectBtn,
        this.formTypeBox,
        this.nailsCountBox,
        this.linesCountBox,
        this.linesWeightBox,
        this.resetBtn
    ]
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

StringArtGenerator.prototype.GetRectNail = function(t) {
    let half = Math.PI / 2
    let x, y

    if (t < half) {
        x = this.width - PADDING
        y = this.Interpolate(PADDING, this.height - PADDING, t / half)
    }
    else if (t < 2 * half) {
        x = this.Interpolate(this.width - PADDING, PADDING, (t - half) / half)
        y = this.height - PADDING
    }
    else if (t < 3*half) {
        x = PADDING
        y = this.Interpolate(this.height - PADDING, PADDING, (t - 2*half) / half)
    }
    else {
        x = this.Interpolate(PADDING, this.width - PADDING, (t - 3*half) / half)
        y = PADDING
    }

    return {x: x, y: y}
}

StringArtGenerator.prototype.InitNails = function() {
    this.nails = []

    let nailsCount = +this.nailsCountBox.value
    let angle = 2 * Math.PI / nailsCount
    let form = this.formTypeBox.value

    for (let i = 0; i < nailsCount; i++) {
        let nail = {x: 0, y: 0}
        let t = i * angle

        if (form == CIRCLE_FORM) {
            nail = this.GetCircleNail(t)
        }
        else if (form == RECT_FORM) {
            nail = this.GetRectNail(t)
        }

        this.nails.push(nail)
    }
}

StringArtGenerator.prototype.InitLines = function() {
    let ts = []

    for (let i = 0; i <= LINE_SECTIONS; i++)
        ts.push(i / LINE_SECTIONS)

    this.lines = []

    for (let i = 0; i < this.nails.length; i++) {
        this.lines[i] = []

        for (let j = 0; j < i; j++) {
            let line = new Set()

            for (let t of ts) {
                let x = Math.floor(this.nails[i].x * t + this.nails[j].x * (1 - t))
                let y = Math.floor(this.nails[i].y * t + this.nails[j].y * (1 - t))
                line.add(y * this.width + x)
            }

            this.lines[i][j] = line
        }
    }
}
