# ARTEMIS from a coding agent

> **The MCP server that lets a coding agent run a recipe on the phone, watch it, and read back what happened — so it can check its own change before calling it done.**

A coding agent that edits a hook can type-check it and run the unit tests, but it cannot see a
sensor. Through ARTEMIS's MCP server it can: it hands ARTEMIS a task, the task runs on the phone,
and the agent reads back the outcome step by step.

## Setup

`pixelkit-sdk` registers the server in its project `.mcp.json`, so an MCP client that reads project
configuration picks it up on its own:

```json
{
  "mcpServers": {
    "artemis": { "command": "artemis", "args": ["mcp"] }
  }
}
```

For Claude Code outside this repository:

```bash
claude mcp add artemis -- artemis mcp
```

ARTEMIS itself has to be installed, and a device connected — the same
[prerequisites as the npm runner](./running.md#before-a-run).

## The four tools

| Tool | What it does |
| :--- | :--- |
| `mobile_run_task` | Starts a task on the device and returns at once with a `trace_id`. Takes the task as `task_desc` — a recipe's text works as-is — plus `model` (`Flash`, the default, or `Pro`), `device_serial`, `verification_level`, `explorer_mode`, `expected_output_desc` and `locked_app_package`. |
| `mobile_manage_task` | `status` for progress and, when the task declared checkpoints, a pass/fail count; `inject_instruction` to correct a task that has gone off course; `stop` to end it and release the device. |
| `mobile_get_device_state` | A screenshot, or the element list the agent is reasoning over. |
| `mobile_inspect_trace` | After a run: a summary, a search over every step, one step's full reasoning and tool calls, or its before, after and action-overlay screenshots. |

On Pro, `verification_level` sets how hard the checker looks: `off`, `final` (the default — one
review at the end), `checkpoints`, or `strict`, where a failed check stops the run.

## A verification loop

For a change to a hook:

1. **Put the change on the phone** — rebuild the template with `npx expo run:android`. ARTEMIS tests
   what is installed, not what is in the editor.
2. **Start the task** with `mobile_run_task`, passing the relevant recipe as `task_desc`. Use `Pro`
   when the check needs Logcat or ADB; `Flash` is enough to press through a screen.
3. **Name the device** with `device_serial` if more than one is connected. With several attached,
   ask which one rather than letting ARTEMIS choose.
4. **Poll** with `mobile_manage_task` `status` at least once a minute. A task can stall without
   saying so; the completion notification alone is not enough.
5. **Read the result** with `mobile_inspect_trace`. When a step failed, the action-overlay
   screenshot shows exactly where the agent tapped.

This is the one advantage over the npm runner that matters most in practice: the device, the engine
and the depth of verification are chosen per run, and the result comes back as data an agent can
act on rather than as terminal output.

## Timing

ARTEMIS's own reasoning adds roughly five seconds a step on Flash and thirty seconds a turn on Pro,
on top of any wait a task asks for. A recipe that says "wait 30 seconds" does not need an exact
wait on Pro — the pipeline delay already covers most of it. When a flow will be run repeatedly, use
ARTEMIS once to discover the exact path, then write it down as a deterministic test.
