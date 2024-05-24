'use strict'

const { WebSocketServer } = require('ws')
const { networkInterfaces } = require('os')

// GET IP-ADDRESS

const netI = networkInterfaces();
let ip = ''
for(let name in netI) {
    netI[name].forEach(data => {
        if (data.internal === false && data.family === 'IPv4') ip = data.address
    })
}
console.log(ip)

// CONNECTION

const clients = {
    first: null,
    second: null,
}

const server = new WebSocketServer({ port: 9898 })
server.on('connection', getConnection)
server.on('error', getError)

function getConnection( client ) {
    console.log(`+++ get new connection: {first: ${!!clients.first}, second: ${!!clients.second}}`)

    const message = { type: 'connect' }
    if (clients.first === null) {
        clients.first = client
        message.data = 'second'
    } else if (clients.second === null) {
        clients.second = client
        message.data = 'first'
        clients.first.send( JSON.stringify({ type: 'start', data: null }) )
    } else {
        message.data = 'no more players'
    }
    client.send( JSON.stringify(message) )

    client.on('message', getMessage)
    client.on('close', () => {
        console.log('--close client--')
        if (client === clients.first) {
            console.log('first closed')
            if (clients.second) clients.second.send( JSON.stringify({ type: 'disconnect', data: null }) )
            clients.first = null
            clients.second = null
        } else if (client === clients.second) {
            console.log('second closed')
            if (clients.first) clients.first.send( JSON.stringify({ type: 'disconnect', data: null }) )
            clients.first = null
            clients.second = null
        }
        console.log(`... client CLOSE ... clients: {first: ${!!clients.first}, second: ${!!clients.second}}`)
    })
}

function getMessage( data ) {
    const message = JSON.parse(data)

    if (message.target === 'server' && message.message === 'stop') {
        clients.first = null
        clients.second = null
        console.log(`>>> server STOP clients: {first: ${!!clients.first}, second: ${!!clients.second}}`)
    } else if (clients[message.target]) clients[message.target].send( JSON.stringify(message.message) )
    else console.log('client', message.target, 'is null')
}

function getError( data ) {
    console.log('get error', data)
}