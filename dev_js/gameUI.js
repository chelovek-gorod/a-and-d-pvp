import { TilingSprite, Sprite, Container, Text, Graphics } from "pixi.js"
import { sprites, sounds } from "./loader"
import { textStyles } from "./fonts"
import { EventHub, events, setHelpText,
    energyOnChange, componentsOnChange, scienceOnChange,
    oreMiningChanged, componentsMiningChanged, scienceMiningChanged,
    bombCarrierOnChange, spiderOnChange, planeOnChange, airshipOnChange,
    playerTowerUpgrade, showResults, sendMessage } from './events'
import { state } from './state'
import { playSound } from './sound'
import { tickerAdd, tickerRemove, tickerClear } from './application'
import { buildInfo, gameMap } from './gameMap'
import { miniMap } from './miniMap'
import { isResult, isTraining } from './game'

const settings = {
    sidebarBottomHeight: 38,
    sidebarBottomTextY: 24,
    sidebarRightWidth: 320,
    sidebarTopHeight: 112,

    attackSlotX: 12,
    attackSlotY: 8,
    attackSlotOffset: 8 + 82,
    attackSlotSize: 82,
    attackSlotHalfSize: 41,
}

export let gameUI = null

function getAddPerSecond(type, biasUsed = 0, isForAdd = false) {
    if (isForAdd) return (60 / state.addFramesSteps[state.player[type].add + biasUsed]).toFixed(2)
    return state.player[type].used ? (60 / state.addFramesSteps[state.player[type].add + biasUsed]).toFixed(2) : '0'
}

class AttackSlot extends Sprite {
    constructor(image, index, name, parent) {
        super(sprites.ui.textures.attack_unit_bg)
        this.position.x = settings.attackSlotX + index * settings.attackSlotOffset
        this.position.y = settings.attackSlotY

        this.name = name

        this.image = new Sprite(image)
        this.image.anchor.set(0.5)
        switch(index) {
            case 0 : this.image.scale.set(0.5); break;
            case 1 : this.image.scale.set(1); break;
            case 2 : this.image.scale.set(0.5); break;
            case 3 : this.image.scale.set(0.25); break;
        }
        this.image.position.x = settings.attackSlotHalfSize
        this.image.position.y = settings.attackSlotHalfSize + 8
        this.addChild(this.image)

        this.counterText = new Text(`x${state.player.attack[this.name].count}`, textStyles.attackSlotCounter)
        this.counterText.anchor.set(1, 0)
        this.counterText.position.x = settings.attackSlotSize - 8
        this.addChild(this.counterText)

        parent.addChild(this)

        let helpText = ''
        switch(index) {
            case 0 : helpText = 'Число бомбовозов для атаки оппонента'; break;
            case 1 : helpText = 'Число пауков для атаки оппонента'; break;
            case 2 : helpText = 'Число штурмовиков для атаки оппонента'; break;
            case 3 : helpText = 'Число дирижаблей для атаки оппонента'; break;
        }
        this.eventMode = 'static'
        this.on('pointerenter', () => setHelpText(helpText) )
        this.on('pointerleave', () => setHelpText('') )
    }
}

class SourceBar extends Container {
    constructor(parent) {
        super()
        this.position.y = settings.attackSlotY

        this.energy_bg = new Sprite(sprites.ui.textures.sources_energy_bg)
        this.energy_icon = new Sprite(sprites.ui.textures.icon_energy)
        this.energy_icon.anchor.set(0.5)
        this.energy_icon.scale.set(0.5)
        this.energy_icon.position.x = 41
        this.energy_icon.position.y = 32
        this.energy_text = new Text(`${state.player.energy.used} / ${state.player.energy.max}`, textStyles.UIStateEnergy)
        this.energy_text.anchor.set(0.5)
        this.energy_text.position.x = 41
        this.energy_text.position.y = 66
        this.energy_bg.addChild(this.energy_icon, this.energy_text)
        this.energy_bg.eventMode = 'static'
        this.energy_bg.on('pointerenter', () => setHelpText('Электроэнергия (используется/доступно)') )
        this.energy_bg.on('pointerleave', () => setHelpText('') )

        this.ore_bg = new Sprite( sprites.ui.textures.sources_bg )
        this.ore_bg.position.x = 82 + 8
        this.ore_icon = new Sprite(sprites.ui.textures.icon_ore)
        this.ore_icon.anchor.set(0.5)
        this.ore_icon.scale.set(0.5)
        this.ore_icon.position.x = 41
        this.ore_icon.position.y = 28
        this.ore_energy_icon = new Sprite(sprites.ui.textures.icon_energy_min)
        this.ore_energy_icon.scale.set(0.5)
        this.ore_energy_icon.anchor.set(1, 0.5)
        this.ore_energy_icon.position.x = 40
        this.ore_energy_icon.position.y = 66
        this.ore_energy_text = new Text(`x${state.player.ore.used}`, textStyles.UIStateEnergy)
        this.ore_energy_text.anchor.set(0, 0.5)
        this.ore_energy_text.position.x = 42
        this.ore_energy_text.position.y = 66
        this.ore_counter_text = new Text(`${state.player.ore.count}`, textStyles.UIStateCounter)
        this.ore_counter_text.anchor.set(1, 0.5)
        this.ore_counter_text.position.x = 200
        this.ore_counter_text.position.y = 32
        this.ore_info_text = new Text(`+${getAddPerSecond('ore')}/сек.`, textStyles.UIStateInfo)
        this.ore_info_text.anchor.set(1, 0.5)
        this.ore_info_text.position.x = 200
        this.ore_info_text.position.y = 66
        this.ore_bg.addChild(this.ore_icon, this.ore_energy_icon, this.ore_energy_text, this.ore_counter_text, this.ore_info_text)
        this.ore_bg.eventMode = 'static'
        this.ore_bg.on('pointerenter', () => setHelpText('Добыча руды') )
        this.ore_bg.on('pointerleave', () => setHelpText('') )

        this.components_bg = new Sprite( sprites.ui.textures.sources_bg )
        this.components_bg.position.x = this.ore_bg.position.x + 220 + 8
        this.components_icon = new Sprite(sprites.ui.textures.icon_components)
        this.components_icon.anchor.set(0.5)
        this.components_icon.scale.set(0.5)
        this.components_icon.position.x = 41
        this.components_icon.position.y = 32
        this.components_energy_icon = new Sprite(sprites.ui.textures.icon_energy_min)
        this.components_energy_icon.scale.set(0.5)
        this.components_energy_icon.anchor.set(1, 0.5)
        this.components_energy_icon.position.x = 32
        this.components_energy_icon.position.y = 66
        this.components_ore_icon = new Sprite(sprites.ui.textures.icon_ore_min)
        this.components_ore_icon.scale.set(0.5)
        this.components_ore_icon.anchor.set(1, 0.5)
        this.components_ore_icon.position.x = 58
        this.components_ore_icon.position.y = 66
        this.components_sources_text = new Text(`x${state.player.components.used}`, textStyles.UIStateEnergy)
        this.components_sources_text.anchor.set(0, 0.5)
        this.components_sources_text.position.x = 62
        this.components_sources_text.position.y = 66
        this.components_counter_text = new Text(`${state.player.components.count}`, textStyles.UIStateCounter)
        this.components_counter_text.anchor.set(1, 0.5)
        this.components_counter_text.position.x = 200
        this.components_counter_text.position.y = 32
        this.components_info_text = new Text(`+${getAddPerSecond('components')}/сек.`, textStyles.UIStateInfo)
        this.components_info_text.anchor.set(1, 0.5)
        this.components_info_text.position.x = 200
        this.components_info_text.position.y = 66
        this.components_bg.addChild(this.components_icon, this.components_energy_icon, this.components_ore_icon, this.components_sources_text, this.components_counter_text, this.components_info_text)
        this.components_bg.eventMode = 'static'
        this.components_bg.on('pointerenter', () => setHelpText('Производство компонентов') )
        this.components_bg.on('pointerleave', () => setHelpText('') )

        this.science_bg = new Sprite( sprites.ui.textures.sources_bg )
        this.science_bg.position.x = this.components_bg.position.x + 220 + 8
        this.science_icon = new Sprite(sprites.ui.textures.icon_science)
        this.science_icon.anchor.set(0.5)
        this.science_icon.scale.set(0.5)
        this.science_icon.position.x = 41
        this.science_icon.position.y = 32
        this.science_energy_icon = new Sprite(sprites.ui.textures.icon_energy_min)
        this.science_energy_icon.scale.set(0.5)
        this.science_energy_icon.anchor.set(1, 0.5)
        this.science_energy_icon.position.x = 32
        this.science_energy_icon.position.y = 66
        this.science_ore_icon = new Sprite(sprites.ui.textures.icon_ore_min)
        this.science_ore_icon.scale.set(0.5)
        this.science_ore_icon.anchor.set(1, 0.5)
        this.science_ore_icon.position.x = 58
        this.science_ore_icon.position.y = 66
        this.science_sources_text = new Text(`x${state.player.science.used}`, textStyles.UIStateEnergy)
        this.science_sources_text.anchor.set(0, 0.5)
        this.science_sources_text.position.x = 62
        this.science_sources_text.position.y = 66
        this.science_counter_text = new Text(`${state.player.science.count}`, textStyles.UIStateCounter)
        this.science_counter_text.anchor.set(1, 0.5)
        this.science_counter_text.position.x = 200
        this.science_counter_text.position.y = 32
        this.science_info_text = new Text(`+${getAddPerSecond('science')}/сек.`, textStyles.UIStateInfo)
        this.science_info_text.anchor.set(1, 0.5)
        this.science_info_text.position.x = 200
        this.science_info_text.position.y = 66
        this.science_bg.addChild(this.science_icon, this.science_energy_icon, this.science_ore_icon, this.science_sources_text, this.science_counter_text, this.science_info_text)
        this.science_bg.eventMode = 'static'
        this.science_bg.on('pointerenter', () => setHelpText('Исследования') )
        this.science_bg.on('pointerleave', () => setHelpText('') )

        this.addChild(this.energy_bg, this.ore_bg, this.components_bg, this.science_bg)
        parent.addChild(this)

        EventHub.on( events.energyOnChange, this.energyOnChange.bind(this) )
        EventHub.on( events.oreMiningChanged, this.oreMiningChanged.bind(this) )
        EventHub.on( events.componentsMiningChanged, this.componentsMiningChanged.bind(this) )
        EventHub.on( events.scienceMiningChanged, this.scienceMiningChanged.bind(this) )
        EventHub.on( events.componentsOnChange, this.componentsOnChange.bind(this) )
        EventHub.on( events.scienceOnChange, this.scienceOnChange.bind(this) )
    }

