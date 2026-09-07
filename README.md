# ASCII

A tiny engine that turns an image into a spinning ASCII-art animation, rendered live in the browser as text - no images, just characters.

Try it, download the result as a GIF, or feed it your own picture.

## Running it

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` and click into any animation.

## Downloading a GIF

Every animation page has a small download icon in the top-right corner. Click it to render the current animation to a looping GIF and save it.

## Generating your own animation

```bash
pnpm generate --image path/to/image.png
```

This builds a new ASCII animation from the image and adds it to the gallery.

- **`--image <path>`** (required) - a **PNG** with a transparent background. The transparent area is dropped, so only your subject is used - this is what lets the engine isolate one object and turn it into a clean silhouette instead of picking up a background.
- **`--name "Display Name"`** (optional) - what to call it. Defaults to the image's filename.
- **`--axis horizontal | vertical | random | auto`** (optional, default `auto`) - which way it spins:
  - `vertical` - spins upright, like a turntable. Good for portraits and anything taller than it is wide.
  - `horizontal` - tumbles end over end, like a coin flip. Good for anything wider than it is tall.
  - `auto` - picks `vertical` or `horizontal` based on the image's aspect ratio.
  - `random` - picks one at random.

Once it's done, run `pnpm dev` and visit the new animation at `/<name>`.

## How it works

Every animation is a cloud of 3D points rendered every frame with a single shared renderer (`lib/ascii/engine`): rotate the points, project them onto a character grid, resolve which point is closest per cell, and pick a character from a brightness ramp based on how much light that point's surface catches. Nothing here is a picture - it's math, printed as text.

For generated animations, the source PNG's alpha channel becomes a silhouette, and each point in that silhouette is pushed toward the camera in proportion to its distance from the silhouette's edge - the same trick that makes an embossed badge look raised.
