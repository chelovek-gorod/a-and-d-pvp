import { TilingSprite } from "pixi.js"
import { sprites } from "./loader"
import { EventHub, events } from './events'

class Background extends TilingSprite {
    constructor( screenData, backgroundImage ) {
        super( sprites[backgroundImage] )
        
        this.screenResize( screenData )
        EventHub.on( events.screenResize, this.screenResize.bind(this) )
    }

    screenResize(screenData) {
        this.width = screenData.width
        this.height = screenData.height
        this.position.x = 0
        this.position.y = 0
    }

    setImage(backgroundImage) {
        this.texture = sprites[backgroundImage]
    }
}

export default Background