    energyOnChange() {
        this.energy_text.text = `${state.player.energy.used} / ${state.player.energy.max}`
    }

    oreMiningChanged() {
        this.ore_energy_text.text = `x${state.player.ore.used}`
        this.ore_info_text.text = `+${getAddPerSecond('ore')}/сек.`
    }
    
    componentsMiningChanged() {
        this.components_sources_text.text = `x${state.player.components.used}`
        this.components_info_text.text = `+${getAddPerSecond('components')}/сек.`
    }
    
    scienceMiningChanged() {
        this.science_sources_text.text = `x${state.player.science.used}`
        this.science_info_text.text = `+${getAddPerSecond('science')}/сек.`
    }

    componentsOnChange() {
        this.components_counter_text.text = `${state.player.components.count}`
    }

    scienceOnChange() {
        this.science_counter_text.text = `${state.player.science.count}`
    }
}

class TopSidebar extends TilingSprite {
    constructor(parent) {
        super(sprites.ui_bg_red)
        this.height = settings.sidebarTopHeight

        this.attack_slot_bombCarrier = new AttackSlot( sprites.player_blue.textures.bomb_carrier_0, 0, 'bombCarrier', this )
        this.attack_slot_spider = new AttackSlot( sprites.player_blue.textures.spider_0, 1, 'spider', this )
        this.attack_slot_plane = new AttackSlot( sprites.player_blue.textures.plane, 2, 'plane', this )
        this.attack_slot_airship = new AttackSlot( sprites.player_blue.textures.airship, 3, 'airship', this )

        this.sourceBar = new SourceBar(this)

        parent.addChild(this)

        EventHub.on( events.bombCarrierOnChange, this.bombCarrierOnChange.bind(this) )
        EventHub.on( events.spiderOnChange, this.spiderOnChange.bind(this) )
        EventHub.on( events.planeOnChange, this.planeOnChange.bind(this) )
        EventHub.on( events.airshipOnChange, this.airshipOnChange.bind(this) )
    }

    bombCarrierOnChange() {
        this.attack_slot_bombCarrier.counterText.text = `x${state.player.attack.bombCarrier.count}`
    }
    spiderOnChange() {
        this.attack_slot_spider.counterText.text = `x${state.player.attack.spider.count}`
    }
    planeOnChange() {
        this.attack_slot_plane.counterText.text = `x${state.player.attack.plane.count}`
    }
    airshipOnChange() {
        this.attack_slot_airship.counterText.text = `x${state.player.attack.airship.count}`
    }
}

