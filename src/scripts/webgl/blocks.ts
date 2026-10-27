/*! @license MIT
 * Adapted from "codrops-batchedmesh" (https://github.com/ULuIQ12/codrops-batchedmesh), Copyright (c) Christophe
 * Choffel, as is public/webgl/blocks.glb. The minifier drops this comment, so the notice also ships as
 * public/webgl/LICENSE.txt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Blocks: a field of chunky blocks (some topped with a "+", a peg, a hole... or a UI element) whose heights roll in slow
 * waves. Blocks near the pointer rise, and a ripple runs out from the middle when the field first appears. Black
 * blocks, with many of the "+" and UI tops and the odd other one in mint, seen by a fixed camera, with ambient
 * occlusion, depth of field and a vignette. The UI tops follow the components on uiverse.io: buttons, switches,
 * sliders, inputs, tooltips, radio buttons, checkboxes, loaders (the spinners turn), cards and forms (see KINDS).
 *
 * Adapted from Christophe Choffel's "BatchedMesh and WebGPURenderer" Codrops demo
 * (https://github.com/ULuIQ12/codrops-batchedmesh, MIT), including its block model (public/webgl/blocks.glb). It needs
 * three.js, so index.ts only loads it on pages that use it. three's WebGPURenderer falls back to WebGL 2 where WebGPU is
 * missing.
 *
 * Host: <canvas data-gl="blocks">
 */
import {
  ACESFilmicToneMapping,
  BatchedMesh,
  Color,
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  MathUtils,
  Matrix4,
  Mesh,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  PMREMGenerator,
  Path,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  RenderPipeline,
  Scene,
  Shape,
  Vector2,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu';
import { clamp, mrt, normalView, output, pass, screenUV, uniform, vec4 } from 'three/tsl';
import { dof } from 'three/examples/jsm/tsl/display/DepthOfFieldNode.js';
import { fxaa } from 'three/examples/jsm/tsl/display/FXAANode.js';
import { ao } from 'three/examples/jsm/tsl/display/GTAONode.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const SETTINGS = {
  model: '/webgl/blocks.glb',
  /** field size in grid cells: smaller on small or low-power devices, which also skip occlusion and depth of field */
  grid: 148,
  gridSmall: 96,
  /** share of square blocks topped with a "+" (like the site's plus marks), and of those in the accent colour */
  crossShare: 0.35,
  crossAccent: 0.55,
  /** share of long and of square blocks topped with a UI element (a button, switch, input, card... see KINDS), and of
   * those in the accent colour: a quarter keeps about a fifth of all tops mint, so the mint crosses still stand out */
  longUiShare: 0.65,
  squareUiShare: 0.3,
  uiAccent: 0.25,
  /** share of the other block tops in the accent colour */
  accentShare: 0.02,
  base: 0x000000,
  tops: [0x101010, 0x181818, 0x202020, 0x282828],
  accent: 0x00ffa1,
  ground: 0x050505,
  /** wave height, and how far (in grid cells) and how high blocks rise around the pointer */
  waves: 8,
  reach: 10,
  lift: 5,
  /** seconds before the opening ripple, and how long it runs */
  rippleDelay: 0.4,
  rippleDuration: 5,
  exposure: 0.9,
  /** depth of field: how far from the focus blocks go fully soft (world units), and the bokeh size */
  focalLength: 60,
  bokeh: 1.5,
};

/** the model's tops, then its bases; each top sits on the base this maps it to */
const TOPS = ['Square_Top', 'Quart_Top', 'Hole_Top', 'Peg_Top', 'Divot_Top', 'Cross_Top'];
const CROSS = TOPS.indexOf('Cross_Top');
const BASES = ['Square_Base', 'Quart_Base', 'Hole_Base'];
const BASE_OF_TOP = [6, 7, 8, 6, 6, 6];

/**
 * UI element tops, after the components on uiverse.io (buttons, switches, inputs, tooltips, loaders, radio buttons,
 * checkboxes, cards and forms), each with the block sizes it fits (by the long and short side, in cells) and how often
 * it is picked among those that fit.
 */
type Kind =
  | 'pill' | 'pushable' | 'outline' | 'switch' | 'slider' | 'input' | 'search' | 'tooltip' | 'segmented' | 'dots'
  | 'key' | 'round' | 'checkbox' | 'radio' | 'spinner' | 'bars' | 'card' | 'form';
