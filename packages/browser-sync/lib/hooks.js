// @ts-check
"use strict";

import Immutable from "immutable";
import { utils } from "./snippet";
import { each, isFunction, union } from "./underbar";

export default {
    /**
     *
     * @this {import("./browser-sync").default}
     * @returns {String}
     */
    "client:js": function(hooks, data) {
        var js = utils.getClientJs(data.port, data.options);

        return hooks.reduce(
            function(acc, hook) {
                if (typeof hook === "function") {
                    return acc.concat(hook);
                }
                return acc.concat(String(hook));
            },
            [js]
        );
    },
    /**
     * @this {import("./browser-sync").default}
     * @returns {Array}
     */
    "client:events": function(hooks, clientEvents) {
        hooks.forEach(function(hook) {
            var result = hook(this);

            if (Array.isArray(result)) {
                clientEvents = union(clientEvents, result);
            } else {
                clientEvents.push(result);
            }
        }, this);

        return clientEvents;
    },
    /**
     * @returns {Array}
     */
    "server:middleware": function(hooks, initial) {
        initial = initial || [];

        each(
            hooks,
            function(hook) {
                var result = hook(this);

                if (Array.isArray(result)) {
                    result.forEach(function(res) {
                        if (isFunction(res)) {
                            initial = initial.push(res);
                        }
                    });
                } else {
                    if (isFunction(result)) {
                        initial = initial.push(result);
                    }
                }
            },
            // @ts-expect-error
            this
        );

        return initial;
    },
    /**
     * @param {Array} hooks
     * @param {import("immutable").Map|import("immutable").List} initial
     * @param pluginOptions
     * @returns {any}
     */
    "files:watch": function(hooks, initial, pluginOptions) {
        var opts;

        if (pluginOptions) {
            opts = Immutable.fromJS(pluginOptions);
            opts.forEach(function(value, key) {
                if (!value) {
                    return;
                }
                var files = value.get("files");
                if (files) {
                    var fileArg = require("./cli/cli-options").makeFilesArg(files);
                    if (fileArg) {
                        initial = initial.set(key, Immutable.fromJS(fileArg));
                    }
                }
            });
        }

        return initial;
    }
};
