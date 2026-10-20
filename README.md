# Corvus

Corvus is a wireframe side-scrolling shooter that began as a browser experiment in 2010. This version keeps the original ships, weapons, upgrade economy, and visual character while rebuilding the runtime for current browsers.

Weapons are physical mounts around the ship: they fire from their own muzzles, intercept enemy fire and collisions before the hull, take damage, and can be repaired or destroyed.

Every mount reacts to its state with weapon-specific recoil, muzzle flashes, charging, cycling, or reload motion. Multi-barrel flashes follow the actual firing barrel, and sustained weapons expose their remaining burst energy on the model.

Combat effects distinguish directional impact sparks, heavy-weapon smoke, engine exhaust, glows, and expanding destruction rings. Slow nebula haze, distant orbital arcs, rotating debris, and near/far star layers add parallax depth behind the combat grid without obscuring threats.

Each frame has a role-focused armory. Modern additions include a penetrating Rail Spike, an impact-detonated Flak Charge, a target-acquiring Hunter Drone, and a sweeping Guard Blade. Orbit repeaters, drones, and blades move independently around their ship: their physical models intercept impacts and their shots originate from the moving mount.

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
npm ci
npm run dev
```

Other useful commands:

```sh
npm test
npm run check
npm run build
npm run preview
```

Use Node 24 (`.nvmrc`, also used by CI). Basaltwater on Debian is the reference
development environment; ordinary Node.js development remains supported.
Select the runtime with `nvm use`, or run `basaltw node exec -- npm run check`
on Basaltwater. `npm run check` checks TypeScript and runs the existing tests;
`npm run build` creates the production bundle.

For an authorized HTTPS preview on a phone or another device, follow the shared
`basaltwater-web-gateway` skill and run:

```sh
basaltwater-web preview start corvus --project .
```

The gateway keeps Vite on loopback. The native development and preview commands
work without Basaltwater; provide trusted HTTPS separately when needed.

The production build uses relative asset paths so it works from the repository's
GitHub Pages project path or another subdirectory. Pull requests and pushes to
`main` are tested and built; only main publishes the Pages site.
