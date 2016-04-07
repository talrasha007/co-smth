'use strict';

var _ = require('co-lodash'),
    crypto = require('crypto'),
    request = require('co-request');

const URLBASE = "http://open.newsmth.net/";
const DEFAULT_CLIENT_USERID    = "testapp";
const DEFAULT_CLIENT_SECRET    = "0055a40712ee09f74f70d193c5e8dbc3";
const DEFAULT_CLIENT_SIGNATURE = "4da4774bea90f3509293d112eb6a24cd";

function md5(data) {
    var hash = crypto.createHash('md5');
    hash.update(new Buffer(data, 'utf8'));
    return hash.digest('hex');
}

module.exports = function (token, appid, secret, signature) {
    appid = appid || DEFAULT_CLIENT_USERID;
    secret = secret || DEFAULT_CLIENT_SECRET;
    signature = signature || DEFAULT_CLIENT_SIGNATURE;

    function sig(args) {
        var data = _(args)
            .toPairs()
            .sortBy(function (p) { return p[0]; })
            .map(function (p) { return p[0].toLowerCase() + '=' + p[1]; })
            .value()
            .join('&');

        data += '&' + signature;

        return md5(data);
    }

    function *post(apiUrl, args) {
        if (token) args.access_token = token;
        args.signature = sig(args);

        var res = yield request({
            uri: URLBASE + apiUrl,
            method: 'POST',
            form: args,
            json: true
        });

        return res.body;
    }

    this.user = {
        login: function *(user, password) {
            var args = {
                username: user,
                client_secret: secret,
                grant_type: 'password',
                client_id: appid,
                password: password,
                libversion: 256,
                libtype: 'android'
            };

            var ret = yield *post('oauth2/password', args);
            token = ret.access_token;
            return ret;
        },

        logout: function *() {
            return yield *post('session/revoke_token.json', {});
        },

        query: function *(uid) {
            return yield *post('user/query.json', { user_id: uid });
        },

        getFriends: function *(uid) {
            return yield *post('user/load_allfriends.json', { user_id: uid });
        },

        addFriend: function *(uid) {
            return yield *post('profile/add_friend.json', { user_id: uid });
        },

        delFriend: function *(uid) {
            return yield *post('profile/delete_friend.json', { user_id: uid });
        }
    };

    this.board = {
        loadSection: function *() {
            return yield *post('board/load_section.json', {});
        },

        readSection: function *(section, group) {
            return yield *post('board/read_section.json', { section_id: section, group_id: group });
        },

        loadBoards: function *(group) {
            return yield *post('board/load_boards.json', { group_id: group });
        },

        loadFav: function *(group) {
            return yield *post('profile/load_favorites.json', { group_id: group });
        },

        addFav: function *(board) {
            return yield *post('profile/add_favorite_board.json', { board_id: board });
        },

        delFav: function *(board) {
            return yield *post('profile/delete_favorite_board.json', { board_id: board });
        }
    };

    this.thread = {
        getThreadCnt: function *(board) {
            return yield *post('board/get_thread.json', { board_id: board });
        },

        loadThreadList: function *(board, from, size, brcmode) {
            return yield *post('board/load_thread.json', {
                board_id: board,
                from: from,
                size: size,
                brcmode: brcmode
            });
        },

        getThread: function *(board, articleId, from, size, sort) {
            return yield *post('article/show_thread.json', {
                board_id: board,
                from: from,
                size: size,
                sort: sort,
                thread_id: articleId
            });
        },

        postArticle: function *(board, title, content) {
            return yield *post('article/post.json', {
                board_id: board,
                subject: title,
                content: content
            });
        },

        replyArticle: function *(board, replyId, title, content) {
            return yield *post('article/reply.json', {
                board_id: board,
                reply_id: replyId,
                subject: title,
                content: content
            });
        },

        forwardArticle: function *(board, articleId, user) {
            return yield *post('article/forward.json', {
                board_id: board,
                article_id: articleId,
                target: user
            });
        },

        searchArticle: function *(board, title, user, from, size) {
            var args = { board_id: board, from: from, size: size };
            var url;

            if (title) {
                args.t = title;
                url = 'board/search_article_title.json';
            } else {
                args.u = user;
                url = 'board/search_article_user.json';
            }

            return yield *post(url, args);
        },

        loadSectionHot: function *(section) {
            return yield *post('board/load_hot.json', { section_id: section });
        }
    };

    this.mail = {
        getMailCnt: function *() {
            return yield *post('mail/count.json', {});
        },

        getMailSentCnt: function *() {
            return yield *post('mail/count_send.json', {});
        },

        loadMailList: function *(from, size) {
            return yield *post('mail/load.json', { from: from, size: size });
        },

        loadMailSentList: function *(from, size) {
            return yield *post('mail/load_send.json', { from: from, size: size });
        },

        getMail: function *(position) {
            return yield *post('mail/get_content.json', { position: position });
        },

        getMailSent: function *(position) {
            return yield *post('mail/get_send_content.json', { position: position });
        },

        postMail: function *(receiver, title, content) {
            return yield *post('mail/send.json', {
                recipient: receiver,
                subject: title,
                content: content
            });
        },

        replyMail: function *(replyId, title, content) {
            return yield *post('mail/reply.json', {
                position: replyId,
                subject: title,
                content: content
            });
        },

        forwardMail: function *(receiver, position) {
            return yield *post('mail/forward.json', {
                position: position,
                target: receiver
            });
        }
    };
};
