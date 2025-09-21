# Browser Based Code Editor

A simple, interactive code editor for HTML, CSS, and JavaScript that runs entirely in your browser.  
This project is designed for quick prototyping, learning, and sharing code—all without any server-side components.

## Features

- **Tabbed Editing:** Switch easily between HTML, CSS, and JavaScript editors.
- **Live Preview:** See your code output instantly in the built-in preview pane.
- **Run with Tests:** Optionally append and run JavaScript validation tests.
- **Save & Load:** Save your work as a JSON file and restore it later.
- **Keyboard Shortcuts:**
  - <kbd>Ctrl</kbd> + <kbd>S</kbd> — Save your project
  - <kbd>Ctrl</kbd> + <kbd>Enter</kbd> — Run code
- **Open Preview in New Window:** View your project in a separate browser window.
- **Persistent Storage:** Automatically restores your last session from local storage.
- **Clearable Output Log:** Easily clear the output/log area.

## Usage

1. **Open `index.html` in your browser.**
2. Write your HTML, CSS, and JavaScript in the respective tabs.
3. Click **Run** or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to update the preview.
4. Use **Run with Tests** to append and execute validation code.
5. Save your work locally and load it back anytime.

## Project Structure

- `index.html` — Main application UI
- `styles.css` — Styling for the editor and layout
- `script.js` — Application logic and editor integration
- `README.md` — Project documentation

## Dependencies

- [Ace Editor](https://ace.c9.io/) (loaded via CDN)

## License

&copy; 2025 Viswa's Project — All Rights Reserved.