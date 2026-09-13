# Contract checks

> **The checks that fail a build when the code, the documentation and the template stop agreeing with each other.**

PixelKit is three repositories that describe one thing: the SDK exports the hooks, the
documentation describes them, and the template exercises them. Nothing about that arrangement keeps
them in step on its own, so each repository checks the others on every push.

## In the SDK — `npm run verify`

CI runs these in order, and the first failure stops the build:

| Step | Fails when |
| :--- | :--- |
| `npm run typecheck` | The TypeScript does not compile. |
| `npm test` | A [unit test](./unit-tests.md) fails. |
| `npm run build` | Any of the three packages does not build. |
| `npm run check-docs` | See below. |
| `npm pack --dry-run` | A package would ship without the files it needs. |
| Consumer import | The packed SDK, installed into a scratch project, cannot resolve `@pixelkit-labs/sdk` and `@pixelkit-labs/sdk/mlkit` through its exports map. |

`check-docs` clones this documentation repository and fails when:

- a hook is exported but has no definition in `data/hooks`, or has one for a hook that no longer
  exists;
- a documented return field is not on the hook's declared type;
- the README does not name every exported hook;
- an agent-facing page imports a name that neither `@pixelkit-labs/sdk` nor `/mlkit` exports, or
  imports it from the wrong one.

A release adds one more: the version tag has to match all four package manifests before anything is
published.

## In the documentation — `npm run build`

| Check | Fails when |
| :--- | :--- |
| `check:diagrams` | A diagram spec has no rendered SVG, the SVG is older than the spec, or the diagram is not shown on any page. |
| `check:api` | A hook has no page in the section its category names, or a page documents a hook that no longer exists; a page's Outputs and Functions tables list different fields from `data/hooks`; the agent primer's mapping table misses a hook; a page opens with a code block or table instead of a line of prose, which would give every link to it a meaningless tooltip. |
| `sync` | A link between pages points at a file that does not exist. |

## In the template — `npm run verify`

| Check | Fails when |
| :--- | :--- |
| `check-deps` | The dependency check fails. |
| `typecheck` | The app does not compile against the installed SDK. |
| `parity` | A hook the installed SDK exports has no entry in `src/core/surface.ts`, or nothing on its tab calls it; or a documented function has no control anywhere in the app. |

CI then runs `npx expo export -p android` to prove the app bundles.

The parity check runs against whichever SDK version is installed. When a new SDK version adds
hooks, the template's dependency bump fails parity until those hooks have somewhere to be tried —
which is the check doing its job, and it means new hooks need template screens before or alongside
the release that adds them.
