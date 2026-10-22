import{t as e}from"./rolldown-runtime.Bi-D_2cA.mjs";import{L as t,b as n,l as r,o as i,s as a,w as o,y as s,z as c}from"./react.vfYwGPnJ.mjs";import{Z as l,j as u,o as d,yt as f}from"./framer.C7fRCC0c.mjs";import{H as p,J as m,Q as h,U as ee,V as te,W as g,Z as ne,at as re,ct as ie,dt as ae,ft as _,lt as oe,mt as se,nt as ce,ot as v,pt as y,rt as b,st as le,tt as ue,ut as de}from"./shared-lib.Aoo2wOYx.mjs";function x(e){return typeof e==`string`?e:e?.src??``}function S(e){if(typeof e!=`string`)return e?.srcSet}function fe(e){if(Array.isArray(e)){e.forEach(e=>e.dispose());return}e.dispose()}function C(e){let{image:t,aspectRatio:a=D,interaction:o=w,grid:l=T,render:u=E,style:d}=e,p=x(t),C=S(t),j=f(),M=n(null),N=n(()=>{}),P=`${p}::${C??``}`,F=O[a]??O[D],I=n({radius:o.radius??w.radius,flipSpeed:o.flipSpeed??w.flipSpeed,returnSpeed:o.returnSpeed??w.returnSpeed,trailLength:o.trailLength??w.trailLength,trailDecay:o.trailDecay??w.trailDecay,feather:l.feather??T.feather,inversion:l.inversion??T.inversion,shade:l.shade??T.shade}),L=Math.max(1,l.cellSize??T.cellSize),R=Math.max(0,l.gap??T.gap),z=u.perspective??E.perspective,B=u.dpr??E.dpr;s(()=>{I.current={radius:o.radius??w.radius,flipSpeed:o.flipSpeed??w.flipSpeed,returnSpeed:o.returnSpeed??w.returnSpeed,trailLength:o.trailLength??w.trailLength,trailDecay:o.trailDecay??w.trailDecay,feather:l.feather??T.feather,inversion:l.inversion??T.inversion,shade:l.shade??T.shade},N.current()},[o.radius,o.flipSpeed,o.returnSpeed,o.trailLength,o.trailDecay,l.feather,l.inversion,l.shade]),s(()=>{if(j){N.current=()=>{};return}let e=M.current;if(!e||!p)return;let t=!1,n=0,r=0,i=!1,a=!0,o=!document.hidden,s=null,l=null,u=null,d=null,f=null,x=null,S=new Float32Array,C=new Float32Array,w=new Uint32Array,T=0,E=0,D=0,O=1,P=1,F=1,V=1,H=NaN,U=NaN,W=new Set,G=[],K={x:0,y:0,lastX:1/0,lastY:1/0},q=[],J=new m(!1),Y=new ie,X=new re(z,1,.1,1e4),Z=new te({canvas:e,antialias:!0,alpha:!0,powerPreference:`high-performance`});Z.outputColorSpace=b,Z.setClearColor(0,0),Z.setPixelRatio(g.clamp(B,.5,2));let he=new de;he.setCrossOrigin(`anonymous`);function ge(){let e=g.degToRad(X.fov*.5);return P*.5/Math.tan(e)}function _e(){X.aspect=O/P,X.fov=z,X.position.set(0,0,ge()),X.lookAt(0,0,0),X.updateProjectionMatrix()}function ve(){d&&=(Y.remove(d),d.geometry.dispose(),fe(d.material),null)}function ye(){f&&(Y.remove(f),f.geometry.dispose(),fe(f.material),f=null,x=null,W.clear())}function be(){u&&(ve(),d=new ce(new v(O,P),new oe({uniforms:{uTexture:{value:u},uResolution:{value:new _(O,P)},uImageSize:{value:new _(u.image.width,u.image.height)}},vertexShader:k,fragmentShader:A,depthWrite:!1,depthTest:!1})),d.position.z=0,d.renderOrder=0,Y.add(d))}function xe(){if(!u)return;ye(),E=Math.ceil(O/L),D=Math.ceil(P/L);let e=E*D,t=Math.max(1,L-R);S=new Float32Array(e),C=new Float32Array(e*2),w=new Uint32Array(e),T=0;let n=new v(1,1,1,1);x=new ne(S,1),x.setUsage(se),n.setAttribute(`aFlip`,x);let r=new oe({uniforms:{uTexture:{value:u},uResolution:{value:new _(O,P)},uImageSize:{value:new _(u.image.width,u.image.height)},uTileUvScale:{value:new _(t/O,t/P)},uInversion:{value:I.current.inversion},uShade:{value:I.current.shade}},vertexShader:pe,fragmentShader:me,side:2,depthWrite:!0,depthTest:!0});H=I.current.inversion,U=I.current.shade,f=new h(n,r,e),f.instanceMatrix.setUsage(ee),f.frustumCulled=!1,f.position.z=2,f.renderOrder=1;let i=new ue,a=new y,o=new le,s=new y(t,t,1),c=0;for(let e=0;e<D;e+=1)for(let t=0;t<E;t+=1){let n=t*L+L*.5-O*.5,r=P*.5-e*L-L*.5;a.set(n,r,0),i.compose(a,o,s),f.setMatrixAt(c,i),C[c*2]=n,C[c*2+1]=r,c+=1}f.instanceMatrix.needsUpdate=!0,Y.add(f)}function Q(){t||i||!a||!o||(i=!0,J.start(),J.getDelta(),n=requestAnimationFrame(Fe))}N.current=Q;function Se(){r=0,!(t||F===O&&V===P)&&(O=F,P=V,Z.setSize(O,P,!1),_e(),u&&(be(),xe()),Q())}function Ce(){let t=e.getBoundingClientRect();F=Math.max(1,Math.round(t.width)),V=Math.max(1,Math.round(t.height)),r===0&&(r=requestAnimationFrame(Se))}function we(e,t){let n=Math.max(3,L*.45),r=e-K.lastX,i=t-K.lastY;if(r*r+i*i<n*n)return!1;q.unshift({x:e,y:t,life:1});let a=Math.max(1,Math.round(I.current.trailLength));return q.length>a&&(q.length=a),K.lastX=e,K.lastY=t,!0}function Te(e){K.x=e.offsetX-O*.5,K.y=P*.5-e.offsetY,we(K.x,K.y)&&Q()}function Ee(){K.lastX=1/0,K.lastY=1/0}function De(e){let t=I.current.trailDecay,n=Math.max(1,Math.round(I.current.trailLength));q.length>n&&(q.length=n);for(let n=q.length-1;n>=0;--n)q[n].life-=e*t,q[n].life<=0&&q.splice(n,1)}function Oe(){G.length=0,T=T+1>>>0,T===0&&(w.fill(0),T=1)}function ke(e){w[e]!==T&&(w[e]=T,G.push(e))}function Ae(e){Oe();let t=L*.5,n=O*.5,r=P*.5;for(let i=0;i<q.length;i+=1){let a=q[i],o=Math.max(0,Math.ceil((a.x-e+n-t)/L)),s=Math.min(E-1,Math.floor((a.x+e+n-t)/L)),c=Math.max(0,Math.ceil((r-t-(a.y+e))/L)),l=Math.min(D-1,Math.floor((r-t-(a.y-e))/L));for(let e=c;e<=l;e+=1){let t=e*E;for(let e=o;e<=s;e+=1)ke(t+e)}}W.forEach(ke)}function je(){if(!f)return;let e=f.material,t=I.current;t.inversion!==H&&(e.uniforms.uInversion.value=t.inversion,H=t.inversion),t.shade!==U&&(e.uniforms.uShade.value=t.shade,U=t.shade)}function Me(e){if(!f||!x)return!1;let t=I.current,n=Math.max(1,t.radius),r=n*n,i=n*(1-g.clamp(t.feather/100,0,1)),a=n-i,o=1-Math.exp(-t.flipSpeed*e),s=1-Math.exp(-t.returnSpeed*e);Ae(n);let c=!1,l=1/0,u=-1;for(let e=0;e<G.length;e+=1){let t=G[e],n=C[t*2],d=C[t*2+1],f=0;for(let e=0;e<q.length;e+=1){let t=q[e],o=n-t.x,s=d-t.y,c=o*o+s*s;if(c>=r)continue;let l=1;if(a>0){let e=Math.sqrt(c),t=g.clamp((e-i)/a,0,1);l=1-t*t*(3-2*t)}f=Math.max(f,l*t.life)}let p=S[t],m=f>p?o:s,h=p+(f-p)*m;f===0&&h<1e-4&&(h=0),h>0||f>0?W.add(t):W.delete(t),Math.abs(h-p)>1e-6&&(S[t]=h,c=!0,l=Math.min(l,t),u=Math.max(u,t))}if(c){let e=x;e.clearUpdateRanges?.(),e.addUpdateRange&&Number.isFinite(l)&&e.addUpdateRange(l,u-l+1),x.needsUpdate=!0}return q.length>0||W.size>0}function Ne(){if(q.length=0,W.clear(),K.lastX=1/0,K.lastY=1/0,S.length>0&&(S.fill(0),x)){let e=x;e.clearUpdateRanges?.(),e.addUpdateRange?.(0,S.length),x.needsUpdate=!0}}function $(){n!==0&&(cancelAnimationFrame(n),n=0),i=!1,J.stop()}function Pe(){$(),Ne()}function Fe(){if(t||!a||!o){i=!1;return}let e=Math.min(J.getDelta(),.05);De(e);let r=Me(e);je(),Z.render(Y,X),r?n=requestAnimationFrame(Fe):(n=0,i=!1,J.stop())}function Ie(){o=!document.hidden,o?Q():Pe()}e.addEventListener(`pointermove`,Te,{passive:!0}),e.addEventListener(`pointerleave`,Ee,{passive:!0}),document.addEventListener(`visibilitychange`,Ie),s=new ResizeObserver(Ce),s.observe(e),`IntersectionObserver`in c&&(l=new IntersectionObserver(e=>{let t=e[0]?.isIntersecting??!0;t!==a&&(a=t,a?Q():Pe())},{threshold:0}),l.observe(e));let Le=e.getBoundingClientRect();return O=Math.max(1,Math.round(Le.width)),P=Math.max(1,Math.round(Le.height)),F=O,V=P,Z.setSize(O,P,!1),_e(),he.load(p,e=>{if(t){e.dispose();return}u=e,u.colorSpace=b,u.minFilter=ae,u.magFilter=ae,u.generateMipmaps=!1,be(),xe(),Q()},void 0,()=>{t||console.warn(`Pixel Flip Grid: image loading failed.`)}),()=>{t=!0,N.current=()=>{},$(),cancelAnimationFrame(r),s?.disconnect(),l?.disconnect(),e.removeEventListener(`pointermove`,Te),e.removeEventListener(`pointerleave`,Ee),document.removeEventListener(`visibilitychange`,Ie),ve(),ye(),u?.dispose(),Y.clear(),Z.dispose()}},[p,L,R,z,B,j]);let V=typeof t==`object`&&t?.alt||`Interactive pixel flip image`,H=d?.width??720;return r(`div`,{style:{...d,position:`relative`,width:H,height:`auto`,minHeight:0,maxHeight:`none`,aspectRatio:F,overflow:`hidden`,background:p?`transparent`:`rgba(0, 0, 0, 0.06)`},children:[j&&p&&i(`img`,{src:p,srcSet:C,alt:V,draggable:!1,loading:`eager`,fetchPriority:`high`,style:{position:`absolute`,inset:0,display:`block`,width:`100%`,height:`100%`,objectFit:`cover`,userSelect:`none`,pointerEvents:`none`}},P),!j&&p&&i(`canvas`,{ref:M,"aria-label":V,style:{position:`absolute`,inset:0,display:`block`,width:`100%`,height:`100%`}}),!p&&i(`div`,{style:{position:`absolute`,inset:0,display:`grid`,placeItems:`center`,padding:24,color:`rgba(0, 0, 0, 0.5)`,fontFamily:`Inter, sans-serif`,fontSize:14,textAlign:`center`,pointerEvents:`none`},children:`Select an image`})]})}var w,T,E,D,O,k,A,pe,me,j=e((()=>{t(),a(),o(),l(),p(),w={radius:260,flipSpeed:12,returnSpeed:1.5,trailLength:6,trailDecay:3.2},T={cellSize:30,gap:0,feather:95,inversion:1,shade:.03},E={perspective:8,dpr:1.5},D=`3:2`,O={"21:9":21/9,"16:9":16/9,"3:2":3/2,"4:3":4/3,"5:4":5/4,"1:1":1,"4:5":4/5,"3:4":3/4,"2:3":2/3,"9:16":9/16},k=`
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,A=`
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
`,pe=`
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
`,me=`
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
`,C.defaultProps={image:void 0,aspectRatio:D,interaction:w,grid:T,render:E},u(C,{image:{type:d.ResponsiveImage,title:`Image`},aspectRatio:{type:d.Enum,title:`Aspect Ratio`,defaultValue:D,options:[`21:9`,`16:9`,`3:2`,`4:3`,`5:4`,`1:1`,`4:5`,`3:4`,`2:3`,`9:16`],optionTitles:[`21:9 Landscape`,`16:9 Landscape`,`3:2 Landscape`,`4:3 Landscape`,`5:4 Landscape`,`1:1 Square`,`4:5 Portrait`,`3:4 Portrait`,`2:3 Portrait`,`9:16 Portrait`]},interaction:{type:d.Object,title:`Interaction`,buttonTitle:`Interaction`,controls:{radius:{type:d.Number,title:`Hover Radius`,defaultValue:w.radius,min:30,max:500,step:1,unit:`px`},flipSpeed:{type:d.Number,title:`Flip Speed`,defaultValue:w.flipSpeed,min:1,max:30,step:.1},returnSpeed:{type:d.Number,title:`Return Speed`,defaultValue:w.returnSpeed,min:.2,max:20,step:.1},trailLength:{type:d.Number,title:`Trail Length`,defaultValue:w.trailLength,min:1,max:24,step:1,displayStepper:!0},trailDecay:{type:d.Number,title:`Trail Decay`,defaultValue:w.trailDecay,min:.5,max:8,step:.1}}},grid:{type:d.Object,title:`Grid`,buttonTitle:`Grid`,controls:{cellSize:{type:d.Number,title:`Cell Size`,defaultValue:T.cellSize,min:6,max:60,step:1,unit:`px`},gap:{type:d.Number,title:`Cell Gap`,defaultValue:T.gap,min:0,max:10,step:.05,unit:`px`},feather:{type:d.Number,title:`Feather`,defaultValue:T.feather,min:0,max:100,step:1,unit:`%`},inversion:{type:d.Number,title:`Inversion`,defaultValue:T.inversion,min:0,max:1,step:.01},shade:{type:d.Number,title:`Flip Shade`,defaultValue:T.shade,min:0,max:.8,step:.01}}},render:{type:d.Object,title:`Render`,buttonTitle:`Render`,controls:{perspective:{type:d.Number,title:`Perspective`,defaultValue:E.perspective,min:4,max:18,step:.1},dpr:{type:d.Number,title:`DPR`,defaultValue:E.dpr,min:.5,max:2,step:.1}}}})}));export{j as n,C as t};
//# sourceMappingURL=PixelFlipGrid.iyjNUvKF.mjs.map