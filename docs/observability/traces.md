# Traces

> **Operations carry their own completion IDs; implicit event ownership covers synchronous execution only.**

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

The SDK 1.6.42 source correction restores global context as soon as `fn` returns its value or promise, before awaiting it. Success and failure events carry the completed operation's explicit ID, regardless of completion order. Durations use `performance.now()`; `startedAt` and event timestamps remain wall-clock time. This increment is not yet published or device-verified.

Inline `logEvent` and `logError` calls inherit the synchronous operation's ID. Events after an `await` have no implicit owner, including in sequential code. Carry an application request ID in event data when correlating those callbacks. `getTrace(id)` does not gather an entire asynchronous workflow automatically. The explicit-context API proposed below remains unimplemented.

### Historical behavior through 1.6.41

Events logged inside a traced call are stamped with its id, so `getTrace(id)` can gather everything
one operation did. That works when calls are sequential. **It does not work when they overlap**,
and in an app with several hooks polling at once, overlapping is the normal case.

The old trace id was a single module-level variable. `traced` set it on entry and restored it on
exit, but across an `await` another traced call can change it in between. Run with two calls, where
B starts while A is waiting:

| Event | Should carry | Carried |
| :--- | :--- | :--- |
| logged by B before its `await` | B's id | B's id |
| logged by A after its `await` | A's id | **B's id** |
| logged by B after its `await` | B's id | **none** |

That historical failure was measured. The practical effect was that `getTrace(id)` could return events from
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

`TraceRecord` has no parent field. Synchronous scope restoration does not establish async parentage, so a user action cannot be viewed as a tree of the operations it caused. Explicit context propagation and parent storage remain future work.

## Limits

- **200 traces.** A ring buffer, oldest first out.
- **Memory only.**
- **JavaScript only.** Kernel-level tracing is [`usePerfetto`](../guides/perfetto-profiling.md),
  a separate mechanism with its own trace file; the two are not joined.

The [unit tests](../guides/testing/unit-tests.md) cover `traced` thoroughly for sequential calls,
which is why they pass; they do not exercise overlapping ones. All of the gaps are listed with what
closing them takes on the [Observability overview](./README.md#where-the-stack-stops).
