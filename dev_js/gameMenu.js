import { Container, Sprite, Text } from 'pixi.js'
import { sprites, sounds } from "./loader"
import { textStyles } from "./fonts"
import { EventHub, events, startTraining, showConnectMenu } from './events'
import { playSound, setSoundsOnOff, setMusicOnOff } from './sound'

let isSoundAndMusic = true

const settings = {
    width: 2048,
    height: 2048,
}
settings.rate = settings.width / settings.height

class MenuButton extends Sprite {
    constructor( y, text, parent, index ) {
        super( sprites.ui.textures.white_button_max )
        this.anchor.set(0.5)
        this.position.y = y
        parent.buttonsBackground.addChild( this )
        this.text = new Text(text, textStyles.buttons_menu)
        this.text.anchor.set(0.5)
        this.addChild( this.text )
        this.eventMode = 'static'
        this.on('pointerenter', this.getHover.bind(this, true) )
        this.on('pointerleave', this.getHover.bind(this, false) )
        this.on('pointertap', parent.getClick.bind(parent, index) )
    }

    getHover(isOnHover) {
        this.text.style = isOnHover ? textStyles.buttons_menu_hover : textStyles.buttons_menu
        if (isOnHover) playSound(sounds.remove)
    }
}

class GameMenu extends Container {
    constructor( screenData ) {
        super()
        this.background = new Sprite( sprites.main_menu_background )
        this.background.anchor.set(0.5)
        this.addChild( this.background )

        this.title = new Sprite( sprites.title )
        this.title.anchor.set(0.5, 1)
        this.title.position.x = 0
        this.title.position.y = -30
        this.addChild( this.title )

        this.buttonsBackground = new Sprite( sprites.ui.textures.shop_bg )
        this.buttonsBackground.anchor.set(0.5)
        this.buttonsBackground.position.x = 0
        this.buttonsBackground.position.y = 240
        this.addChild( this.buttonsBackground )

        this.button_1 = new MenuButton( -90, 'ТРЕНИРОВКА', this, 1 )
        this.button_2 = new MenuButton(   0, 'СРАЖЕНИЕ',   this, 2 )
        this.button_3 = new MenuButton(  90, 'БЕЗ ЗВУКА',  this, 3 )
        
        this.screenResize( screenData )
        EventHub.on( events.screenResize, this.screenResize.bind(this) )
    }

    screenResize( screenData ) {
        let widthRate = screenData.width / settings.width
        let heightRate = screenData.height / settings.height

        if (widthRate < heightRate) {
            this.height = screenData.height
            this.width = this.height * settings.rate 
        } else {
            this.width = screenData.width
            this.height = this.width / settings.rate 
        }

        this.position.x = screenData.centerX
        this.position.y = screenData.centerY
    }

    getClick(index) {
        switch(index) {
            case 1 : startTraining(); playSound(sounds.menu); break;
            case 2 : showConnectMenu(); playSound(sounds.menu); break;
            case 3 : this.switchSound(); break;
        }
    }

    restart() {
        this.button_1.getHover(false)
        this.button_2.getHover(false)
        this.button_3.getHover(false)
    }

    switchSound() {
        isSoundAndMusic = !isSoundAndMusic
        setSoundsOnOff(isSoundAndMusic)
        setMusicOnOff(isSoundAndMusic)

        this.button_3.text.text = isSoundAndMusic ? 'БЕЗ ЗВУКА' : 'ВКЛ. ЗВУК'
    }
}

export default GameMenu