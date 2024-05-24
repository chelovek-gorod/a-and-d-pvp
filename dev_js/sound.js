import { sound } from '@pixi/sound'
import { music } from './loader'

let isSoundOn = true
let isMusicOn = true

// use this functions in game menu options
export function setSoundsOnOff( isTurnOn = false ) {
    isSoundOn = isTurnOn
}

export function setMusicOnOff( isTurnOn = false ) {
    isMusicOn = isTurnOn
}
// -----------------------------------------

export function playSound( se ) {
    if (!isSoundOn) return

    se.stop()
    se.play()
}

let bgMusicList = null
let bgMusicIndex = 0
let bgMusic = null
let bgMusicInstance = null

export function setMusicList(musicListName) {
    if (bgMusic) {
        bgMusic.pause()
        bgMusic = null
        bgMusicInstance.off('end', nextBgMusic)
        sound.remove('bgm')
    }
    bgMusicIndex = 0
    bgMusicList = music[musicListName]
    if (bgMusicList.length > 1) bgMusicList.sort( () => Math.random() - 0.5 )
    playMusic()
}

export function stopMusic() {
    if (!bgMusic) return
    bgMusic.pause()
}

export function playMusic() {
    if (!isMusicOn) return

    if (bgMusic) return bgMusic.isPlaying ? null : bgMusic.resume()

    bgMusicPlay()
}

function bgMusicPlay() {
    bgMusic = sound.add('bgm', bgMusicList[bgMusicIndex] )
    bgMusic.play({ volume: 0.5 }).then( instance => {
        bgMusicInstance = instance
        bgMusicInstance.on('end', nextBgMusic) 
    })
}

function nextBgMusic() {
    bgMusicIndex++
    if (bgMusicIndex === bgMusicList.length) bgMusicIndex = 0
    sound.remove('bgm')
    bgMusicPlay()
}