;(function () {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      this.moveTo(x + r, y)
      this.lineTo(x + w - r, y)
      this.quadraticCurveTo(x + w, y, x + w, y + r)
      this.lineTo(x + w, y + h - r)
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      this.lineTo(x + r, y + h)
      this.quadraticCurveTo(x, y + h, x, y + h - r)
      this.lineTo(x, y + r)
      this.quadraticCurveTo(x, y, x + r, y)
      return this
    }
  }
})()
