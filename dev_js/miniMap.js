import { Sprite, Container, AnimatedSprite, Graphics, TilingSprite } from "pixi.js"
import { sprites } from "./loader"
import { EventHub, events, setHelpText } from './events'
import { state } from './state'
import { tickerAdd, tickerRemove, clearContainer } from "./application"
import { buildTower } from "./towers"
import { BombCarrier, Spider, Plane, Airship } from "./army"

const settings = {
    scaledWidth: 280,
    scaledHeight: 210,
    scaleRate: 0.25,

    sidebarBottomHeight: 38,
    sidebarRightWidth: 320,
    sidebarTopHeight: 112,

    ceilSize: 96,
    ceilHalfSize: 48,
}
settings.width = settings.scaledWidth / settings.scaleRate
settings.height = settings.scaledHeight / settings.scaleRate

export let miniMap = null

let towersToBuildList = []

let trees = []
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
        miniMap.trees.addChild(this)
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
        miniMap.baseContainer.addChild(this)
    }
}

class Base extends AnimatedSprite {
    constructor(x, y) {
        super(sprites.base_red.animations.build)
        this.anchor.set(0.5)
        this.position.x = x + settings.ceilSize
        this.position.y = y + settings.ceilSize
        this.isOnBuild = false
        this.animationSpeed = 0.75
        this.onLoop = this.buildComplete.bind(this)
        miniMap.baseContainer.addChild(this)
    }

    build() {
        if (this.isOnBuild) return

        this.isOnBuild = true
        this.play()
    }

    buildComplete() {
        // data -> {towerType: buildInfo.type, slotIndex: this.index}
        const buildData = towersToBuildList.shift()
        if (buildData) miniMap.slots.children[buildData.slotIndex].buildTower(buildData.towerType)

        if (towersToBuildList.length === 0) {
            this.stop()
            this.isOnBuild = false
        }
    }
}

class Slot extends AnimatedSprite {
    constructor(x, y) {
        super(sprites.slot.animations.open)
        this.anchor.set(0.5)
        this.position.x = x
        this.position.y = y
        this.isEmpty = true
        this.index = miniMap.slots.children.length
        this.loop = false
        this.animationSpeed = 0.75
        miniMap.slots.addChild(this)
    }

    buildTower(type) {
        this.play()
        this.onComplete = this.buildComplete.bind(this, type)
    }

    buildComplete(type) {
        buildTower(type, this.position.x, this.position.y, 'opponent', miniMap)
        this.textures = sprites.slot.animations.close
        this.onComplete = null
        this.animationSpeed = 0.25
        this.play()
    }
}

EventHub.on( events.showResults, clearMap )
function clearMap() {
    clearContainer(miniMap.markers)
    clearContainer(miniMap.air)
    clearContainer(miniMap.bullets)
    clearContainer(miniMap.effects)
    clearContainer(miniMap.towers)
    clearContainer(miniMap.shadows)
    clearContainer(miniMap.ground)
    miniMap.attackers = []

    towersToBuildList = []
    let slots = []
    miniMap.slots.children.forEach(slot => slots.push({x: slot.position.x, y: slot.position.y}))
    clearContainer(miniMap.slots)
    slots.forEach(point => new Slot(point.x, point.y))
}

class MiniMap extends Container {
    constructor(mapScheme, bgName) {
        super()

        this.scale.set(0.25)

        miniMap = this

        this.maskBorder = new Graphics()
        this.maskBorder.beginFill()
        this.maskBorder.drawRoundedRect( -settings.width * 0.5, -settings.height + 24, settings.width, settings.height, 48 )
        this.maskBorder.endFill()
        this.addChild(this.maskBorder)
        this.mask = this.maskBorder

        this.background = new TilingSprite( sprites[bgName] )
        this.background.width = settings.width
        this.background.height = settings.height
        this.background.position.x = -settings.width * 0.5
        this.background.position.y = -settings.height + 24

        this.markers = new Container()
        this.air = new Container()
        this.bullets = new Container()
        this.effects = new Container()
        this.trees = new Container()
        this.towers = new Container()
        this.shadows = new Container()
        this.ground = new Container()
        this.slots = new Container()
        this.baseContainer = new Container()

        this.addChild(this.background, this.baseContainer, this.slots, this.ground, this.shadows, this.towers,
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

        this.eventMode = 'static'
        this.on('pointerenter', () => setHelpText('Спутниковое слежение за оппонентом') )
        this.on('pointerleave', () => setHelpText('') )
    }

    addTowerOnMiniMap(data) {
        // data -> {towerType: buildInfo.type, slotIndex: this.index}
        towersToBuildList.push(data)
        miniMap.base.build()
    }

    addAttacker() {
        switch( this.attackers.shift() ) {
            case 'bombCarrier' : this.ground.addChild( new BombCarrier( this.getStartPoint('ground'), 'player_blue', this, 'player') ); break;
            case 'spider' : this.ground.addChild( new Spider( this.getStartPoint('ground'), 'player_blue', this, 'player') ); break;
            case 'plane' : this.air.addChild( new Plane( this.getStartPoint('air'), 'player_blue', this, 'player') ); break;
            case 'airship' : this.air.addChild( new Airship( this.getStartPoint('air'), 'player_blue', this, 'player') ); break;
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

    setBackgroundImage(backgroundImage) {
        this.background.texture = sprites[backgroundImage]
    }

    updateTrees(bgName) {
        clearContainer(this.trees)

        trees = []
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
}

EventHub.on( events.addTowerOnMiniMap, (data) => miniMap.addTowerOnMiniMap(data) )

export default MiniMap