class ControllerItem extends Container {
    constructor(type, iconImage, iconScale, iconX, iconY, iconRotation = 0) {
        super()
  
        let icon = new Sprite(iconImage)
        icon.anchor.set(0.5) 
        if (iconRotation) icon.rotation = iconRotation
        icon.scale.set(iconScale)
        icon.position.x = iconX
        icon.position.y = iconY
        this.addChild(icon)

        switch (type) {
            case 'gatling':
            case 'rocket':
            case 'tesla':
                const radius_icon = new Sprite(sprites.ui.textures.icon_radius)
                radius_icon.anchor.set(1, 0.5)
                radius_icon.scale.set(0.35)
                radius_icon.position.x = 90
                radius_icon.position.y = 18
                radius_icon.eventMode = 'static'
                radius_icon.on('pointerenter', () => setHelpText('Радиус атаки') )
                radius_icon.on('pointerleave', () => setHelpText('') )
                this.addChild(radius_icon)
                
                this.radius = new Text(`x${state.player.defense[type].radius}`, textStyles.UIButtonPrice)
                this.radius.anchor.set(0, 0.5)
                this.radius.position.x = 90
                this.radius.position.y = 18
                this.addChild(this.radius)

                const air_icon = new Sprite(sprites.ui.textures.icon_air_attack)
                air_icon.anchor.set(1, 0.5)
                air_icon.scale.set(0.35)
                air_icon.position.x = 90
                air_icon.position.y = 36
                air_icon.eventMode = 'static'
                air_icon.on('pointerenter', () => setHelpText('Урон в секунду по воздушной технике') )
                air_icon.on('pointerleave', () => setHelpText('') )
                this.addChild(air_icon)
                
                this.air = new Text(`x${Math.round(state.player.defense[type].speed * state.player.defense[type].air)}`, textStyles.UIButtonPrice)
                this.air.anchor.set(0, 0.5)
                this.air.position.x = 90
                this.air.position.y = 36
                this.addChild(this.air)

                const ground_icon = new Sprite(sprites.ui.textures.icon_ground_attack)
                ground_icon.anchor.set(1, 0.5)
                ground_icon.scale.set(0.35)
                ground_icon.position.x = 90
                ground_icon.position.y = 54
                ground_icon.eventMode = 'static'
                ground_icon.on('pointerenter', () => setHelpText('Урон в секунду по сухопутной технике') )
                ground_icon.on('pointerleave', () => setHelpText('') )
                this.addChild(ground_icon)

                this.ground = new Text(`x${Math.round(state.player.defense[type].speed * state.player.defense[type].ground)}`, textStyles.UIButtonPrice)
                this.ground.anchor.set(0, 0.5)
                this.ground.position.x = 90
                this.ground.position.y = 54
                this.addChild(this.ground)
            break;
            case 'bombCarrier':
            case 'spider':
            case 'plane':
            case 'airship':
                const speed_icon = new Sprite(type === 'plane' || type === 'airship' ? sprites.ui.textures.icon_air_speed : sprites.ui.textures.icon_ground_speed)
                speed_icon.anchor.set(1, 0.5)
                speed_icon.scale.set(0.35)
                speed_icon.position.x = 90
                speed_icon.position.y = 18
                speed_icon.eventMode = 'static'
                speed_icon.on('pointerenter', () => setHelpText('Скорость перемещения') )
                speed_icon.on('pointerleave', () => setHelpText('') )
                this.addChild(speed_icon)
                
                this.speed = new Text(`x${state.player.attack[type].speed}`, textStyles.UIButtonPrice)
                this.speed.anchor.set(0, 0.5)
                this.speed.position.x = 90
                this.speed.position.y = 18
                this.addChild(this.speed)

                const power_icon = new Sprite(sprites.ui.textures.icon_power)
                power_icon.anchor.set(1, 0.5)
                power_icon.scale.set(0.35)
                power_icon.position.x = 90
                power_icon.position.y = 36
                power_icon.eventMode = 'static'
                power_icon.on('pointerenter', () => setHelpText('Урон') )
                power_icon.on('pointerleave', () => setHelpText('') )
                this.addChild(power_icon)
                
                this.power = new Text(`x${state.player.attack[type].power}`, textStyles.UIButtonPrice)
                this.power.anchor.set(0, 0.5)
                this.power.position.x = 90
                this.power.position.y = 36
                this.addChild(this.power)

                const armor_icon = new Sprite(sprites.ui.textures.icon_armor)
                armor_icon.anchor.set(1, 0.5)
                armor_icon.scale.set(0.35)
                armor_icon.position.x = 90
                armor_icon.position.y = 54
                armor_icon.eventMode = 'static'
                armor_icon.on('pointerenter', () => setHelpText('Броня') )
                armor_icon.on('pointerleave', () => setHelpText('') )
                this.addChild(armor_icon)
                
                this.armor = new Text(`x${state.player.attack[type].armor}`, textStyles.UIButtonPrice)
                this.armor.anchor.set(0, 0.5)
                this.armor.position.x = 90
                this.armor.position.y = 54
                this.addChild(this.armor)
            break;
        }

        if (type === 'energy' || type === 'repair') {
            this.btn = new Sprite(sprites.ui.textures.white_button_mid)
            this.btn.anchor.set(0.5)
            this.btn.position.x = 60
            this.btn.position.y = 92
            this.btn.eventMode = 'static'
            this.btn.on('pointertap', type === 'energy' ? this.addSource.bind(this, type) : this.repair.bind(this) )
            let helpText = type === 'energy' ? 'Добавить источник электроэнергии' : 'Отремонтировать базу (+10%)'
            this.btn.on('pointerenter', () => setHelpText(helpText) )
            this.btn.on('pointerleave', () => setHelpText('') )
            this.addChild(this.btn)

            const btn_sign = new Text( type === 'energy' ? '+' : '+10% HP', textStyles.UIButtonSign)
            if (type === 'repair') btn_sign.scale.set(0.5)
            btn_sign.anchor.set(0.5)
            btn_sign.position.y = -8
            this.btn.addChild(btn_sign)

            const price_components_icon = new Sprite(sprites.ui.textures.icon_components_min)
            price_components_icon.anchor.set(0.5)
            price_components_icon.scale.set(0.35)
            price_components_icon.position.x = -40
            price_components_icon.position.y = 10
            this.btn.addChild(price_components_icon)

            let data_components = type === 'energy' ? state.player.energy.upgrade.components : state.player.defense.base.repair.components
            this.price_components = new Text(`x${data_components}`, textStyles.UIButtonPrice)
            this.price_components.anchor.set(0, 0.5)
            this.price_components.position.x = -30
            this.price_components.position.y = 10
            this.btn.addChild(this.price_components)

            const price_science_icon = new Sprite(sprites.ui.textures.icon_science_min)
            price_science_icon.anchor.set(0.5)
            price_science_icon.scale.set(0.35)
            price_science_icon.position.x = 10
            price_science_icon.position.y = 10
            this.btn.addChild(price_science_icon)

            let data_science = type === 'energy' ? state.player.energy.upgrade.science : state.player.defense.base.repair.science
            this.price_science = new Text(`x${data_science}`, textStyles.UIButtonPrice)
            this.price_science.anchor.set(0, 0.5)
            this.price_science.position.x = 20
            this.price_science.position.y = 10
            this.btn.addChild(this.price_science)

            if (type === 'energy') {
                EventHub.on( events.componentsOnChange, this.checkEnergyBtnAlpha.bind(this) )
                EventHub.on( events.scienceOnChange, this.checkEnergyBtnAlpha.bind(this) )
                this.checkEnergyBtnAlpha()
            } else /* type === 'repair' */ {
                EventHub.on( events.componentsOnChange, this.checkRepairBtnAlpha.bind(this) )
                EventHub.on( events.scienceOnChange, this.checkRepairBtnAlpha.bind(this) )
                this.checkRepairBtnAlpha()
            }
        } else {   
            this.btn_left = new Sprite(sprites.ui.textures.white_button_min)
            this.btn_left.anchor.set(0.5)
            this.btn_left.position.x = 32
            this.btn_left.position.y = 92
            this.btn_left.eventMode = 'static'
            switch (type) {
                case 'ore':
                case 'components':
                case 'science':
                    this.btn_left.on('pointertap', this.addSource.bind(this, type) );
                break;

                case 'gatling':
                case 'rocket':
                case 'tesla':
                    this.btn_left.on('pointertap', this.addTower.bind(this, type) );
                    EventHub.on( events.componentsOnChange, this.checkAddDefenseBtnAlpha.bind(this, type) )
                break;

                case 'bombCarrier':
                case 'spider':
                case 'plane':
                case 'airship':
                    this.btn_left.on('pointertap', this.addAttack.bind(this, type) );
                    EventHub.on( events.componentsOnChange, this.checkAddAttackBtnAlpha.bind(this, type) )
                break;
            }
            let btn_left_help_text = ''
            switch (type) {
                case 'ore' : btn_left_help_text = 'Увеличить добычу руды'; break;
                case 'components' : btn_left_help_text = 'Увеличить производство компонентов'; break;
                case 'science' : btn_left_help_text = 'Увеличить количество исследований'; break;

                case 'gatling' : btn_left_help_text = 'Установить пулеметную башню'; break;
                case 'rocket' : btn_left_help_text = 'Установить ракетную башню'; break;
                case 'tesla' : btn_left_help_text = 'Установить электрическую башню'; break;

                case 'bombCarrier' : btn_left_help_text = 'Подготовить бомбовоз к нападению'; break;
                case 'spider' : btn_left_help_text = 'Подготовить паука к нападению'; break;
                case 'plane' : btn_left_help_text = 'Подготовить штурмовик к нападению'; break;
                case 'airship' : btn_left_help_text = 'Подготовить дирижабль к нападению'; break;
            }
            this.btn_left.on('pointerenter', () => setHelpText(btn_left_help_text) )
            this.btn_left.on('pointerleave', () => setHelpText('') )
            this.addChild(this.btn_left)
    
            this.btn_left_sign = new Text('+', textStyles.UIButtonSign)
            this.btn_left_sign.anchor.set(0.5)
            this.btn_left_sign.position.y = -8
            this.btn_left.addChild(this.btn_left_sign)

            if (type === 'ore' || type === 'components' || type === 'science') {
                if ((state.player[type].add + 1) === state.addFramesSteps.length) {
                    this.btn_left_info = new Text(`${getAddPerSecond(type)}/с.`, textStyles.UIButtonPrice)
                    this.btn_left.alpha = 0.5
                } else {
                    this.btn_left_info = new Text(`${getAddPerSecond(type, 1, true)}/с.`, textStyles.UIButtonPrice)
                    this.btn_left.alpha = state.player.energy.max === state.player.energy.used ? 0.5 : 1
                }
                this.btn_left_info.anchor.set(0.5)
                this.btn_left_info.position.y = 10
                this.btn_left.addChild(this.btn_left_info)
            } else {
                const btn_left_price_components_icon = new Sprite(sprites.ui.textures.icon_components_min)
                btn_left_price_components_icon.anchor.set(1, 0.5)
                btn_left_price_components_icon.scale.set(0.35)
                btn_left_price_components_icon.position.x = -4
                btn_left_price_components_icon.position.y = 10
                this.btn_left.addChild(btn_left_price_components_icon)
        
                const groupType = (type === 'gatling' || type === 'rocket' || type === 'tesla') ? 'defense' : 'attack'
                this.btn_price_components = new Text(`x${state.player[groupType][type].price}`, textStyles.UIButtonPrice)
                this.btn_price_components.anchor.set(0, 0.5)
                this.btn_price_components.position.x = 0
                this.btn_price_components.position.y = 10
                this.btn_left.addChild(this.btn_price_components)
        
                this.btn_left.alpha = state.player.components.count < state.player[groupType][type].price ? 0.5 : 1
            }
    
            this.btn_right = new Sprite(sprites.ui.textures.white_button_min)
            this.btn_right.anchor.set(0.5)
            this.btn_right.position.x = 88
            this.btn_right.position.y = 92
            this.btn_right.eventMode = 'static'
            if (type==='ore' || type==='components' || type === 'science') {
                this.btn_right.on( 'pointertap', this.removeSource.bind(this, type) )
            } else {
                if (type==='gatling' || type==='rocket' || type === 'tesla') {
                    this.btn_right.on( 'pointertap', this.upgradeTower.bind(this, type) )
                    EventHub.on( events.scienceOnChange, this.checkUpgradeDefenseBtnAlpha.bind(this, type) )
                } else {
                    this.btn_right.on( 'pointertap', this.upgradeAttack.bind(this, type) )
                    EventHub.on( events.scienceOnChange, this.checkUpgradeAttackBtnAlpha.bind(this, type) )
                }
            }
            let btn_right_help_text = ''
            switch (type) {
                case 'ore' : btn_right_help_text = 'Уменьшить добычу руды'; break;
                case 'components' : btn_right_help_text = 'Уменьшить производство компонентов'; break;
                case 'science' : btn_right_help_text = 'Уменьшить количество исследований'; break;

                case 'gatling' : btn_right_help_text = 'Улучшить все пулеметные башни'; break;
                case 'rocket' : btn_right_help_text = 'Улучшить все ракетные башни'; break;
                case 'tesla' : btn_right_help_text = 'Улучшить все электрические башни'; break;

                case 'bombCarrier' : btn_right_help_text = 'Улучшить все бомбовозы'; break;
                case 'spider' : btn_right_help_text = 'Улучшить всех пауков'; break;
                case 'plane' : btn_right_help_text = 'Улучшить все штурмовики'; break;
                case 'airship' : btn_right_help_text = 'Улучшить все дирижабли'; break;
            }
            this.btn_right.on('pointerenter', () => setHelpText(btn_right_help_text) )
            this.btn_right.on('pointerleave', () => setHelpText('') )
            this.addChild(this.btn_right)
    
            const btn_right_sign = new Text((type==='ore' || type==='components' || type === 'science') ? '-' : '^', textStyles.UIButtonSign)
            btn_right_sign.anchor.set(0.5)
            btn_right_sign.position.y = (type==='ore' || type==='components' || type === 'science') ? -8 : -4
            this.btn_right.addChild(btn_right_sign)

            if (type === 'ore' || type === 'components' || type === 'science') {
                let btn_right_info = (state.player[type].used < 2) ? '0' : getAddPerSecond(type, -1)
                this.btn_right.alpha = state.player[type].used === 0 ? 0.5 : 1
                this.btn_right_info = new Text(`${btn_right_info}/с.`, textStyles.UIButtonPrice)
                this.btn_right_info.anchor.set(0.5)
                this.btn_right_info.position.y = 10
                this.btn_right.addChild(this.btn_right_info)
            } else {
                const btn_right_price_science_icon = new Sprite(sprites.ui.textures.icon_science_min)
                btn_right_price_science_icon.anchor.set(1, 0.5)
                btn_right_price_science_icon.scale.set(0.35)
                btn_right_price_science_icon.position.x = -4
                btn_right_price_science_icon.position.y = 10
                this.btn_right.addChild(btn_right_price_science_icon)
        
                const groupType = (type === 'gatling' || type === 'rocket' || type === 'tesla') ? 'defense' : 'attack'

                this.btn_price_science = new Text(`x${state.player[groupType][type].upgrade.price}`, textStyles.UIButtonPrice)
                this.btn_price_science.anchor.set(0, 0.5)
                this.btn_price_science.position.x = 0
                this.btn_price_science.position.y = 10
                this.btn_right.addChild(this.btn_price_science)
        
                this.btn_right.alpha = state.player.science.count < state.player[groupType][type].upgrade.price ? 0.5 : 1
            }
        }
    }

