// GLSL for the light-beams effect.

export const vertex = /* glsl */ `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

export const fragment = /* glsl */ `
uniform float iTime;
uniform vec2 iResolution;

uniform float uSpeed;
uniform float uSpread;
uniform float uThickness;
uniform float uIntensityFactor;
uniform float uCameraX;
uniform float uBgIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uBgColor;

#define RAYMARCH_STEPS 209
#define MAX_DIST 25.0

void main() {
    vec2 uv = (
        gl_FragCoord.xy - 0.5 * iResolution.xy
    ) / iResolution.y;

    vec3 ro = vec3(uCameraX, 0.5, 0.0);
    vec3 rd = normalize(vec3(1.6, uv.y, uv.x));

    rd.yz *= mat2(
        0.9210609940, -0.3894183423,
        0.3894183423,  0.9210609940
    );

    float timeSpeed = iTime * uSpeed;
    float travel = timeSpeed * 0.4;
    float waveTime = timeSpeed * 0.5;
    float colorTime = timeSpeed * 2.0;

    float t = 0.0;
    float totalGlow = 0.0;
    float mixedGlow = 0.0;

    for (int i = 0; i < RAYMARCH_STEPS; i++) {
        vec3 p = ro + rd * t;
        float shiftedZ = p.z + travel;

        vec3 oscillation = sin(vec3(
            shiftedZ * 0.5,
            shiftedZ * 1.4 + waveTime,
            p.z * 0.8 + p.y * 1.5 + colorTime
        ));

        float waveY =
            oscillation.x * 0.5 -
            oscillation.y * 0.2;

        float distToWaveY = p.y - waveY;

        float relativeY = mod(
            distToWaveY + uSpread * 1.9,
            uSpread
        ) - uSpread * 0.73;

        float d = max(
            max(
                abs(relativeY) - uThickness,
                abs(distToWaveY) - 1.5
            ),
            abs(p.x) - 13.4
        );

        float absDistance = abs(d);
        float currentGlow =
            0.006 / (absDistance + 0.015);

        float mixFactor =
            oscillation.z * 0.5 + 0.5;

        totalGlow += currentGlow;
        mixedGlow += currentGlow * mixFactor;

        t += absDistance * 0.4 + 0.01;

        if (t > MAX_DIST) break;
    }

    vec3 rayColorAccum =
        vec3(-0.2) +
        uColor1 * (totalGlow - mixedGlow) +
        uColor2 * mixedGlow;

    float glowAccum = -2.2 + totalGlow;

    vec3 bgColor =
        uBgColor * uBgIntensity;

    vec3 finalRayColor =
        rayColorAccum * uIntensityFactor;

    float alpha = clamp(
        glowAccum * uIntensityFactor,
        -0.6,
        1.2
    );

    vec3 finalColor = mix(
        bgColor,
        finalRayColor,
        alpha
    );

    gl_FragColor = vec4(finalColor, 1.0);
}
`;
