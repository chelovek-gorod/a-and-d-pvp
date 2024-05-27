import { Sprite, Graphics } from "pixi.js"
import { sprites, sounds } from "./loader"
import { EventHub, events } from './events'
import { state } from './state'
import { playSound } from './sound'
import { tickerAdd, tickerRemove, removeSprite } from "./application"
import { turnSpriteToTarget, moveSprite, getDistance, drawLightning } from './functions'
import Effect from "./effects"
import { isResult } from './game'

const towerRadiusRate = 36

function getNearestEnemy(point) {
    let target = null
    let minDistance = Infinity
    point.parentMap.air.children.forEach( enemy => {
        let distance = getDistance(point, enemy)
        if(distance < minDistance) {
            minDistance = distance
            target = enemy
        }
    })
    point.parentMap.ground.children.forEach( enemy => {
        let distance = getDistance(point, enemy)
        if(distance < minDistance) {
            minDistance = distance
            target = enemy
        }
    })
    return target
}

class GatlingBullet extends Sprite {
    constructor(x, y, rotation, distance, owner) {
        super(sprites.player_blue.textures.tesla_top)
        this.anchor.set(0.5)
        this.position.x = x
        this.position.y = y
        this.rotation = rotation
        this.scale.set(0.25)
        this.speed = 12
        this.distance = distance
        this.power = {
            ground: state[owner].defense.gatling.ground,
            air: state[owner].defense.gatling.air,
        }
        tickerAdd(this)
        playSound(sounds.shut)
    }

    tick(delta) {
        if (this.destroyed) return

        let pathSize = delta * this.speed
        moveSprite(this, pathSize)
        this.distance -= pathSize
        if (this.distance <= 0) this.delete()
    }

    delete() {
        tickerRemove(this)
        removeSprite(this)
    }
}

class RocketRocket extends Sprite {
    constructor(x, y, rotation, distance, owner, parentMap) {
        super(sprites.player_blue.textures.rocket_rocket)
        this.anchor.set(0.5)
        this.position.x = x
        this.position.y = y
        this.rotation = rotation
        this.parentMap = parentMap

        tickerAdd(this)
        this.speed = 6
        this.turnSpeed = 0.1
        this.distance = distance
        this.power = {
            ground: state[owner].defense.rocket.ground,
            air: state[owner].defense.rocket.air,
        }
        this.isSmoke = true
        playSound(sounds.rocket)
    }

    tick(delta) {
        if (this.destroyed) return

        let pathSize = delta * this.speed
        moveSprite(this, pathSize)
        this.distance -= pathSize

        this.isSmoke = !this.isSmoke
        if(this.isSmoke) new Effect(this.position.x, this.position.y, 'smoke_32', this.parentMap)

        if (this.distance <= 0) {
            this.delete()
        } else {
            let target = getNearestEnemy(this)
            if (target) turnSpriteToTarget(this, target, this.turnSpeed)
            else this.delete()
        }
    }

    delete() {
        tickerRemove(this)
        removeSprite(this)
    }
}

class TeslaShut extends Sprite {
    constructor(x, y, target, owner, parentMap) {
        super(sprites.player_blue.textures.tesla_top)
        this.anchor.set(0.5)
        this.position.x = x
        this.position.y = y
        this.target = target
        this.power = {
            ground: state[owner].defense.tesla.ground,
            air: state[owner].defense.tesla.air,
        }
        this.parentMap = parentMap
        this.graphics = new Graphics()
        this.parentMap.bullets.addChild(this.graphics)
        this.duration = 15
        tickerAdd(this)
        this.isSmoke = false
        playSound(sounds.electro)
    }

    tick(delta) {
        if (this.destroyed) return

        if (this.target.destroyed) return this.delete()

        this.duration -= delta
        if (this.duration > 0) {
            drawLightning(this, this.target, this.graphics)
            this.isSmoke = !this.isSmoke
            if (this.isSmoke) new Effect(this.target.position.x, this.target.position.y, 'smoke_32', this.parentMap)
        } else {
            this.target.setDamage( this.power[this.target.damageType] )
            this.delete()
        }
    }

    delete() {
        tickerRemove(this)
        removeSprite(this.graphics)
        removeSprite(this)
    }
}

class Gatling extends Sprite {
    constructor(sprite, x, y, owner, parentMap) {
        super(sprites[sprite].textures.gatling_0)
        this.type = 'gatling'
        this.sprite = sprite
        this.init(x, y, owner, parentMap)
        
        this.offsetGun = 55
        this.isLeftGun = true
        this.images = ["gatling_0","gatling_1","gatling_2","gatling_3"]
        this.imageIndex = 0
    }

