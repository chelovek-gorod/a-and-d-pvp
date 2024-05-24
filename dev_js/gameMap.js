import { Sprite, Container, AnimatedSprite } from "pixi.js"
import { sprites, sounds } from "./loader"
import { EventHub, events, resetAddTower, componentsOnChange, sendMessage } from './events'
import { state } from './state'
import { playSound } from './sound'
import { tickerAdd, tickerRemove, clearContainer } from "./application"
import { buildTower } from "./towers"
import { BombCarrier, Spider, Plane, Airship } from "./army"
import { isTraining } from "./game"

const settings = {
    sidebarBottomHeight: 38,
    sidebarRightWidth: 320,
    sidebarTopHeight: 112,

    ceilSize: 96,
    ceilHalfSize: 48,
}

export let gameMap = null
export const buildInfo = {
    type: '',
    price: 0,
    isActive: false,

    reset() {
        resetAddTower(this.type)
        this.type = ''
        this.price = 0
        this.isActive = false
        gameMap.slots.children.forEach( slot => { if (slot.isEmpty) slot.pointer.hide() } )
    },

    setTower(type, price) {
        this.type = type
        this.price = price
        if (!this.isActive) {
            this.isActive = true
            gameMap.slots.children.forEach( slot => { if (slot.isEmpty) slot.pointer.show() } )
        }
    }
}

let towersToBuildList = []

let trees = [0,]
let treeIndex = 0
let lastLineTrees = []
let currentLineTrees = []

function setTrees(bgName) {
    if (bgName === 'background_tile_1') trees = [1, 2, 3]
    else if (bgName === 'background_tile_3') trees = [4, 5]
    else trees = [6]
}

let treeSteps = Math.ceil(Math.random() * 5)

function addTree(x, y) {
    treeSteps--
    if (treeSteps === 0) {
        if (lastLineTrees.includes(x)) return treeSteps += Math.ceil(Math.random() * 5)

        treeSteps = 3 + Math.floor(Math.random() * 5)

        treeIndex++
        if (treeIndex === trees.length) treeIndex = 0

        new Tree(x, y, trees[treeIndex])
        currentLineTrees.push(x)
    }
}

class Tree extends Sprite {
    constructor(x, y, treeIndex) {
        super(sprites[`tree_${treeIndex}`])
        this.anchor.set(0.5)
        this.position.x = x
        this.position.y = y
        this.rotation = Math.random() * (Math.PI * 2)
        gameMap.trees.addChild(this)
    }
}

class StartPoint extends AnimatedSprite {
    constructor (x, y) {
        super(sprites.star_flash.animations.flash)
        this.anchor.set(0.5)
        this.position.x = x + settings.ceilHalfSize
        this.position.y = y + settings.ceilHalfSize
        this.animationSpeed = 0.5
        this.play()
        gameMap.baseContainer.addChild(this)
    }
}

class Base extends AnimatedSprite {
    constructor(x, y) {
        super(sprites.base_blue.animations.build)
        this.anchor.set(0.5)
        this.position.x = x + settings.ceilSize
        this.position.y = y + settings.ceilSize
        this.isOnBuild = false
        this.animationSpeed = 0.75
        this.onLoop = this.buildComplete.bind(this)
        gameMap.baseContainer.addChild(this)
    }

    build() {
        if (this.isOnBuild) return

        this.isOnBuild = true
        this.play()
        playSound(sounds.build)
    }

    buildComplete() {
        const buildData = towersToBuildList.shift()
        if (buildData) gameMap.slots.children[buildData.slotIndex].buildTower(buildData.towerType)

        if (towersToBuildList.length === 0) {
            this.stop()
            this.isOnBuild = false
        }
    }
}

class SlotPointer extends Sprite {
    constructor(x, y) {
        super(sprites.slot_pointer)
        this.anchor.set(0.5)
        this.alpha = 0
        this.rotation = 0
        this.position.x = x
        this.position.y = y
        this.rotationSpeed = 0.03
        this.scaleSpeed = 0.02
        this.isScaleUp = false
    }

    show() {
        this.alpha = 1
        tickerAdd(this)
    }
    hide() {
        this.alpha = 0
        tickerRemove(this)
    }
    tick(delta) {
        this.rotation += this.rotationSpeed * delta
        let scale = (this.isScaleUp) ? this.scale.x + this.scaleSpeed  * delta : this.scale.x - this.scaleSpeed  * delta
        this.scale.x = scale
        this.scale.y = scale
        if (scale > 1) this.isScaleUp = false
        if (scale < 0.5) this.isScaleUp = true
    }
}

class Slot extends AnimatedSprite {
    constructor(x, y) {
        super(sprites.slot.animations.open)
        this.anchor.set(0.5)
        this.position.x = x
        this.position.y = y
        this.pointer = new SlotPointer(x, y)
        this.isEmpty = true
        this.index = gameMap.slots.children.length
        this.loop = false
        this.animationSpeed = 0.75
        gameMap.slots.addChild(this)
        gameMap.markers.addChild(this.pointer)

        this.eventMode = 'static'
        this.on('pointertap', this.build.bind(this))
    }

    build() {
        if (!buildInfo.isActive || !this.isEmpty) return

        const buildData = {towerType: buildInfo.type, slotIndex: this.index}
        towersToBuildList.push(buildData)

        state.player.components.count -= state.player.defense[buildInfo.type].price
        componentsOnChange()

        buildInfo.reset()
        this.isEmpty = false
        gameMap.base.build()

        if (isTraining === false) sendMessage({type: 'towerAdd', data: buildData})
    }