const isSquare = (l: number, s: number) => l === s;
const isLong = (min: number, max = Infinity) => (l: number, s: number) => l > s && l / s >= min && l / s <= max;
const KINDS: { kind: Kind; fits: (l: number, s: number) => boolean; weight: number }[] = [
  // buttons
  { kind: 'pill', fits: isLong(1), weight: 1.5 },
  { kind: 'pushable', fits: isLong(1), weight: 1 },
  { kind: 'outline', fits: isLong(1), weight: 1 },
  { kind: 'key', fits: isSquare, weight: 1 },
  { kind: 'round', fits: isSquare, weight: 1 },
  // switches, inputs, tooltips
  { kind: 'switch', fits: isLong(1.5, 3), weight: 1.2 },
  { kind: 'slider', fits: isLong(3), weight: 0.8 },
  { kind: 'input', fits: isLong(2.5), weight: 1 },
  { kind: 'search', fits: isLong(3), weight: 0.8 },
  { kind: 'tooltip', fits: isLong(1.5, 3.5), weight: 1 },
  // radio buttons, checkboxes, loaders
  { kind: 'segmented', fits: isLong(2.5), weight: 0.8 },
  { kind: 'radio', fits: isSquare, weight: 1.2 },
  { kind: 'checkbox', fits: isSquare, weight: 1.2 },
  { kind: 'spinner', fits: isSquare, weight: 0.8 },
  { kind: 'bars', fits: isSquare, weight: 0.8 },
  { kind: 'dots', fits: isLong(2.5), weight: 0.8 },
  // cards and forms, on the bigger blocks
  { kind: 'card', fits: (l, s) => l >= 3 && s >= 2, weight: 2 },
  { kind: 'form', fits: (l, s) => l >= 4 && s >= 2, weight: 1.5 },
];

/** A UI kind that fits an l x s block, picked by weight; undefined when none does. */
function pickKind(l: number, s: number) {
  const fitting = KINDS.filter((k) => k.fits(l, s));
  let roll = Math.random() * fitting.reduce((sum, k) => sum + k.weight, 0);
  return fitting.find((k) => (roll -= k.weight) < 0)?.kind;
}

/** proportions, in grid cells: gap to the block's edge, rounded edge, height of a body, corner radius of the pushable
 * and rounded-square buttons (as a share of their short side), and the outline button's border */
const UI = { inset: 0.12, bevel: 0.04, depth: 0.1, corner: 0.22, border: 0.09 };

type Block = {
  /** footprint centre and size, in grid cells */
  x: number;
  z: number;
  sx: number;
  sz: number;
  /** where its wave noise is sampled */
  nx: number;
  ny: number;
  rotation: number;
  /** one of the model's tops (TOPS index), or a UI element */
  top: number | Kind;
  /** how fast its top turns (radians per second): loaders spin */
  spin: number;
  height: number;
};

/** Add an arc to `path` as pieces of at most a quarter turn, so long arcs get as many points as rounded corners. */
function arc(path: Path, cx: number, cy: number, r: number, a0: number, a1: number, clockwise = false) {
  const span = Math.abs(a1 - a0);
  const n = Math.max(1, Math.ceil(span / (Math.PI / 2) - 1e-6));
  for (let i = 0; i < n; i++) path.absarc(cx, cy, r, a0 + ((a1 - a0) * i) / n, a0 + ((a1 - a0) * (i + 1)) / n, clockwise);
  return path;
}

/** A w x h outline centred on (cx, cy) with its corners rounded by r; r of half the short side makes a pill. */
function rrect<T extends Path>(path: T, w: number, h: number, r: number, cx = 0, cy = 0) {
  const x = w / 2;
  const y = h / 2;
  r = Math.max(0.005, Math.min(r, x, y));
  arc(path, cx + x - r, cy - y + r, r, -Math.PI / 2, 0);
  arc(path, cx + x - r, cy + y - r, r, 0, Math.PI / 2);
  arc(path, cx - x + r, cy + y - r, r, Math.PI / 2, Math.PI);
  arc(path, cx - x + r, cy - y + r, r, Math.PI, Math.PI * 1.5);
  return path;
}

/** A circle, drawn as four quarter arcs like the rounded corners so it gets as many points as they do. */
const circle = <T extends Path>(path: T, r: number, cx = 0, cy = 0) => rrect(path, 2 * r, 2 * r, r, cx, cy);

/** A rounded rectangle with a border t wide and nothing inside: a frame. */
function frame(w: number, h: number, r: number, t: number, cx = 0, cy = 0) {
  const shape = rrect(new Shape(), w, h, r, cx, cy);
  shape.holes.push(rrect(new Path(), w - 2 * t, h - 2 * t, r - t, cx, cy));
  return shape;
}

