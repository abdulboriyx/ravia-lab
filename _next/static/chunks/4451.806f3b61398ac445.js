"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4451],{64451:(e,t,a)=>{a.r(t),a.d(t,{DefaultGaussianDensityProps:()=>Z,GaussianDensityParams:()=>J,computeStructureGaussianDensity:()=>K,computeStructureGaussianDensityTexture:()=>ee,computeStructureGaussianDensityTexture2d:()=>et,computeUnitGaussianDensity:()=>V,computeUnitGaussianDensityTexture:()=>W,computeUnitGaussianDensityTexture2d:()=>j,getTextureMaxCells:()=>H});var r=a(24688),i=a(69174),n=a(21340),u=a(9023),o=a(9566),l=a(20430),s=a(90143);a(18312);var d=a(88140),c=a(5056),f=a(34608);let m=`
precision highp float;

attribute vec3 aPosition;
attribute float aRadius;

varying vec3 vPosition;
varying float vRadiusSqInv;

#if defined(dCalcType_groupId)
    attribute float aGroup;
    varying float vGroup;
#endif

uniform vec3 uBboxSize;
uniform vec3 uBboxMin;
uniform float uResolution;

void main() {
    vRadiusSqInv = 1.0 / (aRadius * aRadius);
    #if defined(dCalcType_groupId)
        vGroup = aGroup;
    #endif
    gl_PointSize = ceil(((aRadius * 3.0) / uResolution) + uResolution);
    vPosition = (aPosition - uBboxMin) / uResolution;
    gl_Position = vec4(((aPosition - uBboxMin) / uBboxSize) * 2.0 - 1.0, 1.0);
}
`,p=`
precision highp float;

varying vec3 vPosition;
varying float vRadiusSqInv;
#if defined(dCalcType_groupId)
    #if defined(dGridTexType_2d)
        precision highp sampler2D;
        uniform sampler2D tMinDistanceTex;
        uniform vec3 uGridTexDim;
    #elif defined(dGridTexType_3d)
        precision highp sampler3D;
        uniform sampler3D tMinDistanceTex;
    #endif
    varying float vGroup;
#endif

#include common

uniform vec3 uGridDim;
uniform vec2 uGridTexScale;
uniform float uCurrentSlice;
uniform float uCurrentX;
uniform float uCurrentY;
uniform float uAlpha;
uniform float uResolution;
uniform float uRadiusFactorInv;

