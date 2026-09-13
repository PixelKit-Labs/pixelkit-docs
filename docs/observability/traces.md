# Traces

> **Every call to the outside world timed, given an id, and recorded as succeeded or failed — and the one case where that id is wrong.**

## Recording

```ts
const photo = await traced(MODULE, 'takePicture', () => camera.takePictureAsync(), { quality });
```

`traced(module, op, fn, data?, source?)` runs `fn` and records a `TraceRecord`: an id (`t1`, `t2`,
…), the module and operation, when it started, how long it took, whether it succeeded, the
normalised error if it did not, and any `data` passed in. On the way it:

- records the duration as the metric `<op>Ms`, tagged with `source` (`'hardware'` unless told
  otherwise);
- logs at `info`, or `warn` past 1,500 ms, or `error` on failure;
- on failure, adds to the module's error count and **rethrows**, so control flow is unchanged and
  the caller still decides what to do.

`tracedSafe(module, op, fn, fallback, data?)` is the same, but returns `fallback` instead of
throwing. The failure is still logged and counted; it is never swallowed.

## Reading

| Call | Returns |
| :--- | :--- |
| `getTraces()` | Every recorded trace, oldest first. |
| `getTrace(id)` | One trace and every event that carries its id. |
| `getSlowestTraces(limit = 10)` | The slowest traces, slowest first. |

## Correlation when calls overlap

Events logged inside a traced call are stamped with its id, so `getTrace(id)` can gather everything
one operation did. That works when calls are sequential. **It does not work when they overlap**,
and in an app with several hooks polling at once, overlapping is the normal case.

The current trace id is a single module-level variable. `traced` sets it on entry and restores it on
exit, but across an `await` another traced call can change it in between. Run with two calls, where
B starts while A is waiting:

| Event | Should carry | Carried |
| :--- | :--- | :--- |
| logged by B before its `await` | B's id | B's id |
| logged by A after its `await` | A's id | **B's id** |
| logged by B after its `await` | B's id | **none** |

That is measured, not inferred. The practical effect is that `getTrace(id)` can return events from
the wrong operation and miss ones from the right one.

The usual fix, propagating context implicitly with something like `AsyncLocalStorage`, is not
available: Hermes does not provide it. The dependable fix is explicit — hand the traced function a
context and log through it:

```ts
// the shape a fix would take; not in the SDK today
await traced(MODULE, 'takePicture', async (ctx) => {
  const photo = await camera.takePictureAsync();
  ctx.log('captured', { width: photo.width });
});
```

## Nesting is recorded flat

`traced` already works out which trace it is running inside — it has to, to restore the id when it
returns. It does not store that. `TraceRecord` has no parent field, so a call made inside another is
recorded as an unrelated trace, and a user action cannot be viewed as a tree of the operations it
caused. Storing the parent id is a one-field change.

## Limits

- **200 traces.** A ring buffer, oldest first out.
- **Memory only.**
- **JavaScript only.** Kernel-level tracing is [`usePerfetto`](../guides/perfetto-profiling.md),
  a separate mechanism with its own trace file; the two are not joined.

The [unit tests](../guides/testing/unit-tests.md) cover `traced` thoroughly for sequential calls,
which is why they pass; they do not exercise overlapping ones. All of the gaps are listed with what
closing them takes on the [Observability overview](./README.md#where-the-stack-stops).
