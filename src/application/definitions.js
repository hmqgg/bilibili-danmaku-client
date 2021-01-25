/**
 * definitions.js describes the Definitions of Application Events.
 * For the concept of Definition, see compile.js.
 * For the concept of Application Events, see Wiki page 'Application Protocol'.
 *
 * This file does not contain much documentation because:
 * - It makes use of Tramsformer.js, compile.js and helpers.js, which are well-
 *   documented.
 * - The code of Definitions are very easy to read and understand.
 * - The details of how JSONs before transformation look like and how Events
 *   after transformation look like are documented in a separate Wiki page
 *   'Events'. That should be the first source of information, not this file.
 *
 * Therefore, the following transformers are NOT documented. My apologies.
 */

const { fromPairs } = require('lodash');

const Transformer = require('./Transformer');
const compile = require('../util/compile');
const { asFlag, onWhen, on, onExist, spread, spreadObj } = require('../util/helpers');

// live start & end
const liveEnd = new Transformer('PREPARING', 'liveEnd', spreadObj(['roomid', parseInt, 'roomId']));
const liveStart = new Transformer('LIVE', 'liveStart', spreadObj(['roomid', parseInt, 'roomId']));

// danmaku
const danmaku = new Transformer('DANMU_MSG', 'danmaku', on(m => m.info, {
    timestamp: i => i[0][3],
    content: i => i[1],
    sender: on(i => i[2], spread('uid', 'name', ['isOwner', asFlag], ['isVip', asFlag], ['isSvip', asFlag])),
    badge: onExist(i => i[3], spread('level', 'name', 'owner', 'roomId')),
    ul: on(i => i[4], {
        ranking: u => u[3],
        level: u => u[0],
    }),
    medal: onExist(i => i[5], spread('first', 'second')),
}));

// gift
const userSrc = spreadObj('face', 'uid', 'guard_level', ['uname', 0, 'name']);
const parseTopUser = compile({
    ...userSrc, ...spreadObj('rank', ['score', 0, 'spentCoins'], ['isSelf', asFlag]),
});
const gift = new Transformer('SEND_GIFT', 'gift', on(m => m.data, {
    ...spreadObj(
        'num', 'remain', 'action', 'timestamp', 'coin_type', 'total_coin', 'super_gift_num', 'effect_block',
    ),
    gift: spreadObj(['giftName', 0, 'name'], ['giftId', 0, 'id'], ['giftType', 0, 'type'], 'price'),
    sender: userSrc,
    left: onWhen(m => m, m => m.gold > 0 && m.silver > 0, spreadObj('gold', 'silver')),
    topList: d => d.top_list?.map(parseTopUser),
}));
const tempoStorm = new Transformer('SPECIAL_GIFT', 'tempoStorm', on(m => m.data[39], {
    ...spreadObj('action', 'id'),
    storm: onWhen(d => d, d => d.action === 'start', spreadObj(
        'content', 'time', 'storm_gif', ['hadJoin', 0, 'joined'], 'num',
    )),
}));
const comboEnd = new Transformer('COMBO_END', 'comboEnd', on(m => m.data, spreadObj(
    'price', 'gift_id', 'gift_name', 'combo_num', 'price', 'gift_id', 'start_time', 'end_time',
    ['uname', 0, 'name'], ['r_uname', 0, 'owner'],
)));

// broadcast message
const guardMsg = new Transformer('GUARD_MSG', 'guardMsg', spreadObj('msg', ['buy_type', 0, 'guardLevel']));
const sysMsg = new Transformer('SYS_MSG', 'sysMsg', spreadObj(
    'msg', 'rep', 'styleType', 'url', 'msg_text',
    ['real_roomid', 0, 'realRoomId'], ['roomid', 0, 'roomId'],
));

// welcome
const welcomeVip = new Transformer('WELCOME', 'welcomeVip', on(m => m.data, {
    ...spreadObj('uid', ['uname', 0, 'name'], ['is_admin', asFlag]),
    isVip: d => ('vip' in d && d.vip === 1) || ('svip' in d && d.svip === 1),
    isSvip: d => ('svip' in d && d.svip === 1),
}));
const welcomeGuard = new Transformer('WELCOME_GUARD', 'welcomeGuard', on(m => m.data, spreadObj(
    'uid', 'guard_level', ['username', 0, 'name'],
)));

// events
const wishBottle = new Transformer('WISH_BOTTLE', 'wishBottle', on(m => m.data, {
    ...spreadObj('action', 'id'),
    wish: on(m => m.wish, spreadObj(
        'content', 'status', 'type', 'type_id', 'uid', 'wish_limit', 'wish_progress', 'count_map',
        ['ctime', str => new Date(str).getTime(), 'timestamp'], ['uid', 0, 'anchor'],
    )),
}));
const roomRank = new Transformer('ROOM_RANK', 'roomRank', on(m => m.data, spreadObj(
    'timestamp', 'color', 'h5_url', 'web_url', ['roomid', 0, 'roomId'], ['rank_desc', 0, 'rank'],
)));
const guardBuy = new Transformer('GUARD_BUY', 'guardBuy', {
    ...on(m => m.data, {
        ...spreadObj('guard_level', 'num'),
        buyer: spreadObj(['username', undefined, () => 'name'], 'uid'),
    }),
    ...spreadObj(['roomid', parseInt, () => 'roomId']),
});

// blocking
const blockUser = new Transformer('ROOM_BLOCK_MSG', 'blockUser', {
    roomId: m => m.roomid, blocked: spreadObj(['uid', parseInt], ['uname', 0, 'name']),
});
const silentOn = new Transformer('ROOM_SILENT_ON', 'silentOn', msg => ({
    roomId: msg.roomid,
    ...on(m => m.data, data => ({
        ...compile(spreadObj('type', 'second'))(data),
        ...onWhen(d => d, d => d.type === 'level', spreadObj('level'))(data),
    }))(msg),
}));
const silentOff = new Transformer('ROOM_SILENT_OFF', 'silentOff', spreadObj(['roomid', parseInt, 'roomId']));
const popularity = new Transformer('POPULARITY', 'popularity', {
    count: d => (d.data && d.data.count) || 0,
});

const transformers = [
    liveStart,
    liveEnd,
    danmaku,
    gift,
    tempoStorm,
    comboEnd,
    guardMsg,
    sysMsg,
    welcomeVip,
    welcomeGuard,
    wishBottle,
    roomRank,
    guardBuy,
    blockUser,
    silentOn,
    silentOff,
    popularity,
];
const registry = fromPairs(transformers.map(t => [t.cmd, t]));

module.exports = { transformers, registry };
