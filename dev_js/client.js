import { state } from './state'
import { miniMap } from './miniMap'
import { startOnline, showResults, EventHub, events } from './events'
import { tickerClear } from './application'
import { gameUI } from './gameUI'
import { gameMap } from './gameMap'
import { isResult } from './game'

let socket = null
let target = '' // opponent socket name ('first' or 'second')

export function closeSocket() {
    if (socket) {
        socket.close()
        socket = null
    }
}

export function connectSocket( ip, info ) {
    closeSocket() // for only one connection (socket instance)

    socket = new WebSocket(`ws://${ip}:9898`)
    socket.onopen = openSocket
    socket.onerror = () => info.text = 'ОШИБКА ПОДКЛЮЧЕНИЯ'
}

function openSocket() {
    socket.onmessage = getMessage

    let disconnectResultData = {
        disconnect: true,
        isWin: true,
        isBaseDestroyed: false,
        playerOreMinded: state.player.totalOreMined,
        opponentOreMiOreMinded: state.opponent.totalOreMined
    }
    socket.onclose = () => updateUIandShowResults(disconnectResultData)
    socket.onerror = () => updateUIandShowResults(disconnectResultData)
}

function getMessage( data ) {
    const message = JSON.parse(data.data)
    //if (message.type !== 'oreAdd') console.log('get message', message)

    // types: 'connect', 'start', 'disconnect', 'oreAdd', 'towerAdd', 'towerUpgrade', 'armyAdd', 'armyUpgrade', 'getDamage'
    // data:     name     null    description,   number  {type, index}     type         type         type          number

    switch(message.type) {
        case 'connect':
            target = message.data
            if (target === 'first') startOnline()
            break;
        case 'start':
            startOnline()
            break;
        case 'disconnect':
            const menuData = {
                disconnect: true,
                isWin: true,
                isBaseDestroyed: false,
                playerOreMinded: state.player.totalOreMined,
                opponentOreMiOreMinded: state.opponent.totalOreMined
            }
            updateUIandShowResults(menuData)
            break;

        case 'oreAdd':
            state.opponent.totalOreMined++
            break;

        case 'repair':
            state.opponent.defense.base.hp += 10
            if (state.opponent.defense.base.hp > 100) state.opponent.defense.base.hp = 100
            gameUI.opponentBaseHP.update()
            break;

        case 'towerAdd':
            miniMap.addTowerOnMiniMap(message.data)
            break;
        
        case 'towerUpgrade':
            state.opponent.defense[message.data].radius += state.opponent.defense[message.data].upgrade.radius
            state.opponent.defense[message.data].speed += state.opponent.defense[message.data].upgrade.speed
            state.opponent.defense[message.data].air += state.opponent.defense[message.data].upgrade.air
            state.opponent.defense[message.data].ground += state.opponent.defense[message.data].upgrade.ground
            break;

        case 'attack':
            gameMap.attackers = gameMap.attackers.concat([...message.data])
            if (gameUI.addAttackersTimeout === 0 && gameMap.attackers.length) {
                gameUI.addAttackersTimeout = state.nextUnitTimeout
            }
            break;

        case 'attackUpgrade':
            state.opponent.attack[message.data].speed += state.opponent.attack[message.data].upgrade.speed
            state.opponent.attack[message.data].power += state.opponent.attack[message.data].upgrade.power
            state.opponent.attack[message.data].armor += state.opponent.attack[message.data].upgrade.armor
            break;

        case 'finished':
            const resultData = { disconnect: false }

            if (message.data.winType === 'ore') {
                state.opponent.totalOreMined = message.data.ore

                resultData.isWin = state.player.totalOreMined > state.opponent.totalOreMined
                resultData.isBaseDestroyed = false
            } else {
                //message.data.winType === 'baseHP'
                resultData.isWin = message.data.isWinner
                resultData.isBaseDestroyed = true
            }

            resultData.playerOreMinded = state.player.totalOreMined,
            resultData.opponentOreMiOreMinded = state.opponent.totalOreMined

            socket.send( JSON.stringify({target: 'server', message: 'stop'}) )

            updateUIandShowResults( resultData )
            break;
    }
}

function updateUIandShowResults( resultData ) {
    if (isResult) return

    closeSocket()
    gameUI.stop()
    tickerClear()
    showResults(resultData)
}

function sendMessage( message ) {
    if (socket === null) return

    socket.send( JSON.stringify({target, message}) )
}

EventHub.on( events.sendMessage, sendMessage )