/** A circle r round with a border t wide and nothing inside: a ring. */
function ring(r: number, t: number, cx = 0, cy = 0) {
  const shape = circle(new Shape(), r, cx, cy);
  shape.holes.push(circle(new Path(), r - t, cx, cy));
  return shape;
}

/** Part of a ring, r round and t wide, from angle a0 to a1, with rounded ends: a spinner's arc. */
function arcBand(r: number, t: number, a0: number, a1: number) {
  const mid = r - t / 2;
  const shape = new Shape();
  arc(shape, 0, 0, r, a0, a1);
  arc(shape, mid * Math.cos(a1), mid * Math.sin(a1), t / 2, a1, a1 + Math.PI);
  arc(shape, 0, 0, r - t, a1, a0, true);
  arc(shape, mid * Math.cos(a0), mid * Math.sin(a0), t / 2, a0 + Math.PI, a0 + Math.PI * 2);
  return shape;
}

/** A polygon through the given points. */
function polygon(points: [number, number][]) {
  const shape = new Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach((p) => shape.lineTo(...p));
  return shape;
}

/** A stroke `width` wide along a line through the given points, with mitred joins: a check mark. */
function stroke(points: [number, number][], width: number) {
  const half = width / 2;
  const normal = (a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    return [-dy / len, dx / len];
  };
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  points.forEach((p, i) => {
    const n0 = normal(points[Math.max(0, i - 1)], points[Math.max(1, i)]);
    const n1 = normal(points[Math.min(i, points.length - 2)], points[Math.min(i + 1, points.length - 1)]);
    // the mitre at a join: along the average normal, long enough to keep the stroke's width on both sides
    let mx = n0[0] + n1[0];
    let my = n0[1] + n1[1];
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const scale = half / (mx * n0[0] + my * n0[1]);
    left.push([p[0] + mx * scale, p[1] + my * scale]);
    right.unshift([p[0] - mx * scale, p[1] - my * scale]);
  });
  return polygon([...left, ...right]);
}

/**
 * Extrude a flat outline upwards into a slab `depth` tall with a rounded edge of `bevel`, standing on y = `y`. Kept
 * light, as a thousand of these can be on screen: each quarter arc gets 6 segments (three draws an arc with twice the
 * curve segments) and the edge 3, about the detail of the model's own tops.
 */
function slab(shape: Shape, depth: number, bevel: number, y = 0) {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 3 });
  // the extrusion runs along +z: turn it to +y (the outline's y becomes -z), with the lower bevel on the block
  g.rotateX(-Math.PI / 2);
  g.translate(0, y + bevel, 0);
  return g;
}

/**
 * The slabs of a UI element filling an l x s area (long side along x), standing on y = 0. Thin parts (a frame, a
 * track, text lines) sit low, the parts a hand would press (buttons, knobs, thumbs) stand higher.
 */
