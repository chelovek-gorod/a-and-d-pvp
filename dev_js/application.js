import { Application, Container } from 'pixi.js'
import { playMusic, stopMusic } from './sound'
import { screenResize } from './events'

const app = new Application({
    background: 0x000000,
    antialias: true, // сглаживание
    resolution: 2,
    resizeTo: window
})
document.body.append( app.view )

const appScreen = {}

const referenceWidth = 1366
const referenceHeight = 768
const diagonalHD = Math.sqrt( referenceWidth * referenceWidth + referenceHeight * referenceHeight ) // 1567.1
resize()

function resize() {
    appScreen.width = app.screen.width
    appScreen.height = app.screen.height
    appScreen.centerX = app.screen.width * 0.5
    appScreen.centerY = app.screen.height * 0.5
    appScreen.minSize = app.screen.width > app.screen.height ? app.screen.height : app.screen.width
    appScreen.offsetX = (appScreen.width - appScreen.minSize) * 0.5
    appScreen.offsetY = (appScreen.height - appScreen.minSize) * 0.5

    let diagonal = Math.sqrt( appScreen.width * appScreen.width + appScreen.height * appScreen.height ) // 1704
    appScreen.scaleRateHD = diagonal / diagonalHD
    if (appScreen.scaleRateHD > 1) appScreen.scaleRateHD = 1

    appScreen.scaledWidth = appScreen.width / appScreen.scaleRateHD
    appScreen.scaledHeight = appScreen.height / appScreen.scaleRateHD

    screenResize( appScreen )
}

export function getAppScreen() {
    return appScreen
}

const isAutoScreenLock = false
if (isAutoScreenLock === false) {
    navigator.wakeLock.request('screen')
    .then((wakeLock) => wakeLock.release())
    .catch((error) => console.warn('navigator.wakeLock:', error))
}

let orientation = window.matchMedia("(orientation: portrait)");
orientation.addEventListener("change", () => setTimeout(resize, 0))
window.addEventListener('resize', () => setTimeout(resize, 0))

window.addEventListener('focus', playMusic)
window.addEventListener('blur', stopMusic)
if ('hidden' in document) document.addEventListener('visibilitychange', visibilityOnChange)
function visibilityOnChange( isHide ) {
    if (isHide) stopMusic()
    else playMusic()
}

export class Layer extends Container {
    constructor( ...elements ) {
        super()
        app.stage.addChild( this )
        if ( elements.length ) this.addChild( ...elements )
        return this
    }

    clearLayer() {
        this.children.forEach(element => element.destroy())
    }

    removeLayer() {
        this.clearLayer()
        app.stage.removeChild( this )
    }
}

export function clearStage() {
    clearContainer( app.stage  )
}

export function clearContainer( container ) {
    while(container.children[0]) {
        removeSprite( container.children[0] )
    }
}

export function removeSprite( sprite ) {
    if (sprite.parent) sprite.parent.removeChild( sprite )
    sprite.destroy()
}

export function tickerAdd( element ) {
    if ('tick' in element) tickerArr.push( element )
    else console.warn( 'TRY TO ADD ELEMENT IN TICKER WITHOUT .tick() METHOD:', element)
}

export function tickerRemove( element ) {
    tickerArr = tickerArr.filter( e => e !== element )
}

export function tickerClear() {
    tickerArr = []
}

export function tickerRun() {
    isTickerRun = true
}
export function tickerStop() {
    isTickerRun = false
}

export let isTickerRun = true
let tickerArr = [] // entities for update (need e.tick(delta) method)
app.ticker.add( delta => {
    if (isTickerRun === false) return
    // if (delta = 1) -> FPS = 60 (16.66ms per frame)
    tickerArr.forEach( element => element.tick(delta) )
})