    shut() {
        const offsetAngle = (this.isLeftGun) ? this.rotation - Math.PI * 0.15 : this.rotation + Math.PI * 0.15
        const pointX = this.position.x + Math.cos(offsetAngle) * this.offsetGun
        const pointY = this.position.y + Math.sin(offsetAngle) * this.offsetGun

        new Effect(pointX, pointY, 'smoke_32', this.parentMap)

        this.isLeftGun = !this.isLeftGun
        this.parentMap.bullets.addChild( new GatlingBullet(pointX, pointY, this.rotation, this.radius, this.owner) )
    }
}

class Rocket extends Sprite {
    constructor(sprite, x, y, owner, parentMap) {
        super(sprites[sprite].textures.rocket)
        this.type = 'rocket'
        this.init(x, y, owner, parentMap)

        this.offsetGun = 40
        this.isLeftGun = true
    }

    shut() {
        const offsetAngle = (this.isLeftGun) ? this.rotation - Math.PI * 0.25 : this.rotation + Math.PI * 0.25
        const pointX = this.position.x + Math.cos(offsetAngle) * this.offsetGun
        const pointY = this.position.y + Math.sin(offsetAngle) * this.offsetGun

        new Effect(pointX, pointY, 'smoke_32', this.parentMap)

        this.isLeftGun = !this.isLeftGun
        this.parentMap.bullets.addChild( new RocketRocket(pointX, pointY, this.rotation, this.radius, this.owner, this.parentMap) )
    }
}


class Tesla extends Sprite {
    constructor(sprite, x, y, owner, parentMap) {
        super(sprites[sprite].textures.tesla)
        this.type = 'tesla'
        this.init( x, y, owner, parentMap )
    }

    shut(target) {
        this.parentMap.bullets.addChild( new TeslaShut(this.position.x, this.position.y, target, this.owner, this.parentMap) )
    }
}

const towerMixin = {
    init( x, y, owner, parentMap ) {
        this.anchor.set(0.5)
        this.position.x = x
        this.position.y = y

        this.parentMap = parentMap
        this.owner = owner

        if (this.type !== 'tesla') this.rotation = -Math.PI * 0.25
        this.turnSpeed = (this.type !== 'tesla') ? 0.1 : Infinity
        this.scale.set(0.2)
        this.scaleSpeed = 0.02

        this.upgrade()
        this.nextShutDelay = 0
        
        tickerAdd(this)

        if (this.owner === 'player') {
            this.radiusLine = new Graphics()
            this.radiusLine.position.set(this.position.x, this.position.y)
            this.parentMap.radiuses.addChild(this.radiusLine)
            this.eventMode = 'static'
            this.on('pointerenter', this.drawRadius.bind(this, true) )
            this.on('pointerleave', this.drawRadius.bind(this, false) )
            EventHub.on( events.playerTowerUpgrade, this.upgrade.bind(this) )
        } else {
            EventHub.on( events.opponentTowerUpgrade, this.upgrade.bind(this) )
        }
        
        this.parentMap.towers.addChild(this)       
    },

    upgrade() {
        this.radius = state[this.owner].defense[this.type].radius * towerRadiusRate
        this.shutTimeout = 60 / state[this.owner].defense[this.type].speed
    },

    drawRadius(isDraw) {
        this.radiusLine.clear()
        if (!isDraw) return

        this.radiusLine.lineStyle(6, 0xff0000, 0.75)
        this.radiusLine.beginFill(0xffff00, 0.25)
        this.radiusLine.drawCircle(0, 0, this.radius)
    },

    tick(delta) {
        if (this.destroyed) return
        if (isResult) return this.delete()

        if (this.scale.x < 1) {
            let scale = this.scale.x += this.scaleSpeed * delta
            if (scale > 1) scale = 1
            this.scale.x = scale
            this.scale.y = scale
        }
        
        let target = getNearestEnemy(this)
        if (target) {
            if (this.type !== 'tesla') turnSpriteToTarget(this, target, this.turnSpeed)

            if (this.nextShutDelay > 0) this.nextShutDelay -= delta

            if (getDistance(this, target) < this.radius && this.nextShutDelay <= 0) {
                this.nextShutDelay = this.shutTimeout

                if (this.type === 'gatling') {
                    this.imageIndex++
                    if (this.imageIndex === this.images.length) this.imageIndex = 0
                    this.texture = sprites[this.sprite].textures[ this.images[this.imageIndex] ]
                }
                this.shut(target)
            }
        }
    },

    delete() {
        if (this.destroyed) return

        tickerRemove(this)
        removeSprite(this)
    }
}

Object.assign(Gatling.prototype, towerMixin)
Object.assign(Rocket.prototype, towerMixin)
Object.assign(Tesla.prototype, towerMixin)

export function buildTower(type, x, y, owner, parentMap) {
    const sprite = (owner === 'player') ? 'player_blue' : 'player_red'
    switch(type) {
        case 'gatling' : return new Gatling(sprite, x, y, owner, parentMap);
        case 'rocket' : return new Rocket(sprite, x, y, owner, parentMap);
        case 'tesla' : return new Tesla(sprite, x, y, owner, parentMap);
    }
}