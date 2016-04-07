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

module.exports = class {
    constructor(token, appid, secret, signature) {
        this.token = token;
        this.appid = appid || DEFAULT_CLIENT_USERID;
        this.secret = secret || DEFAULT_CLIENT_SECRET;
        this.signature = signature || DEFAULT_CLIENT_SIGNATURE;
    }

    /* USER API */
    *login(user, password) {
        var args = {
            username: user,
            client_secret: this.secret,
            grant_type: 'password',
            client_id: this.appid,
            password: password,
            libversion: 256,
            libtype: 'android'
        };

        var ret = yield *this._post('oauth2/password', args);
        this.token = ret.access_token;
        return ret;
    }

    *logout() {
        return yield *this._post('session/revoke_token.json', {});
    }

    *queryUser(uid) {
        return yield *this._post('user/query.json', { user_id: uid });
    }

    *getFriends(uid) {
        return yield *this._post('user/load_allfriends.json', { user_id: uid });
    }

    *addFriend(uid) {
        return yield *this._post('profile/add_friend.json', { user_id: uid });
    }

    *delFriend(uid) {
        return yield *this._post('profile/delete_friend.json', { user_id: uid });
    }

    /* BOARD API */
    *loadSection() {
        return yield *this._post('board/load_section.json', {});
    }

    *readSection(section, group) {
        return yield *this._post('board/read_section.json', { section_id: section, group_id: group });
    }

    *loadBoards(group) {
        return yield *this._post('board/load_boards.json', { group_id: group });
    }

    *loadFav(group) {
        return yield *this._post('profile/load_favorites.json', { group_id: group });
    }

    *addFav(board) {
        return yield *this._post('profile/add_favorite_board.json', { board_id: board });
    }

    *delFav(board) {
        return yield *this._post('profile/delete_favorite_board.json', { board_id: board });
    }

    /* THREAD API */
    *getThreadCnt(board) {
        return yield *this._post('board/get_thread.json', { board_id: board });
    }

    *getArticleCnt(board) {
        return yield *this._post('board/get_article.json', { board_id: board });
    }

    *loadThreadList(board, from, size, brcmode) {
        return yield *this._post('board/load_thread.json', {
            board_id: board,
            from: from,
            size: size,
            brcmode: brcmode
        });
    }

    *getThread(board, articleId, from, size, sort) {
        return yield *this._post('article/show_thread.json', {
            board_id: board,
            from: from,
            size: size,
            sort: sort,
            thread_id: articleId
        });
    }

    *getArticle(board, articleId) {
        return yield *this._post('article/show_article.json', {
            board_id: board,
            article_id: articleId
        });
    }

    *postArticle(board, title, content) {
        return yield *this._post('article/post.json', {
            board_id: board,
            subject: title,
            content: content
        });
    }

    *replyArticle(board, replyId, title, content) {
        return yield *this._post('article/reply.json', {
            board_id: board,
            reply_id: replyId,
            subject: title,
            content: content
        });
    }

    *forwardArticle(board, articleId, user) {
        return yield *this._post('article/forward.json', {
            board_id: board,
            article_id: articleId,
            target: user
        });
    }

    *searchArticle(board, title, user, from, size) {
        var args = { board_id: board, from: from, size: size };
        var url;

        if (title) {
            args.t = title;
            url = 'board/search_article_title.json';
        } else {
            args.u = user;
            url = 'board/search_article_user.json';
        }

        return yield *this._post(url, args);
    }

    *loadSectionHot(section) {
        return yield *this._post('board/load_hot.json', { section_id: section });
    }

    /* MAIL API */
    *getMailCnt() {
        return yield *this._post('mail/count.json', {});
    }

    *getMailSentCnt() {
        return yield *this._post('mail/count_send.json', {});
    }

    *loadMailList(from, size) {
        return yield *this._post('mail/load.json', { from: from, size: size });
    }

    *loadMailSentList(from, size) {
        return yield *this._post('mail/load_send.json', { from: from, size: size });
    }

    *getMail(position) {
        return yield *this._post('mail/get_content.json', { position: position });
    }

    *getMailSent(position) {
        return yield *this._post('mail/get_send_content.json', { position: position });
    }

    *postMail(receiver, title, content) {
        return yield *this._post('mail/send.json', {
            recipient: receiver,
            subject: title,
            content: content
        });
    }

    *replyMail(replyId, title, content) {
        return yield *this._post('mail/reply.json', {
            position: replyId,
            subject: title,
            content: content
        });
    }

    *forwardMail(receiver, position) {
        return yield *this._post('mail/forward.json', {
            position: position,
            target: receiver
        });
    }

    /* SNS API */
    *getReferCount(mode) {
        return yield *this._post('refer/count.json', { mode: mode });
    }

    *loadRefer(mode, from, size) {
        return yield *this._post('refer/load.json', {
            mode: mode,
            from: from,
            size: size
        });
    }

    *setReferRead(mode, position) {
        return yield *this._post('refer/read.json', {
            mode: mode,
            position: position
        });
    }

    *loadTimeLine(loadold, oldid, size, order) {
        return yield *this._post('timeline/boards_threads.json', {
            oldid: oldid,
            size: size,
            loadold: loadold,
            order: order
        });
    }

    /* GUESS API */
    *listGuess() {
        return yield *this._post('guess/allguess.json', {});
    }

    *loadGuess(guessId) {
        return yield *this._post('guess/show_guess.json', { guessid: guessId});
    }

    *listMatch() {
        return yield *this._post('guess/show_allmatch.json', {});
    }

    *listGuessTop(guessId) {
        return yield *this._post('guess/guess_top.json', { guessid: guessId });
    }

    *regGuess(guessId, realName, phone) {
        return yield *this._post('guess/reg_guess.json', {
            guessid: guessId,
            realname: realName,
            phone: phone
        });
    }

    *loadMatch(guessId, matchId) {
        return yield *this._post('guess/show_match.json', {
            guessid: guessId,
            matchid: matchId
        });
    }

    *voteMatch(guessId, matchId, sel, money) {
        return yield *this._post('guess/vote.json', {
            guessid: guessId,
            matchid: matchId,
            sel: sel,
            money: money
        });
    }

    /* INTERNAL */
    *_post(apiUrl, args) {
        if (this.token) args.access_token = this.token;
        args.signature = this._sig(args);

        var res = yield request({
            uri: URLBASE + apiUrl,
            method: 'POST',
            form: args,
            json: true
        });

        return res.body;
    }

    _sig(args) {
        var data = _(args)
            .toPairs()
            .sortBy(function (p) { return p[0]; })
            .map(function (p) { return p[0].toLowerCase() + '=' + p[1]; })
            .value()
            .join('&');

        data += '&' + this.signature;

        return md5(data);
    }
};
