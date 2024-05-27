const startState = {
    addFramesSteps: [Infinity, 210, 135, 90, 60, 40, 24, 15, 9, 6],
    attackTimeout: 0,
    nextUnitTimeout: 0,
    waveTimeouts: [
        180 * 60,
        120 * 60,
        60 * 60,
    ],
    nextUnitDelays: [60, 50, 40],
    
    currentWave: 0,

    player: {
        totalOreMined : 0,
        energy: {
            used: 3, // use of energy
            max: 5,  // all energy slots
            upgrade: {
                components: 6,
                science: 3,
                rate: 2, // upgrade price rate (components and science)
            }
        },
        ore: {
            count: 0, // current source number
            used: 1, // use of energy
            add: 3, // add ore per frames index of addFramesSteps
        },
        components: {
            count: 0, // current source number
            used: 1, // use of energy
            add: 2, // add ore per frames index of addFramesSteps
        },
        science: {
            count: 0, // current source number
            used: 1, // use of energy
            add: 1, // add ore per frames index of addFramesSteps
        },
        army: [],
        attack: {
            bombCarrier: {
                count: 0,
                speed: 4,
                power: 15,
                armor: 5,
                price: 3,
                upgrade: {
                    price: 6,
                    speed: 0,
                    power: 3,
                    armor: 1,
                    rate: 1.2 // add round(addPrice) and add round(upgrade.price)
                }
            },
            spider: {
                count: 0,
                speed: 8,
                power: 5,
                armor: 2,
                price: 1,
                upgrade: {
                    price: 3,
                    speed: 2,
                    power: 1,
                    armor: 0,
                    rate: 1.2 // add round(addPrice) and add round(upgrade.price)
                }
            },
            plane: {
                count: 0,
                speed: 12,
                power: 10,
                armor: 4,
                price: 5,
                upgrade: {
                    price: 10,
                    speed: 2,
                    power: 2,
                    armor: 1,
                    rate: 1.2 // add round(addPrice) and add round(upgrade.price)
                }
            },
            airship: {
                count: 0,
                speed: 2,
                power: 20,
                armor: 16,
                price: 7,
                upgrade: {
                    price: 12,
                    speed: 0,
                    power: 5,
                    armor: 2,
                    rate: 1.2 // add round(addPrice) and add round(upgrade.price)
                }
            }
        },
        defense: {
            gatling: {
                price: 8,
                ground: 5, // ground power
                air: 5,  // air power
                radius: 6,
                speed: 10, // shuts per second
                upgrade: {
                    price: 6,
                    ground: 1,
                    air: 1,
                    radius: 0,
                    speed: 1,
                    rate: 1.2 // add round(addPrice) and add round(upgrade.price)
                }
            },
            rocket: {
                price: 12,
                ground: 40, // ground power
                air: 60,  // air power
                radius: 12,
                speed: 1, // shuts per second
                upgrade: {
                    price: 8,
                    ground: 0,
                    air: 2,
                    radius: 1,
                    speed: 0.1,
                    rate: 1.2 // add round(addPrice) and add round(upgrade.price)
                }
            },
            tesla: {
                price: 18,
                ground: 160, // ground power
                air: 80,  // air power
                radius: 9,
                speed: 0.5, // shuts per second
                upgrade: {
                    price: 12,
                    ground: 2,
                    air: 0,
                    radius: 1,
                    speed: 0.05,
                    rate: 1.2 // add round(addPrice) and add round(upgrade.price)
                }
            },
            base: {
                hp: 100,
                repair: {
                    components: 6,
                    science: 3,
                    rate: 1.5, // repair price rate (components and science)
                }
            },
        }
    },
}

export function restartState() {
    state.addFramesSteps = [...startState.addFramesSteps]
    state.attackTimeout = startState.attackTimeout
    state.nextUnitTimeout = startState.nextUnitTimeout
    state.waveTimeouts = startState.waveTimeouts
    state.nextUnitDelays = [...startState.nextUnitDelays]
    state.currentWave = startState.currentWave

    state.player = {}
    state.player.totalOreMined = startState.player.totalOreMined
    state.player.energy = {...startState.player.energy}
    state.player.energy.upgrade = {...startState.player.energy.upgrade}
    state.player.ore = {...startState.player.ore}
    state.player.components = {...startState.player.components}
    state.player.science = {...startState.player.science}
    state.player.attack = {
        bombCarrier: {...startState.player.attack.bombCarrier},
        spider: {...startState.player.attack.spider},
        plane: {...startState.player.attack.plane},
        airship: {...startState.player.attack.airship},
    },
    state.player.army = []
    state.player.attack.bombCarrier.upgrade = {...startState.player.attack.bombCarrier.upgrade}
    state.player.attack.spider.upgrade = {...startState.player.attack.spider.upgrade}
    state.player.attack.plane.upgrade = {...startState.player.attack.plane.upgrade}
    state.player.attack.airship.upgrade = {...startState.player.attack.airship.upgrade}
    state.player.defense = {
        gatling: {...startState.player.defense.gatling},
        rocket: {...startState.player.defense.rocket},
        tesla: {...startState.player.defense.tesla},
        base: {...startState.player.defense.base},
    }
    state.player.defense.gatling.upgrade = {...startState.player.defense.gatling.upgrade}
    state.player.defense.rocket.upgrade = {...startState.player.defense.rocket.upgrade}
    state.player.defense.tesla.upgrade = {...startState.player.defense.tesla.upgrade}
    state.player.defense.base.repair = {...startState.player.defense.base.repair}

    state.opponent = {}
    state.opponent.totalOreMined = startState.player.totalOreMined
    state.opponent.energy = {...startState.player.energy}
    state.opponent.energy.upgrade = {...startState.player.energy.upgrade}
    state.opponent.ore = {...startState.player.ore}
    state.opponent.components = {...startState.player.components}
    state.opponent.science = {...startState.player.science}
    state.opponent.attack = {
        bombCarrier: {...startState.player.attack.bombCarrier},
        spider: {...startState.player.attack.spider},
        plane: {...startState.player.attack.plane},
        airship: {...startState.player.attack.airship},
    },
    state.opponent.army = []
    state.opponent.attack.bombCarrier.upgrade = {...startState.player.attack.bombCarrier.upgrade}
    state.opponent.attack.spider.upgrade = {...startState.player.attack.spider.upgrade}
    state.opponent.attack.plane.upgrade = {...startState.player.attack.plane.upgrade}
    state.opponent.attack.airship.upgrade = {...startState.player.attack.airship.upgrade}
    state.opponent.defense = {
        gatling: {...startState.player.defense.gatling},
        rocket: {...startState.player.defense.rocket},
        tesla: {...startState.player.defense.tesla},
        base: {...startState.player.defense.base},
    }
    state.opponent.defense.gatling.upgrade = {...startState.player.defense.gatling.upgrade}
    state.opponent.defense.rocket.upgrade = {...startState.player.defense.rocket.upgrade}
    state.opponent.defense.tesla.upgrade = {...startState.player.defense.tesla.upgrade}
    state.opponent.defense.base.repair = {...startState.player.defense.base.repair}
}

export const state = {}