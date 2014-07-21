﻿import references = require('references');
import oldBuilder = require('../src/awaitBuilder');
import pipeline = require('../src/pipeline');
import _ = require('../src/util');
export = newBuilder;


var newBuilder = oldBuilder.mod({

    name: 'thunk',

    type: <AsyncAwait.Await.ThunkBuilder> null,

    overrideHandler: (base, options) => function thunkHandler(co, arg, allArgs) {
        if (allArgs || !_.isFunction(arg)) return pipeline.notHandled;
        arg(co.enter);
    }
});
