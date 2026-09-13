# ARTEMIS

> **Verification on a real Pixel: an agent that drives the template app, reads what each hook reports, and checks the value came from hardware.**

Every PixelKit hook makes the same promise: its `source` is `hardware`, `derived` or `unavailable`,
and nothing is ever simulated. Only silicon can prove that. The [unit tests](../guides/testing/unit-tests.md)
prove the logic inside a hook, and the [contract checks](../guides/testing/contract-checks.md)
prove the code, the documentation and the template agree — but neither ever reads a sensor.

[ARTEMIS](https://github.com/google/artemis) is an autonomous mobile testing agent from Google. It
operates a real Android device over ADB, reading the screen both as an image and through the
accessibility tree, and acts on it the way a person would. PixelKit points it at
[`pixelkit-template`](https://github.com/PixelKit-Labs/pixelkit-template) running on a Pixel and
hands it a recipe: which screens to open, which controls to press, and what counts as a pass.

<!-- diagram: artemis-loop -->

## Two engines

| Engine | How it works | Use it for |
| :--- | :--- | :--- |
| **Flash** | One model in an observe–think–act loop, a few seconds a step. No planner and no checker; it chains taps into a single burst so it can catch controls that fade. | Smoke tests, tab and control checks, quick regressions. |
| **Pro** | A planner writes a plan with checkpoints, an operator carries it out and can run ADB commands and read logs, and a checker verifies the checkpoints before the run ends. Slower — each turn plans and verifies. | Multi-branch flows, crash investigation, anything that needs ADB diagnostics or a written report. |

The PixelKit runner defaults to Flash. Pass `--pro` for Pro — see [Running ARTEMIS](./running.md).

## In this section

| Page | What it covers |
| :--- | :--- |
| [Running ARTEMIS](./running.md) | Prerequisites, the npm scripts, and exactly what the runner does and does not do. |
| [Recipes](./recipes.md) | The seven verification plans, what each checks, and how to write a new one. |
| [ARTEMIS from a coding agent](./mcp.md) | The MCP server, so an agent can verify its own change on the phone before calling it done. |

## What a passing run proves

That the checkpoints in the recipe you ran held on that device during that run. It says nothing
about hooks the recipe does not visit, and a recipe can only visit screens the template has built.
Recipe 07 is the current example: it covers the twelve newest hooks, and the template does not yet
have screens for them, so it cannot pass.