function uiParts(kind: Kind, l: number, s: number): ExtrudeGeometry[] {
  const { bevel, depth, corner, border } = UI;
  const thin = bevel / 2;
  switch (kind) {
    case 'pill':
      return [slab(rrect(new Shape(), l, s, s / 2), depth, bevel)];
    case 'pushable': {
      // a face stepped up on a slightly wider skirt, like the solid edge under a "pushable" button
      const skirt = 0.05;
      const step = 0.07;
      return [
        slab(rrect(new Shape(), l, s, s * corner), skirt, thin),
        slab(rrect(new Shape(), l - 2 * step, s - 2 * step, (s - 2 * step) * corner), depth, bevel, skirt + bevel),
      ];
    }
    case 'outline':
      return [slab(frame(l, s, s / 2, border), depth / 2, thin)];
    case 'key':
      return [slab(rrect(new Shape(), l, s, s * corner), depth * 1.2, bevel)];
    case 'round':
      // a domed cap inside a low bezel ring
      return [slab(ring(s / 2, s * 0.08), depth / 2, thin), slab(circle(new Shape(), s * 0.36), depth * 1.4, bevel)];
    case 'switch':
      // a low pill track with its knob standing up at one end
      return [slab(rrect(new Shape(), l, s, s / 2), depth / 2, thin), slab(circle(new Shape(), s * 0.4, l / 2 - s / 2), depth * 1.1, bevel, 0.02)];
    case 'slider': {
      // a thin track, raised up to the round thumb
      const thumb = l * 0.15;
      return [
        slab(rrect(new Shape(), l, s * 0.26, s * 0.13), 0.04, 0.012),
        slab(rrect(new Shape(), thumb + l / 2, s * 0.26, s * 0.13, (thumb - l / 2) / 2), 0.07, 0.012),
        slab(circle(new Shape(), s * 0.4, thumb), depth * 1.2, bevel),
      ];
    }
    case 'input': {
      // a field with a placeholder line and the text cursor after it
      const hint = l * 0.4;
      const x = -l / 2 + s * 0.22 + hint / 2;
      return [
        slab(frame(l, s, s * 0.35, 0.06), depth / 2, thin),
        slab(rrect(new Shape(), hint, s * 0.16, s * 0.08, x), 0.03, 0.012),
        slab(rrect(new Shape(), 0.05, s * 0.5, 0.02, x + hint / 2 + 0.1), 0.08, 0.015),
      ];
    }
    case 'search': {
      // a pill field with a magnifier at one end and a placeholder line
      const cx = -l / 2 + s * 0.46;
      const cy = s * 0.04;
      return [
        slab(frame(l, s, s / 2, 0.06), depth / 2, thin),
        slab(ring(s * 0.2, s * 0.06, cx, cy), 0.07, 0.012),
        slab(stroke([[cx + s * 0.15, cy - s * 0.15], [cx + s * 0.3, cy - s * 0.3]], s * 0.07), 0.07, 0.01),
        slab(rrect(new Shape(), l * 0.35, s * 0.14, s * 0.07, cx + s * 0.4 + l * 0.175), 0.03, 0.012),
      ];
    }
    case 'tooltip': {
      // a bubble with a diamond tail at one end (like the rotated square under a CSS tooltip) and two lines of text
      const tail = s * 0.24;
      const body = l - tail;
      const x = -tail / 2;
      const end = x + body / 2;
      const margin = s * 0.18;
      const left = x - body / 2 + margin;
      const top = depth * 0.7 + bevel;
      const line = (len: number, y: number) => slab(rrect(new Shape(), len, s * 0.13, s * 0.065, left + len / 2, y), 0.03, 0.012, top);
      return [
        slab(rrect(new Shape(), body, s, s * 0.2, x), depth * 0.7, thin),
        slab(polygon([[end - tail, 0], [end, tail], [end + tail, 0], [end, -tail]]), depth * 0.7, thin),
        line((body - 2 * margin) * 0.6, s * 0.15),
        line((body - 2 * margin) * 0.38, -s * 0.15),
      ];
    }
    case 'segmented': {
      // three options in a pill track, the first one picked
      const third = l / 3;
      const label = (i: number) => slab(rrect(new Shape(), third * 0.4, s * 0.13, s * 0.065, -l / 2 + third * (i + 0.5)), 0.025, 0.01, 0.07);
      return [
        slab(rrect(new Shape(), l, s, s / 2), 0.04, 0.015),
        slab(rrect(new Shape(), third - 0.06, s - 0.12, (s - 0.12) / 2, -l / 2 + third / 2), depth * 0.8, thin, 0.04),
        label(1),
        label(2),
      ];
    }
    case 'radio':
      return [slab(ring(s / 2, s * 0.1), depth * 0.6, thin), slab(circle(new Shape(), s * 0.2), depth * 0.9, thin)];
    case 'checkbox':
      return [
        slab(frame(s, s, s * 0.17, s * 0.1), depth * 0.6, thin),
        slab(stroke([[-s * 0.28, s * 0.02], [-s * 0.08, -s * 0.2], [s * 0.3, s * 0.22]], s * 0.13), depth * 0.9, 0.012),
      ];
    case 'spinner':
      // a three-quarter arc; it turns (see Block.spin)
      return [slab(arcBand(s / 2, s * 0.15, 0, Math.PI * 1.5), depth * 0.9, thin)];
    case 'bars':
      // three loading bars of different heights
      return [0.14, 0.3, 0.22].map((h, i) => slab(rrect(new Shape(), s * 0.17, s * 0.62, s * 0.06, (i - 1) * s * 0.3), h, 0.025));
    case 'dots':
      // three loading dots, shrinking, in a group in the middle
      return [0.34, 0.27, 0.2].map((r, i) => slab(circle(new Shape(), s * r, (i - 1) * s * 0.8), depth * 1.2, bevel * 1.4));
    case 'card': {
      // a panel with a raised picture at one end, two lines of text and a small button
      const pad = 0.12;
      const inner = s - 2 * pad;
      const picture = l * 0.55;
      const top = 0.05 + bevel;
      const after = -l / 2 + pad + picture;
      const x = (left: number, len: number) => left + len / 2;
      const y = (len: number) => -inner / 2 + len / 2;
      return [
        slab(rrect(new Shape(), l, s, 0.06 + s * 0.08), 0.05, thin),
        slab(rrect(new Shape(), picture - pad, inner, 0.1, x(-l / 2 + pad, picture - pad)), 0.06, thin, top),
        slab(rrect(new Shape(), 0.12, inner * 0.8, 0.05, x(after + 0.14, 0.12), y(inner * 0.8)), 0.03, 0.012, top),
        slab(rrect(new Shape(), 0.12, inner * 0.5, 0.05, x(after + 0.4, 0.12), y(inner * 0.5)), 0.03, 0.012, top),
        slab(rrect(new Shape(), 0.24, inner * 0.45, 0.12, x(l / 2 - pad - 0.24, 0.24), y(inner * 0.45)), 0.07, thin, top),
      ];
    }
    case 'form': {
      // a panel with a title, two input fields and a submit button, spread along it
      const pad = 0.14;
      const inner = s - 2 * pad;
      const top = 0.05 + bevel;
      const sizes = [0.16, 0.42, 0.42, 0.42];
      const gap = (l - 2 * pad - sizes.reduce((a, b) => a + b, 0)) / (sizes.length - 1);
      const at = sizes.map((_, i) => -l / 2 + pad + sizes.slice(0, i).reduce((a, b) => a + b + gap, 0) + sizes[i] / 2);
      return [
        slab(rrect(new Shape(), l, s, 0.15), 0.05, thin),
        slab(rrect(new Shape(), sizes[0], inner * 0.55, 0.06, at[0], -inner / 2 + (inner * 0.55) / 2), 0.04, 0.015, top),
        slab(frame(sizes[1], inner, 0.18, 0.05, at[1]), 0.05, 0.015, top),
        slab(frame(sizes[2], inner, 0.18, 0.05, at[2]), 0.05, 0.015, top),
        slab(rrect(new Shape(), sizes[3], inner, 0.21, at[3]), 0.08, thin, top),
      ];
    }
  }
}

