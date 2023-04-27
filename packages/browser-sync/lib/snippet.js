// @ts-check
import connectUtils from "./connect-utils";
import lrSnippet from "resp-modifier";
import fs from "fs";
import path from "path";
import { includes } from "./underbar";

import * as utils from "./utils";

/**
 * Utils for snippet injection
 */
var snippetUtils = {
    /**
     * @param {String} url
     * @param {Array} excludeList
     * @returns {boolean}
     */
    isExcluded: function(url, excludeList) {
        var extension = path.extname(url);

        if (extension) {
            if (~url.indexOf("?")) {
                return true;
            }
            extension = extension.slice(1);
            return includes(excludeList, extension);
        }
        return false;
    },
    /**
     * @param {String} snippet
     * @param {Object} options
     * @returns {{match: RegExp, fn: Function, once: boolean, id: string}}
     */
    getRegex: function(snippet, options) {
        var fn = options.getIn(["rule", "fn"]);

        return {
            match: options.getIn(["rule", "match"]),
            fn: function(req, res, match) {
                return fn.apply(null, [snippet, match]);
            },
            once: true,
            id: "bs-snippet"
        };
    },
    getSnippetMiddleware: function(snippet, options, rewriteRules) {
        return lrSnippet.create(snippetUtils.getRules(snippet, options, rewriteRules));
    },
    getRules: function(snippet, options, rewriteRules) {
        var rules = [snippetUtils.getRegex(snippet, options)];

        if (rewriteRules) {
            rules = rules.concat(rewriteRules);
        }

        return {
            rules: rules,
            blacklist: utils.arrayify(options.get("blacklist")),
            whitelist: utils.arrayify(options.get("whitelist"))
        };
    },
    /**
     * @param {Array} [excludeList]
     * @returns {Object}
     */
    isOldIe: function(excludeList) {
        return function(req, res, next) {
            var ua = req.headers["user-agent"];
            var match = /MSIE (\d)\.\d/.exec(ua);
            if (match) {
                if (parseInt(match[1], 10) < 9) {
                    if (!snippetUtils.isExcluded(req.url, excludeList)) {
                        req.headers["accept"] = "text/html";
                    }
                }
            }
            next();
        };
    },
    /**
     * @param {Number} port
     * @param {any} options
     * @returns {() => string}
     */
    getClientJs: function(port, options) {
        return () => {
            const script = options.get("minify") ? "index.js" : "index.js";
            const client = fs.readFileSync(
                require.resolve("browser-sync-client/dist/" + script),
                "utf8"
            );
            return [connectUtils.socketConnector(options), client].join(";\n");
        };
    }
};

export { snippetUtils as utils };
