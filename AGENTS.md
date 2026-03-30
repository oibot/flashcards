# Rules

Before committing run the typechecker `bunx tsc --noEmit`, the linter `bunx expo lint`, and the formatter `bun format`. When there are errors or warnings fix the them first. You can automatically fix some linter errors/warnings with `bunx expo lint --fix`.

# Do

# Don't

Do not hardcode colors.

Unistyles `StyleSheet` can be a function that returns a dictionary of styles. The parameter of this function are the theme and rt (runtime). Use this instead of the hook `useUnistyles` when possible (don't create functions for the styles keys that take a theme, and provide the theme from outside).

Don't use promise chaining if possible. Instead try to use async/await.
