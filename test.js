process.env.DEBUG = '*';

const log = require('debug')('bilibili-danmaku-client/test');

const DanmakuClient = require('./src');

const client = new DanmakuClient(8324350, {
    timeout: 10000,
});
client.start();
client.on('event', ({ name, content }) => {
    switch (name) {
    case 'danmaku':
        log(`${content.sender.name}: ${content.content}`);
        break;
    case 'gift':
        log(`${content.sender.name} => ${content.gift.name} * ${content.num}`);
        break;
    case 'popularity':
        log(`${name} => ${content.count}`);
        break;
    default:
    }
});

process.on('SIGINT', () => client.terminate());
