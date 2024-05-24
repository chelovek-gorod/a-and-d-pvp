import { Container, Sprite, Text } from 'pixi.js'
import { Input } from '@pixi/ui';
import { sprites, sounds } from "./loader"
import { textStyles } from "./fonts"
import { EventHub, events, startTraining, showMainMenu } from './events'
import { playSound } from './sound'
import { connectSocket, closeSocket } from './client'

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
        parent.addChild( this )
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

class ConnectMenu extends Container {
    constructor( screenData ) {
        super()
        this.background = new Sprite( sprites.main_menu_background )
        this.background.anchor.set(0.5)
        this.addChild( this.background )

        this.title = new Text('ПОДКЛЮЧЕНИЕ', textStyles.result_title_win)
        this.title.anchor.set(0.5, 1)
        this.title.scale.set(0.5)
        this.title.position.x = 0
        this.title.position.y = -120
        this.addChild( this.title )

        this.message = new Text('Введите IP в формате 128.128.128.128', textStyles.fullScreen)
        this.message.anchor.set(0.5, 1)
        this.message.position.x = 0
        this.message.position.y = -60
        this.addChild( this.message )

        this.input = new Input({
            bg: Sprite.from(sprites.ui_input),
            textStyle: textStyles.result_description,
            placeholder: 'IP-адрес',
            padding: 12,
            maxLength: 15,
            align: 'center',
        })
        this.input.eventMode = 'static'
        this.input.position.x = -254
        this.input.position.y = -60
        this.input.width = 508
        this.addChild( this.input )

        this.button_connect = new MenuButton( 150, 'СТАРТ', this, 1 )
        this.button_cancel = new MenuButton( 330, 'В МЕНЮ',  this, 2 )
        
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
            case 1 : 
                playSound(sounds.menu);
                let ip = this.input.value
                ip = ip.replaceAll(',', '.')
                ip = ip.replaceAll(' ', '')
                let ipArray = ip.split('.')
                console.log(ipArray)
                if (ipArray.length < 4 || ipArray.length > 4) return this.message.text = 'IP должен быть в формате 128.128.128.128'
                for(let i = 0; i < ipArray.length; i++) {
                    let number = +ipArray[i]
                    if (!Number.isInteger(number)) return this.message.text = 'IP должен быть в формате 128.128.128.128'
                    if (number > 255 || number < 0) return this.message.text = 'Числа в IP должен быть от 0 до 255 (включительно)'
                }
                this.message.text = 'Подключаемся'
                console.log(ip)
                connectSocket(ip, this.message)
                break;
            case 2 :
                closeSocket()
                showMainMenu();
                playSound(sounds.menu);
                break;
        }
    }

    restart() {
        this.button_connect.getHover(false)
        this.button_cancel.getHover(false)
        this.message.text = 'Введите IP в формате 128.128.128.128'
    }
}

export default ConnectMenu