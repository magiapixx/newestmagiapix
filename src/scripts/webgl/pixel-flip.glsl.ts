// GLSL for the pixel-flip effect.

export const imageVertex = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const imageFragment = /* glsl */ `
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uImageSize;

varying vec2 vUv;

vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 scale = vec2(1.0);

    if (screenAspect > imageAspect) {
        scale.y = imageAspect / screenAspect;
    } else {
        scale.x = screenAspect / imageAspect;
    }

    return (uv - 0.5) * scale + 0.5;
}

void main() {
    vec3 color = texture2D(uTexture, coverUv(vUv)).rgb;
    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
}
`;

export const tileVertex = /* glsl */ `
attribute float aFlip;

uniform vec2 uResolution;
uniform vec2 uTileUvScale;
uniform float uShade;

varying vec2 vImageUv;
varying float vShade;

void main() {
    float angle = aFlip * 3.141592653589793;
    float sine = sin(angle);
    float cosine = cos(angle);

    vec3 rotated = position;
    rotated.x = position.x * cosine + position.z * sine;
    rotated.z = -position.x * sine + position.z * cosine;

    vec4 worldPosition = instanceMatrix * vec4(rotated, 1.0);
    vec2 cellCenter = instanceMatrix[3].xy;

    vImageUv =
        cellCenter / uResolution +
        0.5 +
        (uv - 0.5) * uTileUvScale;

    vShade = 1.0 - abs(sine) * uShade;

    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
}
`;

export const tileFragment = /* glsl */ `
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform float uInversion;

varying vec2 vImageUv;
varying float vShade;

vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 scale = vec2(1.0);

    if (screenAspect > imageAspect) {
        scale.y = imageAspect / screenAspect;
    } else {
        scale.x = screenAspect / imageAspect;
    }

    return (uv - 0.5) * scale + 0.5;
}

void main() {
    vec3 original = texture2D(uTexture, coverUv(vImageUv)).rgb;
    vec3 inverted = mix(original, vec3(1.0) - original, uInversion);
    vec3 color = gl_FrontFacing ? original : inverted;

    gl_FragColor = vec4(color * vShade, 1.0);

    #include <colorspace_fragment>
}
`;
