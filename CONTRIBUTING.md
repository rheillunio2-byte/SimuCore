<div align="center">

<img src="https://capsule-render.vercel.app/api?type=shark&height=190&color=0:070B16,50:1D4ED8,100:06B6D4&text=Contributing&fontColor=FFFFFF&fontSize=55&fontAlignY=50&animation=twinkling&stroke=38BDF8&strokeWidth=2" width="100%" />

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=16&duration=2800&pause=900&color=38BDF8&center=true&vCenter=true&width=700&lines=Every+model+starts+with+a+contribution.;Build+more+precise+simulations.;Your+ideas+help+move+SimuCore+forward." alt="Typing SVG" />

<br/>

**Thank you for your interest in contributing to SimuCore!**

</div>

---

## 📌 Introduction

SimuCore is a browser-based engineering simulation studio focused on helping users explore physical systems through interactive models, live measurements, charts, and exportable data.

We welcome contributions from developers, students, engineers, educators, designers, and anyone interested in improving interactive engineering tools.

This guide explains how to contribute, report bugs, suggest improvements, and submit changes.

---

## 🌟 Ways to Contribute

There are several ways to help improve SimuCore:

- **Bug Reports:** Identify and report errors or unexpected behavior.
- **Feature Suggestions:** Recommend useful features and improvements.
- **New Simulations:** Add new physical or engineering models.
- **Model Review:** Check formulas, units, assumptions, and edge cases.
- **Frontend Development:** Improve layouts, components, charts, and responsiveness.
- **UI/UX Design:** Improve usability, accessibility, and visual presentation.
- **Testing:** Add automated tests and verify application behavior.
- **Documentation:** Improve setup instructions, model explanations, and guides.

---

## 🚀 Getting Started

Before contributing, make sure you have:

- A GitHub account.
- Git installed on your computer.
- Visual Studio Code or another code editor.
- A modern web browser.
- Node.js 18 or newer (for running the tests).

SimuCore has no runtime dependencies, so there is nothing to install.

### 1. Fork the Repository

Fork the SimuCore repository to your own GitHub account.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/SimuCore.git
```

Navigate to the project directory:

```bash
cd SimuCore
```

### 3. Create a Branch

Create a separate branch for your contribution:

```bash
git checkout -b feature/your-feature-name
```

Examples:

```bash
git checkout -b feature/rlc-circuit
```

```bash
git checkout -b fix/pendulum-period
```

```bash
git checkout -b docs/update-readme
```

### 4. Run the Application

Open `index.html` in your browser, or start a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

### 5. Make Your Changes

Work on your selected feature, improvement, or fix.

Keep your changes focused and follow the project's existing structure and coding conventions.

### 6. Test Your Changes

Run the automated model tests:

```bash
npm test
```

Then check the application in the browser:

- Every simulation still runs, pauses, steps, and resets.
- Parameter sliders and numeric fields respond correctly.
- Charts and measurements update.
- Saving, loading, renaming, and deleting experiments works.
- CSV export produces valid data.
- The browser console shows no errors or warnings.
- The layout works on desktop, tablet, and mobile widths.

### 7. Commit Your Changes

Use a clear and descriptive commit message:

```bash
git add .
git commit -m "feat: add RLC circuit simulation"
```

Other examples:

```bash
git commit -m "fix: correct pendulum energy calculation"
```

```bash
git commit -m "test: add spring critical damping case"
```

```bash
git commit -m "docs: update contributing guide"
```

### 8. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 9. Submit a Pull Request

Visit your fork on GitHub and open a Pull Request to the original SimuCore repository.

Explain what you changed, why it is useful, and how you tested it.

---

## 🧱 Project Architecture

Understanding the structure makes contributing easier:

```text
js/core/          utilities, state store, playback engine and RK4 integrator
js/simulations/   pure SI-based models: projectile, pendulum, spring, rc-circuit
js/data/          simulation-config.js (parameters, charts, documentation text)
js/components/    storage, notifications, navigation, charts, controls, viewport, export
js/views/         overview, library, workspace, experiments, docs, settings
js/app.js         bootstrap, settings, and hash router
tests/            automated model tests
```

Key rules:

- **Physics stays in `js/simulations/`.** A simulation receives SI inputs and returns a model object with `duration`, `timeScale`, `stateAt(t)`, `sample(n)`, `metrics(t)`, and `summary`. It must not touch the DOM.
- **Everything the interface needs is declared in `js/data/simulation-config.js`:** parameter ranges, units, SI conversions, charts, and documentation text.
- **Drawing lives in `viewport.js` and `charts.js`.** Pages live in `js/views/`.
- Scripts are plain `<script>` files that attach to `window.SimuCore`, so the app works from `file://` without a build step. Keep the load order in `index.html` correct when you add files.

---

## 🧪 Adding a Simulation

1. Create `js/simulations/<name>.js` and register it as `SimuCore.sims.<name>`. Use `rc-circuit.js` as a template and document every formula with comments.
2. Add its entry to `js/data/simulation-config.js` and to the `order` list.
3. Add a viewport renderer in `js/components/viewport.js`.
4. Load the new script in `index.html`.
5. Add tests in `tests/models.test.js`:
   - At least one closed-form or analytic check.
   - At least one conservation law or limiting-case check.
   - The parameter-corner finiteness test runs over every configured simulation automatically.
