# Rules

# Do
When I refer to issues, assume I mean Linear issues in the `Flashcards` Linear team/project unless I explicitly say otherwise.

Format commit messages as `ISSUE-ID: message` (for example, `FLA-16: Use Sentry for logging`).

Before a commit
+ run typechecker `bunx tsc --noEmit`
+ run formatter `bun format`
+ run linter `bunx expo lint`,
+ run tests `bun jest`

If possible fix linter complaints automatically: `bunx expo lint --fix`


# Don't

Do not hardcode colors.

Unistyles `StyleSheet` can be a function that returns a dictionary of styles. The parameter of this function are the theme and rt (runtime). Use this instead of the hook `useUnistyles` when possible (don't create functions for the styles keys that take a theme, and provide the theme from outside).

Don't use promise chaining if possible. Instead try to use async/await.

Don't commit unless the typechecker, the formatter, the linter and the tests run through successfully.

# Persistent memory

The project stores durable agent memory under `.agent-memory/`.

Before starting a substantial task:

1. Read `.agent-memory/index.md`.
2. Open only memory files relevant to the current task.
3. Verify remembered information against the current code.

Update the memory when you discover:

- architectural decisions and their rationale
- non-obvious project constraints
- recurring problems and their solutions
- important commands or workflows

Do not store:

- temporary task progress
- information easily visible in the code
- guesses or unverified conclusions
- secrets or credentials

Keep `.agent-memory/index.md` short.
