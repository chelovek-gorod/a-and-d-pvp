import { Container, Graphics, Text } from 'pixi.js'
import { textStyles } from './fonts'
import { EventHub, events } from './events'

class FullScreenMessage extends Container {
    constructor(screenData, parentContainer) {
        super()
        this.parentContainer = parentContainer
        this.shell = new Graphics()
        this.shell.alpha = 0.75
        this.addChild(this.shell)

        this.message = 'Кликните\nдля продолжения'
        this.text = new Text(this.message, textStyles.fullScreen)
        this.text.anchor.set(0.5)
        this.addChild(this.text)

        EventHub.on( events.screenResize, this.resize.bind(this) )

        this.eventMode = 'static'
        this.on('pointertap', this.getClick.bind(this) )

        this.resize(screenData)
    }

    resize(screenData) {
        if (document.fullscreenEnabled && !document.fullscreenElement) {
            this.shell.clear()
            this.shell.beginFill(0x000000)
            this.shell.drawRect(0, 0, screenData.width, screenData.height)
            this.shell.endFill()
            this.text.position.x = screenData.centerX
            this.text.position.y = screenData.centerY
            this.parentContainer.addChild(this)
        }
    }

    getClick() {
        document.body.requestFullscreen()
        this.parentContainer.removeChild(this)
    }
}

export default FullScreenMessage