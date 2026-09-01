# Corvus

Corvus is a wireframe side-scrolling shooter that began as a browser experiment in 2010. This version keeps the original ships, weapons, upgrade economy, and visual character while rebuilding the runtime for current browsers.

Weapons are physical mounts around the ship: they fire from their own muzzles, intercept enemy fire and collisions before the hull, take damage, and can be repaired or destroyed.

Each frame has a role-focused armory. The modern additions include a penetrating Rail Spike for aligned targets and an impact-detonated Flak Charge for clustered formations.

Play it at [bluehexagons.github.io/jsshooter](https://bluehexagons.github.io/jsshooter/).

## Controls

- Move with WASD or the arrow keys.
- Aim with the pointer.
- Hold the primary mouse button or Space to fire.
- Press P or Escape to pause.
- Use Z/X/C to select upgrade, repair, or reload, then press 1–5 for that armory entry. Upgrade buys weapons that are not installed yet.
- On a touch screen, drag on the left side of the playfield to move and touch the right side to aim and fire.

## Development

The game is written in strict TypeScript and built with Vite.

```sh
npm install
npm run dev
```

Other useful commands:

```sh
npm test
npm run build
npm run preview
```

The production build uses relative asset paths so it works from the repository's GitHub Pages project path. Pushes to `main` are tested, built, and published by the Pages workflow.