/**
 * Index a non-indexed geometry, sharing the vertices that have the same position and normal. Much faster than
 * BufferGeometryUtils.mergeVertices, which builds a string key per vertex: with 150-odd UI shapes to make while the page
 * loads, that took most of a second. Its uv is left at zero: nothing samples it, but the batch needs the attribute.
 */
function indexed(geometry: BufferGeometry) {
  const position = geometry.attributes.position.array;
  const normal = geometry.attributes.normal.array;
  const count = geometry.attributes.position.count;
  const q = (v: number) => Math.round(v * 1e4);
  const keys: number[] = []; // the quantised position and normal of each kept vertex, six to a vertex
  const positions: number[] = [];
  const normals: number[] = [];
  const index = new Uint32Array(count);
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < count; i++) {
    const k = i * 3;
    const key = [q(position[k]), q(position[k + 1]), q(position[k + 2]), q(normal[k]), q(normal[k + 1]), q(normal[k + 2])];
    const hash = (key[0] * 73856093) ^ (key[1] * 19349663) ^ (key[2] * 83492791) ^ (key[3] * 2971215) ^ (key[4] * 1299709) ^ (key[5] * 15485863);
    const bucket = buckets.get(hash);
    let found = -1;
    if (bucket) {
      for (const j of bucket) {
        if (key.every((v, c) => keys[j * 6 + c] === v)) {
          found = j;
          break;
        }
      }
    }
    if (found < 0) {
      found = positions.length / 3;
      keys.push(...key);
      positions.push(position[k], position[k + 1], position[k + 2]);
      normals.push(normal[k], normal[k + 1], normal[k + 2]);
      if (bucket) bucket.push(found);
      else buckets.set(hash, [found]);
    }
    index[i] = found;
  }
  const result = new BufferGeometry();
  result.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  result.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  result.setAttribute('uv', new BufferAttribute(new Float32Array((positions.length / 3) * 2), 2));
  result.setIndex(new BufferAttribute(index, 1));
  return result;
}

/**
 * A UI element top for an l x s block (long side along x; a block running along z turns its top a quarter), at its
 * true size so its rounded corners stay round on long blocks. Its rounded edges are shaded smooth, and it is indexed
 * with the model's attributes (position, normal, uv) so it batches with them.
 */
function uiGeometry(kind: Kind, l: number, s: number) {
  const { inset, bevel } = UI;
  // every outline grows by the bevel, so draw it that much inside the gap
  const parts = uiParts(kind, l - 2 * (inset + bevel), s - 2 * (inset + bevel));
  const merged = parts.length > 1 ? mergeGeometries(parts) : parts[0];
  // smooth across the 30° steps of the rounded edge and the 15° steps around the corners, sharp elsewhere
  const creased = toCreasedNormals(merged, Math.PI / 5);
  const smooth = indexed(creased);
  parts.forEach((p) => p.dispose());
  creased.dispose();
  return smooth;
}