    checkEnergyBtnAlpha() {
        this.btn.alpha = state.player.energy.upgrade.components > state.player.components.count
        || state.player.energy.upgrade.science > state.player.science.count ? 0.5 : 1
    }
    checkRepairBtnAlpha() {
        this.btn.alpha = state.player.defense.base.hp === 100
        || state.player.defense.base.repair.components > state.player.components.count
        || state.player.defense.base.repair.science > state.player.science.count ? 0.5 : 1
    }

    checkAddDefenseBtnAlpha(type) {
        this.btn_left.alpha = state.player.components.count < state.player.defense[type].price ? 0.5 : 1
    }
    checkAddAttackBtnAlpha(type) {
        this.btn_left.alpha = state.player.components.count < state.player.attack[type].price ? 0.5 : 1
    }
    checkUpgradeDefenseBtnAlpha(type) {
        this.btn_right.alpha = state.player.science.count < state.player.defense[type].upgrade.price ? 0.5 : 1
    }
    checkUpgradeAttackBtnAlpha(type) {
        this.btn_right.alpha = state.player.science.count < state.player.attack[type].upgrade.price ? 0.5 : 1
    }

    repair() {
        if (buildInfo.isActive) return buildInfo.reset()

        playSound( sounds.upgrade )

        if (state.player.defense.base.hp === 100
        || state.player.defense.base.repair.components > state.player.components.count
        || state.player.defense.base.repair.science > state.player.science.count) return

        state.player.defense.base.hp += 10
        if (state.player.defense.base.hp > 100) state.player.defense.base.hp = 100

        state.player.components.count -= state.player.defense.base.repair.components
        state.player.science.count -= state.player.defense.base.repair.science
        state.player.defense.base.repair.components = Math.floor(state.player.defense.base.repair.rate * state.player.defense.base.repair.components)
        state.player.defense.base.repair.science = Math.floor(state.player.defense.base.repair.rate * state.player.defense.base.repair.science)

        gameUI.playerBaseHP.update()

        this.price_components.text = `x${state.player.defense.base.repair.components}`
        this.price_science.text = `x${state.player.defense.base.repair.science}`
        componentsOnChange()
        scienceOnChange()

        this.checkRepairBtnAlpha()

        if (isTraining === false) sendMessage({type: 'repair', data: null})
    }

