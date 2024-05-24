import { Container, Sprite, Text } from 'pixi.js'
import { sprites, sounds } from "./loader"
import { textStyles } from "./fonts"
import { EventHub, events, restartMenu } from './events'
import { playSound } from './sound'

const settings = {
    width: 2800,
    height: 1600,
}
settings.rate = settings.width / settings.height

class MenuButton extends Sprite {
    constructor( y, text, parent ) {
        super( sprites.ui.textures.white_button_max )
        this.anchor.set(0.5)
        this.position.y = y
        this.text = new Text(text, textStyles.buttons_menu)
        this.text.anchor.set(0.5)
        this.addChild( this.text )
        this.eventMode = 'static'
        this.on('pointerenter', this.getHover.bind(this, true) )
        this.on('pointerleave', this.getHover.bind(this, false) )
        this.on('pointertap', () => {
            restartMenu()
            parent.removeChild( this )
        })

        setTimeout( () => parent.addChild( this ), 5000 )
    }

    getHover(isOnHover) {
        this.text.style = isOnHover ? textStyles.buttons_menu_hover : textStyles.buttons_menu
        if (isOnHover) playSound(sounds.remove)
    }
}

class ResultMenu extends Container {
    constructor( screenData ) {
        super()
        this.background = new Sprite(sprites.win_background)
        this.background.anchor.set(0.5)
        this.addChild( this.background )

        // data = {isWin: true, isBaseDestroyed: true, playerOreMinded: 100, opponentOreMiOreMinded: 100}
        this.title = new Text('', textStyles.result_title_win)
        this.title.anchor.set(0.5, 1)
        this.title.position.x = 0
        this.title.position.y = -140
        this.addChild( this.title )

        this.description = new Text('', textStyles.result_description)
        this.description.anchor.set(0.5, 1)
        this.description.position.x = 0
        this.description.position.y = 0
        this.addChild( this.description )

        this.playerOre = new Text('', textStyles.result_description)
        this.playerOre.anchor.set(0.5, 1)
        this.playerOre.position.x = 0
        this.playerOre.position.y = 70
        this.addChild( this.playerOre )

        this.opponentOre = new Text('', textStyles.result_description)
        this.opponentOre.anchor.set(0.5, 1)
        this.opponentOre.position.x = 0
        this.opponentOre.position.y = 140
        this.addChild( this.opponentOre )

        this.button = new MenuButton( 230, 'В МЕНЮ', this)
        
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

    update(data) {
        setTimeout( () => this.addChild( this.button ), 5000 )

        this.background.texture = data.isWin ? sprites.win_background : sprites.lose_background

        // data = {isWin: true, isBaseDestroyed: true, playerOreMinded: 100, opponentOreMiOreMinded: 100, disconnect: false}
        this.title.text = data.isWin ? `${data.disconnect ? 'ТЕХНИЧЕСКАЯ ' : ''}ПОБЕДА` : `${data.disconnect ? 'ТЕХНИЧЕСКОЕ ' : ''}ПОРАЖЕНИЕ`
        this.title.style =  data.isWin ? textStyles.result_title_win : textStyles.result_title_lose

        let description = ''
        if (data.disconnect) description = `${data.isWin ? 'ВРАГ ОТКЛЮЧИЛСЯ' : 'ВЫ ОТКЛЮЧИЛИСЬ'} ОТ СЕРВЕРА`
        else if (data.isBaseDestroyed) description = `${data.isWin ? 'ВРАЖЕСКАЯ' : 'ВАША'} БАЗА УНИЧТОЖЕНА`
        else description = `ЭКОНОМИЧЕСК${data.isWin ? 'АЯ ПОБЕДА' : 'ОЕ ПОРАЖЕНИЕ'}`
        this.description.text = description

        this.playerOre.text = `Вы добыли ${data.playerOreMinded} ресурсов`
        this.opponentOre.text = `Оппонент добыл ${data.opponentOreMiOreMinded} ресурсов`
    }

    restart() {
        this.button.getHover(false)
    }
}

export default ResultMenu