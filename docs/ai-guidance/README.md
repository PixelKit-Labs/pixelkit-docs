# For coding agents

PixelKit is built to be worked on by coding agents as well as people, and these pages are written
for them.

| Page | What it covers |
| :--- | :--- |
| [AI primer](./ai-primer.md) | The operational architecture and the prompt contracts an agent needs before touching this codebase |
| [Recipes](./recipes.md) | Task-shaped patterns: the sequence of hooks and calls for common jobs |

## The rule that matters most

**Nothing is simulated.** If a value cannot be read, it is `null` and its `source` is
`'unavailable'`. Never substitute a plausible default, and never write a fallback that invents a
reading — the type system has no `simulated` member precisely so that this is unrepresentable
rather than merely discouraged.

If a capability cannot be driven for real, write the real path — a native module, a platform API —
or report it unavailable. A blank is honest; a plausible number is not.
