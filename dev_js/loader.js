import { Assets } from 'pixi.js'
import { getLoadingBar, removeLoadingBar } from './loadingBar'

const isFullScreen = true

const paths = {
    sprites : './src/images/',
    sounds : './src/sounds/',
    music : './src/music/',
    fonts : './src/fonts/',
}

export const sprites = {
    main_menu_background: 'main_background_image_2048x2048px.jpg',
    lose_background: 'lose_background_image_2800x1600px.jpg',
    win_background: 'win_background_image_2800x1600px.jpg',

    background_tile_1: 'bg1_192x192px.png',
    background_tile_2: 'bg2_256x256px.png',
    background_tile_3: 'bg3_350x350px.png',

    title: 'game_title.png',
    ui: 'ui.json',
    ui_input: 'ui_input_bg_508x84px.png',
    ui_repair: 'icon_repair_96x96px.png',
    ui_base_repair: 'icon_base_repair_96x96px.png',
    ui_bg_red: 'ui_bg_red_112x112px.png',
    ui_bg_purple: 'ui_bg_purple_320x112px.png',
    ui_bg_blue: 'ui_bg_blue_112x38px.png',

    tree_1: 'tree_1_128x128px.png',
    tree_2: 'tree_2_128x128px.png',
    tree_3: 'tree_3_128x128px.png',
    tree_4: 'tree_4_128x128px.png',
    tree_5: 'tree_5_128x128px.png',
    tree_6: 'tree_6_128x128px.png',

    star_flash: 'star_flash_32x32px_11frames.json',

    slot_pointer: 'tower_pointer_86x86px.png',
    slot: 'slot.json',
    base_blue: 'base_blue.json',
    base_red: 'base_red.json',
    player_blue: 'player_blue.json',
    player_red: 'player_red.json',

    explosion_64: 'explosion_64x64px_17frames.json',
    explosion_128: 'explosion_128x128px_20frames.json',
    explosion_192: 'explosion_192x192px_25frames.json',
    explosion_240: 'explosion_240x240px_28frames.json',
    explosion_256: 'explosion_256x256px_48frames.json',
    explosion_256_long: 'explosion_256x256px_72frames.json',
    smoke_32: 'smoke_32x32px_25frames.json',
    smoke_42: 'smoke_42x42px_14frames.json',
}
const spritesNumber = Object.keys(sprites).length
for (let sprite in sprites) sprites[sprite] = paths.sprites + sprites[sprite]

export const sounds = {
    attack_wave_start: 'se_attack_wave_start.mp3',
    upgrade: 'se_upgrade.mp3',
    menu: 'se_menu.mp3',
    add: 'se_add.mp3',
    remove: 'se_remove.mp3',
    build: 'se_build.mp3',
    shut: 'se_shut.mp3',
    rocket: 'se_rocket.mp3',
    electro: 'se_electro.mp3',
    hit: 'se_hit.mp3',
    explosion: 'se_explosion.mp3',
}
const soundsNumber = Object.keys(sounds).length
for (let se in sounds) sounds[se] = paths.sounds + sounds[se]

export const music = {
    game: ['bgm_0.mp3', 'bgm_1.mp3', 'bgm_2.mp3', 'bgm_3.mp3', 'bgm_4.mp3', 'bgm_5.mp3', 'bgm_6.mp3',],
    menu: ['bgm_menu.mp3'],
    lose: ['bgm_lose.mp3'],
    win: ['bgm_win.mp3'],
}
for (let bgm in music) music[bgm] = music[bgm].map(fileName => paths.music + fileName)

export const fonts = {
    black: 'Roboto-Black.ttf',
    bold: 'Roboto-Bold.ttf',
    regular: 'Roboto-Regular.ttf',
    thin: 'Roboto-Thin.ttf',
}
for (let font in fonts) fonts[font] = paths.fonts + fonts[font]

///////////////////////////////////////////////////////////////////

export function uploadAssets( loadingDoneCallback ) {
    const assetsNumber = spritesNumber + soundsNumber
    let loadedAssets = 0
    let progressPerAsset = 100 / assetsNumber

    const loadingBar = getLoadingBar()

    const loading = () => {
        loadedAssets++
        loadingBar.update(progressPerAsset * loadedAssets)
        if (loadedAssets === assetsNumber) {
            removeLoadingBar(isFullScreen)
            loadingDoneCallback()
        }
    }

    for (let sprite in sprites) {
        Assets.add( {alias: sprite, src: sprites[sprite]} )
        Assets.load( sprite ).then(data => {
            sprites[sprite] = data
            loading()
        })
    }

    for (let se in sounds) {
        Assets.add( {alias: se, src: sounds[se]} )
        Assets.load( se ).then(data => {
            sounds[se] = data
            loading()
        })
    }
}