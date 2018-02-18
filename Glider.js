class Glider {
	constructor(row, col, dir) {
		this.row = row
		this.col = col
		this.dir = dir // One of 'n', 's', 'e', 'w'

		this.dirChangeHandler = () => {}
		this.stepHandler = () => {}

	}

	step() {
		switch(this.dir) {
			case 'n':
				if(this.row === 8) {
					this.dir = 's'
					this.dirChangeHandler(this.row, this.col, this.dir)
				} else {
					this.row += 1
				}
				break
			case 's':
				if(this.row === 1) {
					this.dir = 'n'
					this.dirChangeHandler(this.row, this.col, this.dir)
				} else {
					this.row -= 1
				}
				break
			case 'e':
				if(this.col === 8) {
					this.dir = 'w'
					this.dirChangeHandler(this.row, this.col, this.dir)
				} else {
					this.col += 1
				}
				break
			case 'w':
				if(this.col === 1) {
					this.dir = 'e'
					this.dirChangeHandler(this.row, this.col, this.dir)
				} else {
					this.col -= 1
				}
				break
			default:
				throw new Error("Invalid direction: "+  this.dir)
		}

		this.stepHandler(this.row, this.col, this.dir)
	}

	onDirChange(callback) {
		this.dirChangeHandler = callback
	}

	onStep(callback) {
		this.stepHandler = callback
	}
}

module.exports = Glider