# Flashcards

## Architecture

The application uses a feature-first structure:

```text
src/
├── app/       # Expo Router entry points
├── features/  # Product capabilities and domain logic
└── shared/    # Code reused across multiple features
```

Files under `src/app` define the navigation tree required by Expo Router. Keep these files minimal; they should normally re-export a feature route. Route groups such as `(tabs)` and `(modals)` organize navigation without adding URL segments, `_layout.tsx` configures navigators and providers, `[id].tsx` represents a dynamic parameter, and `+api.ts` defines a server endpoint.

Feature routes under `src/features/**/routes` adapt navigation to a feature. They read route parameters, load route-level data, handle loading and error states, and pass props to a screen. Screens under `screens` compose complete workflows, while `components` contains feature-owned UI and `hooks` contains state and workflow orchestration.

Other common feature directories are:

- `model`: domain types and pure business rules
- `data`: persistence contracts and implementations
- `queries`: read-oriented data hooks
- `api`: client-side API access
- `server`: server-only feature logic used by API routes
- `lib`: feature-specific utilities and library adapters

Keep code in its owning feature until it is genuinely reused by multiple features. Move only application-wide infrastructure, utilities, and reusable UI to `src/shared`.

For example, editing an existing card flows through:

```text
src/app/(modals)/edit-card/[id].tsx
  → src/features/cards/edit/routes/edit-card-route.tsx
  → src/features/cards/edit/screens/edit-card-screen.tsx
  → feature hooks
  → the card-store contract
  → the InstantDB implementation
```

## API routes and preview builds

Do not use Expo's automatic build-time server deployment (`EXPO_UNSTABLE_DEPLOY_SERVER`). The app uses a stable EAS Hosting alias instead:

```txt
https://tobio-flashcards--preview.expo.app
```

Development keeps using the local Expo server/API routes because `EXPO_PUBLIC_API_ORIGIN` should be unset locally. Preview builds get `EXPO_PUBLIC_API_ORIGIN` from `eas.json`/EAS env, and `app.config.js` uses it as the Expo Router `origin`.

### Deploy API routes for preview

Deploy API routes manually whenever server code or server environment variables change:

```bash
bunx expo export -p web --api-only
bunx eas-cli@latest deploy --environment preview --alias preview
```

A quick TTS route sanity check should return `401 Unauthorized` for an invalid token, not `Missing INSTANT_APP_ID`:

```bash
curl -i -X POST \
  https://tobio-flashcards--preview.expo.app/api/tts/draft \
  -H 'Authorization: Bearer invalid-token' \
  -H 'Content-Type: application/json' \
  --data '{"html":"<p>Hello</p>","locale":"en-US"}'
```

Because the native app points at the stable `preview` alias, API route changes can be redeployed without rebuilding the app. Rebuild only when native/client code or build configuration changes.

## Local iPhone preview build

If your iPhone is not registered for internal distribution yet, run:

```bash
bunx eas-cli@latest device:create
```

Then rebuild, because the provisioning profile needs to include that device.

Build the preview app:

```bash
bunx eas-cli@latest build --profile preview --platform ios --local
```

After it finishes, install the generated `.ipa` on the iPhone using one of:

- Xcode → Window → Devices and Simulators → drag the `.ipa`
- Apple Configurator
- Finder/device management if available

### Install the `.ipa` from the terminal

Connect and unlock the iPhone, then list devices:

```bash
xcrun devicectl list devices
```

Use the identifier for the physical iPhone whose state is `connected` or `available`. If the state is `unavailable`, unplug/replug the device, unlock it, and trust the Mac on the phone.

`devicectl device install app` installs a `.app` bundle, so first extract the generated `.ipa`:

```bash
IPA_PATH="$(ls -t *.ipa | head -1)"
TMP_DIR="$(mktemp -d)"
unzip -q "$IPA_PATH" -d "$TMP_DIR"
APP_PATH="$(find "$TMP_DIR/Payload" -maxdepth 1 -name '*.app' -print -quit)"
```

Then install the extracted app bundle:

```bash
xcrun devicectl device install app --device <device-identifier> "$APP_PATH"
```

For this machine, the connected iPhone can also be targeted by name:

```bash
xcrun devicectl device install app --device Tobfon "$APP_PATH"
```
