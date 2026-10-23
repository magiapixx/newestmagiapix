// GLSL for the luma effect.

export const vertex = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const fragment = /* glsl */ `
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uTex1Res;
uniform vec2 uTex2Res;
uniform float uTime;

uniform float uLumaTolerance;
uniform float uZoomStrength;
uniform float uChromaStrength;
uniform vec3 uGlowColor;
uniform float uFeather;

uniform float uGlitchStrength;
uniform float uGlitchFrequency;
uniform float uGlitchNarrowness;

varying vec2 vUv;

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
        -0.577350269189626,
        0.024390243902439
    );

    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = x0.x > x0.y
        ? vec2(1.0, 0.0)
        : vec2(0.0, 1.0);

    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);

    vec3 p = permute(
        permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x
        + vec3(0.0, i1.x, 1.0)
    );

    vec3 m = max(
        0.5 - vec3(
            dot(x0, x0),
            dot(x12.xy, x12.xy),
            dot(x12.zw, x12.zw)
        ),
        0.0
    );

    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159
        - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;

    return 130.0 * dot(m, g);
}

float fbm(vec2 x) {
    float value = 0.0;
    float amplitude = 0.5;
    vec2 shift = vec2(100.0);

    mat2 rotation = mat2(
        cos(0.5),
        sin(0.5),
        -sin(0.5),
        cos(0.5)
    );

    for (int i = 0; i < 4; ++i) {
        value += amplitude * snoise(x);
        x = rotation * x * 2.0 + shift;
        amplitude *= 0.5;
    }

    return value;
}

vec2 getCoverUV(
    vec2 uv,
    vec2 planeResolution,
    vec2 textureResolution
) {
    vec2 ratio = vec2(
        min(
            (planeResolution.x / planeResolution.y)
            / (textureResolution.x / textureResolution.y),
            1.0
        ),
        min(
            (planeResolution.y / planeResolution.x)
            / (textureResolution.y / textureResolution.x),
            1.0
        )
    );

    return uv * ratio + (1.0 - ratio) * 0.5;
}

void main() {
    vec2 uv1 = getCoverUV(
        vUv,
        uResolution,
        uTex1Res
    );

    vec2 uv2 = getCoverUV(
        vUv,
        uResolution,
        uTex2Res
    );

    vec3 original1 = texture2D(uTex1, uv1).rgb;
    vec3 original2 = texture2D(uTex2, uv2).rgb;

    float luma1 = dot(
        original1,
        vec3(0.299, 0.587, 0.114)
    );

    float luma2 = dot(
        original2,
        vec3(0.299, 0.587, 0.114)
    );

    float currentLuma = mix(
        luma1,
        1.0 - luma2,
        uProgress
    );

    float noise = fbm(
        vUv * 6.0 + uTime * 0.15
    ) * 0.5 + 0.5;

    float delay =
        currentLuma * uLumaTolerance
        + noise * 0.4;

    float maxDelay = uLumaTolerance + 0.4;

    float currentThreshold = mix(
        -uFeather,
        maxDelay + uFeather,
        uProgress
    );

    float smoothLocal = smoothstep(
        -uFeather,
        uFeather,
        currentThreshold - delay
    );

    float localPeak = sin(
        smoothLocal * 3.14159265
    );

    vec2 centerVector = vUv - 0.5;
    vec2 direction = centerVector * 2.0;

    vec2 driftOffset =
        direction
        * localPeak
        * uZoomStrength
        + vec2(
            fbm(vUv * 10.0),
            fbm(vUv * 10.0 + 10.0)
        )
        * 0.05
        * localPeak;

    vec2 distortedUv1 =
        (uv1 - 0.5)
        * (1.0 - localPeak * uZoomStrength)
        + 0.5
        + driftOffset;

    vec2 distortedUv2 =
        (uv2 - 0.5)
        * (1.0 + localPeak * uZoomStrength)
        + 0.5
        - driftOffset;

    float bandY = floor(
        vUv.y * uGlitchFrequency
    );

    float bandX = floor(
        vUv.x
        * (uGlitchFrequency * uGlitchNarrowness)
        + uTime * 10.0
    );

    float glitchNoise = snoise(
        vec2(bandY, uTime * 15.0)
    );

    float segmentNoise = snoise(
        vec2(bandX, bandY)
    );

    float segmentMask = step(
        0.3,
        segmentNoise
    );

    float glitchMask =
        step(0.65, abs(glitchNoise))
        * segmentMask;

    float glitchOffset =
        glitchNoise
        * glitchMask
        * localPeak
        * uGlitchStrength;

    distortedUv1.x += glitchOffset;
    distortedUv2.x += glitchOffset;

    float chroma =
        localPeak * uChromaStrength;

    vec4 color1;
    color1.r = texture2D(
        uTex1,
        distortedUv1 + vec2(chroma, chroma * 0.5)
    ).r;
    color1.g = texture2D(
        uTex1,
        distortedUv1
    ).g;
    color1.b = texture2D(
        uTex1,
        distortedUv1 - vec2(chroma, chroma * 0.5)
    ).b;
    color1.a = 1.0;

    vec4 color2;
    color2.r = texture2D(
        uTex2,
        distortedUv2 + vec2(chroma, chroma * 0.5)
    ).r;
    color2.g = texture2D(
        uTex2,
        distortedUv2
    ).g;
    color2.b = texture2D(
        uTex2,
        distortedUv2 - vec2(chroma, chroma * 0.5)
    ).b;
    color2.a = 1.0;

    vec3 glow =
        (color1.rgb + color2.rgb)
        * 0.5
        * uGlowColor
        * localPeak
        * 1.8;

    vec4 finalColor = mix(
        color1,
        color2,
        smoothLocal
    );

    finalColor.rgb += glow;

    gl_FragColor = finalColor;

    // Convert the shader's linear output to the renderer's sRGB output space.
    #include <colorspace_fragment>
}
`;