    addSource(type) {
        if (buildInfo.isActive) return buildInfo.reset()

        playSound( sounds.add )

        if (type === 'energy') {
            if(state.player.energy.upgrade.components > state.player.components.count
            || state.player.energy.upgrade.science > state.player.science.count) return
            
            state.player.energy.max++
            state.player.components.count -= state.player.energy.upgrade.components
            state.player.science.count -= state.player.energy.upgrade.science
            state.player.energy.upgrade.components *= state.player.energy.upgrade.rate
            state.player.energy.upgrade.science *= state.player.energy.upgrade.rate

            this.price_components.text = `x${state.player.energy.upgrade.components}`
            this.price_science.text = `x${state.player.energy.upgrade.science}`

            componentsOnChange()
            scienceOnChange()
            energyOnChange()
            this.checkEnergyBtnAlpha()
            return 
        }

        if (state.player.energy.used === state.player.energy.max
        || state.player[type].add + 1 === state.addFramesSteps.length) return

        state.player[type].add++
        state.player[type].used++
        state.player.energy.used++
        energyOnChange()

        if ((state.player[type].add + 1) === state.addFramesSteps.length) {
            this.btn_left_info.text = `${getAddPerSecond(type)}/с.`
            this.btn_left.alpha = 0.5
        } else {
            this.btn_left_info.text = `${getAddPerSecond(type, 1)}/с.`
            this.btn_left.alpha = state.player.energy.max === state.player.energy.used ? 0.5 : 1
        }
        this.btn_right_info.text = `${ (state.player[type].used < 2) ? '0' : getAddPerSecond(type, -1) }/с.`
        this.btn_right.alpha = state.player[type].used === 0 ? 0.5 : 1

        switch(type) {
            case 'ore' : oreMiningChanged(); break;
            case 'components' : componentsMiningChanged(); break;
            case 'science' : scienceMiningChanged(); break;
        }
    }
    removeSource(type) {
        if (buildInfo.isActive) return buildInfo.reset()

        if (state.player[type].used === 0) return

        playSound( sounds.remove )

        state.player[type].add--
        state.player[type].used--
        state.player.energy.used--
        energyOnChange()

        if ((state.player[type].add + 1) === state.addFramesSteps.length) {
            this.btn_left_info.text = `${getAddPerSecond(type)}/с.`
            this.btn_left.alpha = 0.5
        } else {
            this.btn_left_info.text = `${getAddPerSecond(type, 1, true)}/с.`
            this.btn_left.alpha = state.player.energy.max === state.player.energy.used ? 0.5 : 1
        }
        this.btn_right_info.text = `${ (state.player[type].used < 2) ? '0' : getAddPerSecond(type, -1) }/с.`
        this.btn_right.alpha = state.player[type].used === 0 ? 0.5 : 1

        switch(type) {
            case 'ore' : oreMiningChanged(); break;
            case 'components' : componentsMiningChanged(); break;
            case 'science' : scienceMiningChanged(); break;
        }
    }

    addTower(type) {
        if (buildInfo.isActive) {
            buildInfo.reset()
            playSound( sounds.remove )
            return 
        }

        if(state.player.defense[type].price > state.player.components.count) return

        playSound( sounds.add )
        /*
        state.player.components.count -= state.player.defense[type].price
        componentsOnChange()
        */
        buildInfo.setTower(type, state.player.defense[type].price)
        this.btn_left_sign.text = 'x'
        this.btn_left_sign.style = textStyles.UIButtonSignRed
    }
    upgradeTower(type) {
        if (buildInfo.isActive) return buildInfo.reset()

        if(state.player.defense[type].upgrade.price > state.player.science.count) return

        playSound( sounds.upgrade )

        state.player.science.count -= state.player.defense[type].upgrade.price
        scienceOnChange()

        state.player.defense[type].upgrade.price = Math.ceil( state.player.defense[type].upgrade.price * state.player.defense[type].upgrade.rate )
        state.player.defense[type].radius += state.player.defense[type].upgrade.radius
        state.player.defense[type].speed += state.player.defense[type].upgrade.speed
        state.player.defense[type].air += state.player.defense[type].upgrade.air
        state.player.defense[type].ground += state.player.defense[type].upgrade.ground
        this.btn_price_science.text = `x${state.player.defense[type].upgrade.price}`
        this.radius.text = `x${ state.player.defense[type].radius }`
        this.air.text = `x${ Math.round(state.player.defense[type].speed * state.player.defense[type].air) }`
        this.ground.text = `x${ Math.round(state.player.defense[type].speed * state.player.defense[type].ground) }`

        playerTowerUpgrade()

        if (isTraining === false) sendMessage({type: 'towerUpgrade', data: type})
    }

    addAttack(type) {
        if (buildInfo.isActive) return buildInfo.reset()

        if(state.player.attack[type].price > state.player.components.count) return

        playSound( sounds.add )

        state.player.components.count -= state.player.attack[type].price
        componentsOnChange()

        state.player.army.push(type)
        state.player.attack[type].count++
        switch(type) {
            case 'bombCarrier' : bombCarrierOnChange(); break;
            case 'spider' : spiderOnChange(); break;
            case 'plane' : planeOnChange(); break;
            case 'airship' : airshipOnChange(); break;
        }
    }
    upgradeAttack(type) {
        if (buildInfo.isActive) return buildInfo.reset()

        if(state.player.attack[type].upgrade.price > state.player.science.count) return

        playSound( sounds.upgrade )

        state.player.science.count -= state.player.attack[type].upgrade.price
        scienceOnChange()

        state.player.attack[type].upgrade.price = Math.ceil( state.player.attack[type].upgrade.price * state.player.attack[type].upgrade.rate )
        state.player.attack[type].speed += state.player.attack[type].upgrade.speed
        state.player.attack[type].power += state.player.attack[type].upgrade.power
        state.player.attack[type].armor += state.player.attack[type].upgrade.armor
        this.btn_price_science.text = `x${state.player.attack[type].upgrade.price}`
        this.speed.text = `x${state.player.attack[type].speed}`
        this.power.text = `x${state.player.attack[type].power}`
        this.armor.text = `x${state.player.attack[type].armor}`

        if (isTraining === false) sendMessage({type: 'attackUpgrade', data: type})
    }
}