void main() {
    vec2 v = gl_FragCoord.xy - vec2(uCurrentX, uCurrentY) - 0.5;
    vec3 fragPos = vec3(v.x, v.y, uCurrentSlice);
    float dist = distance(fragPos, vPosition) * uResolution;

    #if defined(dCalcType_density)
        float density = exp(-uAlpha * ((dist * dist) * vRadiusSqInv));
        gl_FragColor.a = density * uRadiusFactorInv;
    #elif defined(dCalcType_minDistance)
        gl_FragColor.a = 1.0 - dist * uRadiusFactorInv;
    #elif defined(dCalcType_groupId)
        #if defined(dGridTexType_2d)
            float minDistance = 1.0 - texture2D(tMinDistanceTex, (gl_FragCoord.xy) / (uGridTexDim.xy / uGridTexScale)).a;
        #elif defined(dGridTexType_3d)
            float minDistance = 1.0 - texelFetch(tMinDistanceTex, ivec3(gl_FragCoord.xy, uCurrentSlice), 0).a;
        #endif
        if (dist * uRadiusFactorInv > minDistance + uResolution * 0.05)
            discard;
        gl_FragColor.rgb = packIntToRGB(vGroup);
    #endif
}
`;var x=a(18534);let y={drawCount:(0,f.Xb)("number"),instanceCount:(0,f.Xb)("number"),aRadius:(0,f.Yz)("float32",1,0),aPosition:(0,f.Yz)("float32",3,0),aGroup:(0,f.Yz)("float32",1,0),uCurrentSlice:(0,f.w5)("f"),uCurrentX:(0,f.w5)("f"),uCurrentY:(0,f.w5)("f"),uBboxMin:(0,f.w5)("v3","material"),uBboxSize:(0,f.w5)("v3","material"),uGridDim:(0,f.w5)("v3","material"),uGridTexDim:(0,f.w5)("v3","material"),uGridTexScale:(0,f.w5)("v2","material"),uAlpha:(0,f.w5)("f","material"),uResolution:(0,f.w5)("f","material"),uRadiusFactorInv:(0,f.w5)("f","material"),tMinDistanceTex:(0,f.$G)("texture","rgba","float","nearest","material"),dGridTexType:(0,f.$F)("string",["2d","3d"]),dCalcType:(0,f.$F)("string",["density","minDistance","groupId"])},I="gaussian-density";function g(e){return e.namedFramebuffers[I]||(e.namedFramebuffers[I]=e.resources.framebuffer()),e.namedFramebuffers[I]}function b(e,t,a,r,i,n){let u=`${I}-${e}`;return t.namedTextures[u]||(t.namedTextures[u]=t.resources.texture(a,r,i,n)),t.namedTextures[u]}function C(e,t,a,r,i,n){var u,s,d,c,f,m;let p;return e.isWebGL2?(u=e,s=t,d=a,c=r,f=i,m=n,x.g$&&u.timer.mark("GaussianDensityTexture3d"),p=function(e,t,a,r,i,n){let{gl:u,resources:s,state:d,extensions:{colorBufferFloat:c,textureFloat:f,colorBufferHalfFloat:m,textureHalfFloat:p}}=e,{smoothness:x,resolution:y}=i,{drawCount:I,positions:C,radii:v,groups:D,scale:M,expandedBox:R,dim:A,maxRadius:S}=T(t,a,r,i),[_,B,P]=A,E=b("min-dist-3d",e,"volume-uint8","rgba","ubyte","nearest");E.define(_,B,P);let $=o.ZY.create(1,1),z=2*S,N=h(e,I,C,v,D,E,R,A,A,$,x,y,z),{uCurrentSlice:k}=N.values,O=g(e);function q(e,t){d.currentRenderItemId=-1;for(let a=0;a<P;++a)l.IQ.update(k,a),e.attachFramebuffer(O,0,a),t&&u.clear(u.COLOR_BUFFER_BIT),N.render();u.flush()}return O.bind(),w(e),d.viewport(0,0,_,B),d.scissor(0,0,_,B),n||(n=m&&p?s.texture("volume-float16","rgba","fp16","linear"):c&&f?s.texture("volume-float32","rgba","float","linear"):s.texture("volume-uint8","rgba","ubyte","linear")),n.define(_,B,P),F(e,N),q(n,!0),G(e,N),q(E,!0),Q(e,N),q(n,!1),{texture:n,scale:M,bbox:R,gridDim:A,gridTexDim:A,gridDataDim:A,gridTexScale:$,radiusFactor:z,resolution:y,maxRadius:S}}(u,s,d,c,f,m),x.g$&&u.timer.markEnd("GaussianDensityTexture3d"),D(p)):v(e,t,a,r,!1,i,n)}function v(e,t,a,r,i,n,u){x.g$&&e.timer.mark("GaussianDensityTexture2d");let s=function(e,t,a,r,i,n,u){var s;let d,c,f,m,p,{gl:x,resources:y,state:I,extensions:{colorBufferFloat:C,textureFloat:v,colorBufferHalfFloat:D,textureHalfFloat:M,blendMinMax:R}}=e,{smoothness:A,resolution:S}=n,{drawCount:_,positions:B,radii:P,groups:E,scale:$,expandedBox:z,dim:N,maxRadius:k}=T(t,a,r,n),[O,q,U]=N,{texDimX:Y,texDimY:L,texCols:X,powerOfTwoSize:J}=(d=Math.pow(2,Math.ceil(Math.log(Math.sqrt((s=N)[0]*s[1]*s[2]))/Math.log(2))),c=0,f=s[1],m=1,p=s[2],d<s[0]*s[2]?(p=Math.floor(d/s[0]),m=Math.ceil(s[2]/p),c=p*s[0],f*=m):c=s[0]*s[2],{texDimX:c,texDimY:f,texRows:m,texCols:p,powerOfTwoSize:f<d?d:2*d}),Z=o.eB.create(Y,L,0),H=o.ZY.create(Y/J,L/J),V=2*k,W=i?J:Y,j=i?J:L,K=b("min-dist-2d",e,"image-uint8","rgba","ubyte","nearest");K.define(W,j);let ee=h(e,_,B,P,E,K,z,N,Z,H,A,S,V),{uCurrentSlice:et,uCurrentX:ea,uCurrentY:er}=ee.values,ei=g(e);function en(e,t){I.currentRenderItemId=-1,e.attachFramebuffer(ei,0),t&&(I.viewport(0,0,W,j),I.scissor(0,0,W,j),x.clear(x.COLOR_BUFFER_BIT)),l.IQ.update(er,0);let a=0,r=0,i=0;for(let e=0;e<U;++e)a>=X&&(a-=X,r+=q,i=0,l.IQ.update(er,r)),l.IQ.update(ea,i),l.IQ.update(et,e),I.viewport(i,r,O,q),I.scissor(i,r,O,q),ee.render(),++a,i+=O;x.flush()}return ei.bind(),w(e),u||(u=D&&M?y.texture("image-float16","rgba","fp16","linear"):C&&v?y.texture("image-float32","rgba","float","linear"):y.texture("image-uint8","rgba","ubyte","linear")),u.define(W,j),F(e,ee),en(u,!0),R&&(G(e,ee),en(K,!0),Q(e,ee),en(u,!1)),{texture:u,scale:$,bbox:z,gridDim:N,gridTexDim:Z,gridDataDim:N,gridTexScale:H,radiusFactor:V,resolution:S,maxRadius:k}}(e,t,a,r,i,n,u);return x.g$&&e.timer.markEnd("GaussianDensityTexture2d"),D(s)}function D({texture:e,scale:t,bbox:a,gridDim:r,gridTexDim:i,gridDataDim:n,gridTexScale:u,radiusFactor:l,resolution:s,maxRadius:d}){var c,f;let m;return{transform:(c=t,f=a,m=o.$I.identity(),o.$I.fromScaling(m,c),o.$I.setTranslation(m,f.min),m),texture:e,bbox:a,gridDim:r,gridTexDim:i,gridDataDim:n,gridTexScale:u,radiusFactor:l,resolution:s,maxRadius:d}}function T(e,t,a,r){let{resolution:i,radiusOffset:l}=r,s=1/i,{indices:d,x:c,y:f,z:m,id:p}=e,x=u.CD.size(d),y=new Float32Array(3*x),I=new Float32Array(x),g=new Float32Array(x),b=0;for(let e=0;e<x;++e){let t=u.CD.getAt(d,e);y[3*e]=c[t],y[3*e+1]=f[t],y[3*e+2]=m[t];let r=a(t)+l;b<r&&(b=r),I[e]=r,g[e]=p?p[e]:e}let C=2*b+4*i,v=n.DJ.expand((0,n.DJ)(),t,o.eB.create(C,C,C)),D=n.DJ.scale((0,n.DJ)(),v,s),T=n.DJ.size((0,o.eB)(),D);return o.eB.ceil(T,T),{drawCount:x,positions:y,radii:I,groups:g,scale:o.eB.create(i,i,i),expandedBox:v,dim:T,maxRadius:b}}function h(e,t,a,r,i,n,u,f,x,g,b,C,v){if(e.namedComputeRenderables[I]){let s=o.eB.sub((0,o.eB)(),u.max,u.min),d=e.namedComputeRenderables[I].values;l.IQ.updateIfChanged(d.drawCount,t),l.IQ.updateIfChanged(d.instanceCount,1),l.IQ.update(d.aRadius,r),l.IQ.update(d.aPosition,a),l.IQ.update(d.aGroup,i),l.IQ.updateIfChanged(d.uCurrentSlice,0),l.IQ.updateIfChanged(d.uCurrentX,0),l.IQ.updateIfChanged(d.uCurrentY,0),l.IQ.update(d.uBboxMin,u.min),l.IQ.update(d.uBboxSize,s),l.IQ.update(d.uGridDim,f),l.IQ.update(d.uGridTexDim,x),l.IQ.update(d.uGridTexScale,g),l.IQ.updateIfChanged(d.uAlpha,b),l.IQ.updateIfChanged(d.uResolution,C),l.IQ.updateIfChanged(d.uRadiusFactorInv,1/v),l.IQ.update(d.tMinDistanceTex,n),l.IQ.updateIfChanged(d.dGridTexType,n.getDepth()>0?"3d":"2d"),l.IQ.updateIfChanged(d.dCalcType,"density"),e.namedComputeRenderables[I].update()}else{var D,T,h,w,G,F,Q,M,R,A,S,_,B;let P,E,$,z,N;e.namedComputeRenderables[I]=(D=e,T=t,h=a,w=r,G=i,F=n,Q=u,M=f,R=x,A=g,S=b,_=C,B=v,P=o.eB.sub((0,o.eB)(),Q.max,Q.min),E={drawCount:l.IQ.create(T),instanceCount:l.IQ.create(1),aRadius:l.IQ.create(w),aPosition:l.IQ.create(h),aGroup:l.IQ.create(G),uCurrentSlice:l.IQ.create(0),uCurrentX:l.IQ.create(0),uCurrentY:l.IQ.create(0),uBboxMin:l.IQ.create(Q.min),uBboxSize:l.IQ.create(P),uGridDim:l.IQ.create(M),uGridTexDim:l.IQ.create(R),uGridTexScale:l.IQ.create(A),uAlpha:l.IQ.create(S),uResolution:l.IQ.create(_),uRadiusFactorInv:l.IQ.create(1/B),tMinDistanceTex:l.IQ.create(F),dGridTexType:l.IQ.create(F.getDepth()>0?"3d":"2d"),dCalcType:l.IQ.create("density")},$={...y},z=(0,d.NG)(I,m,p),N=(0,c.$h)(D,"points",z,$,E),(0,s._)(N,E))}return e.namedComputeRenderables[I]}function w(e){let{gl:t,state:a}=e;a.disable(t.CULL_FACE),a.enable(t.BLEND),a.disable(t.DEPTH_TEST),a.enable(t.SCISSOR_TEST),a.depthMask(!1),a.clearColor(0,0,0,0)}function G(e,t){let{gl:a,state:r}=e;if(l.IQ.update(t.values.dCalcType,"minDistance"),t.update(),r.colorMask(!1,!1,!1,!0),r.blendFunc(a.ONE,a.ONE),!e.extensions.blendMinMax)throw Error("GPU gaussian surface calculation requires EXT_blend_minmax");r.blendEquation(e.extensions.blendMinMax.MAX)}function F(e,t){let{gl:a,state:r}=e;l.IQ.update(t.values.dCalcType,"density"),t.update(),r.colorMask(!1,!1,!1,!0),r.blendFunc(a.ONE,a.ONE),r.blendEquation(a.FUNC_ADD)}function Q(e,t){let{gl:a,state:r}=e;l.IQ.update(t.values.dCalcType,"groupId"),t.update(),r.colorMask(!0,!0,!0,!1),r.blendFunc(a.ONE,a.ZERO),r.blendEquation(a.FUNC_ADD)}var M=a(13300),R=a(11079),A=a(38851),S=a(25392);let _=new ArrayBuffer(4);new Int32Array(_),new Float32Array(_);let B=new ArrayBuffer(4),P=new Int32Array(B),E=new Float32Array(B),$=new ArrayBuffer(8);new Int32Array($),new Float32Array($);let z=new ArrayBuffer(4);new Int32Array(z),new Float32Array(z);let N=new ArrayBuffer(16);new Int32Array(N),new Float32Array(N);let k=new ArrayBuffer(8);new Int32Array(k),new Float32Array(k);let O=new ArrayBuffer(4);new Int32Array(O),new Float32Array(O);var q=a(13969),U=a(65497),Y=a(84139),L=a(92468);async function X(e,t,a,r,i){let{resolution:n,radiusOffset:u,smoothness:o}=i,l=1/n,{indices:s,x:d,y:c,z:f,id:m}=t,p=S.C.size(s),x=new Float32Array(p),y=0;for(let e=0;e<p;++e){let t=r(S.C.getAt(s,e))+u;y<t&&(y=t),x[e]=t}let I=2*y+n,g=q.D.expand((0,q.D)(),a,U.e.create(I,I,I)),b=g.min,C=q.D.scale((0,q.D)(),g,l),v=q.D.size((0,U.e)(),C);U.e.ceil(v,v);let D=Y.q.Space(v,[0,1,2],Float32Array),T=D.create(),h=Y.q.create(D,T),w=D.create();w.fill(-1);let G=Y.q.create(D,w),[F,Q,M]=v,R=M*Q,_=(0,A.o)(v[0],b[0],n),B=(0,A.o)(v[1],b[1],n),$=(0,A.o)(v[2],b[2],n),z=D.create(),N=Math.ceil(1e5/(Math.pow(Math.pow(y,3),3)*l));async function k(){for(let t=0;t<p;t+=N)!function(e,t){for(let a=e;a<t;++a){let e=S.C.getAt(s,a),t=d[e],r=c[e],i=f[e],n=x[a],u=1/(n*n),p=2*n,y=p*p,I=Math.ceil(p*l),g=Math.floor(l*(t-b[0])),C=Math.floor(l*(r-b[1])),v=Math.floor(l*(i-b[2])),D=Math.max(0,g-I),h=Math.max(0,C-I),G=Math.max(0,v-I),A=Math.min(F,g+I+2),N=Math.min(Q,C+I+2),k=Math.min(M,v+I+2);for(let e=D;e<A;++e){let n=_[e]-t,l=e*R;for(let e=h;e<N;++e){let t=B[e]-r,s=n*n+t*t,d=e*M+l;for(let e=G;e<k;++e){let t=$[e]-i,r=s+t*t;if(r<=y){let t=function(e){var t;return t=1.44269504*e,P[0]=8388608*((t<-126?-126:t)+126.94269504),E[0]}(-(r*u*o)),i=e+d;T[i]+=t,t>z[i]&&(z[i]=t,w[i]=m?m[a]:a)}}}}}}(t,Math.min(t+N,p)),e.shouldUpdate&&await e.update({message:"filling density grid",current:t,max:p})}await k();let O=L.$.identity();return L.$.fromScaling(O,U.e.create(n,n,n)),L.$.setTranslation(O,g.min),{field:h,idField:G,transform:O,radiusFactor:1,resolution:n,maxRadius:y}}let J={resolution:i.ParamDefinition.Numeric(1,{min:.1,max:20,step:.1},{description:"Grid resolution/cell spacing.",...R.iy.CustomQualityParamInfo}),radiusOffset:i.ParamDefinition.Numeric(0,{min:0,max:10,step:.1},{description:"Extra/offset radius added to the atoms/coarse elements for gaussian calculation. Useful to create coarse, low resolution surfaces."}),smoothness:i.ParamDefinition.Numeric(1.5,{min:1,max:3,step:.1},{description:"Smoothness of the gausian surface, lower is smoother."}),floodfill:i.ParamDefinition.Select("off",i.ParamDefinition.arrayToOptions(["off","inside","outside"]),{description:"If and how to floodfill the gaussian surface. Note that this disables GPU support."}),...M.$J},Z=i.ParamDefinition.getDefaultValues(J);function H(e,t){let a=e.maxTextureSize/3;return a*a/Math.max(1,t?t.units.length/16:1)}function V(e,t,a,i){let{position:n,boundary:u,radius:o}=(0,M.LT)(e,t,a,i),l=(0,M.FC)(u.box,i);return r.YZ.create("Gaussian Density",async e=>await X(e,n,u.box,o,l))}function W(e,t,a,r,i,n){let{position:u,boundary:o,radius:l}=(0,M.LT)(e,t,a,r),s=(0,M.FC)(o.box,r,H(i,e));return C(i,u,o.box,l,s,n)}function j(e,t,a,r,i,n,u){let{position:o,boundary:l,radius:s}=(0,M.LT)(e,t,a,i),d=(0,M.FC)(l.box,i,H(n,e));return v(n,o,l.box,s,r,d,u)}function K(e,t,a){let{position:i,boundary:n,radius:u}=(0,M.oc)(e,t,a),o=(0,M.FC)(n.box,a);return r.YZ.create("Gaussian Density",async e=>await X(e,i,n.box,u,o))}function ee(e,t,a,r,i){let{position:n,boundary:u,radius:o}=(0,M.oc)(e,t,a),l=(0,M.FC)(u.box,a);return C(r,n,u.box,o,l,i)}function et(e,t,a,r,i,n){let{box:u}=e.lookup3d.boundary,{position:o,boundary:l,radius:s}=(0,M.oc)(e,t,r);return v(i,o,u,s,a,(0,M.FC)(l.box,r),n)}}}]);