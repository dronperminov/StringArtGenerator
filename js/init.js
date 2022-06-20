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

StringArtGenerator.prototype.InitNails = function() {
    this.nails = []

    let nailsCount = +this.nailsCountBox.value
    let angle = 2 * Math.PI / nailsCount

    for (let i = 0; i < nailsCount; i++) {
        let x = this.x0 + this.radius * Math.cos(i * angle)
        let y = this.y0 + this.radius * Math.sin(i * angle)

        this.nails.push({x: x, y: y})
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