    buildTower(type) {
        this.play()
        this.onComplete = this.buildComplete.bind(this, type)
    }

    buildComplete(type) {
        buildTower(type, this.position.x, this.position.y, 'player', gameMap)
        this.textures = sprites.slot.animations.close
        this.onComplete = null
        this.animationSpeed = 0.25
        this.play()
    }
}

EventHub.on( events.showResults, clearMap )
function clearMap() {
    clearContainer(gameMap.markers)
    clearContainer(gameMap.air)
    clearContainer(gameMap.bullets)
    clearContainer(gameMap.effects)
    clearContainer(gameMap.towers)
    clearContainer(gameMap.radiuses)
    clearContainer(gameMap.shadows)
    clearContainer(gameMap.ground)
    gameMap.attackers = []


    buildInfo.type = ''
    buildInfo.price = 0
    buildInfo.isActive = false

    towersToBuildList = []
    let slots = []
    gameMap.slots.children.forEach(slot => slots.push({x: slot.position.x, y: slot.position.y}))
    clearContainer(gameMap.slots)
    slots.forEach(point => new Slot(point.x, point.y))
}

class GameMap extends Container {
    constructor(screenData, mapScheme, bgName) {
        super()
        gameMap = this
        this.markers = new Container()
        this.air = new Container()
        this.bullets = new Container()
        this.effects = new Container()
        this.trees = new Container()
        this.towers = new Container()
        this.radiuses = new Container()
        this.shadows = new Container()
        this.ground = new Container()
        this.slots = new Container()
        this.baseContainer = new Container()

        this.addChild(this.baseContainer, this.slots, this.ground, this.shadows, this.radiuses, this.towers,
            this.trees, this.bullets, this.air, this.effects, this.markers)

        this.base = null
        this.airStartPoints = []
        this.groundStartPoints = []
        this.attackers = []

        this.mapScheme = mapScheme
        this.startX = -(mapScheme[0].length * settings.ceilSize * 0.5) 
        this.startY = -(mapScheme.length * settings.ceilSize)

        setTrees(bgName)
        this.fillMap(true)

        this.airStartPointIndex = 1
        this.groundStartPointIndex = 3

        this.screenResize( screenData )
    }

    screenResize(screenData) {
        this.position.x = (screenData.width - settings.sidebarRightWidth) * 0.5
        this.position.y = screenData.height - settings.sidebarBottomHeight - 24
    }

    addAttacker() {
        switch( this.attackers.shift() ) {
            case 'bombCarrier' : this.ground.addChild( new BombCarrier( this.getStartPoint('ground'), 'player_red', this, 'opponent') ); break;
            case 'spider' : this.ground.addChild( new Spider( this.getStartPoint('ground'), 'player_red', this, 'opponent') ); break;
            case 'plane' : this.air.addChild( new Plane( this.getStartPoint('air'), 'player_red', this, 'opponent') ); break;
            case 'airship' : this.air.addChild( new Airship( this.getStartPoint('air'), 'player_red', this, 'opponent') ); break;
        }
    }

    getStartPoint( type = 'ground' ) {
        if (type === 'air') {
            this.airStartPointIndex++
            if (this.airStartPointIndex === this.airStartPoints.length) this.airStartPointIndex = 0

            return {
                x: this.airStartPoints[this.airStartPointIndex].position.x,
                y: this.airStartPoints[this.airStartPointIndex].position.y
            }
        } else {
            this.groundStartPointIndex++
            if (this.groundStartPointIndex === this.groundStartPoints.length) this.groundStartPointIndex = 0
            return {
                x: this.groundStartPoints[this.groundStartPointIndex].position.x,
                y: this.groundStartPoints[this.groundStartPointIndex].position.y
            }
        }
    }

    updateTrees(bgName) {
        clearContainer(this.trees)

        treeIndex = 0
        lastLineTrees = []
        currentLineTrees = []

        setTrees(bgName)
        this.fillMap(false)
    }

    fillMap(isFirst = false) {
        for(let line = 0; line < this.mapScheme.length; line++) {
            for(let index = 0; index < this.mapScheme[line].length; index++) {
                const pointX = this.startX + index * settings.ceilSize
                const pointY = this.startY + line * settings.ceilSize

                if (this.mapScheme[line][index] !== 'b') addTree(pointX, pointY)
                if (index === this.mapScheme[line].length - 1) {
                    addTree(pointX + settings.ceilSize, pointY)
                    lastLineTrees = [...currentLineTrees]
                    currentLineTrees = []
                }
                if (line === this.mapScheme.length - 1) {
                    addTree(pointX, pointY + settings.ceilSize)
                    if (index === this.mapScheme[line].length - 1) addTree(pointX + settings.ceilSize, pointY + settings.ceilSize)
                }

                if (isFirst) {
                    switch(this.mapScheme[line][index]) {
                        case 'A' : this.airStartPoints.push( new StartPoint(pointX, pointY) ); break;
                        case 'G' : this.groundStartPoints.push( new StartPoint(pointX, pointY) ); break;
                        case 'x' : new Slot(pointX + settings.ceilHalfSize, pointY + settings.ceilHalfSize); break;
                        case 'B' : if (this.base === null) this.base = new Base(pointX, pointY); break;
                    }
                }
            }
        }
    }

    clear() {
        
    }
}

EventHub.on( events.screenResize, (data) => gameMap.screenResize(data) )

export default GameMap