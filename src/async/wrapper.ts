﻿import _refs = require('_refs');
import Fiber = require('fibers');
import AsyncOutput = require('./asyncOutput');
import Context = require('./context');
export = wrapper;


//TODO: rename to runInFiber(runCtx: RunContext)



/**
 * The wrapper() function accepts a Context instance, and calls the wrapped function which is
 * described in the context. The result of the call is used to resolve the context's promise.
 * If an exception is thrown, the context's promise is rejected. This function must take all
 * its information in a single argument (i.e. the context), because it is called via
 * Fiber#run(), which accepts at most one argument.
 */
function wrapper(ctx: Context) {
    try {

        // Keep track of how many fibers are active
        adjustFiberCount(+1);

        // Call the wrapped function. It may get suspended at await and/or yield calls.
        var result = ctx.wrapped.apply(ctx.thisArg, ctx.argsAsArray);

        // If we get here, the wrapped function returned normally.
        switch (ctx.output) {
            case AsyncOutput.Promise:
                ctx.value.resolve(result);
                break;
            case AsyncOutput.PromiseIterator:
                ctx.value.resolve(undefined);
                ctx.done.resolve(true);
                break;
        }
    }
    catch (err) {

        // If we get here, the wrapped function had an unhandled exception.
        switch (ctx.output) {
            case AsyncOutput.Promise:
                ctx.value.reject(err);
                break;
            case AsyncOutput.PromiseIterator:
                ctx.value.reject(err);
                ctx.done.resolve(true);
                break;
        }
    }
    finally {

        // Keep track of how many fibers are active
        adjustFiberCount(-1);

        // TODO: for semaphores
        ctx.semaphore.leave();
    }
}


/**
 * The following functionality prevents memory leaks in node-fibers by actively managing Fiber.poolSize.
 * For more information, see https://github.com/laverdet/node-fibers/issues/169.
 */
var fiberPoolSize = Fiber.poolSize;
var activeFiberCount = 0;
function adjustFiberCount(delta: number) {
    activeFiberCount += delta;
    if (activeFiberCount >= fiberPoolSize) {
        fiberPoolSize += 100;
        Fiber.poolSize = fiberPoolSize;
    }
}