class Controller extends Container {
    constructor() {
        super()
        this.activeType = ''
        this.switchButtonProduction = new Sprite(sprites.ui.textures.switch_button_bg)
        this.switchButtonProduction.addChild( new Sprite(sprites.ui.textures.switch_button_production) )
        this.switchButtonProduction.alpha = 0.5
        this.switchButtonProduction.eventMode = 'static'
        // this.switchButtonProduction.on('pointertap', () => switchShopType('production') )
        this.switchButtonProduction.on('pointertap', this.switchShopType.bind(this, 'production') )
        this.switchButtonProduction.on('pointerenter', () => setHelpText('Меню добычи ресурсов и производства') )
        this.switchButtonProduction.on('pointerleave', () => setHelpText('') )

        this.switchButtonDefense = new Sprite(sprites.ui.textures.switch_button_bg)
        this.switchButtonDefense.addChild( new Sprite(sprites.ui.textures.switch_button_defense) )
        this.switchButtonDefense.alpha = 0.5
        this.switchButtonDefense.position.x = 82 + 18
        this.switchButtonDefense.eventMode = 'static'
        // this.switchButtonDefense.on('pointertap', () => switchShopType('defense') )
        this.switchButtonDefense.on('pointertap', this.switchShopType.bind(this, 'defense') )
        this.switchButtonDefense.on('pointerenter', () => setHelpText('Магазин оборонительных средств') )
        this.switchButtonDefense.on('pointerleave', () => setHelpText('') )

        this.switchButtonAttack = new Sprite(sprites.ui.textures.switch_button_bg)
        this.switchButtonAttack.addChild( new Sprite(sprites.ui.textures.switch_button_attack) )
        this.switchButtonAttack.alpha = 0.5
        this.switchButtonAttack.position.x = (82 + 18) * 2
        this.switchButtonAttack.eventMode = 'static'
        // this.switchButtonAttack.on('pointertap', () => switchShopType('attack') )
        this.switchButtonAttack.on('pointertap', this.switchShopType.bind(this, 'attack') )
        this.switchButtonAttack.on('pointerenter', () => setHelpText('Магазин наступательных средств') )
        this.switchButtonAttack.on('pointerleave', () => setHelpText('') )

        this.shop = new Sprite(sprites.ui.textures.shop_bg)
        this.shop.position.y = 82 + 12

        this.item_1 = new Sprite(sprites.ui.textures.shop_item_bg)
        this.item_1.position.x = 12
        this.item_1.position.y = 14
        this.shop.addChild(this.item_1)

        this.item_2 = new Sprite(sprites.ui.textures.shop_item_bg)
        this.item_2.position.x = 12 + 14 + 120
        this.item_2.position.y = 14
        this.shop.addChild(this.item_2)

        this.item_3 = new Sprite(sprites.ui.textures.shop_item_bg)
        this.item_3.position.x = 12
        this.item_3.position.y = 14 + 14 + 120
        this.shop.addChild(this.item_3)

        this.item_4 = new Sprite(sprites.ui.textures.shop_item_bg)
        this.item_4.position.x = 12 + 14 + 120
        this.item_4.position.y = 14 + 14 + 120
        this.shop.addChild(this.item_4)

        this.energy = new ControllerItem('energy', sprites.ui.textures.icon_energy, 0.75, 60, 40)
        this.ore = new ControllerItem('ore', sprites.ui.textures.icon_ore, 0.75, 60, 40)
        this.components = new ControllerItem('components', sprites.ui.textures.icon_components, 0.75, 60, 40)
        this.science = new ControllerItem('science', sprites.ui.textures.icon_science, 0.75, 60, 40)
        
        this.gatling = new ControllerItem('gatling', sprites.player_blue.textures.gatling_0, 0.6, 40, 40, Math.PI * 1.45)
        this.rocket = new ControllerItem('rocket', sprites.player_blue.textures.rocket, 0.6, 40, 40, Math.PI * 1.45)
        this.tesla = new ControllerItem('tesla', sprites.player_blue.textures.tesla, 0.6, 40, 40)
        this.repair = new ControllerItem('repair', sprites.ui_base_repair, 0.6, 60, 36)
        
        this.bombCarrier = new ControllerItem('bombCarrier', sprites.player_blue.textures.bomb_carrier_0, 0.5, 40, 36)
        this.spider = new ControllerItem('spider', sprites.player_blue.textures.spider_0, 1, 40, 36)
        this.plane = new ControllerItem('plane', sprites.player_blue.textures.plane, 0.5, 40, 36)
        this.airship = new ControllerItem('airship', sprites.player_blue.textures.airship, 0.25, 40, 36)

        this.switchShopType( 'production' )

        this.addChild(this.switchButtonProduction, this.switchButtonDefense, this.switchButtonAttack, this.shop)
        //EventHub.on( events.switchShopType, this.switchShopType.bind(this) )
        EventHub.on( events.energyOnChange, this.energyOnChange.bind(this) )
        EventHub.on( events.resetAddTower, this.resetAddTower.bind(this) )
    }

    switchShopType( type ) {
        if (buildInfo.isActive) return buildInfo.reset()
        if (this.activeType === type) return

        playSound( sounds.menu )

        switch( this.activeType ) {
            case 'production' :
                this.item_1.removeChild(this.energy)
                this.item_2.removeChild(this.ore)
                this.item_3.removeChild(this.components)
                this.item_4.removeChild(this.science)
            break;
            case 'defense' :
                this.item_1.removeChild(this.gatling)
                this.item_2.removeChild(this.rocket)
                this.item_3.removeChild(this.tesla)
                this.item_4.removeChild(this.repair)
            break;
            case 'attack' :
                this.item_1.removeChild(this.bombCarrier)
                this.item_2.removeChild(this.spider)
                this.item_3.removeChild(this.plane)
                this.item_4.removeChild(this.airship)
            break;
        }

        switch( type ) {
            case 'production' :
                this.switchButtonProduction.alpha = 1
                this.switchButtonDefense.alpha = 0.5
                this.switchButtonAttack.alpha = 0.5

                this.item_1.addChild(this.energy)
                this.item_2.addChild(this.ore)
                this.item_3.addChild(this.components)
                this.item_4.addChild(this.science)
            break;
            case 'defense' :
                this.switchButtonProduction.alpha = 0.5
                this.switchButtonDefense.alpha = 1
                this.switchButtonAttack.alpha = 0.5

                this.item_1.addChild(this.gatling)
                this.item_2.addChild(this.rocket)
                this.item_3.addChild(this.tesla)
                this.item_4.addChild(this.repair)
            break;
            case 'attack' :
                this.switchButtonProduction.alpha = 0.5
                this.switchButtonDefense.alpha = 0.5
                this.switchButtonAttack.alpha = 1

                this.item_1.addChild(this.bombCarrier)
                this.item_2.addChild(this.spider)
                this.item_3.addChild(this.plane)
                this.item_4.addChild(this.airship)
            break;
        }

        this.activeType = type
    }
    
    energyOnChange() {
        const types = ['ore', 'components', 'science']
        types.forEach( type => {
            this[type].btn_left.alpha = (state.player[type].add + 1) === state.addFramesSteps.length
                                      || state.player.energy.used === state.player.energy.max ? 0.5 : 1

            this[type].btn_right.alpha = state.player[type].add === 0 || state.player[type].used === 0 ? 0.5 : 1
        })
    }

    resetAddTower(type) {
        this[type].btn_left_sign.text = '+'
        this[type].btn_left_sign.style = textStyles.UIButtonSign
    }
}

class RightSidebar extends TilingSprite {
    constructor(parent) {
        super(sprites.ui_bg_purple)
        this.width = settings.sidebarRightWidth

        miniMap.position.x = 164
        miniMap.position.y = 330
        this.addChild(miniMap)

        parent.opponentBaseHP = new BaseHP('opponent', this)
        parent.opponentBaseHP.position.x = miniMap.position.x
        parent.opponentBaseHP.position.y = miniMap.position.y + 3

        this.controller = new Controller()
        this.controller.position.x = 24
        this.controller.position.y = 348
        this.addChild(this.controller)

        parent.addChild(this)
    }
}

class BottomSidebar extends TilingSprite {
    constructor(parent) {
        super(sprites.ui_bg_blue)
        this.height = settings.sidebarBottomHeight
        
        this.text = new Text('', textStyles.sidebarMessage)
        this.text.anchor.set(0.5)
        this.text.position.y = settings.sidebarBottomTextY
        this.addChild(this.text)

        parent.addChild(this)
        EventHub.on( events.setHelpText, this.setHelpText.bind(this) )
    }

    setHelpText(text) {
        this.text.text = text
    }
}