// Inigo Quilez's remapping functions (https://iquilezles.org/articles/functions/)
const gain = (x: number, k: number) => {
  const a = 0.5 * Math.pow(2 * (x < 0.5 ? x : 1 - x), k);
  return x < 0.5 ? a : 1 - a;
};
const cubicPulse = (c: number, w: number, x: number) => {
  let d = Math.abs(x - c);
  if (d > w) return 0;
  d /= w;
  return 1 - d * d * (3 - 2 * d);
};

/** Fill a size x size grid with blocks of random sizes and kinds, row by row (as the original demo does). */
function layOut(size: number) {
  const blocks: Block[] = [];
  const taken: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const max = new Vector2();
  max.x = max.y = MathUtils.randInt(1, 5);
  for (let py = 0; py < size; py++) {
    let px = 0;
    while (px < size) {
      let room = 0;
      for (let i = px; i < Math.min(size, px + max.x) && !taken[i][py]; i++) room++;
      if (room === 0) {
        px++;
        continue;
      }
      const square = Math.random() < 0.5;
      const sx = MathUtils.randInt(1, room);
      const sz = square ? sx : MathUtils.randInt(1, max.y);
      for (let i = px; i < Math.min(size, px + sx); i++) for (let j = py; j < Math.min(size, py + sz); j++) taken[i][j] = true;
      // only square blocks take the model's shaped tops; long ones get a plain top or a UI element that fits them
      const s = SETTINGS;
      const roll = Math.random();
      const ui = () => pickKind(Math.max(sx, sz), Math.min(sx, sz));
      let top: Block['top'];
      if (!square) top = (roll < s.longUiShare && ui()) || 0;
      else if (roll < s.crossShare) top = CROSS;
      else top = (roll < s.crossShare + s.squareUiShare && ui()) || MathUtils.randInt(0, CROSS - 1);
      blocks.push({
        x: px + sx / 2,
        z: py + sz / 2,
        sx,
        sz,
        nx: px * 0.1,
        ny: py,
        // a square block can face any way, a long one only two; a checkbox faces the camera, so its tick reads upright
        rotation: top === 'checkbox' ? Math.PI : square ? (MathUtils.randInt(0, 4) * Math.PI) / 2 : MathUtils.randInt(0, 2) * Math.PI,
        top,
        spin: top === 'spinner' ? MathUtils.randFloat(0.6, 1.2) * (Math.random() < 0.5 ? -1 : 1) : 0,
        height: 1,
      });
      px += sx;
    }
    // the size limits sometimes change after a row, which gives the field some structure
    if (Math.random() > 0.8) {
      max.x = Math.random() > 0.5 ? 2 : 5;
      max.y = Math.random() > 0.5 ? 2 : 5;
    }
  }
  return blocks;
}

