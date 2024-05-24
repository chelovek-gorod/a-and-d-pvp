import { EventHub, events, addTowerOnMiniMap } from './events'
import { state } from './state'

const startArmyAddTimeout = 10 * 60
const settings = {
    slots: [
        // top line 1 - left slots
        {gun: 'tesla', timeout: 230 * 60}, // 11
        {gun: 'rocket', timeout: 150 * 60}, // 5

        // top line 1 - right slots
        {gun: 'rocket', timeout: 170 * 60}, // 6
        {gun: 'tesla', timeout: 240 * 60}, // 12

        // top line 2 - left slots
        {gun: 'rocket', timeout: 185 * 60}, // 7
        {gun: 'gatling', timeout: 40 * 60}, // 1

        // top line 2 - right slots
        {gun: 'gatling', timeout: 75 * 60}, // 2
        {gun: 'rocket', timeout: 200 * 60}, // 8

        // bottom line - left slots
        {gun: 'tesla', timeout: 220 * 60}, // 10
        {gun: 'gatling', timeout: 130 * 60}, // 4

        // bottom line - right slots
        {gun: 'gatling', timeout: 105 * 60}, // 3
        {gun: 'tesla', timeout: 210 * 60}, // 9
    ],
    army: {
        spider: 4,
        bombCarrier: 5,
        plane: 3,
        airship: 2,
    },
    armyAddTimeout: startArmyAddTimeout,
    oreAddTimeout: 1 * 45
}

class Opponent {
    constructor() {
        this.guns = settings.slots.map( (gun, index) => {
            return {type: 'defense', name: gun.gun, timeout: gun.timeout, index}
        })
        this.guns.sort((gunA, gunB) => gunA.timeout - gunB.timeout)

        this.army = []
        for (let type in settings.army) {
            for (let i = 0; i < settings.army[type]; i++) this.army.push(type)
        }
        this.army.sort( () => Math.random() - 0.5 )
        this.armyIndex = Math.floor(Math.random() * this.army.length)
        this.armyAddTimeout = settings.armyAddTimeout
        this.oreAddTimeout = settings.oreAddTimeout
    }

    update(frame) {
        if (this.guns.length && this.guns[0].timeout <= frame) {
            let tower = this.guns.shift()
            // data -> {towerType: buildInfo.type, slotIndex: this.index}
            addTowerOnMiniMap({towerType: tower.name, slotIndex: tower.index})
        }

        if (this.armyAddTimeout <= frame) {
            this.armyAddTimeout += settings.armyAddTimeout

            const armyType = this.army[this.armyIndex]
            state.opponent.army.push(armyType)

            this.armyIndex++
            if (this.armyIndex === this.army.length) this.armyIndex = 0
        }

        if (this.oreAddTimeout <= frame) {
            this.oreAddTimeout += settings.oreAddTimeout
            state.opponent.totalOreMined++
        }
    }

    nextWave() {
        if (state.currentWave === state.waveTimeouts.length) {
            settings.armyAddTimeout = startArmyAddTimeout
        } else {
            settings.armyAddTimeout = Math.ceil( settings.armyAddTimeout / (state.currentWave * 2) )
        }
    }
}

export default Opponent