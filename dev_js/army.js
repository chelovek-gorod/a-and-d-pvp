import { Sprite, AnimatedSprite, Graphics } from "pixi.js"
import { sprites, sounds } from "./loader"
import { setBaseDamageFrom } from './events'
import { state } from './state'
import { playSound } from './sound'
import { tickerAdd, tickerRemove, removeSprite } from "./application"
import { turnSpriteToTarget, moveSprite, getDistance } from './functions'
import Effect from "./effects"
import { isResult } from './game'

const baseDistance = 100
const speedRate = 0.2
const shadowOffsetY = 64

export class BombCarrier extends AnimatedSprite {
    constructor(startPoint, sprite_atlas, parentMap, owner) {
        super(sprites[sprite_atlas].animations.bomb_carrier)
        this.size = 48
        this.damageType = 'ground'
        this.init('bombCarrier', startPoint, parentMap, owner)

        this.animationSpeed = 0.5
        this.play()
    }
}

export class Spider extends AnimatedSprite {
    constructor(startPoint, sprite_atlas, parentMap, owner) {
        super(sprites[sprite_atlas].animations.spider)
        this.size = 16
        this.damageType = 'ground'
        this.init('spider', startPoint, parentMap, owner)

        this.animationSpeed = 0.5
        this.play()
    }
}

export class Plane extends Sprite {
    constructor(startPoint, sprite_atlas, parentMap, owner) {
        super(sprites[sprite_atlas].textures.plane)
        this.size = 32
        this.damageType = 'air'
        this.init('plane', startPoint, parentMap, owner)

        this.shadow = new Sprite(sprites[sprite_atlas].textures.plane_shadow)
        this.shadow.anchor.set(0.5)
        this.shadow.position.x = startPoint.x
        this.shadow.position.y = startPoint.y + shadowOffsetY
        turnSpriteToTarget(this.shadow, this.parentMap.base, Infinity)
        this.parentMap.shadows.addChild(this.shadow)
    }
}

export class Airship extends Sprite {
    constructor(startPoint, sprite_atlas, parentMap, owner) {
        super(sprites[sprite_atlas].textures.airship)
        this.size = 64
        this.damageType = 'air'
        this.init('airship', startPoint, parentMap, owner)

        this.shadow = new Sprite(sprites[sprite_atlas].textures.airship_shadow)
        this.shadow.anchor.set(0.5)
        this.shadow.position.x = startPoint.x
        this.shadow.position.y = startPoint.y + shadowOffsetY
        turnSpriteToTarget(this.shadow, this.parentMap.base, Infinity)
        this.parentMap.shadows.addChild(this.shadow)
    }
}

const armyMixin = {
    init(type, startPoint, parentMap, owner) {
        this.anchor.set(0.5)
        this.position.x = startPoint.x
        this.position.y = startPoint.y

        this.parentMap = parentMap
        this.parentMap.ground.addChild(this)
        turnSpriteToTarget(this, this.parentMap.base, Infinity)

        this.hp = 100
        this.owner = owner
        this.speed = state[this.owner].attack[type].speed * speedRate
        this.armor = state[this.owner].attack[type].armor
        this.power = state[this.owner].attack[type].power

        tickerAdd(this)

        this.hpBar = new Graphics()
        this.parentMap.markers.addChild(this.hpBar)

        this.parentMap[this.damageType].addChild(this)
    },

    tick(delta) {
        if (this.destroyed) return
        if (isResult) return this.delete()

        this.parentMap.bullets.children.forEach( bullet => {
            if ( getDistance(this, bullet) < this.size ) {
                this.hp -= bullet.power[this.damageType] / this.armor
                new Effect(bullet.position.x, bullet.position.y, 'explosion_64', this.parentMap)
                if (this.owner === 'opponent') playSound(sounds.hit)
                bullet.delete()
            }
        })
        if (this.hp <= 0) {
            new Effect(this.position.x, this.position.y, 'explosion_192', this.parentMap)
            if (this.owner === 'opponent') playSound(sounds.explosion)
            return this.delete()
        }
        
        moveSprite(this, this.speed * delta)
        if ( getDistance(this, this.parentMap.base) < baseDistance ) {
            const target = this.owner === 'opponent' ? 'player' : 'opponent'
            state[target].defense.base.hp -= this.power
            if (state[target].defense.base.hp < 0) state[target].defense.base.hp = 0
            setBaseDamageFrom(this.owner)

            if (this.destroyed) return // !!! if unit destroyed by other event

            new Effect(this.position.x, this.position.y, 'explosion_240', this.parentMap)
            if (this.owner === 'opponent') playSound(sounds.explosion)
            return this.delete()
        }
        if (this.damageType === 'air') {
            this.shadow.position.x = this.position.x
            this.shadow.position.y = this.position.y + shadowOffsetY
        }

        this.hpBar.clear()
        this.hpBar.beginFill(0xff0000)
        this.hpBar.drawRect(this.position.x - 25, this.position.y - 50, 50, 5)
        this.hpBar.endFill()
        this.hpBar.beginFill(0x00ff00)
        this.hpBar.drawRect(this.position.x - 25, this.position.y - 50, this.hp * 0.5, 5)
        this.hpBar.endFill()
    },

    setDamage(damage) {
        this.hp -= damage / this.armor
        new Effect(this.position.x, this.position.y, 'explosion_64', this.parentMap)
        if (this.owner === 'opponent') playSound(sounds.hit)
        if (this.hp <= 0) {
            new Effect(this.position.x, this.position.y, 'explosion_192', this.parentMap)
            if (this.owner === 'opponent') playSound(sounds.explosion)
            return this.delete()
        }
    },

    delete() {
        if (this.damageType === 'air') removeSprite(this.shadow)
        removeSprite(this.hpBar)
        tickerRemove(this)
        removeSprite(this)
    }
}

Object.assign(BombCarrier.prototype, armyMixin)
Object.assign(Spider.prototype, armyMixin)
Object.assign(Plane.prototype, armyMixin)
Object.assign(Airship.prototype, armyMixin)