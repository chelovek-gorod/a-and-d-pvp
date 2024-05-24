import { Container, Graphics, Text } from 'pixi.js'
import { textStyles } from './fonts'
import { getAppScreen, Layer } from './application'
import { EventHub, events } from './events'
import FullScreenMessage from './fullscreen'

const settings = {}
settings.progressSize = 100,
settings.progressPixelSize = 200,
settings.progressRate = settings.progressPixelSize / settings.progressSize
settings.lineRadius = 3,
settings.lineMinSize = settings.lineRadius * 2,
settings.lineWidth = settings.progressPixelSize + settings.lineMinSize,
settings.halfLineWidth = settings.lineWidth * 0.5
settings.offset = settings.halfLineWidth + settings.lineRadius
settings.width = settings.offset * 2
settings.height = settings.lineMinSize * 2

class LoadingBar extends Container {
    constructor() {
        super()
        this.lineBg = new Graphics()
        this.lineBg.beginFill(0x777777)
        this.lineBg.drawRoundedRect(-settings.offset, 0, settings.width, settings.height, settings.lineMinSize)
        this.lineBg.endFill()
        this.addChild(this.lineBg)

        this.line = new Graphics()
        this.addChild(this.line)

        this.text = new Text('0 %', textStyles.loading)
        this.text.anchor.set(0.5, 1)
        this.text.position.y = settings.lineMinSize
        this.addChild(this.text)

        EventHub.on( events.screenResize, screenResize )
        this.layer = new Layer(this)

        // screenResize() is called after initialization
    }

    update(progress) {
        const range = Math.round(progress)

        let width = settings.lineMinSize + range * settings.progressRate

        this.line.clear()
        this.line.beginFill(0xffffff)
        this.line.drawRoundedRect(-settings.halfLineWidth, settings.lineRadius, width, settings.lineMinSize, settings.lineRadius)
        this.line.endFill()

        this.text.text = range + ' %'
    }
}

let loadingBar = null

function screenResize(screenData) {
    if (!loadingBar) return

    loadingBar.position.x = screenData.centerX
    loadingBar.position.y = screenData.centerY
}

export function getLoadingBar() {
    if (!loadingBar) {
        loadingBar = new LoadingBar()
        screenResize( getAppScreen() )
    }
    return loadingBar
}

export function removeLoadingBar(isFullScreen) {
    if (!loadingBar) return

    EventHub.off( events.screenResize, screenResize )

    //if (isFullScreen) new FullScreenMessage(getAppScreen(), loadingBar.layer)
    loadingBar.layer.removeLayer()
}