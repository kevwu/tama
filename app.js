const Tone = require("tone")
const teoria = require("teoria")
const WebMidi = require("webmidi")

const Glider = require("./Glider")

let Launchpad

WebMidi.enable((err) => {
	if (err) {
		console.log("Unable to start webmidi:")
		console.log(err)
	}

	console.log(WebMidi.inputs)
	console.log(WebMidi.outputs)

	Launchpad = new (require("./Launchpad"))(
		WebMidi.getOutputByName("Launchpad MK2 MIDI 1"),
		WebMidi.getInputByName(("Launchpad MK2 MIDI 1"))
	)

	Launchpad.clearAll()

	let synth = new Tone.PolySynth(24, Tone.Synth, {
		oscillator: {
			partials: [0, 2, 3, 4],
		}
	}).toMaster()

	Tone.Transport.bpm.value = 100
	Tone.Transport.start()

	let gliders = []

	let setDirection = 'n'

	let scale = new teoria.scale("A3", "major")

	let midiGrid = []
	for(let i = 0; i < 8; i += 1) {
		midiGrid[i] = [0,0,0,0,0,0,0,0]
	}

	// rendering interval
	setInterval(() => {
		// controls
		Launchpad.setPad(9, 5, "off", 0)

		let color
		let col
		switch(setDirection) {
			case 'n':
				color = 60
				col = 1
				break
			case 's':
				color = 64
				col = 2
				break
			case 'w':
				color = 62
				col = 3
				break
			case 'e':
				color = 51
				col = 4
				break
		}

		Launchpad.setPad(9, col, "on", color)

		for(let i = 1; i <= 4; i += 1) {
			if(i !== col) {
				Launchpad.setPad(9, i, "off", 0)
			}
		}


		if(Tone.Transport.state === "started") {
			Launchpad.setPad(4, 9, "on", 27)
		} else {
			Launchpad.setPad(4, 9, "on", 60)
		}

		// render gliders

		// blank out grid representation
		for(let i = 0; i < 8; i += 1) {
			midiGrid[i] = [0,0,0,0,0,0,0,0]
		}

		gliders.forEach((glider, i) => {
			let color
			switch(glider.dir) {
				case 'n':
					color = 60
					break
				case 's':
					color = 64
					break
				case 'e':
					color = 51
					break
				case 'w':
					color = 62
			}

			midiGrid[glider.row - 1][glider.col - 1] = color
		})

		midiGrid.forEach((rowList, row) => {
			rowList.forEach((cell, col) => {
				Launchpad.setPad(row + 1, col + 1, "on", cell)
			})

		})
	}, 10)

	let glide = new Tone.Event((time, pitch) => {
		gliders.forEach((glider, i) => {
			glider.step()

			let note
			if(glider.dir === 'n' || glider.dir === 's') {
				note = scale.get(glider.col).scientific()
			} else if(glider.dir === 'e' || glider.dir === 'w') {
				note = scale.get(glider.row).scientific()
			}


			glider.onDirChange(() => {
				synth.triggerAttackRelease(note, "16n")
			})
		})

		// check all gliders against one another
		// brute force, might need to change for more efficient method
		let collided = []
		gliders.forEach((a, i) => {
			gliders.forEach((b, j) => {
				if(collided[i] || collided[j]) {
					return
				}

				if(i === j) {
					return
				}

				if(a.row === b.row && a.col === b.col) {
					/*const collisionMap = {
						'n': {
							'w': 'e',
							'e': 'w',
							's': 'n',
						},
						's': {
							'w': 'e',
							'e': 'w',
							'n': 's',
						},
						'e': {
							'n': 's',
							's': 'n',
							'w': 'e',
						},
						'w': {
							'n': 's',
							's': 'n',
							'e': 'w',
						}
					}*/

					// first index is current direction
					// second index is direction of incoming collision
					const collisionMap = {
						'n': {
							'w': 'e',
							'e': 'e',
							's': 'e',
							'n': 'n',
						},
						's': {
							'w': 'w',
							'e': 'w',
							'n': 'w',
							's': 's',
						},
						'e': {
							'n': 's',
							's': 's',
							'w': 's',
							'e': 'e',
						},
						'w': {
							'n': 'n',
							's': 'n',
							'e': 'n',
							'w': 'w',
						}
					}

					let aDir = a.dir
					let bDir = b.dir

					a.dir = collisionMap[aDir][bDir]
					b.dir = collisionMap[bDir][aDir]

					if(!a.dir || !b.dir) {
						return
					}

					collided[i] = true
					collided[j] = true
				}
			})
		})
	}, "")

	glide.set({
		"loop": true,
		"loopEnd": "16n",
	})

	glide.start('@8n')

	Launchpad.on("noteon", (row, col) => {
		if(col === 9) {
			if(row === 4) {
				Tone.Transport.toggle()
			}

			return
		}

		if(row === 9) {
			if(col >= 1 && col <= 4) {
				setDirection = {
					1: 'n',
					2: 's',
					3: 'w',
					4: 'e'
				}[col]
			}

			if(col === 5) {
				gliders = []
				Launchpad.clearGrid()
			}
		} else {
			gliders.push(new Glider(row, col, setDirection))
		}
	})
})
