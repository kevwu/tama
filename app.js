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
		// blank out grid
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
	}, "")

	glide.set({
		"loop": true,
		"loopEnd": "16n",
	})

	glide.start('@8n')

	Launchpad.on("noteon", (row, col) => {
		if(row === 9) {
			Launchpad.setPad(9, 1, "off", 0)
			Launchpad.setPad(9, 2, "off", 0)
			Launchpad.setPad(9, 3, "off", 0)
			Launchpad.setPad(9, 4, "off", 0)
			Launchpad.setPad(9, 5, "off", 0)

			let color

			switch(col) {
				case 1:
					setDirection = 'n'
					color = 60
					break
				case 2:
					setDirection = 's'
					color = 64
					break
				case 3:
					setDirection = 'w'
					color = 62
					break
				case 4:
					setDirection = 'e'
					color = 51
					break
				case 5:
					gliders = []
					Launchpad.clearAll()
			}

			Launchpad.setPad(9, col, "on", color)

		} else {
			gliders.push(new Glider(row, col, setDirection))
		}
	})
})
