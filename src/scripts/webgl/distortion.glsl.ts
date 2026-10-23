// GLSL for the distortion effect.

export const vertex = /* glsl */ `
uniform vec2 uPointer;
uniform vec2 uVelocity;

uniform float uRadius;
uniform float uSoftness;
uniform float uPullStrength;
uniform float uPlaneAspect;

varying vec2 vUv;
varying vec2 vMotion;

float influenceField(vec2 point) {
    vec2 delta =
        point -
        uPointer;

    delta.x *=
        uPlaneAspect;

    float distanceToPointer =
        length(delta);

    float safeRadius =
        max(
            uRadius,
            0.0001
        );

    return exp(
        -pow(
            distanceToPointer /
            safeRadius,
            uSoftness
        )
    );
}

void main() {
    vUv = uv;

    vec3 transformed =
        position;

    float influence =
        influenceField(
            position.xy
        );

    vec2 motion =
        uVelocity *
        uPullStrength *
        influence;

    transformed.xy +=
        motion;

    vMotion = motion;

    gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(
            transformed,
            1.0
        );
}
`;

export const fragment = /* glsl */ `
uniform sampler2D uTexture;

uniform float uHasTexture;

uniform vec2 uImageSize;
uniform vec3 uBackgroundColor;
uniform vec2 uPointer;
uniform vec2 uVelocity;

uniform float uRadius;
uniform float uSoftness;
uniform float uTextureWarp;
uniform float uChromatic;
uniform float uPlaneAspect;

varying vec2 vUv;
varying vec2 vMotion;

vec2 coverUv(vec2 uv) {
    float imageAspect =
        uImageSize.x /
        max(
            uImageSize.y,
            1.0
        );

    float planeAspect =
        uPlaneAspect;

    vec2 covered = uv;

    if (
        planeAspect >
        imageAspect
    ) {
        covered.y =
            (
                covered.y -
                0.5
            ) *
            (
                imageAspect /
                planeAspect
            ) +
            0.5;
    } else {
        covered.x =
            (
                covered.x -
                0.5
            ) *
            (
                planeAspect /
                imageAspect
            ) +
            0.5;
    }

    return covered;
}

vec3 linearToSrgb(
    vec3 value
) {
    vec3 low =
        value *
        12.92;

    vec3 high =
        1.055 *
        pow(
            max(
                value,
                0.0
            ),
            vec3(
                1.0 /
                2.4
            )
        ) -
        0.055;

    return mix(
        low,
        high,
        step(
            vec3(
                0.0031308
            ),
            value
        )
    );
}

void main() {
    if (
        uHasTexture <
        0.5
    ) {
        vec3 backgroundColor =
            linearToSrgb(
                max(
                    uBackgroundColor,
                    0.0
                )
            );

        gl_FragColor =
            vec4(
                backgroundColor,
                1.0
            );

        return;
    }

    vec2 pointerUv =
        uPointer +
        0.5;

    vec2 delta =
        vUv -
        pointerUv;

    delta.x *=
        uPlaneAspect;

    float safeRadius =
        max(
            uRadius,
            0.0001
        );

    float localInfluence =
        exp(
            -pow(
                length(
                    delta
                ) /
                safeRadius,
                uSoftness
            )
        );

    float speed =
        min(
            length(
                uVelocity
            ) /
            0.18,
            1.0
        );

    vec2 direction =
        vec2(0.0);

    if (
        length(
            uVelocity
        ) >
        0.00001
    ) {
        direction =
            normalize(
                uVelocity
            );
    }

    vec2 elasticOffset =
        vMotion *
        uTextureWarp;

    vec2 warpedUv =
        vUv -
        elasticOffset;

    vec2 baseUv =
        clamp(
            coverUv(
                warpedUv
            ),
            0.001,
            0.999
        );

    float chromaAmount =
        uChromatic *
        speed *
        localInfluence;

    vec2 chromaOffset =
        direction *
        chromaAmount;

    vec2 redUv =
        clamp(
            coverUv(
                warpedUv +
                chromaOffset
            ),
            0.001,
            0.999
        );

    vec2 blueUv =
        clamp(
            coverUv(
                warpedUv -
                chromaOffset
            ),
            0.001,
            0.999
        );

    vec3 baseColor =
        texture2D(
            uTexture,
            baseUv
        ).rgb;

    float redChannel =
        texture2D(
            uTexture,
            redUv
        ).r;

    float blueChannel =
        texture2D(
            uTexture,
            blueUv
        ).b;

    vec3 color =
        vec3(
            redChannel,
            baseColor.g,
            blueChannel
        );

    color =
        linearToSrgb(
            max(
                color,
                0.0
            )
        );

    gl_FragColor =
        vec4(
            color,
            1.0
        );
}
`;
