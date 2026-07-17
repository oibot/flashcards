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