6. Document the model's equations, assumptions, and limits in the configuration so they appear in the Documentation page.

---

## 📏 Contribution Guidelines

### General Guidelines

- Keep contributions relevant to SimuCore.
- Write clean, readable, and maintainable code.
- Avoid unnecessary modifications to unrelated files.
- Test your changes before submitting.
- Follow the existing project structure.
- Use meaningful variable and function names.
- Avoid unnecessary dependencies.
- Provide clear descriptions of your changes.
- Be respectful when discussing suggestions and reviewing contributions.

### Frontend Guidelines

- Use semantic HTML elements.
- Keep CSS organized, and use the design tokens in `css/variables.css`.
- Maintain consistent spacing, colors, and typography.
- Ensure the interface remains responsive with no horizontal overflow.
- Keep animations smooth and purposeful, and respect reduced-motion preferences (`SimuCore.motion.reduced()`).
- Keep every control keyboard-accessible, labeled, and visibly focusable.

### Engineering and Model Guidelines

- Use SI units consistently inside models. Convert display units (degrees, kΩ, µF) at the configuration level.
- Verify formulas and units before submitting.
- Handle invalid and extreme parameter combinations.
- Never display `NaN` or `Infinity`. Use `SimuCore.util.fmt` and `fmtSI`, which show "—" for non-finite values.
- Charts and exports must use the same model data as the viewport.
- State idealized assumptions clearly.
- Do not claim engineering-grade accuracy without proper validation.
- Prefer numerical methods that stay stable across the supported parameter range.

### Documentation Guidelines

- Use simple and understandable language.
- Keep headings and formatting consistent.
- Verify links and commands.
- Use accurate descriptions of implemented features.
- Ensure screenshot paths are correct.
- Update the project structure when files are added or removed.

---

## 🧾 Testing Your Changes

Before submitting a contribution, test the affected parts of the application.

### Automated Tests

```bash
npm test
```

All tests must pass.

### Browser Testing

1. Open the application in a modern browser.
2. Check that the interface loads correctly.
3. Test the modified feature.
4. Check the browser console for errors.
5. Test the layout at roughly 1440, 820, and 390 pixels wide.
6. Verify that existing functionality remains operational.

### Model Testing

If you modify a simulation:

- Compare results against a known analytic solution.
- Test zero, minimum, and maximum parameter values.
- Test conservation laws where they apply.
- Confirm that charts, metrics, and CSV output agree.

---

## 🐛 Reporting Bugs

If you discover a bug, open an Issue in the GitHub repository.

Include the following information when possible:

1. **Title:** A short description of the issue.
2. **Description:** Explain what happened.
3. **Steps to Reproduce:** Provide the steps needed to reproduce the issue, including simulation and parameter values.
4. **Expected Behavior:** Describe what should happen.
5. **Actual Behavior:** Explain what happened instead.
6. **Environment:** Include your operating system and browser.
7. **Screenshots or Logs:** Attach useful evidence, such as console errors.

Please avoid including private credentials or sensitive information.

---

## 💡 Suggesting Improvements

Have an idea that could make SimuCore better?

We welcome suggestions related to:

- New simulations and engineering models.
- Improved numerical accuracy.
- Chart and visualization improvements.
- Experiment management and comparison tools.
- Accessibility and mobile usability.
- User experience and interface design.
- Documentation and learning resources.
- Performance and reliability.

Open a GitHub Issue and explain the problem your suggestion addresses and how it could improve the project.

---

## 🔀 Pull Request Guidelines

Before submitting a Pull Request, make sure:

- Your changes are relevant to SimuCore.
- Your branch is based on the latest appropriate version of the repository.
- Your code follows existing conventions.
- `npm test` passes.
- The browser console is free of errors and warnings.
- You have updated documentation when necessary.
- You have not included unrelated files or sensitive credentials.
- Your Pull Request clearly explains the changes.

Keep Pull Requests focused. Smaller, well-explained contributions are easier to review.

---

## 🔐 Security and Privacy Guidelines

Please follow these practices:

- Never commit passwords, API keys, or private credentials.
- Avoid exposing personal information in issues or screenshots.
- Do not add third-party tracking or unnecessary external requests.
- Handle stored data responsibly.
- Report potential vulnerabilities privately to the project maintainer rather than publicly disclosing sensitive details.

---

## 🤝 Code of Conduct

We want SimuCore to remain a welcoming and collaborative project.

All contributors are expected to:

- Treat others with respect.
- Welcome constructive feedback.
- Respect different opinions and ideas.
- Avoid harassment and discriminatory behavior.
- Keep discussions professional and productive.
- Help create a positive learning and development environment.

---

## 📄 License

By contributing to SimuCore, you agree that your contributions will be licensed under the project's **MIT License**.

Make sure that any code, images, or other materials you submit are your own or that you have permission to contribute them.

See the [LICENSE](LICENSE) file for details.

You can also view the license here:

[View SimuCore MIT License](https://github.com/rheillunio2-byte/SimuCore?tab=MIT-1-ov-file)

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=wave&color=0:06B6D4,50:1D4ED8,100:070B16&height=135&section=footer&animation=twinkling" width="100%" />

**Thank you for helping improve SimuCore!**

<sub>Better models. Clearer insight. Stronger engineering intuition.</sub>

</div>