const magic = '\u200b'

module.exports = function nomorecensor(mod) {
    const command = mod.command || mod.require.command;
    let badwords = []

    mod.queryData('/AbuseLetterList/').then(result => {
        badwords = result.children.map(x => x.attributes.string.trimEnd().toLowerCase())
    })

    const CHAT_SERVER_PACKETS = [['S_CHAT', 3], ['S_WHISPER', 3], ['S_PRIVATE_CHAT', 1]];
    const CHAT_CLIENT_PACKETS = [['C_WHISPER', 1], ['C_CHAT', 1]];
    for (let [packet, version] of CHAT_SERVER_PACKETS) mod.hook(packet, version, { order: 100000000, filter: { fake: null } }, event => uncensorPacket(packet, event))
    for (let [packet, version] of CHAT_CLIENT_PACKETS) mod.hook(packet, version, { order: 100000000, filter: { fake: null } }, event => uncensorPacket(packet, event))

    const uncensorPacket = (packet, event) => {
        if (packet == "C_CHAT" && event.channel == 18) return
        let uncensored = uncensor(event.message)
        if (!uncensored || uncensored == event.message) return
        event.message = uncensored
        return true
    }

    const uncensor = (str, debug = false) => {
        for (let i = 0; i < badwords.length; i++) {
            if (i > 0 && badwords[i] == badwords[i - 1]) continue
            let position = str.toLowerCase().indexOf(badwords[i])
            let count = 0
            while (position !== -1) {
                count++
                str = str.substr(0, position + 1) + magic + str.substr(position + 1)
                position = str.toLowerCase().indexOf(badwords[i], position + 2)
                if (count > 100) break
            }
            if (debug && count > 0) {
                console.log(str.split('').map(x => `${x}:${x.charCodeAt(0)}`))
                console.log(`badword ${badwords[i]} found ${count} times`)
            }
        }
        return str
    }

    this.destructor = () => {
    };
}