class InfoText extends Container {
    constructor(type, parent) {
        super()

        this.background = new Graphics()
        this.background.beginFill(0xffffff)
        this.background.alpha = 0.5
        this.position.y = settings.sidebarTopHeight + 24
        if (type === 'wave') {
            this.position.x = -12
            this.background.drawRoundedRect(0, 0, 380, 24, 12)
        } else {
            this.background.drawRoundedRect(0, 0, 300, 24, 12)
        }
        this.background.endFill()
        this.addChild(this.background)

        if (type === 'wave') {
            this.text = new Text('', textStyles.UISideInfo)
            this.text.anchor.set(0, 0.5)
            this.text.position.x = 24
        } else {
            this.text = new Text(`ВСЕГО ДОБЫТО РУДЫ: ${state.player.totalOreMined}`, textStyles.UISideInfo)
            this.text.anchor.set(1, 0.5)
            this.text.position.x = 300 - 24
        }
        this.text.position.y = 12
        this.addChild(this.text)

        parent.addChild(this)
    }
}

class BaseHP extends Container {
    constructor(type, parent) {
        super()

        this.background = new Graphics()
        this.background.beginFill(0x777777)
        this.background.drawRoundedRect(-84, -10, 168, 20, 10)
        this.background.endFill()
        this.addChild(this.background)

        this.line = new Graphics()
        this.addChild(this.line)

        this.type = type
        if (this.type === 'player') {
            this.color = 0x0000ff
        } else {
            this.color = 0xff0000
            this.scale.set(0.25)
        }

        this.update()
        parent.addChild(this)
    }

    update() {
        this.line.clear()
        this.line.beginFill(this.color)
        this.line.drawRoundedRect(-80, -6, state[this.type].defense.base.hp * 1.6, 12, 6)
        this.line.endFill()

        if (state[this.type].defense.base.hp === 0) {
            const data = {
                disconnect: false,
                isWin: this.type === 'opponent',
                isBaseDestroyed: true,
                playerOreMinded: state.player.totalOreMined,
                opponentOreMiOreMinded: state.opponent.totalOreMined
            }
            gameUI.stop()
            tickerClear()
            if (isTraining === false) sendMessage({type: 'finished', data: {winType: 'baseHP', isWinner: this.type === 'player'}})
            showResults(data)
        }
    }
}

class GameIU extends Container {
    constructor(screenData) {
        super()

        this.waveTexts= ['ПЕРВАЯ', 'ВТОРАЯ', 'ПОСЛЕДНЯЯ']
        this.waveInfo = new InfoText('wave', this)
        this.oreInfo = new InfoText('ore', this)

        this.sidebarBottom = new BottomSidebar(this)
        this.sidebarRight = new RightSidebar(this)
        this.sidebarTop = new TopSidebar(this)

        this.playerBaseHP = new BaseHP('player', this)
        // this.opponentBaseHP  - added in rightSideBar -> miniMap

        this.screenResize( screenData )
        EventHub.on( events.screenResize, this.screenResize.bind(this) )
        EventHub.on( events.oreMiningChanged, this.oreMiningChanged.bind(this) )
        EventHub.on( events.componentsMiningChanged, this.componentsMiningChanged.bind(this) )
        EventHub.on( events.scienceMiningChanged, this.scienceMiningChanged.bind(this) )
        EventHub.on( events.setBaseDamageFrom, this.BaseGetDamage.bind(this) )

        gameUI = this
    }

    screenResize(screenData) {
        this.oreInfo.position.x = screenData.width - settings.sidebarRightWidth - 300 + 12

        this.playerBaseHP.position.x = (screenData.width - settings.sidebarRightWidth) * 0.5
        this.playerBaseHP.position.y = screenData.height - settings.sidebarBottomHeight - 12

        this.sidebarBottom.width = screenData.width
        this.sidebarBottom.position.y = screenData.height - settings.sidebarBottomHeight
        this.sidebarBottom.text.position.x = (screenData.width - settings.sidebarRightWidth) * 0.5

        this.sidebarRight.height = screenData.height
        this.sidebarRight.position.x = screenData.width - this.sidebarRight.width

        this.sidebarTop.width = screenData.width
        this.sidebarTop.sourceBar.position.x = screenData.width - (this.sidebarTop.sourceBar.width + settings.attackSlotX)
    }

    oreMiningChanged() {
        this.oreAddAtFrame = state.player.ore.used ? this.frames + state.addFramesSteps[state.player.ore.add] : Infinity
    }
    componentsMiningChanged() {
        this.componentsAddAtFrame = state.player.components.used ? this.frames + state.addFramesSteps[state.player.components.add] : Infinity
    }
    scienceMiningChanged() {
        this.scienceAddAtFrame = state.player.science.used ? this.frames + state.addFramesSteps[state.player.science.add] : Infinity
    }

    BaseGetDamage(doer) {
        if (doer === 'opponent') {
            this.playerBaseHP.update()
        } else {
            this.opponentBaseHP.update()
        }
    }

    updateWaveInfo() {
        this.waveInfo.text.text = `${this.waveTexts[state.currentWave]} ВОЛНА ЧЕРЕЗ ${(state.attackTimeout / 60).toFixed()} секунд`
    }

