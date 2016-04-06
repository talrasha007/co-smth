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
    hash.update(data);
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
        }
    };

    this.thread = {
        loadSectionHot: function *(section) {
            return yield *post('board/load_hot.json', { section_id: section });
        }
    };
};
