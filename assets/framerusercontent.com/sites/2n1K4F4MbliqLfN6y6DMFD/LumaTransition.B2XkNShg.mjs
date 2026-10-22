import{t as e}from"./rolldown-runtime.Bi-D_2cA.mjs";import{L as t,_ as n,b as r,j as i,l as a,o,s,w as c,y as l,z as u}from"./react.vfYwGPnJ.mjs";import{Z as d,j as f,o as p,yt as m}from"./framer.C7fRCC0c.mjs";import{$ as h,H as g,V as _,Y as v,ct as y,dt as b,ft as x,it as S,lt as ee,nt as te,ot as ne,rt as C,ut as w}from"./shared-lib.Aoo2wOYx.mjs";function T(e){return Math.min(1,Math.max(0,e))}function E(e){return e?.src?.trim()||``}function D(e){let t=e.image,n=t?.naturalWidth??t?.videoWidth??t?.width??1,r=t?.naturalHeight??t?.videoHeight??t?.height??1;return{width:Math.max(1,n),height:Math.max(1,r)}}function O(e,t){let n=T(t);switch(e){case`none`:return n;case`power1.inOut`:return n<.5?2*n*n:1-(-2*n+2)**2/2;case`power2.inOut`:return n<.5?4*n*n*n:1-(-2*n+2)**3/2;case`power3.inOut`:return n<.5?8*n*n*n*n:1-(-2*n+2)**4/2;case`sine.inOut`:return-(Math.cos(Math.PI*n)-1)/2;case`expo.inOut`:return n===0||n===1?n:n<.5?2**(20*n-10)/2:(2-2**(-20*n+10))/2;case`circ.inOut`:return n<.5?(1-Math.sqrt(1-(2*n)**2))/2:(Math.sqrt(1-(-2*n+2)**2)+1)/2;default:return n}}function k(){return o(`div`,{style:{position:`absolute`,inset:0,display:`flex`,alignItems:`center`,justifyContent:`center`,padding:24,background:`#050505`,color:`rgba(255, 255, 255, 0.55)`,fontFamily:`Inter, sans-serif`,fontSize:12,lineHeight:1.4,letterSpacing:`0.08em`,textAlign:`center`,textTransform:`uppercase`,pointerEvents:`none`},children:`Select up to 3 images`})}function A(e){let{images:t,progress:s,pauseTime:c,transitionTime:d,easeMode:f,lumaTolerance:p,feather:g,zoomStrength:A,chromaStrength:N,glitchStrength:P,glitchFrequency:F,glitchNarrowness:I,glowColor:L,dpr:R,style:z}=e,B=m(),V=r(null),H=r(null),U=r(null),W=r({progress:s,pauseTime:c,transitionTime:d,easeMode:f,lumaTolerance:p,feather:g,zoomStrength:A,chromaStrength:N,glitchStrength:P,glitchFrequency:F,glitchNarrowness:I,glowColor:L}),[G,K]=n(!1),[q,J]=n(!1),Y=i(()=>(t??[]).slice(0,3).filter(e=>!!E(e)),[t]),X=i(()=>Y.map(E),[Y]),Z=X.join(`|`),Q=Y[0];l(()=>{W.current={progress:s,pauseTime:c,transitionTime:d,easeMode:f,lumaTolerance:p,feather:g,zoomStrength:A,chromaStrength:N,glitchStrength:P,glitchFrequency:F,glitchNarrowness:I,glowColor:L};let e=U.current;e&&(e.uLumaTolerance.value=p,e.uFeather.value=g,e.uZoomStrength.value=A,e.uChromaStrength.value=N,e.uGlitchStrength.value=P,e.uGlitchFrequency.value=F,e.uGlitchNarrowness.value=I,e.uGlowColor.value.set(L))},[s,c,d,f,p,g,A,N,P,F,I,L]),l(()=>{if(B||X.length<2)return;let e=V.current,t=H.current;if(!e||!t)return;let n=!1,r=0,i=null,a=null,o=null,s=null,c=null,l=[];K(!0),J(!1);let d=new w;return d.setCrossOrigin(`anonymous`),(async()=>{try{if(l=await Promise.all(X.map(e=>d.loadAsync(e))),n){l.forEach(e=>e.dispose());return}l.forEach(e=>{e.generateMipmaps=!1,e.minFilter=b,e.magFilter=b,e.wrapS=h,e.wrapT=h,e.colorSpace=C,e.needsUpdate=!0}),o=new _({canvas:t,antialias:!1,alpha:!1,powerPreference:`high-performance`}),o.setPixelRatio(Math.max(.25,Math.min(3,R))),o.outputColorSpace=C;let f=new y,p=new S(-1,1,1,-1,0,1),m=l[0],g=l[1],w=D(m),E=D(g),k=W.current,A={uTex1:{value:m},uTex2:{value:g},uProgress:{value:T(k.progress)},uResolution:{value:new x(1,1)},uTex1Res:{value:new x(w.width,w.height)},uTex2Res:{value:new x(E.width,E.height)},uTime:{value:0},uLumaTolerance:{value:k.lumaTolerance},uZoomStrength:{value:k.zoomStrength},uChromaStrength:{value:k.chromaStrength},uGlowColor:{value:new v(k.glowColor)},uFeather:{value:k.feather},uGlitchStrength:{value:k.glitchStrength},uGlitchFrequency:{value:k.glitchFrequency},uGlitchNarrowness:{value:k.glitchNarrowness}};U.current=A,c=new ee({vertexShader:j,fragmentShader:M,uniforms:A,depthTest:!1,depthWrite:!1,toneMapped:!1}),s=new ne(2,2);let N=new te(s,c);f.add(N);let P=()=>{if(!o)return;let t=e.getBoundingClientRect(),n=Math.max(1,Math.round(t.width)),r=Math.max(1,Math.round(t.height));o.setSize(n,r,!1),A.uResolution.value.set(n,r)};i=new ResizeObserver(P),i.observe(e),P();let F=0,I=performance.now(),L=I,z=!0,B=e.getBoundingClientRect(),V=B.bottom>0&&B.right>0&&B.top<u.innerHeight&&B.left<u.innerWidth,H=V?null:performance.now(),G=()=>{let e=(F+1)%l.length,t=l[F],n=l[e],r=D(t),i=D(n);A.uTex1.value=t,A.uTex2.value=n,A.uTex1Res.value.set(r.width,r.height),A.uTex2Res.value.set(i.width,i.height)},q=e=>{if(r=0,n||!o||!c||!V)return;let t=W.current,i=Math.max(0,t.pauseTime),a=Math.max(.001,t.transitionTime),s=(e-I)/1e3;if(A.uTime.value=(e-L)/1e3,s<i)A.uProgress.value=0;else{let n=(s-i)/a,r=z?T(t.progress):0,o=O(t.easeMode,n);A.uProgress.value=r+(1-r)*o,n>=1&&(F=(F+1)%l.length,G(),A.uProgress.value=0,I=e,z=!1)}o.render(f,p),V&&(r=requestAnimationFrame(q))},J=()=>{n||!V||r!==0||(r=requestAnimationFrame(q))},Y=()=>{V&&(V=!1,H=performance.now(),r!==0&&(cancelAnimationFrame(r),r=0))},Z=()=>{if(V)return;let e=performance.now();if(H!==null){let t=e-H;I+=t,L+=t}H=null,V=!0,J()};a=new IntersectionObserver(e=>{let t=e[0];t&&(t.isIntersecting&&t.intersectionRatio>0?Z():Y())},{root:null,threshold:0}),a.observe(e),K(!1),V&&J()}catch(e){console.error(`Luma Depth Transition:`,e),n||(J(!0),K(!1))}})(),()=>{n=!0,cancelAnimationFrame(r),i?.disconnect(),a?.disconnect(),U.current=null,c?.dispose(),s?.dispose(),l.forEach(e=>e.dispose()),o?.dispose()}},[B,Z,R]);let $={position:`relative`,width:`100%`,height:`100%`,overflow:`hidden`,background:`#050505`,...z};return Q?B||Y.length<2?o(`div`,{style:$,children:o(`img`,{src:Q.src,srcSet:Q.srcSet,alt:Q.alt??``,draggable:!1,style:{width:`100%`,height:`100%`,display:`block`,objectFit:`cover`,userSelect:`none`,pointerEvents:`none`}})}):a(`div`,{ref:V,style:$,children:[o(`canvas`,{ref:H,style:{position:`absolute`,inset:0,width:`100%`,height:`100%`,display:`block`}}),(G||q)&&o(`img`,{src:Q.src,srcSet:Q.srcSet,alt:Q.alt??``,draggable:!1,style:{position:`absolute`,inset:0,width:`100%`,height:`100%`,display:`block`,objectFit:`cover`,opacity:q?1:.65,userSelect:`none`,pointerEvents:`none`}}),G&&o(`div`,{style:{position:`absolute`,inset:0,display:`flex`,alignItems:`center`,justifyContent:`center`,color:`#FFFFFF`,fontFamily:`Inter, sans-serif`,fontSize:12,fontWeight:300,letterSpacing:`0.28em`,textTransform:`uppercase`,pointerEvents:`none`},children:`Loading...`})]}):o(`div`,{style:$,children:o(k,{})})}var j,M,N=e((()=>{t(),s(),c(),d(),g(),j=`
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`,M=`
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
`,A.defaultProps={images:[],progress:0,pauseTime:0,transitionTime:10,easeMode:`power1.inOut`,lumaTolerance:2.1,feather:.66,zoomStrength:.18,chromaStrength:0,glitchStrength:.02,glitchFrequency:800,glitchNarrowness:.5,glowColor:`#000000`,dpr:1},f(A,{images:{type:p.Array,title:`Images`,control:{type:p.ResponsiveImage},maxCount:3,defaultValue:[]},progress:{type:p.Number,title:`Progress`,min:0,max:1,step:.01,defaultValue:0},pauseTime:{type:p.Number,title:`Pause`,min:0,max:10,step:.1,unit:`s`,defaultValue:0},transitionTime:{type:p.Number,title:`Duration`,min:1,max:10,step:.1,unit:`s`,defaultValue:10},easeMode:{type:p.Enum,title:`Easing`,options:[`none`,`power1.inOut`,`power2.inOut`,`power3.inOut`,`sine.inOut`,`expo.inOut`,`circ.inOut`],optionTitles:[`None`,`Power 1 In Out`,`Power 2 In Out`,`Power 3 In Out`,`Sine In Out`,`Expo In Out`,`Circ In Out`],defaultValue:`power1.inOut`},lumaTolerance:{type:p.Number,title:`Luma Depth`,min:.1,max:3,step:.1,defaultValue:2.1},feather:{type:p.Number,title:`Feather`,min:.001,max:1,step:.01,defaultValue:.66},zoomStrength:{type:p.Number,title:`Zoom`,min:0,max:.5,step:.01,defaultValue:.18},chromaStrength:{type:p.Number,title:`RGB Split`,min:0,max:.3,step:.01,defaultValue:0},glitchStrength:{type:p.Number,title:`Glitch`,min:0,max:.3,step:.005,defaultValue:.02},glitchFrequency:{type:p.Number,title:`Density`,min:10,max:2e3,step:5,defaultValue:800},glitchNarrowness:{type:p.Number,title:`Dash Width`,min:0,max:2,step:.01,defaultValue:.5},glowColor:{type:p.Color,title:`Edge Glow`,defaultValue:`#000000`},dpr:{type:p.Number,title:`DPR`,min:.5,max:2,step:.1,defaultValue:1}})}));export{N as n,A as t};
//# sourceMappingURL=LumaTransition.B2XkNShg.mjs.map