/** Wait until `host` has a size: a canvas set up at zero size never recovers its render targets. */
function sized(host: HTMLElement) {
  return new Promise<void>((resolve) => {
    const observer = new ResizeObserver(() => {
      if (host.clientWidth > 1 && host.clientHeight > 1) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(host);
  });
}

async function start(canvas: HTMLCanvasElement, host: HTMLElement, cancelled: () => boolean) {
  const s = SETTINGS;
  await sized(host);
  if (cancelled()) return;
  const small = Math.min(host.clientWidth, host.clientHeight) < 600 || (navigator.hardwareConcurrency ?? 8) <= 4;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new WebGPURenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = s.exposure;
  await renderer.init();
  if (cancelled()) return void renderer.dispose();

  // the camera stays where the original demo first puts it
  const camera = new PerspectiveCamera(20, 1, 0.1, 500);
  const angle = (-Math.PI * 2) / 3;
  const distance = 100;
  const fit = new Vector3(Math.cos(angle), 0, Math.sin(distance)).multiplyScalar(10);
  camera.position.set(Math.cos(angle) * distance, 55, Math.sin(angle) * distance).add(fit);
  camera.lookAt(fit);

  // post-processing: colour, normals and depth -> ambient occlusion -> depth of field -> vignette -> FXAA
  const post = new RenderPipeline(renderer);
  const scene = new Scene();
  const scenePass = pass(scene, camera);
  const color = scenePass.getTextureNode('output');
  const vignette = clamp(screenUV.sub(0.5).length().mul(1.2), 0.0, 1.0).oneMinus().pow(0.5);
  // focus on the point the camera looks at, as the demo's auto-focus settles on
  const ground = new Plane(new Vector3(0, 1, 0), camera.position.y * 0.1);
  const look = new Vector3();
  camera.getWorldDirection(look);
  const focusPoint = new Vector3();
  new Raycaster(camera.position, look).ray.intersectPlane(ground, focusPoint);
  const focusDistance = focusPoint.distanceTo(camera.position);
  if (small) {
    post.outputNode = fxaa(color.mul(vignette));
  } else {
    scenePass.setMRT(mrt({ output, normal: normalView }));
    const occlusion = ao(scenePass.getTextureNode('depth'), scenePass.getTextureNode('normal'), camera);
    occlusion.distanceExponent.value = 1;
    occlusion.distanceFallOff.value = 0.1;
    occlusion.radius.value = 1.0;
    occlusion.scale.value = 1.5;
    occlusion.thickness.value = 1;
    const shaded = vec4(color.rgb.mul(occlusion.getTextureNode().r), color.a);
    const blurred = dof(shaded, scenePass.getViewZNode(), uniform(focusDistance * 0.85), uniform(s.focalLength), uniform(s.bokeh));
    post.outputNode = fxaa(blurred.mul(vignette));
  }

  const gltf = await new GLTFLoader().loadAsync(s.model);
  if (cancelled()) return void renderer.dispose();

  // a neutral studio light for the reflections (the demo's blue sky tinted the black blocks); the background stays black
  const pmrem = new PMREMGenerator(renderer);
  const sky = (await pmrem.fromSceneAsync(new RoomEnvironment(), 0.04)).texture;
  pmrem.dispose();
  scene.environment = sky;
  scene.background = new Color(s.base);

  const size = small ? s.gridSmall : s.grid;
  const floor = new Mesh(new PlaneGeometry(size, size), new MeshStandardNodeMaterial({ color: s.ground }));
  floor.rotateX(-Math.PI / 2);
  scene.add(floor);

  // every block is two instances of one BatchedMesh: a base stretched to its height, and a top laid on it
  const model = [...TOPS, ...BASES].map((name) => (gltf.scene.getObjectByName(name) as Mesh).geometry as BufferGeometry);
  const blocks = layOut(size);
  // the geometries the field uses, each stored once in the batch: the model's, and a UI element per kind and block size
  const used: BufferGeometry[] = [];
  const slot = new Map<BufferGeometry | string, number>();
  const use = (key: BufferGeometry | string, make: () => BufferGeometry) => {
    let i = slot.get(key);
    if (i === undefined) slot.set(key, (i = used.push(make()) - 1));
    return i;
  };
  const partsOf = (b: Block) => {
    const top = b.top;
    if (typeof top === 'number') return [use(model[BASE_OF_TOP[top]], () => model[BASE_OF_TOP[top]]), use(model[top], () => model[top])];
    const l = Math.max(b.sx, b.sz);
    const sh = Math.min(b.sx, b.sz);
    return [use(model[BASE_OF_TOP[0]], () => model[BASE_OF_TOP[0]]), use(`${top} ${l}x${sh}`, () => uiGeometry(top, l, sh))];
  };
  // making the hundred-odd UI shapes takes a few hundred milliseconds: do it in short slices so the page stays
  // responsive meanwhile
  const parts: number[][] = [];
  let slice = performance.now();
  for (const b of blocks) {
    parts.push(partsOf(b));
    if (performance.now() - slice > 8) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (cancelled()) return void renderer.dispose();
      slice = performance.now();
    }
  }
  const vertices = used.reduce((n, g) => n + g.attributes.position.count, 0);
  const indices = used.reduce((n, g) => n + g.index!.count, 0);
  const material = new MeshPhysicalNodeMaterial({ roughness: 0.1, metalness: 0 });
  material.envMapIntensity = 0.25;
  const mesh = new BatchedMesh(blocks.length * 2, vertices, indices, material);
  mesh.sortObjects = false;
  mesh.position.set(-size / 2, 0, -size / 2);
  scene.add(mesh);
  const ids = used.map((g) => mesh.addGeometry(g));
  const base = new Color(s.base);
  const tops = s.tops.map((c) => new Color(c));
  const accent = new Color(s.accent);
  blocks.forEach((b, i) => {
    mesh.addInstance(ids[parts[i][0]]);
    mesh.addInstance(ids[parts[i][1]]);
    mesh.setColorAt(i * 2, base);
    const share = b.top === CROSS ? s.crossAccent : typeof b.top === 'string' ? s.uiAccent : s.accentShare;
    mesh.setColorAt(i * 2 + 1, Math.random() < share ? accent : tops[MathUtils.randInt(0, tops.length - 1)]);
  });

  // the opening ripple runs out from where the demo centred it
  const rippleCentre = new Vector3();
  new Raycaster(camera.position.clone().setY(camera.position.y - 10), look).ray.intersectPlane(ground, rippleCentre);

  // the pointer, projected onto the ground
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const pointer = new Vector3(1e5, 0, 1e5);
  const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
  let clientX = -1e4;
  let clientY = -1e4;
  const onMove = (e: PointerEvent) => {
    clientX = e.clientX;
    clientY = e.clientY;
  };
  const placePointer = () => {
    const r = host.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return void pointer.set(1e5, 0, 1e5);
    raycaster.setFromCamera(ndc.set(x * 2 - 1, -y * 2 + 1), camera);
    if (!raycaster.ray.intersectPlane(groundPlane, pointer)) pointer.set(1e5, 0, 1e5);
  };

  const noise = new SimplexNoise();
  // two octaves of simplex noise scaled to 0..1, like the demo's fast-simplex-noise settings
  const waveAt = (x: number, y: number) => {
    let sum = 0;
    let amplitude = 1;
    let frequency = 0.05;
    for (let o = 0; o < 2; o++) {
      sum += noise.noise(x * frequency, y * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return (sum / 1.5 + 1) / 2;
  };

  const matrix = new Matrix4();
  const place = (index: number, b: Block, y: number, sx: number, sy: number, sz: number, rotation = b.rotation) => {
    // translate * rotateY * scale, written out
    const c = Math.cos(rotation);
    const sn = Math.sin(rotation);
    matrix.set(c * sx, 0, sn * sz, b.x, 0, sy, 0, y, -sn * sx, 0, c * sz, b.z, 0, 0, 0, 1);
    mesh.setMatrixAt(index, matrix);
  };

  let elapsed = 0;
  const update = (dt: number) => {
    if (!still) elapsed += dt;
    placePointer();
    const t = MathUtils.clamp((elapsed - s.rippleDelay) / s.rippleDuration, 0, 1);
    const echoT = MathUtils.clamp((elapsed - s.rippleDelay - 0.3) / s.rippleDuration, 0, 1);
    const rising = 1 - Math.pow(0.9, dt * 60);
    const falling = 1 - Math.pow(0.7, dt * 60);
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const dx = b.x + mesh.position.x - pointer.x;
      const dz = b.z + mesh.position.z - pointer.z;
      const near = MathUtils.clamp(1 - Math.sqrt(dx * dx + dz * dz) / s.reach, 0, 1);
      let target = waveAt(b.nx, b.ny + elapsed * 5) * s.waves + 1 + near * s.lift;
      if (t < 1 && !still) {
        const fromCentre = MathUtils.clamp(Math.hypot(b.x - rippleCentre.x - size / 2, b.z - rippleCentre.z - size / 2) / size / 2, 0, 1);
        target += cubicPulse(Math.pow(gain(t, 1.1), 0.9), 0.05, fromCentre) * 10 + cubicPulse(gain(echoT, 1.3), 0.025, fromCentre) * 5;
      }
      // blocks rise slower than they drop
      b.height += (target - b.height) * (target >= b.height ? rising : falling);
      place(i * 2, b, 0, b.sx, b.height, b.sz);
      // the model's tops are unit squares stretched to the block; UI elements are already drawn at its size (along x,
      // so a block running along z turns its top a quarter), and a loader's spins on its block
      if (typeof b.top === 'number') place(i * 2 + 1, b, b.height, b.sx, 1, b.sz);
      else place(i * 2 + 1, b, b.height, 1, 1, 1, b.rotation + (b.sz > b.sx ? Math.PI / 2 : 0) + b.spin * elapsed);
    }
  };

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  // run only while the hero is on screen and the tab is visible
  let inView = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let running = false;
  let last = 0;
  const frame = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    update(dt);
    post.render();
  };
  const sync = () => {
    const run = inView && pageVisible;
    if (run === running) return;
    running = run;
    last = 0;
    renderer.setAnimationLoop(run ? frame : null);
  };
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    sync();
  };

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver((entries) => {
    if (!entries[0]) return;
    inView = entries[0].isIntersecting;
    sync();
  });
  intersectionObserver.observe(host);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  update(0);
  sync();

  return () => {
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVisibility);
    mesh.dispose();
    material.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    sky.dispose();
    renderer.dispose();
  };
}

export function mountBlocks(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement!;
  let disposed = false;
  let stop: (() => void) | undefined;
  start(canvas, host, () => disposed)
    .then((dispose) => {
      if (disposed) dispose?.();
      else stop = dispose;
    })
    .catch((error) => console.warn('blocks effect could not start:', error));
  return () => {
    disposed = true;
    stop?.();
  };
}
