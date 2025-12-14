# Components

This directory contains all the React components that make up the user interface of the Quiz App.

## Structure

We organize components by their purpose to make them easy to find.

- **`game/`**: Components specific to the quiz gameplay experience.
  - `QuestionCard`: Displays the question and choices.
  - `Timer`: Shows the countdown during a question.
  - `ScoreBoard`: Displays current scores.

- **`layout/`**: Structural components that define the page layout.
  - `Navbar`: The top navigation bar.
  - `Footer`: The page footer.
  - `Container`: Wrappers for centering content.

- **`ui/`**: Reusable, generic UI elements (our "Design System").
  - `Button`: Standard buttons used across the app.
  - `Input`: Text input fields.
  - `Card`: A box container with a shadow/border.
  - `Modal`: Pop-up dialogs.

## Component Philosophy

We try to make components "dumb" or "presentational" whenever possible. This means they just take data (props) and display it, without knowing too much about the app's complex logic or state. The logic is usually handled in the "Views" (pages) or the Redux store.

Conventions
- Name files in `PascalCase` per component (e.g., `QuestionCard.jsx`).
- Co-locate small component-specific tests/stories when applicable (`QuestionCard.test.jsx`, `QuestionCard.stories.jsx`).
- Keep side effects out of UI components; trigger API work via hooks or thunks.
