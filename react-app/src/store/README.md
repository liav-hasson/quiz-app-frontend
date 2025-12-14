# Redux Store

This directory manages the global state of the application using Redux Toolkit.

## What is the Store?

The "Store" is like a giant database that lives inside the browser's memory while the user is on the site. It holds data that needs to be accessed by many different parts of the app, so we don't have to pass it down manually through every component.

## Slices

We divide the store into "Slices", each managing a specific piece of data:

- **`authSlice.js`**: Keeps track of the logged-in user (username, token, avatar).
- **`quizSlice.js`**: Manages the state of the current single-player quiz (current question, score, answers).
- **`multiplayerSlice.js`**: Manages the state for multiplayer games (lobby players, socket connection status).
- **`uiSlice.js`**: Handles global UI state like "Dark Mode" or showing/hiding global modals.

## How to use it

1. **Reading Data**: Components use `useSelector` to read data from the store.
   ```javascript
   const user = useSelector(state => state.auth.user);
   ```

2. **Updating Data**: Components use `useDispatch` to send "actions" to the store.
   ```javascript
   dispatch(setAnswer(userAnswer));
   ```