    start(opponent) {
        this.opponent = opponent

        this.waveTimeout = state.waveTimeouts[state.currentWave]
        state.attackTimeout = state.waveTimeouts[state.currentWave]

        this.frames = 0
        this.oreAddAtFrame = state.player.ore.used ? state.addFramesSteps[state.player.ore.add] : Infinity
        this.componentsAddAtFrame = state.player.components.used ? state.addFramesSteps[state.player.components.add] : Infinity
        this.scienceAddAtFrame = state.player.science.used ? state.addFramesSteps[state.player.science.add] : Infinity

        this.addAttackersTimeout = 0
        state.nextUnitTimeout = state.nextUnitDelays[state.currentWave]

        this.sidebarTop.attack_slot_bombCarrier.counterText.text = `x${state.player.attack.bombCarrier.count}`
        this.sidebarTop.attack_slot_spider.counterText.text = `x${state.player.attack.spider.count}`
        this.sidebarTop.attack_slot_plane.counterText.text = `x${state.player.attack.plane.count}`
        this.sidebarTop.attack_slot_airship.counterText.text = `x${state.player.attack.airship.count}`

        this.sidebarTop.sourceBar.energy_text.text = `${state.player.energy.used} / ${state.player.energy.max}`
        this.sidebarTop.sourceBar.ore_energy_text.text = `x${state.player.ore.used}`
        this.sidebarTop.sourceBar.ore_counter_text.text = `${state.player.ore.count}`
        this.sidebarTop.sourceBar.ore_info_text.text = `+${getAddPerSecond('ore')}/сек.`
        this.sidebarTop.sourceBar.components_sources_text.text = `x${state.player.components.used}`
        this.sidebarTop.sourceBar.components_counter_text.text = `${state.player.components.count}`
        this.sidebarTop.sourceBar.components_info_text.text = `+${getAddPerSecond('components')}/сек.`
        this.sidebarTop.sourceBar.science_sources_text.text = `x${state.player.science.used}`
        this.sidebarTop.sourceBar.science_counter_text.text = `${state.player.science.count}`
        this.sidebarTop.sourceBar.science_info_text.text = `+${getAddPerSecond('science')}/сек.`

        this.sidebarRight.controller.energy.price_components.text = `x${state.player.energy.upgrade.components}`
        this.sidebarRight.controller.energy.price_science.text = `x${state.player.energy.upgrade.science}`
        this.sidebarRight.controller.energy.checkEnergyBtnAlpha()

        /*
        this.sidebarRight.controller.ore
        this.sidebarRight.controller.components
        this.sidebarRight.controller.science
        */
        const sourceTypes = ['ore', 'components', 'science']
        sourceTypes.forEach( type => {
            if ((state.player[type].add + 1) === state.addFramesSteps.length) {
                this.sidebarRight.controller[type].btn_left_info.text = `${getAddPerSecond(type)}/с.`
                this.sidebarRight.controller[type].btn_left.alpha = 0.5
            } else {
                this.sidebarRight.controller[type].btn_left_info.text = `${getAddPerSecond(type, 1, true)}/с.`
                this.sidebarRight.controller[type].btn_left.alpha = state.player.energy.max === state.player.energy.used ? 0.5 : 1
            }

            let btn_right_info = (state.player[type].used < 2) ? '0' : getAddPerSecond(type, -1)
            this.sidebarRight.controller[type].btn_right.alpha = state.player[type].used === 0 ? 0.5 : 1
            this.sidebarRight.controller[type].btn_right_info.text = `${btn_right_info}/с.`
        })
        
        /*
        this.sidebarRight.controller.gatling
        this.sidebarRight.controller.rocket
        this.sidebarRight.controller.tesla
        */
        const defenseTypes = ['gatling', 'rocket', 'tesla']
        defenseTypes.forEach( type => {
            this.sidebarRight.controller[type].radius.text = `x${state.player.defense[type].radius}`
            this.sidebarRight.controller[type].air.text = `x${Math.round(state.player.defense[type].speed * state.player.defense[type].air)}`
            this.sidebarRight.controller[type].ground.text = `x${Math.round(state.player.defense[type].speed * state.player.defense[type].ground)}`
            this.sidebarRight.controller[type].btn_price_components.text = `x${state.player.defense[type].price}`
            this.sidebarRight.controller[type].btn_price_science.text = `x${state.player.defense[type].upgrade.price}`
            this.sidebarRight.controller[type].checkAddDefenseBtnAlpha('gatling')
            this.sidebarRight.controller[type].checkUpgradeDefenseBtnAlpha(type)
        })

        this.sidebarRight.controller.repair.price_components.text = `x${state.player.defense.base.repair.components}`
        this.sidebarRight.controller.repair.price_science.text = `x${state.player.defense.base.repair.science}`
        this.sidebarRight.controller.repair.checkRepairBtnAlpha()
        
        /*
        this.sidebarRight.controller.bombCarrier
        this.sidebarRight.controller.spider
        this.sidebarRight.controller.plane
        this.sidebarRight.controller.airship
        */
        const attackTypes = ['bombCarrier', 'spider', 'plane', 'airship']
        attackTypes.forEach( type => {
            this.sidebarRight.controller[type].speed.text = `x${state.player.attack[type].speed}`
            this.sidebarRight.controller[type].power.text = `x${state.player.attack[type].power}`
            this.sidebarRight.controller[type].armor.text = `x${state.player.attack[type].armor}`
            this.sidebarRight.controller[type].btn_price_components.text = `x${state.player.attack[type].price}`
            this.sidebarRight.controller[type].btn_price_science.text = `x${state.player.attack[type].upgrade.price}`
            this.sidebarRight.controller[type].checkAddAttackBtnAlpha(type)
            this.sidebarRight.controller[type].checkUpgradeAttackBtnAlpha(type)
        })
        
        this.playerBaseHP.update()
        this.opponentBaseHP.update()

        this.updateWaveInfo()
        tickerAdd(this)
    }
    stop() {
        tickerRemove(this)
    }
    tick(delta) {
        if (state.currentWave < state.waveTimeouts.length) {
            if (state.attackTimeout > 0) {
                state.attackTimeout -= delta
                if (this.waveTimeout - 60 >= state.attackTimeout) {
                    this.waveTimeout = state.attackTimeout
                    this.updateWaveInfo()
                }
            } else {
                playSound(sounds.attack_wave_start)
                state.nextUnitTimeout = state.nextUnitDelays[state.currentWave]

                state.currentWave++
                if (state.currentWave < state.waveTimeouts.length) {
                    state.attackTimeout = state.waveTimeouts[state.currentWave]
                    this.waveTimeout = state.waveTimeouts[state.currentWave]
                    this.updateWaveInfo()
                } else {
                    this.waveInfo.text.text = 'ЭТО ПОСЛЕДНЯЯ ВОЛНА'
                }

                if (isTraining ) {
                    this.opponent.nextWave()
                    gameMap.attackers = gameMap.attackers.concat(state.opponent.army)
                    state.opponent.army = []
                } else {
                    sendMessage({type: 'attack', data: [...state.player.army]})
                }

                miniMap.attackers = miniMap.attackers.concat(state.player.army)
                state.player.army = []

                for (let unitType in state.player.attack) state.player.attack[unitType].count = 0
                
                bombCarrierOnChange()
                spiderOnChange()
                planeOnChange()
                airshipOnChange()

                this.addAttackersTimeout = (gameMap.attackers.length || miniMap.attackers.length) ? state.nextUnitTimeout : 0
                // add delay for multiplayer 
                if (state.currentWave === state.waveTimeouts.length && gameMap.attackers.length === 0) this.addAttackersTimeout = 5 * 60
            }
        } else {
            if ( isResult === false
            && this.addAttackersTimeout === 0 // be added delay for multiplayer 
            && gameMap.attackers.length === 0
            && miniMap.attackers.length === 0
            && gameMap.air.children.length === 0
            && gameMap.ground.children.length === 0
            && miniMap.air.children.length === 0
            && miniMap.ground.children.length === 0) {
                const data = {
                    disconnect: false,
                    isWin: state.player.totalOreMined > state.opponent.totalOreMined,
                    isBaseDestroyed: false,
                    playerOreMinded: state.player.totalOreMined,
                    opponentOreMiOreMinded: state.opponent.totalOreMined
                }
                this.stop()
                tickerClear()
                if (isTraining === false) sendMessage({type: 'finished', data: {winType: 'ore', ore: state.player.totalOreMined}})
                return showResults(data)
            }
        }

        if (this.addAttackersTimeout) {
            this.addAttackersTimeout -= delta
            if (this.addAttackersTimeout <= 0) {
                if (gameMap.attackers.length) gameMap.addAttacker()
                if (miniMap.attackers.length) miniMap.addAttacker()
                this.addAttackersTimeout = (gameMap.attackers.length || miniMap.attackers.length) ? state.nextUnitTimeout : 0
            }
        }

        this.frames += delta
        if (this.opponent) this.opponent.update(this.frames)

        if (this.frames > this.oreAddAtFrame) {
            this.oreAddAtFrame += state.addFramesSteps[state.player.ore.add]
            this.oreInfo.text.text = `ВСЕГО ДОБЫТО РУДЫ: ${++state.player.totalOreMined}`
            this.sidebarTop.sourceBar.ore_counter_text.text = ++state.player.ore.count

            if (isTraining === false) sendMessage({type: 'oreAdd', data: null})
        }
        if (this.frames > this.componentsAddAtFrame) {
            this.componentsAddAtFrame += state.addFramesSteps[state.player.components.add]
            if (state.player.ore.count) {
                this.sidebarTop.sourceBar.ore_counter_text.text = --state.player.ore.count
                this.sidebarTop.sourceBar.components_counter_text.text = ++state.player.components.count
                componentsOnChange()
            }
        }
        if (this.frames > this.scienceAddAtFrame) {
            this.scienceAddAtFrame += state.addFramesSteps[state.player.science.add]
            if (state.player.ore.count) {
                this.sidebarTop.sourceBar.ore_counter_text.text = --state.player.ore.count
                this.sidebarTop.sourceBar.science_counter_text.text = ++state.player.science.count
                scienceOnChange()
            }
        }
    }
}

export default GameIU