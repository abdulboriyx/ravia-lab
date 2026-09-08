"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6888],{2274:(e,r,i)=>{i.d(r,{kk:()=>o,ru:()=>n});var t=i(69174);let a={value:t.ParamDefinition.Numeric(1,{min:0,max:20,step:.1})};function n(e,r){let i=r.value;return{factory:n,granularity:"uniform",size:()=>i,props:r,description:"Gives everything the same, uniform size."}}let o={name:"uniform",label:"Uniform",category:"",factory:n,getParams:function(e){return a},defaultValues:t.ParamDefinition.getDefaultValues(a),isApplicable:e=>!0}},3054:(e,r,i)=>{i.d(r,{i:()=>n});var t,a=i(69174);function n(e){return{...n.Zero,...e}}(t=n||(n={})).Zero={metalness:0,roughness:0,bumpiness:0},t.toArray=function(e,r,i){return r[i]=255*e.metalness,r[i+1]=255*e.roughness,r[i+2]=255*e.bumpiness,r},t.toArrayNormalized=function(e,r,i){return r[i]=e.metalness,r[i+1]=e.roughness,r[i+2]=e.bumpiness,r},t.areEqual=function(e,r){return e.metalness===r.metalness&&e.roughness===r.roughness&&e.bumpiness===r.bumpiness},t.toString=function({metalness:e,roughness:r,bumpiness:i}){return`M ${e.toFixed(2)} | R ${r.toFixed(2)} | B ${i.toFixed(2)}`},t.getParam=function(e){return a.ParamDefinition.Group({metalness:a.ParamDefinition.Numeric(0,{min:0,max:1,step:.01}),roughness:a.ParamDefinition.Numeric(1,{min:0,max:1,step:.01}),bumpiness:a.ParamDefinition.Numeric(0,{min:0,max:1,step:.01})},{...e,presets:[[{metalness:0,roughness:1,bumpiness:0},"Matte"],[{metalness:0,roughness:.2,bumpiness:0},"Plastic"],[{metalness:0,roughness:.6,bumpiness:0},"Glossy"],[{metalness:1,roughness:.6,bumpiness:0},"Metallic"]]})}},3766:(e,r,i)=>{i.d(r,{C6:()=>a}),i(18534);var t=i(37897);function a(e){return"u">typeof WebGL2RenderingContext&&e instanceof WebGL2RenderingContext}(0,t.q)(),i(24688),i(61500),i(88140),i(4020),i(30286),(0,t.q)(),(0,t.q)(),i(45033),i(61286),(0,t.q)(),i(99603),(0,t.q)(),i(94325),(0,t.q)(),new Uint8Array(4),new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1])},4020:(e,r,i)=>{i.d(r,{kB:()=>n});var t=i(20430),a=i(61500);function n(e){let r={};return Object.keys(e).forEach(i=>{r[i]=t.IQ.create((0,a.Go)(e[i].ref.value))}),r}},11079:(e,r,i)=>{let t,a,n,o,l,d;i.d(r,{iy:()=>s,Y0:()=>z,jH:()=>B,Y3:()=>O});var c,f,s,u=i(20430),m=i(22747),p=i(69174),g=i(71526),v=i(17373),h=i(23843),y=i(22020),x=i(2274),b=i(6300),_=i(3054),I=i(74563),C=i(92468),D=i(9605),T=i(65497),S=i(20361),P=i(58534);function w(){}(c=w||(w={})).Type={none:0,plane:1,sphere:2,cube:3,cylinder:4,infiniteCone:5},c.Params={variant:p.ParamDefinition.Select("pixel",p.ParamDefinition.arrayToOptions(["instance","pixel"])),objects:p.ParamDefinition.ObjectList({type:p.ParamDefinition.Select("plane",p.ParamDefinition.objectToOptions(c.Type,e=>(0,P.Mk)(e))),invert:p.ParamDefinition.Boolean(!1),position:p.ParamDefinition.Vec3((0,T.e)()),rotation:p.ParamDefinition.Group({axis:p.ParamDefinition.Vec3(T.e.create(1,0,0)),angle:p.ParamDefinition.Numeric(0,{min:-180,max:180,step:1},{description:"Angle in Degrees"})},{isExpanded:!0}),scale:p.ParamDefinition.Vec3(T.e.create(1,1,1)),transform:p.ParamDefinition.Mat4(C.$.identity())},e=>(0,P.Mk)(e.type))},t=(0,D.k)(),a=(0,D.k)(),n=(0,T.e)(),o=(0,T.e)(),l=(0,C.$)(),d=(0,C.$)(),c.getClip=function(e,r){let i=e.objects.length,{type:a,invert:o,position:l,rotation:d,scale:f,transform:s}=(null==r?void 0:r.objects)||{count:0,type:Array(i).fill(1),invert:Array(i).fill(!1),position:Array(3*i).fill(0),rotation:Array(4*i).fill(0),scale:Array(3*i).fill(1),transform:Array(16*i).fill(0)};for(let r=0;r<i;++r){let i=e.objects[r];a[r]=c.Type[i.type],o[r]=i.invert,T.e.toArray(i.position,l,3*r),T.e.normalize(n,i.rotation.axis),D.k.toArray(D.k.setAxisAngle(t,n,(0,S.pu)(i.rotation.angle)),d,4*r),T.e.toArray(i.scale,f,3*r),C.$.toArray(i.transform,s,16*r)}return{variant:e.variant,objects:{count:i,type:a,invert:o,position:l,rotation:d,scale:f,transform:s}}},c.areEqual=function(e,r){if(e.variant!==r.variant||e.objects.count!==r.objects.count)return!1;let i=e.objects,c=r.objects;for(let e=0,r=i.count;e<r;++e)if(i.invert[e]!==c.invert[e]||i.type[e]!==c.type[e]||(T.e.fromArray(n,i.position,3*e),T.e.fromArray(o,c.position,3*e),!T.e.equals(n,o))||(T.e.fromArray(n,i.scale,3*e),T.e.fromArray(o,c.scale,3*e),!T.e.equals(n,o))||(D.k.fromArray(t,i.rotation,4*e),D.k.fromArray(a,c.rotation,4*e),!D.k.equals(t,a))||(C.$.fromArray(l,i.transform,16*e),C.$.fromArray(d,c.transform,16*e),!C.$.areEqual(l,d,I.p)))return!1;return!0};var F=i(10596);let k=p.ParamDefinition.arrayToOptions(["custom","auto","highest","higher","high","medium","low","lower","lowest"]);function B(e){return!!e.smoothColors}function z(e,r,i){if(("on"===e.name||"auto"===e.name&&r)&&i&&i<3){let r=3;return"on"===e.name?(i*=e.params.resolutionFactor,r=e.params.sampleStride):(i*=2-(0,b.TF)(0,1.1,i),(i=Math.max(.5,i))>1.2&&(r=2)),{resolution:i,stride:r}}}p.ParamDefinition.MappedStatic("auto",{auto:p.ParamDefinition.Group({}),on:p.ParamDefinition.Group({resolutionFactor:p.ParamDefinition.Numeric(2,{min:.5,max:6,step:.1}),sampleStride:p.ParamDefinition.Numeric(3,{min:1,max:12,step:1})}),off:p.ParamDefinition.Group({})});function O(e,r,i){return"auto"===e?r*i>5e7:e}(f=s||(s={})).MaterialCategory={category:"Material"},f.ShadingCategory={category:"Shading"},f.CullingLodCategory={category:"Culling & LOD"},f.CustomQualityParamInfo={category:"Custom Quality",hideIf:e=>void 0!==e.quality&&"custom"!==e.quality},f.Params={alpha:p.ParamDefinition.Numeric(1,{min:0,max:1,step:.01},{label:"Opacity",isEssential:!0,description:"How opaque/transparent the representation is rendered."}),quality:p.ParamDefinition.Select("auto",k,{isEssential:!0,description:"Visual/rendering quality of the representation."}),material:_.i.getParam(),clip:p.ParamDefinition.Group(w.Params),emissive:p.ParamDefinition.Numeric(0,{min:0,max:1,step:.01}),density:p.ParamDefinition.Numeric(.2,{min:0,max:1,step:.01},{description:"Density value to estimate object thickness."}),instanceGranularity:p.ParamDefinition.Select("auto",[[!0,"On"],[!1,"Off"],["auto","Auto"]],{description:"Use instance granularity for marker, transparency, clipping, overpaint, substance data to save memory. When set to `auto`, granularity is enabled if `groupCount * instanceCount` exceeds `AutoInstanceGranularityThreshold`."}),lod:p.ParamDefinition.Vec3((0,T.e)(),void 0,{...f.CullingLodCategory,description:"Level of detail.",fieldLabels:{x:"Min Distance",y:"Max Distance",z:"Overlap (Shader)"}}),cellSize:p.ParamDefinition.Numeric(200,{min:0,max:5e3,step:100},{...f.CullingLodCategory,description:"Instance grid cell size."}),batchSize:p.ParamDefinition.Numeric(2e3,{min:0,max:5e4,step:500},{...f.CullingLodCategory,description:"Instance grid batch size."})},f.createSimple=function(e=v.s.grey,r=1,i){i||(i=(0,g.Zk)());let t=(0,m.iQ)(1,i.instanceCount.ref.value,1,()=>h.LU,!1,()=>!1);return{transform:i,locationIterator:t,theme:{color:(0,y.TA)({},{value:e,lightness:0,saturation:0}),size:(0,x.ru)({},{value:r})}}},f.createValues=function(e,r){let i=w.getClip(e.clip);return{alpha:u.IQ.create(e.alpha),uAlpha:u.IQ.create(e.alpha),uVertexCount:u.IQ.create(r.vertexCount),uGroupCount:u.IQ.create(r.groupCount),drawCount:u.IQ.create(r.drawCount),uMetalness:u.IQ.create(e.material.metalness),uRoughness:u.IQ.create(e.material.roughness),uBumpiness:u.IQ.create(e.material.bumpiness),uEmissive:u.IQ.create(e.emissive),uDensity:u.IQ.create(e.density),dClipObjectCount:u.IQ.create(i.objects.count),dClipVariant:u.IQ.create(i.variant),uClipObjectType:u.IQ.create(i.objects.type),uClipObjectInvert:u.IQ.create(i.objects.invert),uClipObjectPosition:u.IQ.create(i.objects.position),uClipObjectRotation:u.IQ.create(i.objects.rotation),uClipObjectScale:u.IQ.create(i.objects.scale),uClipObjectTransform:u.IQ.create(i.objects.transform),instanceGranularity:u.IQ.create(O(e.instanceGranularity,r.groupCount,r.instanceCount)),uLod:u.IQ.create(F.Z.create(e.lod[0],e.lod[1],e.lod[2],0))}},f.updateValues=function(e,r){u.IQ.updateIfChanged(e.alpha,r.alpha),u.IQ.updateIfChanged(e.uMetalness,r.material.metalness),u.IQ.updateIfChanged(e.uRoughness,r.material.roughness),u.IQ.updateIfChanged(e.uBumpiness,r.material.bumpiness),u.IQ.updateIfChanged(e.uEmissive,r.emissive),u.IQ.updateIfChanged(e.uDensity,r.density);let i=w.getClip(r.clip);u.IQ.updateIfChanged(e.dClipObjectCount,i.objects.count),u.IQ.updateIfChanged(e.dClipVariant,i.variant),u.IQ.update(e.uClipObjectType,i.objects.type),u.IQ.update(e.uClipObjectInvert,i.objects.invert),u.IQ.update(e.uClipObjectPosition,i.objects.position),u.IQ.update(e.uClipObjectRotation,i.objects.rotation),u.IQ.update(e.uClipObjectScale,i.objects.scale),u.IQ.update(e.uClipObjectTransform,i.objects.transform),u.IQ.updateIfChanged(e.instanceGranularity,O(r.instanceGranularity,e.uGroupCount.ref.value,e.instanceCount.ref.value)),u.IQ.update(e.uLod,F.Z.set(e.uLod.ref.value,r.lod[0],r.lod[1],r.lod[2],0))},f.createRenderableState=function(e={}){let r=void 0===e.alpha||1===e.alpha;return{disposed:!1,visible:!0,alphaFactor:1,pickable:!0,colorOnly:!1,opaque:r,writeDepth:r}},f.updateRenderableState=function(e,r){e.opaque=r.alpha*e.alphaFactor>=1,e.writeDepth=e.opaque}},15055:(e,r,i)=>{i.d(r,{D1:()=>c});var t=i(20430),a=i(23155),n=i(45969),o=i(9566),l=i(23843),d=i(99603);function c(e,r,i,c){var m;let p=function(e,r,i,c){switch(i.granularity){case"uniform":return function(e,r,i){var a;e.reset();let c=e.hasNext?e.move():{location:l.LU,isSecondary:!1};return a=r(c.location,c.isSecondary),i?(t.IQ.update(i.uColor,n.Q1.toVec3Normalized(i.uColor.ref.value,a)),t.IQ.updateIfChanged(i.dColorType,"uniform"),i):{uColor:t.IQ.create(n.Q1.toVec3Normalized((0,o.eB)(),a)),tColor:t.IQ.create({array:new Uint8Array(3),width:1,height:1}),tColorGrid:t.IQ.create((0,d.z6)()),uPaletteDomain:t.IQ.create(o.ZY.create(0,1)),uPaletteDefault:t.IQ.create((0,o.eB)()),tPalette:t.IQ.create({array:new Uint8Array(3),width:1,height:1}),uColorTexDim:t.IQ.create(o.ZY.create(1,1)),uColorGridDim:t.IQ.create(o.eB.create(1,1,1)),uColorGridTransform:t.IQ.create(o.Zb.create(0,0,0,1)),dColorType:t.IQ.create("uniform"),dUsePalette:t.IQ.create(!1)}}(e,i.color,c);case"instance":return e.nonInstanceable?s(e,i.color,c):function(e,r,i){let{instanceCount:t}=e,o=(0,a.xg)(Math.max(1,t),3,Uint8Array,i&&i.tColor.ref.value.array);for(e.reset();e.hasNext;){let{location:i,isSecondary:t,instanceIndex:a}=e.move();n.Q1.toArray(r(i,t),o.array,3*a),e.skipInstance()}return f(o,"instance",i)}(e,i.color,c);case"group":return s(e,i.color,c);case"groupInstance":return function(e,r,i){let{groupCount:t,instanceCount:o,hasLocation2:l}=e,d=(0,a.xg)(Math.max(1,o*t*(l?2:1)),3,Uint8Array,i&&i.tColor.ref.value.array);e.reset();let c=l?6:3;for(;e.hasNext;){let{location:i,location2:t,isSecondary:a,index:o}=e.move();n.Q1.toArray(r(i,a),d.array,o*c),l&&n.Q1.toArray(r(t,a),d.array,o*c+3)}return f(d,"groupInstance",i)}(e,i.color,c);case"vertex":return function(e,r,i){let{groupCount:t,stride:o}=e,l=(0,a.xg)(Math.max(1,t),3,Uint8Array,i&&i.tColor.ref.value.array);for(e.reset(),e.voidInstances();e.hasNext&&!e.isNextNewInstance;){let{location:i,isSecondary:t,groupIndex:a}=e.move(),d=r(i,t);for(let e=0;e<o;++e)n.Q1.toArray(d,l.array,(a+e)*3)}return f(l,"vertex",i)}(r,i.color,c);case"vertexInstance":return function(e,r,i){let{groupCount:t,instanceCount:o,stride:l}=e,d=(0,a.xg)(Math.max(1,o*t),3,Uint8Array,i&&i.tColor.ref.value.array);for(e.reset();e.hasNext;){let{location:i,isSecondary:t,index:a}=e.move(),o=r(i,t);for(let e=0;e<l;++e)n.Q1.toArray(o,d.array,(a+e)*3)}return f(d,"vertexInstance",i)}(r,i.color,c);case"volume":return u(i.grid,"volume",c);case"volumeInstance":return u(i.grid,"volumeInstance",c);case"direct":var m;return(m=c)?(t.IQ.updateIfChanged(m.dColorType,"direct"),m):{uColor:t.IQ.create((0,o.eB)()),tColor:t.IQ.create({array:new Uint8Array(3),width:1,height:1}),tColorGrid:t.IQ.create((0,d.z6)()),uPaletteDomain:t.IQ.create(o.ZY.create(0,1)),uPaletteDefault:t.IQ.create((0,o.eB)()),tPalette:t.IQ.create({array:new Uint8Array(3),width:1,height:1}),uColorTexDim:t.IQ.create(o.ZY.create(1,1)),uColorGridDim:t.IQ.create(o.eB.create(1,1,1)),uColorGridTransform:t.IQ.create(o.Zb.create(0,0,0,1)),dColorType:t.IQ.create("direct"),dUsePalette:t.IQ.create(!1)}}}(e,r,i,c);if(i.palette){t.IQ.updateIfChanged(p.dUsePalette,!0);let[e,r]=i.palette.domain||[0,1];t.IQ.update(p.uPaletteDomain,o.ZY.set(p.uPaletteDomain.ref.value,e,r)),t.IQ.update(p.uPaletteDefault,n.Q1.toVec3Normalized(p.uPaletteDefault.ref.value,null!=(m=i.palette.defaultColor)?m:(0,n.Q1)(0xcccccc))),function(e,r){let i=!0,a=r.ref.value;if(e.colors.length!==a.width||a.filter!==e.filter)i=!1;else{let r=a.array,t=0;for(let a of e.colors){let[e,o,l]=n.Q1.toRgb(a);if(r[t++]!==e||r[t++]!==o||r[t++]!==l){i=!1;break}}}if(i)return;let o=new Uint8Array(3*e.colors.length),l=0;for(let r of e.colors){let[e,i,t]=n.Q1.toRgb(r);o[l++]=e,o[l++]=i,o[l++]=t}t.IQ.update(r,{array:o,height:1,width:e.colors.length,filter:e.filter})}(i.palette,p.tPalette)}else t.IQ.updateIfChanged(p.dUsePalette,!1);return p}function f(e,r,i){return i?(t.IQ.update(i.tColor,e),t.IQ.update(i.uColorTexDim,o.ZY.create(e.width,e.height)),t.IQ.updateIfChanged(i.dColorType,r),i):{uColor:t.IQ.create((0,o.eB)()),tColor:t.IQ.create(e),tColorGrid:t.IQ.create((0,d.z6)()),uPaletteDomain:t.IQ.create(o.ZY.create(0,1)),uPaletteDefault:t.IQ.create((0,o.eB)()),tPalette:t.IQ.create({array:new Uint8Array(3),width:1,height:1}),uColorTexDim:t.IQ.create(o.ZY.create(e.width,e.height)),uColorGridDim:t.IQ.create(o.eB.create(1,1,1)),uColorGridTransform:t.IQ.create(o.Zb.create(0,0,0,1)),dColorType:t.IQ.create(r),dUsePalette:t.IQ.create(!1)}}function s(e,r,i){let{groupCount:t,hasLocation2:o}=e,l=(0,a.xg)(Math.max(1,t*(o?2:1)),3,Uint8Array,i&&i.tColor.ref.value.array);e.reset();let d=o?6:3;for(;e.hasNext&&!e.isNextNewInstance;){let{location:i,location2:t,isSecondary:a,groupIndex:c}=e.move();n.Q1.toArray(r(i,a),l.array,c*d),o&&n.Q1.toArray(r(t,a),l.array,c*d+3)}return f(l,"group",i)}function u(e,r,i){let{colors:a,dimension:n,transform:l}=e,d=a.getWidth(),c=a.getHeight();return i?(t.IQ.update(i.tColorGrid,a),t.IQ.update(i.uColorTexDim,o.ZY.create(d,c)),t.IQ.update(i.uColorGridDim,o.eB.clone(n)),t.IQ.update(i.uColorGridTransform,o.Zb.clone(l)),t.IQ.updateIfChanged(i.dColorType,r),i):{uColor:t.IQ.create((0,o.eB)()),tColor:t.IQ.create({array:new Uint8Array(3),width:1,height:1}),tColorGrid:t.IQ.create(a),uPaletteDomain:t.IQ.create(o.ZY.create(0,1)),uPaletteDefault:t.IQ.create((0,o.eB)()),tPalette:t.IQ.create({array:new Uint8Array(3),width:1,height:1}),uColorTexDim:t.IQ.create(o.ZY.create(d,c)),uColorGridDim:t.IQ.create(o.eB.clone(n)),uColorGridTransform:t.IQ.create(o.Zb.clone(l)),dColorType:t.IQ.create(r),dUsePalette:t.IQ.create(!1)}}},17373:(e,r,i)=>{let t;i.d(r,{s:()=>a});let a=(0,i(92139)._j)({aliceblue:0xf0f8ff,antiquewhite:0xfaebd7,aqua:65535,aquamarine:8388564,azure:0xf0ffff,beige:0xf5f5dc,bisque:0xffe4c4,black:0,blanchedalmond:0xffebcd,blue:255,blueviolet:9055202,brown:0xa52a2a,burlywood:0xdeb887,cadetblue:6266528,chartreuse:8388352,chocolate:0xd2691e,coral:0xff7f50,cornflower:6591981,cornflowerblue:6591981,cornsilk:0xfff8dc,crimson:0xdc143c,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:0xb8860b,darkgray:0xa9a9a9,darkgreen:25600,darkgrey:0xa9a9a9,darkkhaki:0xbdb76b,darkmagenta:9109643,darkolivegreen:5597999,darkorange:0xff8c00,darkorchid:0x9932cc,darkred:9109504,darksalmon:0xe9967a,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:0xff1493,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:0xb22222,floralwhite:0xfffaf0,forestgreen:2263842,fuchsia:0xff00ff,gainsboro:0xdcdcdc,ghostwhite:0xf8f8ff,gold:0xffd700,goldenrod:0xdaa520,gray:8421504,green:32768,greenyellow:0xadff2f,grey:8421504,honeydew:0xf0fff0,hotpink:0xff69b4,indianred:0xcd5c5c,indigo:4915330,ivory:0xfffff0,khaki:0xf0e68c,laserlemon:0xffff54,lavender:0xe6e6fa,lavenderblush:0xfff0f5,lawngreen:8190976,lemonchiffon:0xfffacd,lightblue:0xadd8e6,lightcoral:0xf08080,lightcyan:0xe0ffff,lightgoldenrod:0xfafad2,lightgoldenrodyellow:0xfafad2,lightgray:0xd3d3d3,lightgreen:9498256,lightgrey:0xd3d3d3,lightpink:0xffb6c1,lightsalmon:0xffa07a,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:0xb0c4de,lightyellow:0xffffe0,lime:65280,limegreen:3329330,linen:0xfaf0e6,magenta:0xff00ff,maroon:8388608,maroon2:8323072,maroon3:0xb03060,mediumaquamarine:6737322,mediumblue:205,mediumorchid:0xba55d3,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:0xc71585,midnightblue:1644912,mintcream:0xf5fffa,mistyrose:0xffe4e1,moccasin:0xffe4b5,navajowhite:0xffdead,navy:128,oldlace:0xfdf5e6,olive:8421376,olivedrab:7048739,orange:0xffa500,orangered:0xff4500,orchid:0xda70d6,palegoldenrod:0xeee8aa,palegreen:0x98fb98,paleturquoise:0xafeeee,palevioletred:0xdb7093,papayawhip:0xffefd5,peachpuff:0xffdab9,peru:0xcd853f,pink:0xffc0cb,plum:0xdda0dd,powderblue:0xb0e0e6,purple:8388736,purple2:8323199,purple3:0xa020f0,rebeccapurple:6697881,red:0xff0000,rosybrown:0xbc8f8f,royalblue:4286945,saddlebrown:9127187,salmon:0xfa8072,sandybrown:0xf4a460,seagreen:3050327,seashell:0xfff5ee,sienna:0xa0522d,silver:0xc0c0c0,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:0xfffafa,springgreen:65407,steelblue:4620980,tan:0xd2b48c,teal:32896,thistle:0xd8bfd8,tomato:0xff6347,turquoise:4251856,violet:0xee82ee,wheat:0xf5deb3,white:0xffffff,whitesmoke:0xf5f5f5,yellow:0xffff00,yellowgreen:0x9acd32});t=new Map,Object.keys(a).forEach(e=>{t.set(a[e],e)})},22020:(e,r,i)=>{i.d(r,{TA:()=>f,Wr:()=>s,vz:()=>c});var t=i(45969),a=i(69174),n=i(97818),o=i(20430),l=i(66736);let d=(0,t.Q1)(0xcccccc),c={value:a.ParamDefinition.Color(d),saturation:a.ParamDefinition.Numeric(0,{min:-6,max:6,step:.1}),lightness:a.ParamDefinition.Numeric(0,{min:-6,max:6,step:.1})};function f(e,r){let i=(0,o.NT)(r.value,d);return i=t.Q1.saturate(i,r.saturation),i=t.Q1.lighten(i,r.lightness),{factory:f,granularity:"uniform",color:()=>i,props:r,description:"Gives everything the same, uniform color.",legend:(0,n.h)([["uniform",i]])}}let s={name:"uniform",label:"Uniform",category:l.N.Misc,factory:f,getParams:function(e){return c},defaultValues:a.ParamDefinition.getDefaultValues(c),isApplicable:e=>!0}},22747:(e,r,i)=>{i.d(r,{ZC:()=>l,iQ:()=>n,tu:()=>o});var t=i(9566),a=i(23843);function n(e,r,i,t,o=!1,l=()=>!1,d){if(e%i!=0)throw Error("incompatible groupCount and stride");let c={location:a.LU,location2:a.LU,index:0,groupIndex:0,instanceIndex:0,isSecondary:!1},f=c.groupIndex<e,s=!1,u=0,m=0,p=!1,g=!!d;return{get hasNext(){return f},get isNextNewInstance(){return s},groupCount:e,instanceCount:r,count:e*r,stride:i,nonInstanceable:o,hasLocation2:g,move:()=>(f&&(c.groupIndex=u,c.instanceIndex=m,c.index=m*e+u,c.location=t(u,p?-1:m),g&&(c.location2=d(u,p?-1:m)),c.isSecondary=l(u,p?-1:m),(u+=i)===e?(++m,s=!0,m<r&&(u=0)):s=!1,f=u<e),c),reset(){c.location=a.LU,c.location2=a.LU,c.index=0,c.groupIndex=0,c.instanceIndex=0,c.isSecondary=!1,f=c.groupIndex<e,s=!1,u=0,m=0,p=!1},skipInstance(){f&&c.instanceIndex===m&&(++m,u=0,f=m<r)},voidInstances(){p=!0}}}function o(e,r){return{kind:"position-location",position:e?t.eB.clone(e):(0,t.eB)(),normal:r?t.eB.clone(r):(0,t.eB)()}}function l(e){return!!e&&"position-location"===e.kind}},23155:(e,r,i)=>{i.d(r,{Ax:()=>g,sL:()=>m,xg:()=>d});var t=i(21340),a=i(9566),n=i(20747);i(45033);let o=a.eB.fromArray,l=a.eB.transformMat4Offset;function d(e,r,i,t){var a;let n,o,{length:l,width:d,height:c}=(n=Math.ceil(Math.sqrt(a=Math.max(a=e,2))),n+=(r-n%r)%r,o=n>0?Math.ceil(a/n):0,{width:n,height:o,length:n*o*r});return{array:t=t&&t.length>=l?t:new i(l),width:d,height:c}}let c=(0,a.eB)(),f=new n.Z("14"),s=new n.Z("98");function u(e){return e>1e5?f:s}function m(e,r,i){let n=3*i,l=u(r);l.reset();for(let i=0,t=3*r;i<t;i+=n)o(c,e,i),l.includePosition(c);l.finishedIncludeStep();for(let i=0,t=3*r;i<t;i+=n)o(c,e,i),l.radiusPosition(c);let d=l.getSphere();if(r<=14){let i=[];for(let t=0,l=3*r;t<l;t+=n)i.push(o((0,a.eB)(),e,t));t.f8.setExtrema(d,i)}return d}let p=(0,a.$I)();function g(e,r,i,n){if(1===i){a.$I.fromArray(p,r,n);let i=t.f8.clone(e);return a.$I.isIdentity(p)?i:t.f8.transform(i,i,p)}let o=u(i);o.reset();let{center:d,radius:f,extrema:s}=e;if(s&&i<=14){for(let e=0;e<i;++e)for(let i of s)l(c,i,r,0,0,16*e+n),o.includePosition(c);o.finishedIncludeStep();for(let e=0;e<i;++e)for(let i of s)l(c,i,r,0,0,16*e+n),o.radiusPosition(c)}else{for(let e=0;e<i;++e)l(c,d,r,0,0,16*e+n),o.includePositionRadius(c,f);o.finishedIncludeStep();for(let e=0;e<i;++e)l(c,d,r,0,0,16*e+n),o.radiusPositionRadius(c,f)}return o.getSphere()}},23352:(e,r,i)=>{i.d(r,{AA:()=>g,TL:()=>l,lm:()=>d,pi:()=>o,xL:()=>p});var t=i(9566),a=i(45033);let n=(0,t.eB)();function o(e,r,i,a){for(let o=0,l=3*a;o<l;o+=3)t.eB.fromArray(n,r,i+o),t.eB.transformMat4(n,n,e),t.eB.toArray(n,r,i+o)}function l(e,r,i,a){for(let o=0,l=3*a;o<l;o+=3)t.eB.fromArray(n,r,i+o),t.eB.transformMat3(n,n,e),t.eB.toArray(n,r,i+o)}function d(e,r){for(let i=0,a=e.length;i<a;i+=3)t.eB.fromArray(n,e,i),t.eB.normalize(n,n),t.eB.scale(n,n,r),t.eB.toArray(n,e,i)}let c=(0,t.eB)(),f=(0,t.eB)(),s=(0,t.eB)(),u=(0,t.eB)(),m=(0,t.eB)();function p(e,r,i,a,n){for(let a=0,o=3*n;a<o;a+=3){let n=3*r[a],o=3*r[a+1],l=3*r[a+2];t.eB.fromArray(c,e,n),t.eB.fromArray(f,e,o),t.eB.fromArray(s,e,l),t.eB.sub(u,s,f),t.eB.sub(m,c,f),t.eB.cross(u,u,m),i[n]+=u[0],i[n+1]+=u[1],i[n+2]+=u[2],i[o]+=u[0],i[o+1]+=u[1],i[o+2]+=u[2],i[l]+=u[0],i[l+1]+=u[1],i[l+2]+=u[2]}return function(e,r){for(let i=0,t=3*r;i<t;i+=3){let r=e[i],t=e[i+1],a=e[i+2],n=1/Math.sqrt(r*r+t*t+a*a);e[i]=r*n,e[i+1]=t*n,e[i+2]=a*n}return e}(i,a)}function g(e,r,i=1){let t=new Int32Array((0,a._M)(e)+2),n=new Int32Array(r),o=new Int32Array(r);for(let t=0,a=r*i;t<a;t+=i)++o[e[t]];let l=0;for(let e=0;e<r;e++)t[e]=l,l+=o[e];t[r]=l;let d=new Int32Array(l);for(let a=0,o=r*i;a<o;a+=i){let r=e[a];d[t[r]+n[r]]=a,++n[r]}return{indices:d,offsets:t}}},23843:(e,r,i)=>{i.d(r,{LU:()=>t});let t={kind:"null-location"}},26888:(e,r,i)=>{i.r(r),i.d(r,{Mesh:()=>t});var t,a=i(20430),n=i(9566),o=i(21340),l=i(23352),d=i(52786),c=i(22747),f=i(15055),s=i(61286),u=i(69174),m=i(23155),p=i(11079),g=i(76760),v=i(90070),h=i(76346),y=i(45033),x=i(20361),b=i(69212),_=i(57861),I=i(30255),C=i(27473),D=i(40033);!function(e){function r(e,r,i,n,d,c,f){var s,u,p,g,v,h,y,x,b,_,I,C,D;let T,S,P,w,F;return f?(s=e,u=r,p=i,g=n,v=d,h=c,(y=f).vertexCount=v,y.triangleCount=h,a.IQ.update(y.vertexBuffer,s),a.IQ.update(y.indexBuffer,u),a.IQ.update(y.normalBuffer,p),a.IQ.update(y.groupBuffer,g),y):(x=e,b=r,_=i,I=n,C=d,D=c,S=(0,o.f8)(),P=-1,w=-1,F={kind:"mesh",vertexCount:C,triangleCount:D,vertexBuffer:a.IQ.create(x),indexBuffer:a.IQ.create(b),normalBuffer:a.IQ.create(_),groupBuffer:a.IQ.create(I),varyingGroup:a.IQ.create(!1),get boundingSphere(){let e=t(F);if(e!==P){let r=(0,m.sL)(F.vertexBuffer.ref.value,F.vertexCount,1);o.f8.copy(S,r),P=e}return S},get groupMapping(){return F.groupBuffer.ref.version!==w&&(T=(0,l.AA)(F.groupBuffer.ref.value,F.vertexCount),w=F.groupBuffer.ref.version),T},setBoundingSphere(e){o.f8.copy(S,e),P=t(F)},hasBoundingSphere:()=>P===t(F),meta:{}})}function i(e){return r(e?e.vertexBuffer.ref.value:new Float32Array(0),e?e.indexBuffer.ref.value:new Uint32Array(0),e?e.normalBuffer.ref.value:new Float32Array(0),e?e.groupBuffer.ref.value:new Float32Array(0),0,0,e)}function t(e){return(0,s.TI)([e.vertexCount,e.triangleCount,e.vertexBuffer.ref.version,e.indexBuffer.ref.version,e.normalBuffer.ref.version,e.groupBuffer.ref.version])}e.create=r,e.createEmpty=i,e.computeNormals=function(e){let{vertexCount:r,triangleCount:i}=e,t=e.vertexBuffer.ref.value,n=e.indexBuffer.ref.value,o=e.normalBuffer.ref.value.length>=3*r?e.normalBuffer.ref.value:new Float32Array(3*r);o===e.normalBuffer.ref.value&&o.fill(0,0,3*r),(0,l.xL)(t,n,o,r,i),a.IQ.update(e.normalBuffer,o)},e.checkForDuplicateVertices=function(e,r=3){let i=e.vertexBuffer.ref.value,t=new Map,a=(e,r)=>`${e[0].toFixed(r)}|${e[1].toFixed(r)}|${e[2].toFixed(r)}`,o=0,l=(0,n.eB)();for(let d=0,c=e.vertexCount;d<c;++d){n.eB.fromArray(l,i,3*d);let e=a(l,r),c=t.get(e);void 0!==c?(o+=1,t.set(e,c+1)):t.set(e,1)}return o};let T=(0,n.U)();function S(e){let{vertexCount:r,triangleCount:i}=e,t=e.indexBuffer.ref.value,a=[];for(let e=0;e<r;++e)a[e]=[];for(let e=0;e<i;++e){let r=t[3*e],i=t[3*e+1],n=t[3*e+2];(0,y.Z2)(a[r],i),(0,y.Z2)(a[r],n),(0,y.Z2)(a[i],r),(0,y.Z2)(a[i],n),(0,y.Z2)(a[n],r),(0,y.Z2)(a[n],i)}return a}function P(e){let{triangleCount:r}=e,i=e.indexBuffer.ref.value,t=new Map,a=(e,r)=>{let i=(0,s.bd)(e,r),a=t.get(i)||0;t.set(i,a+1)};for(let e=0;e<r;++e){let r=i[3*e],t=i[3*e+1],n=i[3*e+2];a(r,t),a(r,n),a(t,n)}return t}function w(e){let r=new Set,i=[0,0];return e.forEach((e,t)=>{1===e&&((0,s.Ao)(i,t),r.add(i[0]),r.add(i[1]))}),r}function F(e,r,i){let t=new Map,a=(e,r)=>{t.has(e)?(0,y.Z2)(t.get(e),r):t.set(e,[r])};return r.forEach(t=>{for(let n of e[t])r.has(n)&&1===i.get((0,s.bd)(t,n))&&a(t,n)}),t}function k(e,r){let i=e.vertexCount,t=r.instanceCount.ref.value,a=(0,c.tu)(),o=a.position,l=a.normal,d=e.vertexBuffer.ref.value,f=e.normalBuffer.ref.value,s=r.aTransform.ref.value;return(0,c.iQ)(i,t,1,(e,r)=>(r<0?(n.eB.fromArray(o,d,3*e),n.eB.fromArray(l,f,3*e)):(n.eB.transformMat4Offset(o,d,s,0,3*e,16*r),n.eB.transformDirectionOffset(l,f,s,0,3*e,16*r)),a))}function B(e,r,i,t,l){let{instanceCount:c,groupCount:s}=i,u=k(e,r),y=(0,f.D1)(i,u,t.color),x=(0,p.Y3)(l.instanceGranularity,s,c)?(0,d.Km)(c,"instance"):(0,d.Km)(c*s,"groupInstance"),T=(0,g.WG)(),S=(0,v.MD)(),P=(0,_.JS)(),w=(0,b.IB)(),F=(0,h.EN)(),B=(0,I.RV)(),z={drawCount:3*e.triangleCount,vertexCount:e.vertexCount,groupCount:s,instanceCount:c},O=o.f8.clone(e.boundingSphere),R=(0,m.Ax)(O,r.aTransform.ref.value,c,0);return{dGeometryType:a.IQ.create("mesh"),aPosition:e.vertexBuffer,aNormal:e.normalBuffer,aGroup:e.groupBuffer,elements:e.indexBuffer,dVaryingGroup:e.varyingGroup,boundingSphere:a.IQ.create(R),invariantBoundingSphere:a.IQ.create(O),uInvariantBoundingSphere:a.IQ.create(n.Zb.ofSphere(O)),...y,...x,...T,...S,...P,...w,...F,...B,...r,...p.iy.createValues(l,z),uDoubleSided:a.IQ.create(l.doubleSided),dFlatShaded:a.IQ.create(l.flatShaded),dFlipSided:a.IQ.create(l.flipSided),dIgnoreLight:a.IQ.create(l.ignoreLight),dCelShaded:a.IQ.create(l.celShaded),dXrayShaded:a.IQ.create("inverted"===l.xrayShaded?"inverted":!0===l.xrayShaded?"on":"off"),dTransparentBackfaces:a.IQ.create(l.transparentBackfaces),uBumpFrequency:a.IQ.create(l.bumpFrequency),uBumpAmplitude:a.IQ.create(l.bumpAmplitude),meta:a.IQ.create(e.meta),...(0,C.J9)(l.interior),...(0,D.xN)(l.animation)}}function z(e,r){p.iy.updateRenderableState(e,r),e.opaque=e.opaque&&!r.xrayShaded,e.writeDepth=e.opaque}e.transform=function(e,r){let i=e.vertexBuffer.ref.value;if((0,l.pi)(r,i,0,e.vertexCount),!n.$I.isTranslationAndUniformScaling(r)){let i=n.U.directionTransform(T,r);(0,l.TL)(i,e.normalBuffer.ref.value,0,e.vertexCount)}a.IQ.update(e.vertexBuffer,i)},e.getOriginalData=function(e){let{originalData:r}="kind"in e?e.meta:e.meta.ref.value;return r},e.uniformTriangleGroup=function(e,r=!0){let{indexBuffer:i,vertexBuffer:t,groupBuffer:o,normalBuffer:l,triangleCount:d,vertexCount:c}=e,f=i.ref.value,u=t.ref.value,m=o.ref.value,p=l.ref.value,g=s.Gm.create(Uint32Array,3,1024,d),v=s.Gm.create(Float32Array,3,1024,u);v.currentIndex=3*c,v.elementCount=c;let h=s.Gm.create(Float32Array,3,1024,p);h.currentIndex=3*c,h.elementCount=c;let y=s.Gm.create(Float32Array,1,1024,m);y.currentIndex=c,y.elementCount=c;let x=(0,n.eB)(),b=(0,n.eB)(),_=(0,n.eB)(),I=(0,n.eB)(),C=(0,n.eB)(),D=(0,n.eB)();function T(e){n.eB.fromArray(x,u,3*e),n.eB.fromArray(I,p,3*e),s.Gm.add3(v,x[0],x[1],x[2]),s.Gm.add3(h,I[0],I[1],I[2])}function S(e,r){n.eB.fromArray(x,u,3*e),n.eB.fromArray(b,u,3*r),n.eB.scale(x,n.eB.add(x,x,b),.5),n.eB.fromArray(I,p,3*e),n.eB.fromArray(C,p,3*r),n.eB.scale(I,n.eB.add(I,I,C),.5),s.Gm.add3(v,x[0],x[1],x[2]),s.Gm.add3(h,I[0],I[1],I[2])}function P(e,r,i){n.eB.fromArray(x,u,3*e),n.eB.fromArray(b,u,3*r),n.eB.fromArray(_,u,3*i),n.eB.scale(x,n.eB.add(x,n.eB.add(x,x,b),_),1/3),n.eB.fromArray(I,p,3*e),n.eB.fromArray(C,p,3*r),n.eB.fromArray(D,p,3*i),n.eB.scale(I,n.eB.add(I,n.eB.add(I,I,C),D),1/3),s.Gm.add3(v,x[0],x[1],x[2]),s.Gm.add3(h,I[0],I[1],I[2])}function w(e,r,i,t,a){++k,T(e),S(e,r),S(e,i),s.Gm.add3(g,F,F+1,F+2);for(let e=0;e<3;++e)s.Gm.add(y,t);F+=3,k+=2,T(r),T(i),S(e,r),S(e,i),s.Gm.add3(g,F,F+1,F+3),s.Gm.add3(g,F,F+3,F+2);for(let e=0;e<4;++e)s.Gm.add(y,a);F+=4}let F=c,k=0;if(r)for(let e=0;e<d;++e){let r=f[3*e],i=f[3*e+1],t=f[3*e+2],a=m[r],n=m[i],o=m[t];if(a===n&&a===o)++k,s.Gm.add3(g,r,i,t);else if(a===n)w(t,r,i,o,a);else if(a===o)w(i,t,r,n,o);else if(n===o)w(r,i,t,a,n);else{k+=2,T(r),S(r,i),S(r,t),P(r,i,t),s.Gm.add3(g,F,F+1,F+3),s.Gm.add3(g,F,F+3,F+2);for(let e=0;e<4;++e)s.Gm.add(y,a);F+=4,k+=2,T(i),S(i,t),S(i,r),P(r,i,t),s.Gm.add3(g,F,F+1,F+3),s.Gm.add3(g,F,F+3,F+2);for(let e=0;e<4;++e)s.Gm.add(y,n);F+=4,k+=2,T(t),S(t,i),S(t,r),P(r,i,t),s.Gm.add3(g,F+3,F+1,F),s.Gm.add3(g,F+2,F+3,F);for(let e=0;e<4;++e)s.Gm.add(y,o);F+=4}}else for(let e=0;e<d;++e){let r=f[3*e],i=f[3*e+1],t=f[3*e+2],a=m[r],n=m[i],o=m[t];if(a!==n||a!==o){++k,T(r),T(i),T(t),s.Gm.add3(g,F,F+1,F+2);let e=n===o?n:a;for(let r=0;r<3;++r)s.Gm.add(y,e);F+=3}else++k,s.Gm.add3(g,r,i,t)}let B=s.Gm.compact(g),z=s.Gm.compact(v),O=s.Gm.compact(h),R=s.Gm.compact(y);return e.vertexCount=F,e.triangleCount=k,a.IQ.update(t,z),a.IQ.update(o,R),a.IQ.update(i,B),a.IQ.update(l,O),e.meta.originalData={indexBuffer:f,vertexCount:c,triangleCount:d},e},e.smoothEdges=function(e,r){!function(e,r){let{indexBuffer:i,triangleCount:t}=e,n=i.ref.value,o=s.Gm.create(Uint32Array,3,1024,t),l=0;for(let e=0;e<t;++e){let i=n[3*e],t=n[3*e+1],a=n[3*e+2];2!==r[i].length&&2!==r[t].length&&2!==r[a].length&&(s.Gm.add3(o,i,t,a),l+=1)}let d=s.Gm.compact(o);e.triangleCount=l,a.IQ.update(i,d)}(e,S(e));for(let i=0;i<10;++i){let i=e.triangleCount,t=P(e),o=S(e),l=F(o,w(t),t);if(!function(e,r,i,t){var o;let{vertexBuffer:l,indexBuffer:d,normalBuffer:c,triangleCount:f}=e,u=l.ref.value,m=d.ref.value,p=c.ref.value,g=s.Gm.create(Uint32Array,3,1024,f),v=0;for(let e=0;e<f;++e)s.Gm.add3(g,m[3*e],m[3*e+1],m[3*e+2]),v+=1;let h=(0,n.eB)(),y=(0,n.eB)(),b=(0,n.eB)(),_=(0,n.eB)(),I=(0,n.eB)(),C=(0,n.eB)(),D=(0,n.eB)(),T=(0,n.eB)(),S=(0,n.eB)(),P=(0,n.eB)(),w=(0,x.pu)(120),F=new Set,k=Array.from(i.keys()).filter(e=>i.get(e).length<2).map(e=>{let r=i.get(e);return n.eB.fromArray(h,u,3*e),n.eB.fromArray(y,u,3*r[0]),n.eB.fromArray(b,u,3*r[1]),n.eB.sub(I,y,h),n.eB.sub(C,b,h),[e,n.eB.angle(I,C)]});for(let[e,a]of(k.sort(([,e],[,r])=>e-r),k)){if(F.has(e)||a>w)continue;let l=i.get(e);if(r[l[0]].includes(l[1])&&!(null==(o=i.get(l[0]))?void 0:o.includes(l[1]))||(n.eB.fromArray(h,u,3*e),n.eB.fromArray(y,u,3*l[0]),n.eB.fromArray(b,u,3*l[1]),n.eB.sub(I,y,h),n.eB.sub(C,b,h),n.eB.add(T,I,C),n.eB.squaredDistance(h,y)>=t))continue;let d=!1;for(let i of r[e])if(!l.includes(i)&&(n.eB.fromArray(_,u,3*i),n.eB.sub(D,_,h),0>n.eB.dot(T,D))){d=!0;break}d&&(n.eB.fromArray(S,p,3*e),n.eB.triangleNormal(P,h,y,b),n.eB.dot(P,S)>0?s.Gm.add3(g,e,l[0],l[1]):s.Gm.add3(g,l[1],l[0],e),F.add(e),F.add(l[0]),F.add(l[1]),v+=1)}let B=s.Gm.compact(g);e.triangleCount=v,a.IQ.update(d,B)}(e,o,l,r.maxNewEdgeLength*r.maxNewEdgeLength),e.triangleCount===i)break}let i=P(e),t=S(e);return!function(e,r,i){let{iterations:t,lambda:o}=i,l=(0,n.eB)(),d=(0,n.eB)(),c=(0,n.eB)(),f=(0,n.eB)(),s=-o,u=new Float32Array(e.vertexBuffer.ref.value.length),m=i=>{let t=e.vertexBuffer.ref.value;u.set(t),r.forEach((e,r)=>{if(2!==e.length)return;n.eB.fromArray(l,t,3*r),n.eB.fromArray(d,t,3*e[0]),n.eB.fromArray(c,t,3*e[1]);let a=1/n.eB.distance(l,d),o=1/n.eB.distance(l,c);n.eB.scale(d,d,a),n.eB.scale(c,c,o),n.eB.add(f,d,c),n.eB.scale(f,f,1/(a+o)),n.eB.sub(f,f,l),n.eB.scale(f,f,i),n.eB.add(f,l,f),n.eB.toArray(f,u,3*r)});let o=e.vertexBuffer.ref.value;a.IQ.update(e.vertexBuffer,u),u=o};for(let e=0;e<t;++e)m(o),m(s)}(e,F(t,w(i),i),{iterations:r.iterations,lambda:.5}),e},e.Params={...p.iy.Params,doubleSided:u.ParamDefinition.Boolean(!1,p.iy.CustomQualityParamInfo),flipSided:u.ParamDefinition.Boolean(!1,p.iy.ShadingCategory),flatShaded:u.ParamDefinition.Boolean(!1,p.iy.ShadingCategory),ignoreLight:u.ParamDefinition.Boolean(!1,p.iy.ShadingCategory),celShaded:u.ParamDefinition.Boolean(!1,p.iy.ShadingCategory),xrayShaded:u.ParamDefinition.Select(!1,[[!1,"Off"],[!0,"On"],["inverted","Inverted"]],p.iy.ShadingCategory),transparentBackfaces:u.ParamDefinition.Select("off",u.ParamDefinition.arrayToOptions(["off","on","opaque"]),p.iy.ShadingCategory),bumpFrequency:u.ParamDefinition.Numeric(0,{min:0,max:10,step:.1},p.iy.ShadingCategory),bumpAmplitude:u.ParamDefinition.Numeric(1,{min:0,max:5,step:.1},p.iy.ShadingCategory),interior:(0,C.ag)(),animation:(0,D.gL)()},e.Utils={Params:e.Params,createEmpty:i,createValues:B,createValuesSimple:function(r,i,t,a,n){let o=p.iy.createSimple(t,a,n),l={...u.ParamDefinition.getDefaultValues(e.Params),...i};return B(r,o.transform,o.locationIterator,o.theme,l)},updateValues:function(e,r){p.iy.updateValues(e,r),a.IQ.updateIfChanged(e.uDoubleSided,r.doubleSided),a.IQ.updateIfChanged(e.dFlatShaded,r.flatShaded),a.IQ.updateIfChanged(e.dFlipSided,r.flipSided),a.IQ.updateIfChanged(e.dIgnoreLight,r.ignoreLight),a.IQ.updateIfChanged(e.dCelShaded,r.celShaded),a.IQ.updateIfChanged(e.dXrayShaded,"inverted"===r.xrayShaded?"inverted":!0===r.xrayShaded?"on":"off"),a.IQ.updateIfChanged(e.dTransparentBackfaces,r.transparentBackfaces),a.IQ.updateIfChanged(e.uBumpFrequency,r.bumpFrequency),a.IQ.updateIfChanged(e.uBumpAmplitude,r.bumpAmplitude),(0,C.Gn)(e,r.interior),(0,D.am)(e,r.animation)},updateBoundingSphere:function(e,r){let i=o.f8.clone(r.boundingSphere),t=(0,m.Ax)(i,e.aTransform.ref.value,e.instanceCount.ref.value,0);o.f8.equals(t,e.boundingSphere.ref.value)||a.IQ.update(e.boundingSphere,t),o.f8.equals(i,e.invariantBoundingSphere.ref.value)||(a.IQ.update(e.invariantBoundingSphere,i),a.IQ.update(e.uInvariantBoundingSphere,n.Zb.fromSphere(e.uInvariantBoundingSphere.ref.value,i)))},createRenderableState:function(e){let r=p.iy.createRenderableState(e);return z(r,e),r},updateRenderableState:z,createPositionIterator:k}}(t||(t={}))},27473:(e,r,i)=>{i.d(r,{Gn:()=>u,J9:()=>s,ag:()=>d});var t=i(10596),a=i(92139),n=i(3054),o=i(69174),l=i(66615);function d(){return o.ParamDefinition.Group({color:o.ParamDefinition.Color(a.Q1.fromRgb(76,76,76)),colorStrength:o.ParamDefinition.Numeric(1,{min:0,max:1,step:.01}),substance:n.i.getParam(),substanceStrength:o.ParamDefinition.Numeric(1,{min:0,max:1,step:.01})})}function c(e,r){return a.Q1.toArrayNormalized(e.color,r,0),r[3]=e.colorStrength,r}function f(e,r){return n.i.toArrayNormalized(e.substance,r,0),r[3]=e.substanceStrength,r}function s(e){return{uInteriorColor:l.IQ.create(c(e,(0,t.Z)())),uInteriorSubstance:l.IQ.create(f(e,(0,t.Z)()))}}function u(e,r){l.IQ.update(e.uInteriorColor,c(r,e.uInteriorColor.ref.value)),l.IQ.update(e.uInteriorSubstance,f(r,e.uInteriorSubstance.ref.value))}},30255:(e,r,i)=>{i.d(r,{RV:()=>s,V4:()=>l,Zn:()=>d,xR:()=>o,yi:()=>c});var t=i(66615),a=i(9566),n=i(23155);function o(e,r,i,t){for(let a=r;a<i;++a)e[a]=255*t;return!0}function l(e,r){if(0===r||e.length<r)return 0;let i=0;for(let t=0;t<r;++t)i+=e[t];return i/(255*r)}function d(e,r,i){e.fill(0,r,i)}function c(e,r,i){let o=(0,n.xg)(Math.max(1,e),1,Uint8Array,i&&i.tWiggle.ref.value.array);return i?(t.IQ.update(i.tWiggle,o),t.IQ.update(i.uWiggleTexDim,a.ZY.create(o.width,o.height)),t.IQ.updateIfChanged(i.dWiggle,e>0),t.IQ.updateIfChanged(i.wiggleAverage,l(o.array,e)),t.IQ.updateIfChanged(i.dWiggleType,r),i):{tWiggle:t.IQ.create(o),uWiggleTexDim:t.IQ.create(a.ZY.create(o.width,o.height)),dWiggle:t.IQ.create(e>0),wiggleAverage:t.IQ.create(0),dWiggleType:t.IQ.create(r),uWiggleStrength:t.IQ.create(1)}}let f={array:new Uint8Array(1),width:1,height:1};function s(e){return e?(t.IQ.update(e.tWiggle,f),t.IQ.update(e.uWiggleTexDim,a.ZY.create(1,1)),e):{tWiggle:t.IQ.create(f),uWiggleTexDim:t.IQ.create(a.ZY.create(1,1)),dWiggle:t.IQ.create(!1),wiggleAverage:t.IQ.create(0),dWiggleType:t.IQ.create("groupInstance"),uWiggleStrength:t.IQ.create(1)}}},30286:(e,r,i)=>{i.d(r,{oq:()=>a});var t=i(37897);function a(e,r,i){let t=[];return Object.keys(r).forEach(a=>{let n=r[a];"attribute"===n.type&&(t[t.length]=[a,e.resources.attribute(i[a].ref.value,n.itemSize,n.divisor)])}),t}i(3766),i(99603),(0,t.q)()},40033:(e,r,i)=>{i.d(r,{am:()=>l,gL:()=>n,xN:()=>o});var t=i(20430),a=i(69174);function n(){return a.ParamDefinition.Group({wiggleMode:a.ParamDefinition.Select("position",[["position","Position"],["group","Group"]],{description:"Noise seeding mode. Position: spatially correlated (nearby atoms move together). Group: per-group independent noise."}),wiggleSpeed:a.ParamDefinition.Numeric(7,{min:0,max:10,step:.1},{description:"Speed of vertex wiggle animation."}),wiggleAmplitude:a.ParamDefinition.Numeric(0,{min:0,max:5,step:.01},{description:"Amplitude of vertex wiggle animation."}),wiggleFrequency:a.ParamDefinition.Numeric(.2,{min:.01,max:2,step:.01},{description:"Spatial frequency of vertex wiggle noise (position mode). Lower values correlate nearby atoms more."}),tumbleSpeed:a.ParamDefinition.Numeric(1,{min:0,max:10,step:.1},{description:"Speed of instance tumble animation."}),tumbleAmplitude:a.ParamDefinition.Numeric(0,{min:0,max:10,step:.1},{description:"Amplitude of instance tumble animation. In \xc5ngstr\xf6ms of implied surface displacement."}),tumbleFrequency:a.ParamDefinition.Numeric(.2,{min:0,max:2,step:.01},{description:"Spatial frequency multiplier for tumble noise."})})}function o(e){return{uWiggleSpeed:t.IQ.create(e.wiggleSpeed),uWiggleAmplitude:t.IQ.create(e.wiggleAmplitude),uWiggleFrequency:t.IQ.create(e.wiggleFrequency),uWiggleMode:t.IQ.create(+("position"!==e.wiggleMode)),uTumbleSpeed:t.IQ.create(e.tumbleSpeed),uTumbleAmplitude:t.IQ.create(e.tumbleAmplitude),uTumbleFrequency:t.IQ.create(e.tumbleFrequency)}}function l(e,r){t.IQ.updateIfChanged(e.uWiggleSpeed,r.wiggleSpeed),t.IQ.updateIfChanged(e.uWiggleAmplitude,r.wiggleAmplitude),t.IQ.updateIfChanged(e.uWiggleFrequency,r.wiggleFrequency),t.IQ.updateIfChanged(e.uWiggleMode,+("position"!==r.wiggleMode)),t.IQ.updateIfChanged(e.uTumbleSpeed,r.tumbleSpeed),t.IQ.updateIfChanged(e.uTumbleAmplitude,r.tumbleAmplitude),t.IQ.updateIfChanged(e.uTumbleFrequency,r.tumbleFrequency)}},52786:(e,r,i)=>{i.d(r,{Km:()=>d,Xl:()=>l});var t=i(66615),a=i(9566),n=i(23155);let o=new Uint8Array(772);function l(e,r){if(0===r)return 0;let i=new Uint32Array(e.buffer,0,e.buffer.byteLength>>2),t=r-4>>2,a=4*t,n=0;if(t<0)for(let i=0;i<r;++i)n+=e[i]&&1;else{for(let e=0;e<t;++e){let r=i[e];n+=o[65535&r]+o[r>>16]}for(let i=a;i<r;++i)n+=e[i]&&1}return n/r}function d(e,r,i){if(i){let o=(0,n.xg)(Math.max(1,e),1,Uint8Array,i.tMarker.ref.value.array);return o.array.fill(0,0,e),t.IQ.updateIfChanged(i.uMarker,0),t.IQ.update(i.tMarker,o),t.IQ.update(i.uMarkerTexDim,a.ZY.create(o.width,o.height)),t.IQ.updateIfChanged(i.markerAverage,0),t.IQ.updateIfChanged(i.markerStatus,0),t.IQ.updateIfChanged(i.dMarkerType,r),i}{let i=(0,n.xg)(Math.max(1,e),1,Uint8Array);return{uMarker:t.IQ.create(0),tMarker:t.IQ.create(i),uMarkerTexDim:t.IQ.create(a.ZY.create(i.width,i.height)),markerAverage:t.IQ.create(0),markerStatus:t.IQ.create(0),dMarkerType:t.IQ.create(r)}}}o[1]=1,o[2]=1,o[3]=1,o[256]=1,o[512]=1,o[768]=1,o[257]=2,o[513]=2,o[769]=2,o[258]=2,o[514]=2,o[770]=2,o[259]=2,o[515]=2,o[771]=2,new Uint8Array(1)},57861:(e,r,i)=>{i.d(r,{JS:()=>u,Ns:()=>l,Sj:()=>f,bO:()=>d,dQ:()=>c});var t=i(66615),a=i(9566),n=i(23155),o=i(99603);function l(e,r,i,t){for(let a=r;a<i;++a)e[a]=255*t;return!0}function d(e,r){if(0===r||e.length<r)return 0;let i=0;for(let t=0;t<r;++t)i+=e[t];return i/(255*r)}function c(e,r,i){e.fill(0,r,i)}function f(e,r,i){let l=(0,n.xg)(Math.max(1,e),1,Uint8Array,i&&i.tEmissive.ref.value.array);return i?(t.IQ.update(i.tEmissive,l),t.IQ.update(i.uEmissiveTexDim,a.ZY.create(l.width,l.height)),t.IQ.updateIfChanged(i.dEmissive,e>0),t.IQ.updateIfChanged(i.emissiveAverage,d(l.array,e)),t.IQ.updateIfChanged(i.dEmissiveType,r),i):{tEmissive:t.IQ.create(l),uEmissiveTexDim:t.IQ.create(a.ZY.create(l.width,l.height)),dEmissive:t.IQ.create(e>0),emissiveAverage:t.IQ.create(0),tEmissiveGrid:t.IQ.create((0,o.z6)()),uEmissiveGridDim:t.IQ.create(a.eB.create(1,1,1)),uEmissiveGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dEmissiveType:t.IQ.create(r),uEmissiveStrength:t.IQ.create(1)}}let s={array:new Uint8Array(1),width:1,height:1};function u(e){return e?(t.IQ.update(e.tEmissive,s),t.IQ.update(e.uEmissiveTexDim,a.ZY.create(1,1)),e):{tEmissive:t.IQ.create(s),uEmissiveTexDim:t.IQ.create(a.ZY.create(1,1)),dEmissive:t.IQ.create(!1),emissiveAverage:t.IQ.create(0),tEmissiveGrid:t.IQ.create((0,o.z6)()),uEmissiveGridDim:t.IQ.create(a.eB.create(1,1,1)),uEmissiveGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dEmissiveType:t.IQ.create("groupInstance"),uEmissiveStrength:t.IQ.create(1)}}},66736:(e,r,i)=>{i.d(r,{N:()=>t});let t={Atom:"Atom Property",Chain:"Chain Property",Residue:"Residue Property",Symmetry:"Symmetry",Validation:"Validation",Misc:"Miscellaneous"}},69212:(e,r,i)=>{i.d(r,{C2:()=>c,IB:()=>u,fZ:()=>f,mx:()=>d});var t=i(66615),a=i(9566),n=i(23155),o=i(99603),l=i(3054);function d(e,r,i,t){for(let a=r;a<i;++a)l.i.toArray(t,e,4*a),e[4*a+3]=255;return!0}function c(e,r,i){return e.fill(0,4*r,4*i),!0}function f(e,r,i){let l=(0,n.xg)(Math.max(1,e),4,Uint8Array,i&&i.tSubstance.ref.value.array);return i?(t.IQ.update(i.tSubstance,l),t.IQ.update(i.uSubstanceTexDim,a.ZY.create(l.width,l.height)),t.IQ.updateIfChanged(i.dSubstance,e>0),t.IQ.updateIfChanged(i.dSubstanceType,r),i):{tSubstance:t.IQ.create(l),uSubstanceTexDim:t.IQ.create(a.ZY.create(l.width,l.height)),dSubstance:t.IQ.create(e>0),tSubstanceGrid:t.IQ.create((0,o.z6)()),uSubstanceGridDim:t.IQ.create(a.eB.create(1,1,1)),uSubstanceGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dSubstanceType:t.IQ.create(r),uSubstanceStrength:t.IQ.create(1)}}let s={array:new Uint8Array(4),width:1,height:1};function u(e){return e?(t.IQ.update(e.tSubstance,s),t.IQ.update(e.uSubstanceTexDim,a.ZY.create(1,1)),e):{tSubstance:t.IQ.create(s),uSubstanceTexDim:t.IQ.create(a.ZY.create(1,1)),dSubstance:t.IQ.create(!1),tSubstanceGrid:t.IQ.create((0,o.z6)()),uSubstanceGridDim:t.IQ.create(a.eB.create(1,1,1)),uSubstanceGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dSubstanceType:t.IQ.create("groupInstance"),uSubstanceStrength:t.IQ.create(1)}}},71526:(e,r,i)=>{i.d(r,{Zk:()=>y,l1:()=>v,ES:()=>x,CY:()=>b});var t=i(20430),a=i(9566),n=i(45033),o=i(25392),l=i(13969),d=i(65497),c=i(60654),f=i(12251);let s=d.e.transformMat4Offset,u=d.e.fromArray,m=l.D.add,p=(0,a.U)(),g=(0,a.$I)();function v(e,r,i,o,l,d){let c=function(e,r){for(let i=0;i<r;i++)if(a.U.fromMat4(p,a.$I.fromArray(g,e,16*i)),0>a.U.determinant(p))return!0;return!1}(e,r);if(d){t.IQ.update(d.matrix,d.matrix.ref.value);let i=d.transform.ref.value.length>=16*r?d.transform.ref.value:new Float32Array(16*r);i.set(e),t.IQ.update(d.transform,i),t.IQ.updateIfChanged(d.uInstanceCount,r),t.IQ.updateIfChanged(d.instanceCount,r);let a=d.aTransform.ref.value.length>=16*r?d.aTransform.ref.value:new Float32Array(16*r);t.IQ.update(d.aTransform,a);let o=d.extraTransform.ref.value.length>=16*r?d.extraTransform.ref.value:new Float32Array(16*r);t.IQ.update(d.extraTransform,o),t.IQ.updateIfChanged(d.hasExtraTransform,!1);let l=d.aInstance.ref.value.length>=r?d.aInstance.ref.value:new Float32Array(r);t.IQ.update(d.aInstance,(0,n.WE)(l,r)),t.IQ.update(d.hasReflection,c)}else d={aTransform:t.IQ.create(new Float32Array(16*r)),matrix:t.IQ.create(a.$I.identity()),transform:t.IQ.create(new Float32Array(e)),extraTransform:t.IQ.create(new Float32Array(16*r)),hasExtraTransform:t.IQ.create(!1),uInstanceCount:t.IQ.create(r),instanceCount:t.IQ.create(r),aInstance:t.IQ.create((0,n.WE)(new Float32Array(r))),hasReflection:t.IQ.create(c),instanceGrid:t.IQ.create({cellSize:0,cellCount:0,cellOffsets:new Uint32Array,cellSpheres:new Float32Array,cellTransform:new Float32Array,cellInstance:new Float32Array,batchSize:0,batchCount:0,batchOffsets:new Uint32Array,batchSpheres:new Float32Array,batchCell:new Uint32Array})};return b(d,i,o,l),d}let h=new Float32Array(16);function y(e){return v(new Float32Array(h),1,void 0,0,0,e)}function x(e,r){for(let i=0;i<r;i++)e.set(h,16*i);return e}function b(e,r,i,p){let g=e.aTransform.ref.value,v=e.aInstance.ref.value,h=e.instanceCount.ref.value,y=e.matrix.ref.value,x=e.transform.ref.value,b=e.extraTransform.ref.value,_=e.hasExtraTransform.ref.value,I=a.$I.isIdentity(y);if(!_&&I)for(let e=0,r=16*h;e<r;e++)g[e]=x[e];else if(_||I)if(_&&I)for(let e=0;e<h;e++){let r=16*e;a.$I.mulOffset(g,b,x,r,r,r)}else for(let e=0;e<h;e++){let r=16*e;a.$I.mulOffset(g,b,x,r,r,r),a.$I.mulOffset(g,y,g,r,0,r)}else for(let e=0;e<h;e++){let r=16*e;a.$I.mulOffset(g,y,x,r,0,r)}for(let e=0;e<h;e++)v[e]=e;if(r&&h>0){let a=function(e,r,i){let t=function(e,r){let{instanceCount:i,instance:t,transform:a,invariantBoundingSphere:n}=e,u=new Float32Array(i),p=new Float32Array(i),g=new Float32Array(i),v=o.C.ofBounds(0,i),h=l.D.setEmpty((0,l.D)()),{center:y,radius:x}=n,b=d.e.create(x,x,x),_=(0,d.e)();for(let e=0;e<i;++e)s(_,y,a,0,0,16*e),u[e]=_[0],p[e]=_[1],g[e]=_[2],m(h,_);l.D.expand(h,h,b);let I={box:h,sphere:f.f.fromBox3D((0,f.f)(),h)},{array:C,offset:D,count:T}=(0,c.E)({x:u,y:p,z:g,indices:v},I,d.e.create(r,r,r)).buckets,S=D.length,P=new Uint32Array(S+1),w=new Float32Array(4*S),F=new Float32Array(16*i),k=new Float32Array(i),B=(0,l.D)(),z=(0,f.f)(),O=0;for(let e=0;e<S;++e){let r=D[e],i=T[e];P[e]=r;let n=O;for(let e=r,n=r+i;e<n;++e){let r=C[e];k[O]=t[r];for(let e=0;e<16;++e)F[16*O+e]=a[16*r+e];O+=1}if(1===i)s(w,y,F,4*e,0,16*n),w[4*e+3]=x;else{l.D.setEmpty(B);let r=16*n;for(let e=0;e<i;++e)s(_,y,F,0,0,16*e+r),m(B,_);l.D.expand(B,B,b),f.f.fromBox3D(z,B),f.f.toArray(z,w,4*e)}}return P[S]=D[S-1]+T[S-1],{cellSize:r,cellCount:S,cellOffsets:P,cellSpheres:w,cellTransform:F,cellInstance:k}}(e,r),a=function(e,r){let{cellCount:i,cellSpheres:t}=e,a=new Float32Array(i),n=new Float32Array(i),s=new Float32Array(i),p=o.C.ofBounds(0,i),g=l.D.setEmpty((0,l.D)()),v=(0,d.e)(),h=0;for(let e=0;e<i;++e){let r=4*e;u(v,t,r),a[e]=v[0],n[e]=v[1],s[e]=v[2],m(g,v),h=Math.max(h,t[r+3])}let y=d.e.create(h,h,h);l.D.expand(g,g,y);let x={box:g,sphere:f.f.fromBox3D((0,f.f)(),g)},{array:b,offset:_,count:I}=(0,c.E)({x:a,y:n,z:s,indices:p},x,d.e.create(r,r,r)).buckets,C=_.length,D=new Uint32Array(C+1),T=new Float32Array(4*C),S=new Uint32Array(i),P=(0,l.D)(),w=(0,f.f)(),F=0;for(let e=0;e<C;++e){let r=_[e],i=I[e];D[e]=r;for(let e=r,t=r+i;e<t;++e)S[F]=b[e],F+=1;if(1===i){let i=b[r];T[4*e]=t[4*i],T[4*e+1]=t[4*i+1],T[4*e+2]=t[4*i+2],T[4*e+3]=t[4*i+3]}else{l.D.setEmpty(P),h=0;for(let e=r,a=r+i;e<a;++e){let r=b[e];v[0]=t[4*r],v[1]=t[4*r+1],v[2]=t[4*r+2],m(P,v),h=Math.max(h,t[4*r+3])}d.e.set(y,h,h,h),l.D.expand(P,P,y),f.f.fromBox3D(w,P),f.f.toArray(w,T,4*e)}}return D[C]=_[C-1]+I[C-1],{batchSize:r,batchCount:C,batchOffsets:D,batchSpheres:T,batchCell:S}}(t,i),p=new Uint32Array(t.cellOffsets.length),g=new Float32Array(t.cellSpheres.length),v=new Float32Array(t.cellInstance.length),h=0;for(let r=0,i=a.batchCell.length;r<i;++r){let i=a.batchCell[r],n=t.cellOffsets[i],o=t.cellOffsets[i+1]-n;p[r+1]=p[r]+o;for(let e=0;e<4;++e)g[4*r+e]=t.cellSpheres[4*i+e];for(let r=0;r<o;++r){let i=n+r,a=t.cellInstance[i];for(let r=0;r<16;++r)t.cellTransform[16*h+r]=e.transform[16*a+r];v[h]=a,h+=1}}return{cellSize:t.cellSize,cellCount:t.cellCount,cellOffsets:p,cellSpheres:g,cellTransform:t.cellTransform,cellInstance:v,batchSize:a.batchSize,batchCount:a.batchCount,batchOffsets:a.batchOffsets,batchSpheres:a.batchSpheres,batchCell:(0,n.WE)(a.batchCell)}}({instanceCount:h,instance:v,transform:g,invariantBoundingSphere:r},i,p);t.IQ.update(e.instanceGrid,a),t.IQ.update(e.aInstance,a.cellInstance),t.IQ.update(e.aTransform,a.cellTransform)}else t.IQ.update(e.aInstance,v),t.IQ.update(e.aTransform,g)}a.$I.toArray(a.$I.identity(),h,0)},76346:(e,r,i)=>{i.d(r,{$G:()=>d,EN:()=>f,HB:()=>o,eO:()=>l});var t=i(66615),a=i(9566),n=i(23155);function o(e,r,i,t){return e.fill(t,r,i),!0}function l(e,r,i){e.fill(0,r,i)}function d(e,r,i){let o=(0,n.xg)(Math.max(1,e),1,Uint8Array,i&&i.tClipping.ref.value.array);return i?(t.IQ.update(i.tClipping,o),t.IQ.update(i.uClippingTexDim,a.ZY.create(o.width,o.height)),t.IQ.updateIfChanged(i.dClipping,e>0),t.IQ.updateIfChanged(i.dClippingType,r),i):{tClipping:t.IQ.create(o),uClippingTexDim:t.IQ.create(a.ZY.create(o.width,o.height)),dClipping:t.IQ.create(e>0),dClippingType:t.IQ.create(r)}}let c={array:new Uint8Array(1),width:1,height:1};function f(e){return e?(t.IQ.update(e.tClipping,c),t.IQ.update(e.uClippingTexDim,a.ZY.create(1,1)),t.IQ.updateIfChanged(e.dClipping,!1),e):{tClipping:t.IQ.create(c),uClippingTexDim:t.IQ.create(a.ZY.create(1,1)),dClipping:t.IQ.create(!1),dClippingType:t.IQ.create("groupInstance")}}},76760:(e,r,i)=>{i.d(r,{MD:()=>c,WG:()=>u,qp:()=>d,zj:()=>f});var t=i(66615),a=i(9566),n=i(23155),o=i(45969),l=i(99603);function d(e,r,i,t){for(let a=r;a<i;++a)o.Q1.toArray(t,e,4*a),e[4*a+3]=255;return!0}function c(e,r,i){return e.fill(0,4*r,4*i),!0}function f(e,r,i){let o=(0,n.xg)(Math.max(1,e),4,Uint8Array,i&&i.tOverpaint.ref.value.array);return i?(t.IQ.update(i.tOverpaint,o),t.IQ.update(i.uOverpaintTexDim,a.ZY.create(o.width,o.height)),t.IQ.updateIfChanged(i.dOverpaint,e>0),t.IQ.updateIfChanged(i.dOverpaintType,r),i):{tOverpaint:t.IQ.create(o),uOverpaintTexDim:t.IQ.create(a.ZY.create(o.width,o.height)),dOverpaint:t.IQ.create(e>0),tOverpaintGrid:t.IQ.create((0,l.z6)()),uOverpaintGridDim:t.IQ.create(a.eB.create(1,1,1)),uOverpaintGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dOverpaintType:t.IQ.create(r),uOverpaintStrength:t.IQ.create(1)}}let s={array:new Uint8Array(4),width:1,height:1};function u(e){return e?(t.IQ.update(e.tOverpaint,s),t.IQ.update(e.uOverpaintTexDim,a.ZY.create(1,1)),e):{tOverpaint:t.IQ.create(s),uOverpaintTexDim:t.IQ.create(a.ZY.create(1,1)),dOverpaint:t.IQ.create(!1),tOverpaintGrid:t.IQ.create((0,l.z6)()),uOverpaintGridDim:t.IQ.create(a.eB.create(1,1,1)),uOverpaintGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dOverpaintType:t.IQ.create("groupInstance"),uOverpaintStrength:t.IQ.create(1)}}},88140:(e,r,i)=>{i.d(r,{NG:()=>el});var t=i(37897);i(3766);let a=`
float preFogAlpha = gl_FragColor.a;
if (uFog) {
    float viewZ = depthToViewZ(uIsOrtho, fragmentDepth, uNear, uFar);
    float fogFactor = smoothstep(uFogNear, uFogFar, abs(viewZ));
    float fogAlpha = (1.0 - fogFactor) * gl_FragColor.a;
    if (!uTransparentBackground) {
        if (gl_FragColor.a < 1.0) {
            // transparent objects are blended with background color
            gl_FragColor.a = fogAlpha;
        } else {
            // mix opaque objects with background color
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, fogFactor);
        }
    } else {
        #if defined(dRenderVariant_colorDpoit) && !defined(dGeometryType_directVolume)
            if (gl_FragColor.a < 1.0) {
                // transparent objects are blended with background color
                gl_FragColor.a = fogAlpha;
            } else {
                // opaque objects need to be pre-multiplied alpha
                gl_FragColor.rgb *= fogAlpha;
                gl_FragColor.a = fogAlpha;
            }
        #else
            // pre-multiplied alpha expected for transparent background
            gl_FragColor.rgb *= fogAlpha;
            gl_FragColor.a = fogAlpha;
        #endif
    }
} else if (uTransparentBackground) {
    #if !defined(dRenderVariant_colorDpoit) && !defined(dGeometryType_directVolume)
        // pre-multiplied alpha expected for transparent background
        gl_FragColor.rgb *= gl_FragColor.a;
    #endif
}
`,n=`
if (interior) {
    material.rgb = mix(material.rgb, uInteriorColor.rgb, uInteriorColor.a);

    float isf = clamp(uInteriorSubstance.a, 0.0, 0.99); // clamp to avoid artifacts
    metalness = mix(metalness, uInteriorSubstance.r, isf);
    roughness = mix(roughness, uInteriorSubstance.g, isf);
    bumpiness = mix(bumpiness, uInteriorSubstance.b, isf);

    #ifdef dTransparentBackfaces_opaque
        material.a = 1.0;
    #endif
}
`,o=`
#if defined(dIgnoreLight)
    #ifdef bumpEnabled
        if (uBumpFrequency > 0.0 && uBumpAmplitude > 0.0 && bumpiness > 0.0) {
            material.rgb += fbm(vModelPosition * uBumpFrequency) * uBumpAmplitude * bumpiness;
            material.rgb -= 0.5 * uBumpAmplitude * bumpiness;
        }
    #endif

    #if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        material.rgb += material.rgb * emissive;
    #endif

    gl_FragColor = material;
#else
    #ifdef bumpEnabled
        if (uBumpFrequency > 0.0 && uBumpAmplitude > 0.0 && bumpiness > 0.0) {
            normal = perturbNormal(-vViewPosition, normal, fbm(vModelPosition * uBumpFrequency), (uBumpAmplitude * bumpiness) / uBumpFrequency);
        }
    #endif

    vec4 color = material;

    #if defined(dCelShaded)
        // clamp to avoid artifacts
        metalness = clamp(metalness, 0.0, 0.99);
        roughness = clamp(roughness, 0.05, 1.0);
    #endif

    GeometricContext geometry;
    geometry.position = -vViewPosition;
    geometry.normal = normal;
    geometry.viewDir = normalize(vViewPosition);

    PhysicalMaterial physicalMaterial;
    physicalMaterial.diffuseColor = color.rgb * (1.0 - metalness);
    #ifdef enabledFragDepth
        physicalMaterial.roughness = min(max(roughness, 0.0525), 1.0);
    #else
        vec3 dxy = max(abs(dFdx(normal)), abs(dFdy(normal)));
        float geometryRoughness = max(max(dxy.x, dxy.y), dxy.z);
        physicalMaterial.roughness = min(max(roughness, 0.0525) + geometryRoughness, 1.0);
    #endif
    physicalMaterial.specularColor = mix(vec3(0.04), color.rgb, metalness);
    physicalMaterial.specularF90 = 1.0;

    IncidentLight directLight;

    vec3 outgoingLight = vec3(0.0);

    #if defined(dCelShaded)
        float celDiffuse;
        float celSpecular;
        float celIntensity;

        #pragma unroll_loop_start
        for (int i = 0; i < dLightCount; ++i) {
            directLight.direction = uLightDirection[i];
            directLight.color = uLightColor[i] * PI; // * PI for punctual light

            celDiffuse = RECIPROCAL_PI * max(dot(geometry.normal, directLight.direction), 0.0) * (1.0 - metalness);
            celSpecular = luminance(saturate(dot(geometry.normal, directLight.direction)) * BRDF_GGX(directLight.direction, geometry.viewDir, geometry.normal, physicalMaterial.specularColor, physicalMaterial.specularF90, roughness));

            celIntensity = celDiffuse + celSpecular;
            celIntensity = ceil(celIntensity * uCelSteps) / uCelSteps;

            outgoingLight += color.rgb * directLight.color * celIntensity;
        }
        #pragma unroll_loop_end

        outgoingLight += physicalMaterial.diffuseColor * uAmbientColor;
    #else
        ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));

        #pragma unroll_loop_start
        for (int i = 0; i < dLightCount; ++i) {
            directLight.direction = uLightDirection[i];
            directLight.color = uLightColor[i] * PI; // * PI for punctual light
            RE_Direct_Physical(directLight, geometry, physicalMaterial, reflectedLight);
        }
        #pragma unroll_loop_end

        vec3 irradiance = uAmbientColor * PI; // * PI for punctual light
        RE_IndirectDiffuse_Physical(irradiance, geometry, physicalMaterial, reflectedLight);

        // indirect specular only metals
        vec3 radiance = uAmbientColor * metalness;
        vec3 iblIrradiance = uAmbientColor * metalness;
        vec3 clearcoatRadiance = vec3(0.0);
        RE_IndirectSpecular_Physical(radiance, iblIrradiance, clearcoatRadiance, geometry, physicalMaterial, reflectedLight);

        outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;
    #endif
    outgoingLight = clamp(outgoingLight, 0.01, 0.99); // prevents black artifacts on specular highlight with transparent background

    #if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        outgoingLight += color.rgb * emissive;
    #endif

    gl_FragColor = vec4(outgoingLight, color.a);
#endif

gl_FragColor.rgb *= uExposure;
`,l=`

#if defined(dColorMarker)
    if (marker > 0.0) {
        if ((uMarkerPriority == 1 && marker != 2.0) || (uMarkerPriority != 1 && marker == 1.0)) {
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uHighlightColor, uHighlightStrength);
            gl_FragColor.a = max(gl_FragColor.a, uHighlightStrength * 0.002); // for direct-volume rendering
        } else {
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uSelectColor, uSelectStrength);
            gl_FragColor.a = max(gl_FragColor.a, uSelectStrength * 0.002); // for direct-volume rendering
        }
    } else if (uMarkerAverage > 0.0) {
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uDimColor, uDimStrength);
        gl_FragColor.a = max(gl_FragColor.a, uDimStrength * 0.002); // for direct-volume rendering
    }
#endif
`,d=`
#if dClipObjectCount != 0 && defined(dClipping)
    #if defined(dClippingType_instance)
        vClipping = readFromTexture(tClipping, aInstance, uClippingTexDim).a;
    #elif defined(dMarkerType_groupInstance)
        vClipping = readFromTexture(tClipping, aInstance * float(uGroupCount) + group, uClippingTexDim).a;
    #endif
#endif
`,c=`
#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing) || defined(dRenderVariant_emissive)
    #if defined(dColorType_attribute)
        vColor.rgb = aColor;
    #elif defined(dColorType_instance)
        vColor.rgb = readFromTexture(tColor, aInstance, uColorTexDim).rgb;
    #elif defined(dColorType_group)
        #if defined(dDualColor)
            vec4 color2;
            if (aColorMode == 2.0) {
                vColor.rgb = readFromTexture(tColor, group, uColorTexDim).rgb;
            } else {
                vColor.rgb = readFromTexture(tColor, group * 2.0, uColorTexDim).rgb;
                color2.rgb = readFromTexture(tColor, group * 2.0 + 1.0, uColorTexDim).rgb;
            }
        #else
            vColor.rgb = readFromTexture(tColor, group, uColorTexDim).rgb;
        #endif
    #elif defined(dColorType_groupInstance)
        #if defined(dDualColor)
            vec4 color2;
            if (aColorMode == 2.0) {
                vColor.rgb = readFromTexture(tColor, aInstance * float(uGroupCount) + group, uColorTexDim).rgb;
            } else {
                vColor.rgb = readFromTexture(tColor, (aInstance * float(uGroupCount) + group) * 2.0, uColorTexDim).rgb;
                color2.rgb = readFromTexture(tColor, (aInstance * float(uGroupCount) + group) * 2.0 + 1.0, uColorTexDim).rgb;
            }
        #else
            vColor.rgb = readFromTexture(tColor, aInstance * float(uGroupCount) + group, uColorTexDim).rgb;
        #endif
    #elif defined(dColorType_vertex)
        vColor.rgb = readFromTexture(tColor, vertexId, uColorTexDim).rgb;
    #elif defined(dColorType_vertexInstance)
        vColor.rgb = readFromTexture(tColor, int(aInstance) * uVertexCount + vertexId, uColorTexDim).rgb;
    #elif defined(dColorType_volume)
        vec3 cgridPos = (uColorGridTransform.w * (position - uColorGridTransform.xyz)) / uColorGridDim;
        vColor.rgb = texture3dFrom2dLinear(tColorGrid, cgridPos, uColorGridDim, uColorTexDim).rgb;
    #elif defined(dColorType_volumeInstance)
        vec3 cgridPos = (uColorGridTransform.w * (vModelPosition / uModelScale - uColorGridTransform.xyz)) / uColorGridDim;
        vColor.rgb = texture3dFrom2dLinear(tColorGrid, cgridPos, uColorGridDim, uColorTexDim).rgb;
    #endif

    #ifdef dUsePalette
        vPaletteV = ((vColor.r * 256.0 * 256.0 * 255.0 + vColor.g * 256.0 * 255.0 + vColor.b * 255.0) - 1.0) / PALETTE_SCALE;
    #endif

    #ifdef dOverpaint
        #if defined(dOverpaintType_instance)
            vOverpaint = readFromTexture(tOverpaint, aInstance, uOverpaintTexDim);
        #elif defined(dOverpaintType_groupInstance)
            vOverpaint = readFromTexture(tOverpaint, aInstance * float(uGroupCount) + group, uOverpaintTexDim);
        #elif defined(dOverpaintType_vertexInstance)
            vOverpaint = readFromTexture(tOverpaint, int(aInstance) * uVertexCount + vertexId, uOverpaintTexDim);
        #elif defined(dOverpaintType_volumeInstance)
            vec3 ogridPos = (uOverpaintGridTransform.w * (vModelPosition / uModelScale - uOverpaintGridTransform.xyz)) / uOverpaintGridDim;
            vOverpaint = texture3dFrom2dLinear(tOverpaintGrid, ogridPos, uOverpaintGridDim, uOverpaintTexDim);
        #endif

        // pre-mix to avoid darkening due to empty overpaint
        #ifdef dColorType_uniform
            vOverpaint.rgb = mix(uColor.rgb, vOverpaint.rgb, vOverpaint.a);
        #else
            vOverpaint.rgb = mix(vColor.rgb, vOverpaint.rgb, vOverpaint.a);
        #endif
        vOverpaint *= uOverpaintStrength;
    #endif

    #ifdef dEmissive
        #if defined(dEmissiveType_instance)
            vEmissive = readFromTexture(tEmissive, aInstance, uEmissiveTexDim).a;
        #elif defined(dEmissiveType_groupInstance)
            vEmissive = readFromTexture(tEmissive, aInstance * float(uGroupCount) + group, uEmissiveTexDim).a;
        #elif defined(dEmissiveType_vertexInstance)
            vEmissive = readFromTexture(tEmissive, int(aInstance) * uVertexCount + vertexId, uEmissiveTexDim).a;
        #elif defined(dEmissiveType_volumeInstance)
            vec3 egridPos = (uEmissiveGridTransform.w * (vModelPosition / uModelScale - uEmissiveGridTransform.xyz)) / uEmissiveGridDim;
            vEmissive = texture3dFrom2dLinear(tEmissiveGrid, egridPos, uEmissiveGridDim, uEmissiveTexDim).a;
        #endif
        vEmissive *= uEmissiveStrength;
    #endif

    #ifdef dSubstance
        #if defined(dSubstanceType_instance)
            vSubstance = readFromTexture(tSubstance, aInstance, uSubstanceTexDim);
        #elif defined(dSubstanceType_groupInstance)
            vSubstance = readFromTexture(tSubstance, aInstance * float(uGroupCount) + group, uSubstanceTexDim);
        #elif defined(dSubstanceType_vertexInstance)
            vSubstance = readFromTexture(tSubstance, int(aInstance) * uVertexCount + vertexId, uSubstanceTexDim);
        #elif defined(dSubstanceType_volumeInstance)
            vec3 sgridPos = (uSubstanceGridTransform.w * (vModelPosition / uModelScale - uSubstanceGridTransform.xyz)) / uSubstanceGridDim;
            vSubstance = texture3dFrom2dLinear(tSubstanceGrid, sgridPos, uSubstanceGridDim, uSubstanceTexDim);
        #endif

        // pre-mix to avoid artifacts due to empty substance
        vSubstance.rgb = mix(vec3(uMetalness, uRoughness, uBumpiness), vSubstance.rgb, vSubstance.a);
        vSubstance *= uSubstanceStrength;
    #endif
#elif defined(dRenderVariant_emissive)
    #ifdef dEmissive
        #if defined(dEmissiveType_instance)
            vEmissive = readFromTexture(tEmissive, aInstance, uEmissiveTexDim).a;
        #elif defined(dEmissiveType_groupInstance)
            vEmissive = readFromTexture(tEmissive, aInstance * float(uGroupCount) + group, uEmissiveTexDim).a;
        #elif defined(dEmissiveType_vertexInstance)
            vEmissive = readFromTexture(tEmissive, int(aInstance) * uVertexCount + vertexId, uEmissiveTexDim).a;
        #elif defined(dEmissiveType_volumeInstance)
            vec3 egridPos = (uEmissiveGridTransform.w * (vModelPosition / uModelScale - uEmissiveGridTransform.xyz)) / uEmissiveGridDim;
            vEmissive = texture3dFrom2dLinear(tEmissiveGrid, egridPos, uEmissiveGridDim, uEmissiveTexDim).a;
        #endif
        vEmissive *= uEmissiveStrength;
    #endif
#elif defined(dRenderVariant_pick)
    #ifdef requiredDrawBuffers
        vObject = vec4(packIntToRGB(float(uObjectId)), 1.0);
        vInstance = vec4(packIntToRGB(aInstance), 1.0);
        vGroup = vec4(packIntToRGB(group), 1.0);
    #else
        if (uPickType == 1) {
            vColor = vec4(packIntToRGB(float(uObjectId)), 1.0);
        } else if (uPickType == 2) {
            vColor = vec4(packIntToRGB(aInstance), 1.0);
        } else {
            vColor = vec4(packIntToRGB(group), 1.0);
        }
    #endif
#endif

#ifdef dTransparency
    #if defined(dTransparencyType_instance)
        vTransparency = readFromTexture(tTransparency, aInstance, uTransparencyTexDim).a;
    #elif defined(dTransparencyType_groupInstance)
        vTransparency = readFromTexture(tTransparency, aInstance * float(uGroupCount) + group, uTransparencyTexDim).a;
    #elif defined(dTransparencyType_vertexInstance)
        vTransparency = readFromTexture(tTransparency, int(aInstance) * uVertexCount + vertexId, uTransparencyTexDim).a;
    #elif defined(dTransparencyType_volumeInstance)
        vec3 tgridPos = (uTransparencyGridTransform.w * (vModelPosition / uModelScale - uTransparencyGridTransform.xyz)) / uTransparencyGridDim;
        vTransparency = texture3dFrom2dLinear(tTransparencyGrid, tgridPos, uTransparencyGridDim, uTransparencyTexDim).a;
    #endif
    vTransparency *= uTransparencyStrength;
#endif
`,f=`
#ifdef dGeometryType_textureMesh
    float group = unpackRGBToInt(readFromTexture(tGroup, vertexId, uGeoTexDim).rgb);
#else
    float group = aGroup;
#endif
`,s=`
#if defined(dNeedsMarker)
    #if defined(dMarkerType_instance)
        vMarker = readFromTexture(tMarker, aInstance, uMarkerTexDim).a;
    #elif defined(dMarkerType_groupInstance)
        vMarker = readFromTexture(tMarker, aInstance * float(uGroupCount) + group, uMarkerTexDim).a;
    #endif
#endif
`,u=`
#if defined(dNeedsMarker)
    float marker = uMarker;
    if (uMarker == -1.0) {
        marker = floor(vMarker * 255.0 + 0.5); // rounding required to work on some cards on win
    }
#endif

// optional per-fragment opacity multiplier; defaults to 1.0
#ifndef dHasMaterialOpacity
    float materialOpacity = 1.0;
#endif

#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
    #if defined(dUsePalette)
        vec4 material = vec4(texture2D(tPalette, vec2(vPaletteV, 0.5)).rgb, uAlpha);
    #elif defined(dColorType_uniform)
        vec4 material = vec4(uColor, uAlpha);
    #elif defined(dColorType_varying)
        vec4 material = vec4(vColor.rgb, uAlpha);
    #endif

    // mix material with overpaint
    #if defined(dOverpaint)
        material.rgb = mix(material.rgb, vOverpaint.rgb, vOverpaint.a);
    #endif

    float emissive = uEmissive;
    #ifdef dEmissive
        emissive += vEmissive;
    #endif

    float metalness = uMetalness;
    float roughness = uRoughness;
    float bumpiness = uBumpiness;
    #ifdef dSubstance
        float sf = clamp(vSubstance.a, 0.0, 0.99); // clamp to avoid artifacts
        metalness = mix(metalness, vSubstance.r, sf);
        roughness = mix(roughness, vSubstance.g, sf);
        bumpiness = mix(bumpiness, vSubstance.b, sf);
    #endif

    #if defined(dXrayShaded)
        material.a = calcXrayShadedAlpha(material.a, normal);
    #endif
#elif defined(dRenderVariant_depth)
    if (fragmentDepth > getDepth(gl_FragCoord.xy / uDrawingBufferSize)) {
        discard;
    }
    vec4 material;
    if (uRenderMask == MaskOpaque) {
        #if defined(dXrayShaded)
            discard;
        #endif
        #if defined(dTransparency)
            float dta = 1.0 - vTransparency;
            #if __VERSION__ == 100 || defined(dVaryingGroup)
                if (vTransparency < 0.1) dta = 1.0; // hard cutoff to avoid artifacts
            #endif

            if (uAlpha * materialOpacity * dta < 1.0) {
                discard;
            }
        #else
            if (uAlpha * materialOpacity < 1.0) {
                discard;
            }
        #endif
        material = packDepthToRGBA(fragmentDepth);
    } else if (uRenderMask == MaskTransparent) {
        float alpha = uAlpha * materialOpacity;
        #if defined(dTransparency)
            float dta = 1.0 - vTransparency;
            alpha *= dta;
        #endif

        #ifdef dXrayShaded
            alpha = calcXrayShadedAlpha(alpha, normal);
        #else
            if (alpha == 1.0) {
                discard;
            }
        #endif
        material = packDepthWithAlphaToRGBA(fragmentDepth, alpha);
    }
#elif defined(dRenderVariant_marking)
    vec4 material;
    if(uMarkingType == 1) {
        if (marker > 0.0)
            discard;
        #ifdef enabledFragDepth
            material = packDepthToRGBA(gl_FragDepthEXT);
        #else
            material = packDepthToRGBA(gl_FragCoord.z);
        #endif
    } else {
        if (marker == 0.0)
            discard;
        float depthTest = 1.0;
        if (uMarkingDepthTest) {
            depthTest = (fragmentDepth >= getDepthPacked(gl_FragCoord.xy / uDrawingBufferSize)) ? 1.0 : 0.0;
        }
        bool isHighlight = intMod(marker, 2.0) > 0.1;
        float viewZ = depthToViewZ(uIsOrtho, fragmentDepth, uNear, uFar);
        float fogFactor = smoothstep(uFogNear, uFogFar, abs(viewZ));
        if (fogFactor == 1.0)
            discard;
        material = vec4(0.0, depthTest, isHighlight ? 1.0 : 0.0, 1.0 - fogFactor);
    }
#elif defined(dRenderVariant_emissive)
    float emissive = uEmissive;
    #ifdef dEmissive
        emissive += vEmissive;
    #endif
    float emissiveAlpha = uAlpha;
    #if defined(dXrayShaded)
        emissiveAlpha = calcXrayShadedAlpha(emissiveAlpha, normal);
    #endif
    // fade emissive bloom with fog so the glow dims into the background like the geometry
    if (uFog) {
        float viewZ = depthToViewZ(uIsOrtho, fragmentDepth, uNear, uFar);
        emissiveAlpha *= 1.0 - smoothstep(uFogNear, uFogFar, abs(viewZ));
    }
    // dim emitters behind a transparent blocker by its coverage (tDepth packs front depth+alpha)
    vec2 emissiveBlocker = unpackRGBAToDepthWithAlpha(texture2D(tDepth, gl_FragCoord.xy / uDrawingBufferSize));
    if (fragmentDepth > emissiveBlocker.x + 0.0001) {
        emissiveAlpha *= 1.0 - emissiveBlocker.y;
    }
    // glow with the object's own color so emissive isn't double-counted via the lit buffer
    #if defined(dUsePalette)
        vec3 emissiveColor = texture2D(tPalette, vec2(vPaletteV, 0.5)).rgb;
    #elif defined(dColorType_uniform)
        vec3 emissiveColor = uColor;
    #elif defined(dColorType_varying)
        vec3 emissiveColor = vColor.rgb;
    #else
        vec3 emissiveColor = vec3(1.0);
    #endif
    #ifdef dOverpaint
        emissiveColor = mix(emissiveColor, vOverpaint.rgb, vOverpaint.a);
    #endif
    float e = emissive * emissiveAlpha;
    vec4 material = vec4(emissiveColor * e, e);
#endif

// apply per-group transparency
#if defined(dTransparency) && (defined(dRenderVariant_pick) || defined(dRenderVariant_color) || defined(dRenderVariant_emissive) || defined(dRenderVariant_tracing))
    float ta = 1.0 - vTransparency;
    if (vTransparency < 0.09) ta = 1.0; // hard cutoff looks better

    #if defined(dRenderVariant_pick)
        if (ta * uAlpha < uPickingAlphaThreshold)
            discard; // ignore so the element below can be picked
    #elif defined(dRenderVariant_emissive)
        material *= ta;
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        material.a *= ta;
    #endif
#endif
`,m=`
#ifdef dGeometryType_image
    mat4 transform = aTransform;
#else
    mat4 transform = applyTumble(aTransform, aInstance, float(uObjectId));
#endif
mat4 model = uModel * transform;
mat4 modelView = uView * model;
#ifdef dGeometryType_textureMesh
    vec3 position = readFromTexture(tPosition, vertexId, uGeoTexDim).xyz;
#else
    vec3 position = aPosition;
#endif
#ifndef dGeometryType_image
    position = applyWiggle(position, group, aInstance);
#endif
vec4 position4 = vec4(position, 1.0);
// for accessing tColorGrid in vert shader and for clipping in frag shader
vModelPosition = (model * position4).xyz;
vec4 mvPosition = modelView * position4;
vViewPosition = mvPosition.xyz;
gl_Position = uProjection * mvPosition;
`,p=`
#if defined(dSizeType_uniform)
    float size = uSize;
#elif defined(dSizeType_attribute)
    float size = aSize;
#elif defined(dSizeType_instance)
    float size = unpackRGBToInt(readFromTexture(tSize, aInstance, uSizeTexDim).rgb);
#elif defined(dSizeType_group)
    float size = unpackRGBToInt(readFromTexture(tSize, group, uSizeTexDim).rgb);
#elif defined(dSizeType_groupInstance)
    float size = unpackRGBToInt(readFromTexture(tSize, aInstance * float(uGroupCount) + group, uSizeTexDim).rgb);
#elif defined(dSizeType_vertex)
    float size = unpackRGBToInt(readFromTexture(tSize, vertexId, uSizeTexDim).rgb);
#elif defined(dSizeType_vertexInstance)
    float size = unpackRGBToInt(readFromTexture(tSize, int(aInstance) * uVertexCount + vertexId, uSizeTexDim).rgb);
#endif

#if defined(dSizeType_instance) || defined(dSizeType_group) || defined(dSizeType_groupInstance) || defined(dSizeType_vertex) || defined(dSizeType_vertexInstance)
    size /= 100.0; // NOTE factor also set in TypeScript
#endif

size *= uSizeFactor;
`,g=`
float viewZ = depthToViewZ(uIsOrtho, fragmentDepth, uNear, uFar);
float fogFactor = smoothstep(uFogNear, uFogFar, abs(viewZ));
float fogAlpha = (1.0 - fogFactor) * uAlpha;
float alpha = uAlpha;
#ifdef dXrayShaded
    // add bias to make picking xray shaded elements easier
    alpha = calcXrayShadedAlpha(alpha, normal) + (0.3 * uPickingAlphaThreshold);
#endif
// if not opaque enough ignore so the element below can be picked
if (alpha < uPickingAlphaThreshold || fogAlpha < 0.1) {
    #ifdef dTransparentBackfaces_opaque
        if (!interior) discard;
    #else
        discard;
    #endif
}
`,v=`
#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
    #if defined(dTransparentBackfaces_off)
        if (interior && material.a < 1.0) discard;
    #elif defined(dTransparentBackfaces_opaque)
        if (interior) material.a = 1.0;
    #endif

    #if !defined(dXrayShaded)
        if ((uRenderMask == MaskOpaque && material.a < 1.0) ||
            (uRenderMask == MaskTransparent && material.a == 1.0)
        ) {
            discard;
        }
    #endif
#endif

#if defined(dRenderVariant_depth)
    #if defined(dTransparentBackfaces_off)
        if (interior) discard;
    #endif
#endif
`,h=`
#if defined(dClipVariant_instance) && dClipObjectCount != 0
    vec3 mCenter = (uModel * aTransform * vec4(uInvariantBoundingSphere.xyz, 1.0)).xyz;
    if (clipTest(mCenter / uModelScale)) {
        // move out of [ -w, +w ] to 'discard' in vert shader
        gl_Position.z = 2.0 * gl_Position.w;
    }
#endif
`,y=`
#if defined(dClipVariant_pixel) && dClipObjectCount != 0
    if (clipTest(vModelPosition / uModelScale))
        discard;
#endif
`,x=`
uniform float uMetalness;
uniform float uRoughness;
uniform float uBumpiness;
#ifdef bumpEnabled
    uniform float uBumpFrequency;
    uniform float uBumpAmplitude;
#endif
uniform float uEmissive;

// Density value to estimate object thickness
uniform float uDensity;

#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing) || defined(dRenderVariant_emissive)
    #if defined(dColorType_uniform)
        uniform vec3 uColor;
    #elif defined(dColorType_varying)
        varying vec4 vColor;
    #endif

    #ifdef dUsePalette
        uniform sampler2D tPalette;
        varying float vPaletteV;
    #endif

    #ifdef dOverpaint
        varying vec4 vOverpaint;
    #endif

    #ifdef dEmissive
        varying float vEmissive;
    #endif

    #ifdef dSubstance
        varying vec4 vSubstance;
    #endif
#elif defined(dRenderVariant_emissive)
    #ifdef dEmissive
        varying float vEmissive;
    #endif
#elif defined(dRenderVariant_pick)
    #if __VERSION__ == 100 || !defined(dVaryingGroup)
        #ifdef requiredDrawBuffers
            varying vec4 vObject;
            varying vec4 vInstance;
            varying vec4 vGroup;
        #else
            varying vec4 vColor;
        #endif
    #else
        #ifdef requiredDrawBuffers
            flat in vec4 vObject;
            flat in vec4 vInstance;
            flat in vec4 vGroup;
        #else
            flat in vec4 vColor;
        #endif
    #endif
#endif

#ifdef dTransparency
    varying float vTransparency;
#endif
`,b=`
uniform float uMetalness;
uniform float uRoughness;
uniform float uBumpiness;

#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing) || defined(dRenderVariant_emissive)
    #if defined(dColorType_uniform)
        uniform vec3 uColor;
    #elif defined(dColorType_attribute)
        varying vec4 vColor;
        attribute vec3 aColor;
    #elif defined(dColorType_texture)
        varying vec4 vColor;
        uniform vec2 uColorTexDim;
        uniform sampler2D tColor;
    #elif defined(dColorType_grid)
        varying vec4 vColor;
        uniform vec2 uColorTexDim;
        uniform vec3 uColorGridDim;
        uniform vec4 uColorGridTransform;
        uniform sampler2D tColorGrid;
    #elif defined(dColorType_direct)
        varying vec4 vColor;
    #endif

    #ifdef dUsePalette
        varying float vPaletteV;
    #endif

    #ifdef dOverpaint
        #if defined(dOverpaintType_instance) || defined(dOverpaintType_groupInstance) || defined(dOverpaintType_vertexInstance)
            varying vec4 vOverpaint;
            uniform vec2 uOverpaintTexDim;
            uniform sampler2D tOverpaint;
        #elif defined(dOverpaintType_volumeInstance)
            varying vec4 vOverpaint;
            uniform vec2 uOverpaintTexDim;
            uniform vec3 uOverpaintGridDim;
            uniform vec4 uOverpaintGridTransform;
            uniform sampler2D tOverpaintGrid;
        #endif
        uniform float uOverpaintStrength;
    #endif

    #ifdef dEmissive
        #if defined(dEmissiveType_instance) || defined(dEmissiveType_groupInstance) || defined(dEmissiveType_vertexInstance)
            varying float vEmissive;
            uniform vec2 uEmissiveTexDim;
            uniform sampler2D tEmissive;
        #elif defined(dEmissiveType_volumeInstance)
            varying float vEmissive;
            uniform vec2 uEmissiveTexDim;
            uniform vec3 uEmissiveGridDim;
            uniform vec4 uEmissiveGridTransform;
            uniform sampler2D tEmissiveGrid;
        #endif
        uniform float uEmissiveStrength;
    #endif

    #ifdef dSubstance
        #if defined(dSubstanceType_instance) || defined(dSubstanceType_groupInstance) || defined(dSubstanceType_vertexInstance)
            varying vec4 vSubstance;
            uniform vec2 uSubstanceTexDim;
            uniform sampler2D tSubstance;
        #elif defined(dSubstanceType_volumeInstance)
            varying vec4 vSubstance;
            uniform vec2 uSubstanceTexDim;
            uniform vec3 uSubstanceGridDim;
            uniform vec4 uSubstanceGridTransform;
            uniform sampler2D tSubstanceGrid;
        #endif
        uniform float uSubstanceStrength;
    #endif
#elif defined(dRenderVariant_emissive)
    #ifdef dEmissive
        #if defined(dEmissiveType_instance) || defined(dEmissiveType_groupInstance) || defined(dEmissiveType_vertexInstance)
            varying float vEmissive;
            uniform vec2 uEmissiveTexDim;
            uniform sampler2D tEmissive;
        #elif defined(dEmissiveType_volumeInstance)
            varying float vEmissive;
            uniform vec2 uEmissiveTexDim;
            uniform vec3 uEmissiveGridDim;
            uniform vec4 uEmissiveGridTransform;
            uniform sampler2D tEmissiveGrid;
        #endif
        uniform float uEmissiveStrength;
    #endif
#elif defined(dRenderVariant_pick)
    #if __VERSION__ == 100 || !defined(dVaryingGroup)
        #ifdef requiredDrawBuffers
            varying vec4 vObject;
            varying vec4 vInstance;
            varying vec4 vGroup;
        #else
            varying vec4 vColor;
        #endif
    #else
        #ifdef requiredDrawBuffers
            flat out vec4 vObject;
            flat out vec4 vInstance;
            flat out vec4 vGroup;
        #else
            flat out vec4 vColor;
        #endif
    #endif
#endif

#ifdef dTransparency
    #if defined(dTransparencyType_instance) || defined(dTransparencyType_groupInstance) || defined(dTransparencyType_vertexInstance)
        varying float vTransparency;
        uniform vec2 uTransparencyTexDim;
        uniform sampler2D tTransparency;
    #elif defined(dTransparencyType_volumeInstance)
        varying float vTransparency;
        uniform vec2 uTransparencyTexDim;
        uniform vec3 uTransparencyGridDim;
        uniform vec4 uTransparencyGridTransform;
        uniform sampler2D tTransparencyGrid;
    #endif
    uniform float uTransparencyStrength;
#endif
`,_=`
uniform float uWiggleSpeed;
uniform float uWiggleAmplitude;
uniform float uWiggleFrequency;
uniform int uWiggleMode;
uniform float uTumbleSpeed;
uniform float uTumbleAmplitude;
uniform float uTumbleFrequency;

#ifdef dWiggle
    uniform vec2 uWiggleTexDim;
    uniform sampler2D tWiggle;
    uniform float uWiggleStrength;
#endif

vec3 applyWiggle(vec3 pos, float groupId, float instanceId) {
    if (!uEnableAnimation) return pos;
    float amplitude = uWiggleAmplitude;
    #ifdef dWiggle
        #if defined(dWiggleType_instance)
            amplitude += readFromTexture(tWiggle, instanceId, uWiggleTexDim).a * uWiggleStrength;
        #elif defined(dWiggleType_groupInstance)
            amplitude += readFromTexture(tWiggle, instanceId * float(uGroupCount) + groupId, uWiggleTexDim).a * uWiggleStrength;
        #endif
    #endif
    if (amplitude > 0.0 && uWiggleSpeed > 0.0 && uWiggleFrequency > 0.0) {
        float t = uTime * uWiggleSpeed;
        vec3 s;
        if (uWiggleMode == 0) {
            // Position mode: spatial position correlates nearby atoms
            s = pos;
        } else {
            // Group mode: per-group independent noise
            // Hash groupId into a well-distributed 3D seed to avoid repetition
            s = vec3(
                fract(sin(groupId * 127.1) * 43758.5453) * 1000.0,
                fract(sin(groupId * 269.5) * 21639.7182) * 1000.0,
                fract(sin(groupId * 419.2) * 32517.3926) * 1000.0
            );
        }
        s *= uWiggleFrequency;
        pos.x += (fbm(vec3(s.x, s.y + t, s.z)) / 0.4375 - 1.0) * amplitude;
        pos.y += (fbm(vec3(s.x + 37.0, s.y, s.z + t)) / 0.4375 - 1.0) * amplitude;
        pos.z += (fbm(vec3(s.x + t, s.y + 73.0, s.z)) / 0.4375 - 1.0) * amplitude;
    }
    return pos;
}

mat4 applyTumble(mat4 transform, float instanceIndex, float objectId) {
    if (!uEnableAnimation) return transform;
    if (uTumbleAmplitude > 0.0 && uTumbleSpeed > 0.0 && uTumbleFrequency > 0.0) {
        // Scale amplitude inversely with bounding-sphere radius (Stokes-Einstein: D ~ 1/r)
        float amplitude = uTumbleAmplitude / max(uInvariantBoundingSphere.w, 1.0);
        float t = uTime * uTumbleSpeed;
        float seed = (instanceIndex * 127.1 + objectId * 311.7) * uTumbleFrequency;

        // Per-instance rotation angles from layered noise (Brownian-like)
        float angleX = (fbm(vec3(seed, t, 0.0)) / 0.4375 - 1.0) * amplitude;
        float angleY = (fbm(vec3(seed, 0.0, t)) / 0.4375 - 1.0) * amplitude;
        float angleZ = (fbm(vec3(0.0, seed, t)) / 0.4375 - 1.0) * amplitude;

        float cx = cos(angleX); float sx = sin(angleX);
        float cy = cos(angleY); float sy = sin(angleY);
        float cz = cos(angleZ); float sz = sin(angleZ);

        // Combined rotation matrix (Rz * Ry * Rx)
        mat3 rot = mat3(
            cy * cz, cx * sz + sx * sy * cz, sx * sz - cx * sy * cz,
            -cy * sz, cx * cz - sx * sy * sz, sx * cz + cx * sy * sz,
            sy, -sx * cy, cx * cy
        );

        // Per-instance translation offset from layered noise (Brownian-like)
        vec3 offset = vec3(
            (fbm(vec3(seed + 31.7, t, 0.0)) / 0.4375 - 1.0),
            (fbm(vec3(seed + 31.7, 0.0, t)) / 0.4375 - 1.0),
            (fbm(vec3(0.0, seed + 31.7, t)) / 0.4375 - 1.0)
        ) * amplitude;

        // Bounding-sphere center transformed by the linear part only (no translation)
        vec3 localCenter = mat3(transform) * uInvariantBoundingSphere.xyz;

        // Rotate basis vectors
        mat4 result = transform;
        result[0].xyz = rot * transform[0].xyz;
        result[1].xyz = rot * transform[1].xyz;
        result[2].xyz = rot * transform[2].xyz;

        // Adjust translation so rotation pivots around the transformed center
        result[3].xyz = transform[3].xyz + localCenter - rot * localCenter + offset;

        return result;
    }
    return transform;
}
`,I=`
vec3 quaternionTransform(const in vec4 q, const in vec3 v) {
    vec3 t = 2.0 * cross(q.xyz, v);
    return v + q.w * t + cross(q.xyz, t);
}

vec4 computePlane(const in vec3 normal, const in vec3 inPoint) {
    return vec4(normalize(normal), -dot(normal, inPoint));
}

float planeSD(const in vec4 plane, const in vec3 center) {
    return -dot(plane.xyz, center - plane.xyz * -plane.w);
}

float sphereSD(const in vec3 position, const in vec4 rotation, const in vec3 size, const in vec3 center) {
    return (
        length(quaternionTransform(vec4(-rotation.x, -rotation.y, -rotation.z, rotation.w), center - position) / size) - 1.0
    ) * min(min(size.x, size.y), size.z);
}

float cubeSD(const in vec3 position, const in vec4 rotation, const in vec3 size, const in vec3 center) {
    vec3 d = abs(quaternionTransform(vec4(-rotation.x, -rotation.y, -rotation.z, rotation.w), center - position)) - size;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float cylinderSD(const in vec3 position, const in vec4 rotation, const in vec3 size, const in vec3 center) {
    vec3 t = quaternionTransform(vec4(-rotation.x, -rotation.y, -rotation.z, rotation.w), center - position);

    vec2 d = abs(vec2(length(t.xz), t.y)) - size.xy;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float infiniteConeSD(const in vec3 position, const in vec4 rotation, const in vec3 size, const in vec3 center) {
    vec3 t = quaternionTransform(vec4(-rotation.x, -rotation.y, -rotation.z, rotation.w), center - position);

    float q = length(t.xy);
    return dot(size.xy, vec2(q, t.z));
}

float getSignedDistance(const in vec3 center, const in int type, const in vec3 position, const in vec4 rotation, const in vec3 scale, const in mat4 transform) {
    vec3 c = (transform * vec4(center, 1.0)).xyz;
    if (type == 1) {
        vec3 normal = quaternionTransform(rotation, vec3(0.0, 1.0, 0.0));
        vec4 plane = computePlane(normal, position);
        return planeSD(plane, c);
    } else if (type == 2) {
        return sphereSD(position, rotation, scale * 0.5, c);
    } else if (type == 3) {
        return cubeSD(position, rotation, scale * 0.5, c);
    } else if (type == 4) {
        return cylinderSD(position, rotation, scale * 0.5, c);
    } else if (type == 5) {
        return infiniteConeSD(position, rotation, scale * 0.5, c);
    } else {
        return 0.1;
    }
}

#if __VERSION__ == 100
    // 8-bit
    int bitwiseAnd(in int a, in int b) {
        int d = 128;
        int result = 0;
        for (int i = 0; i < 8; ++i) {
            if (d <= 0) break;
            if (a >= d && b >= d) result += d;
            if (a >= d) a -= d;
            if (b >= d) b -= d;
            d /= 2;
        }
        return result;
    }

    bool hasBit(const in int mask, const in int bit) {
        return bitwiseAnd(mask, bit) == 0;
    }
#else
    bool hasBit(const in int mask, const in int bit) {
        return (mask & bit) == 0;
    }
#endif

#if dClipObjectCount != 0
    bool clipTest(const in vec3 center) {
        // flag is a bit-flag for clip-objects to ignore (note, object ids start at 1 not 0)
        #if defined(dClipping)
            int flag = int(floor(vClipping * 255.0 + 0.5));
        #else
            int flag = 0;
        #endif

        #pragma unroll_loop_start
        for (int i = 0; i < dClipObjectCount; ++i) {
            if (flag == 0 || hasBit(flag, UNROLLED_LOOP_INDEX + 1)) {
                bool test = getSignedDistance(center, uClipObjectType[i], uClipObjectPosition[i], uClipObjectRotation[i], uClipObjectScale[i], uClipObjectTransform[i]) <= 0.0;
                if ((!uClipObjectInvert[i] && test) || (uClipObjectInvert[i] && !test)) {
                    return true;
                }
            }
        }
        #pragma unroll_loop_end
        return false;
    }
#endif
`,C=`
uniform int uObjectId;
uniform int uInstanceCount;
uniform int uGroupCount;

uniform int uPickType;
uniform int uMarkingType;

uniform vec4 uCameraPlane;
uniform vec4 uLod;

#if dClipObjectCount != 0
    uniform int uClipObjectType[dClipObjectCount];
    uniform bool uClipObjectInvert[dClipObjectCount];
    uniform vec3 uClipObjectPosition[dClipObjectCount];
    uniform vec4 uClipObjectRotation[dClipObjectCount];
    uniform vec3 uClipObjectScale[dClipObjectCount];
    uniform mat4 uClipObjectTransform[dClipObjectCount];

    #if defined(dClipping)
        #if __VERSION__ == 100 || defined(dClippingType_instance) || !defined(dVaryingGroup)
            varying float vClipping;
        #else
            flat in float vClipping;
        #endif
    #endif
#endif

#if defined(dColorMarker)
    uniform vec3 uHighlightColor;
    uniform vec3 uSelectColor;
    uniform vec3 uDimColor;
    uniform float uHighlightStrength;
    uniform float uSelectStrength;
    uniform float uDimStrength;
    uniform int uMarkerPriority;
    uniform float uMarkerAverage;
#endif

#if defined(dNeedsMarker)
    uniform float uMarker;
    #if __VERSION__ == 100 || defined(dMarkerType_instance) || !defined(dVaryingGroup)
        varying float vMarker;
    #else
        flat in float vMarker;
    #endif
#endif

#if defined(dRenderVariant_colorDpoit)
    #define MAX_DPOIT_DEPTH 99999.0 // NOTE constant also set in TypeScript
    uniform sampler2D tDpoitDepth;
    uniform sampler2D tDpoitFrontColor;
#endif

varying vec3 vModelPosition;
varying vec3 vViewPosition;

uniform vec2 uViewOffset;
uniform float uModelScale;

uniform float uNear;
uniform float uFar;
uniform float uIsOrtho;

uniform bool uFog;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;

uniform float uAlpha;
uniform float uPickingAlphaThreshold;
uniform bool uTransparentBackground;

uniform bool uDoubleSided;
bool interior;

uniform float uXrayEdgeFalloff;
uniform float uCelSteps;
uniform float uExposure;

uniform mat4 uProjection;

uniform int uRenderMask;
uniform bool uMarkingDepthTest;

uniform sampler2D tDepth;
uniform vec2 uDrawingBufferSize;

float getDepthPacked(const in vec2 coords) {
    return unpackRGBAToDepth(texture2D(tDepth, coords));
}

float getDepth(const in vec2 coords) {
    #ifdef depthTextureSupport
        return texture2D(tDepth, coords).r;
    #else
        return unpackRGBAToDepth(texture2D(tDepth, coords));
    #endif
}

float calcDepth(const in vec3 pos) {
    vec2 clipZW = pos.z * uProjection[2].zw + uProjection[3].zw;
    return 0.5 + 0.5 * clipZW.x / clipZW.y;
}

// "Bump Mapping Unparametrized Surfaces on the GPU" Morten S. Mikkelsen
// https://mmikk.github.io/papers3d/mm_sfgrad_bump.pdf
vec3 perturbNormal(in vec3 position, in vec3 normal, in float height, in float scale) {
    vec3 sigmaS = dFdx(position);
    vec3 sigmaT = dFdy(position);

    vec3 r1 = cross(sigmaT, normal);
    vec3 r2 = cross(normal, sigmaS);
    float det = dot(sigmaS, r1);
    if (det == 0.0) return normal;

    float bs = dFdx(height);
    float bt = dFdy(height);

    vec3 surfGrad = sign(det) * (bs * r1 + bt * r2);
    return normalize(abs(det) * normal - scale * surfGrad);
}

#ifdef dXrayShaded
    float calcXrayShadedAlpha(in float alpha, const in vec3 normal) {
        #if defined(dXrayShaded_on)
            alpha *= 1.0 - pow(abs(dot(normal, vec3(0.0, 0.0, 1.0))), uXrayEdgeFalloff);
        #elif defined(dXrayShaded_inverted)
            alpha *= pow(abs(dot(normal, vec3(0.0, 0.0, 1.0))), uXrayEdgeFalloff);
        #endif
        return clamp(alpha, 0.001, 0.999);
    }
#endif
`,D=`
uniform mat4 uProjection, uModel, uView;
uniform vec3 uCameraPosition;
uniform vec4 uCameraPlane;

uniform int uObjectId;
uniform int uVertexCount;
uniform int uInstanceCount;
uniform int uGroupCount;
uniform vec4 uInvariantBoundingSphere;
uniform vec4 uLod;

uniform bool uDoubleSided;
uniform int uPickType;
uniform float uTime;
uniform bool uEnableAnimation;

#if dClipObjectCount != 0
    uniform int uClipObjectType[dClipObjectCount];
    uniform bool uClipObjectInvert[dClipObjectCount];
    uniform vec3 uClipObjectPosition[dClipObjectCount];
    uniform vec4 uClipObjectRotation[dClipObjectCount];
    uniform vec3 uClipObjectScale[dClipObjectCount];
    uniform mat4 uClipObjectTransform[dClipObjectCount];

    #if defined(dClipping)
        uniform vec2 uClippingTexDim;
        uniform sampler2D tClipping;
        #if __VERSION__ == 100 || defined(dClippingType_instance) || !defined(dVaryingGroup)
            varying float vClipping;
        #else
            flat out float vClipping;
        #endif
    #endif
#endif

#if defined(dNeedsMarker)
    uniform float uMarker;
    uniform vec2 uMarkerTexDim;
    uniform sampler2D tMarker;
    #if __VERSION__ == 100 || defined(dMarkerType_instance) || !defined(dVaryingGroup)
        varying float vMarker;
    #else
        flat out float vMarker;
    #endif
#endif

varying vec3 vModelPosition;
varying vec3 vViewPosition;

uniform float uModelScale;

#if defined(noNonInstancedActiveAttribs)
    // int() is needed for some Safari versions
    // see https://bugs.webkit.org/show_bug.cgi?id=244152
    #define VertexID int(gl_VertexID)
#else
    attribute float aVertex;
    #define VertexID int(aVertex)
#endif

#if defined(enabledMultiDraw)
    #define DrawID gl_DrawID
#else
    #define DrawID uDrawId
#endif
`,T=`
// TODO find a better place for these convenience defines

#if defined(dRenderVariant_colorBlended) || defined(dRenderVariant_colorWboit) || defined(dRenderVariant_colorDpoit)
    #define dRenderVariant_color
#endif

#if defined(dColorType_instance) || defined(dColorType_group) || defined(dColorType_groupInstance) || defined(dColorType_vertex) || defined(dColorType_vertexInstance)
    #define dColorType_texture
#endif

#if defined(dColorType_volume) || defined(dColorType_volumeInstance)
    #define dColorType_grid
#endif

#if defined(dColorType_attribute) || defined(dColorType_texture) || defined(dColorType_grid)
    #define dColorType_varying
#endif

#if ((defined(dRenderVariant_color) || defined(dRenderVariant_tracing)) && defined(dColorMarker)) || defined(dRenderVariant_marking)
    #define dNeedsMarker
#endif

#if defined(dXrayShaded_on) || defined(dXrayShaded_inverted)
    #define dXrayShaded
#endif

#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing) || ((defined(dRenderVariant_depth) || defined(dRenderVariant_pick)) && defined(dXrayShaded))
    #define dNeedsNormal
#endif

#define MaskAll 0
#define MaskOpaque 1
#define MaskTransparent 2

//

#define PI 3.14159265
#define RECIPROCAL_PI 0.31830988618
#define EPSILON 1e-6
#define ONE_MINUS_EPSILON 1.0 - EPSILON
#define TWO_PI 6.2831853
#define HALF_PI 1.570796325

#define PALETTE_SCALE 16777214.0 // (1 << 24) - 2

#define saturate(a) clamp(a, 0.0, 1.0)

#if __VERSION__ == 100
    #define round(x) floor((x) + 0.5)
#endif

float intDiv(const in float a, const in float b) { return float(int(a) / int(b)); }
vec2 ivec2Div(const in vec2 a, const in vec2 b) { return vec2(ivec2(a) / ivec2(b)); }
float intMod(const in float a, const in float b) { return a - b * float(int(a) / int(b)); }
int imod(const in int a, const in int b) { return a - b * (a / b); }

float pow2(const in float x) { return x * x; }

vec3 packIntToRGB(in float value) {
    value = clamp(round(value), 0.0, 16777216.0 - 1.0) + 1.0;
    vec3 c = vec3(0.0);
    c.b = mod(value, 256.0);
    value = floor(value / 256.0);
    c.g = mod(value, 256.0);
    value = floor(value / 256.0);
    c.r = mod(value, 256.0);
    return c / 255.0;
}
float unpackRGBToInt(const in vec3 rgb) {
    return (floor(rgb.r * 255.0 + 0.5) * 256.0 * 256.0 + floor(rgb.g * 255.0 + 0.5) * 256.0 + floor(rgb.b * 255.0 + 0.5)) - 1.0;
}

vec2 packUnitIntervalToRG(const in float v) {
    vec2 enc;
    enc.xy = vec2(fract(v * 256.0), v);
    enc.y -= enc.x * (1.0 / 256.0);
    enc.xy *=  256.0 / 255.0;

    return enc;
}

float unpackRGToUnitInterval(const in vec2 enc) {
    return dot(enc, vec2(255.0 / (256.0 * 256.0), 255.0 / 256.0));
}

float pack2x4(vec2 v) {
    vec2 clamped_v = clamp(v, 0.0, 1.0);
    vec2 scaled_v = floor(clamped_v * 15.0 + 0.5); // round to 0–15
    float c = scaled_v.x + scaled_v.y * 16.0;
    return c / 255.0;
}

vec2 unpack2x4(float f) {
    float c = floor(f * 255.0 + 0.5);
    float lo = mod(c, 16.0);
    float hi = floor(c / 16.0);
    return vec2(lo, hi) / 15.0;
}

vec3 screenSpaceToViewSpace(const in vec3 ssPos, const in mat4 invProjection) {
    vec4 p = vec4(ssPos * 2.0 - 1.0, 1.0);
    p = invProjection * p;
    return p.xyz / p.w;
}

const float PackUpscale = 256.0 / 255.0; // fraction -> 0..1 (including 1)
const float UnpackDownscale = 255.0 / 256.0; // 0..1 -> fraction (excluding 1)
const vec3 PackFactors = vec3(256.0 * 256.0 * 256.0, 256.0 * 256.0,  256.0);
const vec4 UnpackFactors = UnpackDownscale / vec4(PackFactors, 1.0);
const float ShiftRight8 = 1.0 / 256.0;

vec4 packDepthToRGBA(const in float v) {
    vec4 r = vec4(fract(v * PackFactors), v);
    r.yzw -= r.xyz * ShiftRight8; // tidy overflow
    return r * PackUpscale;
}
float unpackRGBAToDepth(const in vec4 v) {
    return dot(v, UnpackFactors);
}

vec4 packDepthWithAlphaToRGBA(const in float depth, const in float alpha){
    vec3 r = vec3(fract(depth * PackFactors.yz), depth);
    r.yz -= r.xy * ShiftRight8; // tidy overflow
    return vec4(r * PackUpscale, alpha);
}
vec2 unpackRGBAToDepthWithAlpha(const in vec4 v) {
    return vec2(dot(v.xyz, UnpackFactors.yzw), v.w);
}

vec4 sRGBToLinear(const in vec4 c) {
    return vec4(mix(pow(c.rgb * 0.9478672986 + vec3(0.0521327014), vec3(2.4)), c.rgb * 0.0773993808, vec3(lessThanEqual(c.rgb, vec3(0.04045)))), c.a);
}
vec4 linearTosRGB(const in vec4 c) {
    return vec4(mix(pow(c.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), c.rgb * 12.92, vec3(lessThanEqual(c.rgb, vec3(0.0031308)))), c.a);
}

float luminance(vec3 c) {
    // https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    return dot(c, W);
}

float linearizeDepth(const in float depth, const in float near, const in float far) {
    return (2.0 * near) / (far + near - depth * (far - near));
}

float perspectiveDepthToViewZ(const in float invClipZ, const in float near, const in float far) {
    return (near * far) / ((far - near) * invClipZ - far);
}

float orthographicDepthToViewZ(const in float linearClipZ, const in float near, const in float far) {
    return linearClipZ * (near - far) - near;
}

float depthToViewZ(const in float isOrtho, const in float linearClipZ, const in float near, const in float far) {
    return isOrtho == 1.0 ? orthographicDepthToViewZ(linearClipZ, near, far) : perspectiveDepthToViewZ(linearClipZ, near, far);
}

// see https://github.com/graphitemaster/normals_revisited and https://www.shadertoy.com/view/3s33zj
mat3 adjoint(const in mat4 m) {
    return mat3(
        cross(m[1].xyz, m[2].xyz),
        cross(m[2].xyz, m[0].xyz),
        cross(m[0].xyz, m[1].xyz)
    );
}

#if __VERSION__ == 100
    // transpose

    float transpose(const in float m) {
        return m;
    }

    mat2 transpose2(const in mat2 m) {
        return mat2(
            m[0][0], m[1][0],
            m[0][1], m[1][1]
        );
    }

    mat3 transpose3(const in mat3 m) {
        return mat3(
            m[0][0], m[1][0], m[2][0],
            m[0][1], m[1][1], m[2][1],
            m[0][2], m[1][2], m[2][2]
        );
    }

    mat4 transpose4(const in mat4 m) {
        return mat4(
            m[0][0], m[1][0], m[2][0], m[3][0],
            m[0][1], m[1][1], m[2][1], m[3][1],
            m[0][2], m[1][2], m[2][2], m[3][2],
            m[0][3], m[1][3], m[2][3], m[3][3]
        );
    }

    // inverse

    float inverse(const in float m) {
        return 1.0 / m;
    }

    mat2 inverse2(const in mat2 m) {
        return mat2(m[1][1],-m[0][1],
                -m[1][0], m[0][0]) / (m[0][0]*m[1][1] - m[0][1]*m[1][0]);
    }

    mat3 inverse3(const in mat3 m) {
        float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
        float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
        float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

        float b01 = a22 * a11 - a12 * a21;
        float b11 = -a22 * a10 + a12 * a20;
        float b21 = a21 * a10 - a11 * a20;

        float det = a00 * b01 + a01 * b11 + a02 * b21;

        return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
                    b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
                    b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
    }

    mat4 inverse4(const in mat4 m) {
        float
            a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
            a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
            a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
            a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        return mat4(
            a11 * b11 - a12 * b10 + a13 * b09,
            a02 * b10 - a01 * b11 - a03 * b09,
            a31 * b05 - a32 * b04 + a33 * b03,
            a22 * b04 - a21 * b05 - a23 * b03,
            a12 * b08 - a10 * b11 - a13 * b07,
            a00 * b11 - a02 * b08 + a03 * b07,
            a32 * b02 - a30 * b05 - a33 * b01,
            a20 * b05 - a22 * b02 + a23 * b01,
            a10 * b10 - a11 * b08 + a13 * b06,
            a01 * b08 - a00 * b10 - a03 * b06,
            a30 * b04 - a31 * b02 + a33 * b00,
            a21 * b02 - a20 * b04 - a23 * b00,
            a11 * b07 - a10 * b09 - a12 * b06,
            a00 * b09 - a01 * b07 + a02 * b06,
            a31 * b01 - a30 * b03 - a32 * b00,
            a20 * b03 - a21 * b01 + a22 * b00) / det;
    }

    #define isNaN(x) ((x) != (x))
    #define isInf(x) ((x) == (x) + 1.0)
#else
    #define transpose2(m) transpose(m)
    #define transpose3(m) transpose(m)
    #define transpose4(m) transpose(m)

    #define inverse2(m) inverse(m)
    #define inverse3(m) inverse(m)
    #define inverse4(m) inverse(m)

    #define isNaN isnan
    #define isInf isinf
#endif

float hash(in float h) {
    return fract(sin(h) * 43758.5453123);
}

float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n = p.x + p.y * 157.0 + 113.0 * p.z;
    return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
}

float fbm(in vec3 p) {
    float f = 0.0;
    f += 0.5 * noise(p);
    p *= 2.01;
    f += 0.25 * noise(p);
    p *= 2.02;
    f += 0.125 * noise(p);

    return f;
}
`,S=`
if (uLod.w == 0.0 && (uLod.x != 0.0 || uLod.y != 0.0)) {
    float d = (dot(uCameraPlane.xyz, vModelPosition) + uCameraPlane.w) / uModelScale;
    float ta = min(
        smoothstep(uLod.x, uLod.x + uLod.z, d),
        1.0 - smoothstep(uLod.y - uLod.z, uLod.y, d)
    );

    #if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        float at = 0.0;

        // shift by view-offset during multi-sample rendering to allow for blending
        vec2 coord = gl_FragCoord.xy + uViewOffset * 0.25;

        const mat4 thresholdMatrix = mat4(
            1.0 / 17.0,  9.0 / 17.0,  3.0 / 17.0, 11.0 / 17.0,
            13.0 / 17.0,  5.0 / 17.0, 15.0 / 17.0,  7.0 / 17.0,
            4.0 / 17.0, 12.0 / 17.0,  2.0 / 17.0, 10.0 / 17.0,
            16.0 / 17.0,  8.0 / 17.0, 14.0 / 17.0,  6.0 / 17.0
        );
        int ci = int(intMod(coord.x, 4.0));
        int ri = int(intMod(coord.y, 4.0));
        #if __VERSION__ == 100
            vec4 i = vec4(float(ci * 4 + ri));
            vec4 v = thresholdMatrix[0] * vec4(equal(i, vec4(0.0, 1.0, 2.0, 3.0))) +
                thresholdMatrix[1] * vec4(equal(i, vec4(4.0, 5.0, 6.0, 7.0))) +
                thresholdMatrix[2] * vec4(equal(i, vec4(8.0, 9.0, 10.0, 11.0))) +
                thresholdMatrix[3] * vec4(equal(i, vec4(12.0, 13.0, 14.0, 15.0)));
            at = v.x + v.y + v.z + v.w;
        #else
            at = thresholdMatrix[ci][ri];
        #endif

        if (ta < 0.99 && (ta < 0.01 || ta < at)) {
            discard;
        }
    #else
        if (ta < uPickingAlphaThreshold) {
            discard;
        }
    #endif
}
`,P=`
    // floatToRgba adapted from https://github.com/equinor/glsl-float-to-rgba
    // MIT License, Copyright (c) 2020 Equinor

    float shiftRight (float v, float amt) {
    v = floor(v) + 0.5;
    return floor(v / exp2(amt));
    }
    float shiftLeft (float v, float amt) {
        return floor(v * exp2(amt) + 0.5);
    }
    float maskLast (float v, float bits) {
        return mod(v, shiftLeft(1.0, bits));
    }
    float extractBits (float num, float from, float to) {
        from = floor(from + 0.5); to = floor(to + 0.5);
        return maskLast(shiftRight(num, from), to - from);
    }

    vec4 floatToRgba(float texelFloat, bool littleEndian) {
        if (texelFloat == 0.0) return vec4(0.0, 0.0, 0.0, 0.0);
        float sign = texelFloat > 0.0 ? 0.0 : 1.0;
        texelFloat = abs(texelFloat);
        float exponent = floor(log2(texelFloat));
        float biased_exponent = exponent + 127.0;
        float fraction = ((texelFloat / exp2(exponent)) - 1.0) * 8388608.0;
        float t = biased_exponent / 2.0;
        float last_bit_of_biased_exponent = fract(t) * 2.0;
        float remaining_bits_of_biased_exponent = floor(t);
        float byte4 = extractBits(fraction, 0.0, 8.0) / 255.0;
        float byte3 = extractBits(fraction, 8.0, 16.0) / 255.0;
        float byte2 = (last_bit_of_biased_exponent * 128.0 + extractBits(fraction, 16.0, 23.0)) / 255.0;
        float byte1 = (sign * 128.0 + remaining_bits_of_biased_exponent) / 255.0;
        return (
            littleEndian
                ? vec4(byte4, byte3, byte2, byte1)
                : vec4(byte1, byte2, byte3, byte4)
        );
    }
`,w=`
#if dLightCount != 0
    uniform vec3 uLightDirection[dLightCount];
    uniform vec3 uLightColor[dLightCount];
#endif
uniform vec3 uAmbientColor;

struct PhysicalMaterial {
    vec3 diffuseColor;
    float roughness;
    vec3 specularColor;
    float specularF90;
};

struct IncidentLight {
    vec3 color;
    vec3 direction;
};

struct ReflectedLight {
    vec3 directDiffuse;
    vec3 directSpecular;
    vec3 indirectDiffuse;
    vec3 indirectSpecular;
};

struct GeometricContext {
    vec3 position;
    vec3 normal;
    vec3 viewDir;
};

vec3 BRDF_Lambert(const in vec3 diffuseColor) {
    return RECIPROCAL_PI * diffuseColor;
}

vec3 F_Schlick(const in vec3 f0, const in float f90, const in float dotVH) {
    // Original approximation by Christophe Schlick '94
    // float fresnel = pow( 1.0 - dotVH, 5.0 );
    // Optimized variant (presented by Epic at SIGGRAPH '13)
    // https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
    float fresnel = exp2((-5.55473 * dotVH - 6.98316) * dotVH);
    return f0 * (1.0 - fresnel) + (f90 * fresnel);
}

// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float V_GGX_SmithCorrelated(const in float alpha, const in float dotNL, const in float dotNV) {
    float a2 = pow2(alpha);
    float gv = dotNL * sqrt(a2 + (1.0 - a2) * pow2(dotNV));
    float gl = dotNV * sqrt(a2 + (1.0 - a2) * pow2(dotNL));
    return 0.5 / max(gv + gl, EPSILON);
}

// Microfacet Models for Refraction through Rough Surfaces - equation (33)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney’s reparameterization
float D_GGX(const in float alpha, const in float dotNH) {
    float a2 = pow2(alpha);
    float denom = pow2(dotNH) * (a2 - 1.0) + 1.0; // avoid alpha = 0 with dotNH = 1
    return RECIPROCAL_PI * a2 / pow2(denom);
}

// GGX Distribution, Schlick Fresnel, GGX_SmithCorrelated Visibility
vec3 BRDF_GGX(const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float roughness) {
    float alpha = pow2(roughness); // UE4's roughness
    vec3 halfDir = normalize( lightDir + viewDir);
    float dotNL = saturate(dot(normal, lightDir));
    float dotNV = saturate(dot(normal, viewDir));
    float dotNH = saturate(dot(normal, halfDir));
    float dotVH = saturate(dot(viewDir, halfDir));
    vec3 F = F_Schlick(f0, f90, dotVH);
    float V = V_GGX_SmithCorrelated(alpha, dotNL, dotNV);
    float D = D_GGX(alpha, dotNH);
    return F * (V * D);
}

// Analytical approximation of the DFG LUT, one half of the
// split-sum approximation used in indirect specular lighting.
// via 'environmentBRDF' from "Physically Based Shading on Mobile"
// https://www.unrealengine.com/blog/physically-based-shading-on-mobile
vec2 DFGApprox(const in vec3 normal, const in vec3 viewDir, const in float roughness) {
    float dotNV = saturate(dot(normal, viewDir));
    const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022);
    const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04);
    vec4 r = roughness * c0 + c1;
    float a004 = min(r.x * r.x, exp2(-9.28 * dotNV)) * r.x + r.y;
    vec2 fab = vec2(-1.04, 1.04) * a004 + r.zw;
    return fab;
}

// Fdez-Ag\xfcera's "Multiple-Scattering Microfacet Model for Real-Time Image Based Lighting"
// Approximates multiscattering in order to preserve energy.
// http://www.jcgt.org/published/0008/01/03/
void computeMultiscattering(const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter) {
    vec2 fab = DFGApprox(normal, viewDir, roughness);
    vec3 FssEss = specularColor * fab.x + specularF90 * fab.y;
    float Ess = fab.x + fab.y;
    float Ems = 1.0 - Ess;
    vec3 Favg = specularColor + (1.0 - specularColor) * 0.047619; // 1/21
    vec3 Fms = FssEss * Favg / (1.0 - Ems * Favg);
    singleScatter += FssEss;
    multiScatter += Fms * Ems;
}

void RE_Direct_Physical(const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
    float dotNL = saturate(dot(geometry.normal, directLight.direction));
    vec3 irradiance = dotNL * directLight.color;
    reflectedLight.directSpecular += irradiance * BRDF_GGX(directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularF90, material.roughness);
    reflectedLight.directDiffuse += irradiance * BRDF_Lambert(material.diffuseColor);
}

void RE_IndirectDiffuse_Physical(const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert(material.diffuseColor);
}

void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
    // Both indirect specular and indirect diffuse light accumulate here
    vec3 singleScattering = vec3(0.0);
    vec3 multiScattering = vec3(0.0);
    vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
    computeMultiscattering(geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering);
    vec3 diffuse = material.diffuseColor * (1.0 - ( singleScattering + multiScattering));
    reflectedLight.indirectSpecular += radiance * singleScattering;
    reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
    reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
`,F=`
varying vec3 vNormal;
`,k=`
vec4 readFromTexture(const in sampler2D tex, const in float i, const in vec2 dim) {
    float x = intMod(i, dim.x);
    float y = floor(intDiv(i, dim.x));
    vec2 uv = (vec2(x, y) + 0.5) / dim;
    return texture2D(tex, uv);
}

vec4 readFromTexture(const in sampler2D tex, const in int i, const in vec2 dim) {
    int x = imod(i, int(dim.x));
    int y = i / int(dim.x);
    vec2 uv = (vec2(x, y) + 0.5) / dim;
    return texture2D(tex, uv);
}
`,B=`
    // rgbaToFloat adapted from https://github.com/ihmeuw/glsl-rgba-to-float
    // BSD 3-Clause License
    //
    // Copyright (c) 2019, Institute for Health Metrics and Evaluation All rights reserved.
    // Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
    //  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    //  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    //  - Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
    //
    // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
    // INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
    // IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
    // OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
    // OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    // OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
    // OF THE POSSIBILITY OF SUCH DAMAGE.

    ivec4 floatsToBytes(vec4 inputFloats, bool littleEndian) {
        ivec4 bytes = ivec4(inputFloats * 255.0);
        return (
            littleEndian
                ? bytes.abgr
                : bytes
        );
    }

    // Break the four bytes down into an array of 32 bits.
    void bytesToBits(const in ivec4 bytes, out bool bits[32]) {
        for (int channelIndex = 0; channelIndex < 4; ++channelIndex) {
            float acc = float(bytes[channelIndex]);
            for (int indexInByte = 7; indexInByte >= 0; --indexInByte) {
                float powerOfTwo = exp2(float(indexInByte));
                bool bit = acc >= powerOfTwo;
                bits[channelIndex * 8 + (7 - indexInByte)] = bit;
                acc = mod(acc, powerOfTwo);
            }
        }
    }

    // Compute the exponent of the 32-bit float.
    float getExponent(bool bits[32]) {
        const int startIndex = 1;
        const int bitStringLength = 8;
        const int endBeforeIndex = startIndex + bitStringLength;
        float acc = 0.0;
        int pow2 = bitStringLength - 1;
        for (int bitIndex = startIndex; bitIndex < endBeforeIndex; ++bitIndex) {
            acc += float(bits[bitIndex]) * exp2(float(pow2--));
        }
        return acc;
    }

    // Compute the mantissa of the 32-bit float.
    float getMantissa(bool bits[32], bool subnormal) {
        const int startIndex = 9;
        const int bitStringLength = 23;
        const int endBeforeIndex = startIndex + bitStringLength;
        // Leading/implicit/hidden bit convention:
        // If the number is not subnormal (with exponent 0), we add a leading 1 digit.
        float acc = float(!subnormal) * exp2(float(bitStringLength));
        int pow2 = bitStringLength - 1;
        for (int bitIndex = startIndex; bitIndex < endBeforeIndex; ++bitIndex) {
            acc += float(bits[bitIndex]) * exp2(float(pow2--));
        }
        return acc;
    }

    // Parse the float from its 32 bits.
    float bitsToFloat(bool bits[32]) {
        float signBit = float(bits[0]) * -2.0 + 1.0;
        float exponent = getExponent(bits);
        bool subnormal = abs(exponent - 0.0) < 0.01;
        float mantissa = getMantissa(bits, subnormal);
        float exponentBias = 127.0;
        return signBit * mantissa * exp2(exponent - exponentBias - 23.0);
    }

    float rgbaToFloat(vec4 texelRGBA, bool littleEndian) {
        ivec4 rgbaBytes = floatsToBytes(texelRGBA, littleEndian);
        bool bits[32];
        bytesToBits(rgbaBytes, bits);
        return bitsToFloat(bits);
    }
`,z=`
#if defined(dSizeType_uniform)
    uniform float uSize;
#elif defined(dSizeType_attribute)
    attribute float aSize;
#elif defined(dSizeType_instance) || defined(dSizeType_group) || defined(dSizeType_groupInstance) || defined(dSizeType_vertex) || defined(dSizeType_vertexInstance)
    uniform vec2 uSizeTexDim;
    uniform sampler2D tSize;
#endif

uniform float uSizeFactor;
`,O=`
vec4 texture3dFrom1dTrilinear(const in sampler2D tex, const in vec3 pos, const in vec3 gridDim, const in vec2 texDim, const in float offset) {
    float gdYZ = gridDim.z * gridDim.y;
    float gdZ = gridDim.z;
    vec3 p0 = floor(pos * gridDim);
    vec3 p1 = ceil(pos * gridDim);
    vec3 pd = (pos * gridDim - p0) / (p1 - p0);
    vec4 s000 = readFromTexture(tex, offset + p0.z + p0.y * gdZ + p0.x * gdYZ, texDim);
    vec4 s100 = readFromTexture(tex, offset + p0.z + p0.y * gdZ + p1.x * gdYZ, texDim);
    vec4 s001 = readFromTexture(tex, offset + p1.z + p0.y * gdZ + p0.x * gdYZ, texDim);
    vec4 s101 = readFromTexture(tex, offset + p1.z + p0.y * gdZ + p1.x * gdYZ, texDim);
    vec4 s010 = readFromTexture(tex, offset + p0.z + p1.y * gdZ + p0.x * gdYZ, texDim);
    vec4 s110 = readFromTexture(tex, offset + p0.z + p1.y * gdZ + p1.x * gdYZ, texDim);
    vec4 s011 = readFromTexture(tex, offset + p1.z + p1.y * gdZ + p0.x * gdYZ, texDim);
    vec4 s111 = readFromTexture(tex, offset + p1.z + p1.y * gdZ + p1.x * gdYZ, texDim);
    vec4 s00 = mix(s000, s100, pd.x);
    vec4 s01 = mix(s001, s101, pd.x);
    vec4 s10 = mix(s010, s110, pd.x);
    vec4 s11 = mix(s011, s111, pd.x);
    vec4 s0 = mix(s00, s10, pd.y);
    vec4 s1 = mix(s01, s11, pd.y);
    return mix(s0, s1, pd.z);
}
`,R=`
vec4 texture3dFrom2dLinear(sampler2D tex, vec3 pos, vec3 gridDim, vec2 texDim) {
    float zSlice0 = floor(pos.z * gridDim.z);
    float column0 = intMod(zSlice0 * gridDim.x, texDim.x) / gridDim.x;
    float row0 = floor(intDiv(zSlice0 * gridDim.x, texDim.x));
    vec2 coord0 = (vec2(column0 * gridDim.x, row0 * gridDim.y) + (pos.xy * gridDim.xy)) / texDim;
    vec4 color0 = texture2D(tex, coord0);

    float zSlice1 = zSlice0 + 1.0;
    float column1 = intMod(zSlice1 * gridDim.x, texDim.x) / gridDim.x;
    float row1 = floor(intDiv(zSlice1 * gridDim.x, texDim.x));
    vec2 coord1 = (vec2(column1 * gridDim.x, row1 * gridDim.y) + (pos.xy * gridDim.xy)) / texDim;
    vec4 color1 = texture2D(tex, coord1);

    float delta0 = abs((pos.z * gridDim.z) - zSlice0);
    return mix(color0, color1, delta0);
}
`,A=`
vec4 texture3dFrom2dNearest(sampler2D tex, vec3 pos, vec3 gridDim, vec2 texDim) {
    float zSlice = floor(pos.z * gridDim.z + 0.5); // round to nearest z-slice
    float column = intMod(zSlice * gridDim.x, texDim.x) / gridDim.x;
    float row = floor(intDiv(zSlice * gridDim.x, texDim.x));
    vec2 coord = (vec2(column * gridDim.x, row * gridDim.y) + (pos.xy * gridDim.xy)) / texDim;
    return texture2D(tex, coord);
}
`,G=`
#if defined(dRenderVariant_colorWboit)
    if (uRenderMask == MaskOpaque) {
        if (preFogAlpha < 1.0) {
            discard;
        }
    } else if (uRenderMask == MaskTransparent) {
        if (preFogAlpha != 1.0 && fragmentDepth < getDepth(gl_FragCoord.xy / uDrawingBufferSize)) {
            #ifdef dTransparentBackfaces_off
                if (interior) discard;
            #endif
            float alpha = gl_FragColor.a;
            float wboitWeight = alpha * clamp(pow(1.0 - fragmentDepth, 2.0), 0.01, 1.0);
            gl_FragColor = vec4(gl_FragColor.rgb * alpha * wboitWeight, alpha);
            // extra alpha is to handle pre-multiplied alpha
            #ifndef dGeometryType_directVolume
                gl_FragData[1] = vec4((uTransparentBackground ? alpha : 1.0) * alpha * wboitWeight);
            #else
                gl_FragData[1] = vec4(alpha * alpha * wboitWeight);
            #endif
        } else {
            discard;
        }
    }
#endif
`,V=`
#if defined(dRenderVariant_colorDpoit)
    if (uRenderMask == MaskOpaque) {
        if (preFogAlpha < 1.0) {
            discard;
        }
    } else if (uRenderMask == MaskTransparent) {
        vec2 coords = gl_FragCoord.xy / uDrawingBufferSize;
        if (preFogAlpha != 1.0 && fragmentDepth < getDepth(coords)) {
            #ifdef dTransparentBackfaces_off
                if (interior) discard;
            #endif

            // adapted from https://github.com/tsherif/webgl2examples
            // The MIT License, Copyright 2017 Tarek Sherif, Shuai Shao

            vec2 lastDepth = texture2D(tDpoitDepth, coords).rg;
            vec4 lastFrontColor = texture2D(tDpoitFrontColor, coords);

            vec4 fragColor = gl_FragColor;

            // depth value always increases
            // so we can use MAX blend equation
            gl_FragData[2].rg = vec2(-MAX_DPOIT_DEPTH);

            // front color always increases
            // so we can use MAX blend equation
            gl_FragColor = lastFrontColor;

            // back color is separately blend afterwards each pass
            gl_FragData[1] = vec4(0.0);

            float nearestDepth = -lastDepth.x;
            float furthestDepth = lastDepth.y;
            float alphaMultiplier = 1.0 - lastFrontColor.a;

            if (fragmentDepth < nearestDepth || fragmentDepth > furthestDepth) {
                // Skip this depth since it's been peeled.
                return;
            }

            if (fragmentDepth > nearestDepth && fragmentDepth < furthestDepth) {
                // This needs to be peeled.
                // The ones remaining after MAX blended for
                // all need-to-peel will be peeled next pass.
                gl_FragData[2].rg = vec2(-fragmentDepth, fragmentDepth);
                return;
            }

            // write to back and front color buffer
            if (fragmentDepth == nearestDepth) {
                gl_FragColor.rgb += fragColor.rgb * fragColor.a * alphaMultiplier;
                gl_FragColor.a = 1.0 - alphaMultiplier * (1.0 - fragColor.a);
            } else {
                gl_FragData[1] += fragColor;
            }

        } else {
            discard;
        }
    }
#endif
`,M=`
precision highp float;
precision highp int;

#include common
#include read_from_texture
#include common_vert_params
#include color_vert_params
#include size_vert_params
#include common_clip
#include common_animation

uniform float uPixelRatio;
uniform vec4 uViewport;

attribute vec3 aPosition;
attribute mat4 aTransform;
attribute float aInstance;
attribute float aGroup;

void main(){
    int vertexId = VertexID;

    #include assign_group
    #include assign_color_varying
    #include assign_marker_varying
    #include assign_clipping_varying
    #include assign_position
    #include assign_size

    #ifdef dPointSizeAttenuation
        gl_PointSize = size * uPixelRatio * ((uViewport.w / 2.0) / -mvPosition.z) * 5.0;
    #else
        gl_PointSize = size * uPixelRatio;
    #endif
    gl_PointSize = max(1.0, gl_PointSize);

    gl_Position = uProjection * mvPosition;

    #include clip_instance
}
`,E=`
precision highp float;
precision highp int;

#include common
#include common_frag_params
#include color_frag_params
#include common_clip

const vec2 center = vec2(0.5);
const float radius = 0.5;

void main(){
    #include fade_lod
    #include clip_pixel

    float fragmentDepth = gl_FragCoord.z;
    #include assign_material_color

    #if defined(dPointStyle_circle)
        float dist = distance(gl_PointCoord, center);
        if (dist > radius) discard;
    #elif defined(dPointStyle_fuzzy)
        float dist = distance(gl_PointCoord, center);
        float fuzzyAlpha = 1.0 - smoothstep(0.0, radius, dist);
        if (fuzzyAlpha < 0.0001) discard;
    #endif

    #if defined(dPointStyle_fuzzy) && (defined(dRenderVariant_color) || defined(dRenderVariant_tracing))
        material.a *= fuzzyAlpha;
    #endif

    #include check_transparency

    #if defined(dRenderVariant_pick)
        #include check_picking_alpha
        #ifdef requiredDrawBuffers
            gl_FragColor = vObject;
            gl_FragData[1] = vInstance;
            gl_FragData[2] = vGroup;
            gl_FragData[3] = packDepthToRGBA(fragmentDepth);
        #else
            gl_FragColor = vColor;
        #endif
    #elif defined(dRenderVariant_depth)
        gl_FragColor = material;
    #elif defined(dRenderVariant_marking)
        gl_FragColor = material;
    #elif defined(dRenderVariant_emissive)
        gl_FragColor = material;
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        gl_FragColor = material;
        #include apply_marker_color

        #if defined(dRenderVariant_color)
            #include apply_fog
            #include wboit_write
            #include dpoit_write
        #elif defined(dRenderVariant_tracing)
            gl_FragData[1] = vec4(normalize(vViewPosition), emissive);
            gl_FragData[2] = vec4(material.rgb, uDensity);
        #endif
    #endif
}
`,Q=`
precision highp float;
precision highp int;

#include common
#include read_from_texture
#include common_vert_params
#include color_vert_params
#include size_vert_params
#include common_clip
#include common_animation

uniform mat4 uModelView;
uniform mat4 uInvProjection;
uniform float uIsOrtho;
uniform bool uIsAsymmetricProjection;

uniform vec2 uTexDim;
uniform sampler2D tPositionGroup;

attribute mat4 aTransform;
attribute float aInstance;

varying float vRadius;
varying vec3 vPoint;
varying vec3 vPointViewPosition;

/**
 * Bounding rectangle of a clipped, perspective-projected 3D Sphere.
 * Michael Mara, Morgan McGuire. 2013
 *
 * Specialization by Arseny Kapoulkine, MIT License Copyright (c) 2018
 * https://github.com/zeux/niagara
 *
 * Only works for for symmetric projections.
 */
void sphereProjection(const in vec3 p, const in float r, const in vec2 mapping) {
    vec3 pr = p * r;
    float pzr2 = p.z * p.z - r * r;

    float vx = sqrt(p.x * p.x + pzr2);
    float minx = ((vx * p.x - pr.z) / (vx * p.z + pr.x)) * uProjection[0][0];
    float maxx = ((vx * p.x + pr.z) / (vx * p.z - pr.x)) * uProjection[0][0];

    float vy = sqrt(p.y * p.y + pzr2);
    float miny = ((vy * p.y - pr.z) / (vy * p.z + pr.y)) * uProjection[1][1];
    float maxy = ((vy * p.y + pr.z) / (vy * p.z - pr.y)) * uProjection[1][1];

    gl_Position.xy = vec2(maxx + minx, maxy + miny) * -0.5;
    gl_Position.xy -= mapping * vec2(maxx - minx, maxy - miny) * 0.5;
    gl_Position.xy *= gl_Position.w;
}

const mat4 D = mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, -1.0
);

/**
 * Compute point size and center using the technique described in:
 * "GPU-Based Ray-Casting of Quadratic Surfaces" http://dl.acm.org/citation.cfm?id=2386396
 * by Christian Sigg, Tim Weyrich, Mario Botsch, Markus Gross.
 */
void quadraticProjection(const in vec3 position, const in float radius, const in vec2 mapping, const in mat4 transform) {
    vec2 xbc, ybc;

    mat4 T = mat4(
        radius, 0.0, 0.0, 0.0,
        0.0, radius, 0.0, 0.0,
        0.0, 0.0, radius, 0.0,
        position.x, position.y, position.z, 1.0
    );

    mat4 R = transpose4(uProjection * uModelView * transform * T);
    float A = dot(R[3], D * R[3]);
    float B = -2.0 * dot(R[0], D * R[3]);
    float C = dot(R[0], D * R[0]);
    xbc[0] = (-B - sqrt(B * B - 4.0 * A * C)) / (2.0 * A);
    xbc[1] = (-B + sqrt(B * B - 4.0 * A * C)) / (2.0 * A);
    float sx = abs(xbc[0] - xbc[1]) * 0.5;

    A = dot(R[3], D * R[3]);
    B = -2.0 * dot(R[1], D * R[3]);
    C = dot(R[1], D * R[1]);
    ybc[0] = (-B - sqrt(B * B - 4.0 * A * C)) / (2.0 * A);
    ybc[1] = (-B + sqrt(B * B - 4.0 * A * C)) / (2.0 * A);
    float sy = abs(ybc[0] - ybc[1]) * 0.5;

    gl_Position.xy = vec2(0.5 * (xbc.x + xbc.y), 0.5 * (ybc.x + ybc.y));
    gl_Position.xy -= mapping * vec2(sx, sy);
    gl_Position.xy *= gl_Position.w;
}

void main(void){
    vec2 mapping = vec2(1.0, 1.0); // vertices 2 and 5
    #if __VERSION__ == 100
        int m = imod(VertexID, 6);
    #else
        int m = VertexID % 6;
    #endif
    if (m == 0) {
        mapping = vec2(-1.0, 1.0);
    } else if (m == 1 || m == 3) {
        mapping = vec2(-1.0, -1.0);
    } else if (m == 4) {
        mapping = vec2(1.0, -1.0);
    }

    int vertexId = VertexID / 6;

    vec4 positionGroup = readFromTexture(tPositionGroup, vertexId, uTexDim);
    vec3 position = positionGroup.rgb;
    float group = positionGroup.a;

    position = applyWiggle(position, group, aInstance);
    mat4 transform = applyTumble(aTransform, aInstance, float(uObjectId));

    #include assign_color_varying
    #include assign_marker_varying
    #include assign_clipping_varying
    #include assign_size

    vRadius = size * uModelScale;

    vec4 position4 = vec4(position, 1.0);
    vModelPosition = (uModel * transform * position4).xyz; // for clipping in frag shader

    float d;
    if (uLod.w != 0.0 && (uLod.x != 0.0 || uLod.y != 0.0)) {
        if (uModelScale != 1.0) {
            vRadius *= uLod.w;
        } else {
            d = (dot(uCameraPlane.xyz, vModelPosition) + uCameraPlane.w) / uModelScale;
            float f = min(
                smoothstep(uLod.x, uLod.x + uLod.z, d),
                1.0 - smoothstep(uLod.y - uLod.z, uLod.y, d)
            ) * uLod.w;
            vRadius *= f;
        }
    }

    vec4 mvPosition = uModelView * transform * position4;

    #ifdef dApproximate
        vec4 mvCorner = vec4(mvPosition.xyz, 1.0);
        mvCorner.xy += mapping * vRadius;
        gl_Position = uProjection * mvCorner;
    #else
        if (uIsOrtho == 1.0) {
            vec4 mvCorner = vec4(mvPosition.xyz, 1.0);
            mvCorner.xy += mapping * vRadius;
            gl_Position = uProjection * mvCorner;
        } else if (uIsAsymmetricProjection) {
            gl_Position = uProjection * vec4(mvPosition.xyz, 1.0);
            quadraticProjection(position, vRadius / uModelScale, mapping, transform);
        } else {
            gl_Position = uProjection * vec4(mvPosition.xyz, 1.0);
            sphereProjection(mvPosition.xyz, vRadius, mapping);
        }
    #endif

    vec4 vPoint4 = uInvProjection * gl_Position;
    vPoint = vPoint4.xyz / vPoint4.w;
    vPointViewPosition = -mvPosition.xyz / mvPosition.w;

    if (gl_Position.z < -gl_Position.w) {
        mvPosition.z -= 2.0 * vRadius; // avoid clipping
        gl_Position.z = (uProjection * vec4(mvPosition.xyz, 1.0)).z;
    }

    if (uModelScale == 1.0) {
        if (uLod.w != 0.0 && (uLod.x != 0.0 || uLod.y != 0.0)) {
            if (d < uLod.x || d > uLod.y) {
                // move out of [ -w, +w ] to 'discard' in vert shader
                gl_Position.z = 2.0 * gl_Position.w;
            }
        }
    }

    #if defined(dClipPrimitive) && !defined(dClipVariant_instance) && dClipObjectCount != 0
        if (clipTest(vModelPosition / uModelScale)) {
            // move out of [ -w, +w ] to 'discard' in vert shader
            gl_Position.z = 2.0 * gl_Position.w;
        }
    #else
        #include clip_instance
    #endif
}
`,N=`
precision highp float;
precision highp int;

#define bumpEnabled

#include common
#include common_frag_params
#include color_frag_params
#include light_frag_params
#include common_clip

uniform mat4 uInvView;
uniform float uAlphaThickness;

uniform vec4 uInteriorColor;
uniform vec4 uInteriorSubstance;

varying float vRadius;
varying vec3 vPoint;
varying vec3 vPointViewPosition;

#ifdef dSolidInterior
    const bool solidInterior = true;
#else
    const bool solidInterior = false;
#endif

bool SphereImpostor(out vec3 modelPos, out vec3 cameraPos, out vec3 cameraNormal, out bool interior, out float fragmentDepth){
    vec3 cameraSpherePos = -vPointViewPosition;

    vec3 rayOrigin = mix(vec3(0.0, 0.0, 0.0), vPoint, uIsOrtho);
    vec3 rayDirection = mix(normalize(vPoint), vec3(0.0, 0.0, 1.0), uIsOrtho);
    vec3 cameraSphereDir = mix(cameraSpherePos, rayOrigin - cameraSpherePos, uIsOrtho);

    float B = dot(rayDirection, cameraSphereDir);
    float det = B * B + vRadius * vRadius - dot(cameraSphereDir, cameraSphereDir);

    if (det < 0.0) return false;

    float sqrtDet = sqrt(det);
    float posT = mix(B + sqrtDet, B - sqrtDet, uIsOrtho);
    float negT = mix(B - sqrtDet, B + sqrtDet, uIsOrtho);

    cameraPos = rayDirection * negT + rayOrigin;
    modelPos = (uInvView * vec4(cameraPos, 1.0)).xyz;
    fragmentDepth = calcDepth(cameraPos);

    bool objectClipped = false;

    #if !defined(dClipPrimitive) && defined(dClipVariant_pixel) && dClipObjectCount != 0
        if (clipTest(modelPos)) {
            objectClipped = true;
            fragmentDepth = -1.0;
        }
    #endif

    if (fragmentDepth > 0.0) {
        cameraNormal = normalize(cameraPos - cameraSpherePos);
        interior = false;
        return true;
    } else if (uDoubleSided || solidInterior) {
        cameraPos = rayDirection * posT + rayOrigin;
        modelPos = (uInvView * vec4(cameraPos, 1.0)).xyz;
        fragmentDepth = calcDepth(cameraPos);
        cameraNormal = -normalize(cameraPos - cameraSpherePos);
        interior = true;
        if (fragmentDepth > 0.0) {
            #ifdef dSolidInterior
                if (!objectClipped) {
                    fragmentDepth = 0.0 + (0.0000001 / vRadius);
                    cameraNormal = -mix(normalize(vPoint), vec3(0.0, 0.0, -1.0), uIsOrtho);

                    // intersection of ray with near plane
                    float nearT = - (uNear + dot(rayOrigin, vec3(0.0, 0.0, 1.0))) / dot(rayDirection, vec3(0.0, 0.0, 1.0));
                    cameraPos = rayDirection * nearT + rayOrigin;
                    modelPos = (uInvView * vec4(cameraPos, 1.0)).xyz;
                }
            #endif
            return true;
        }
    }

    return false;
}

void main(void){
    vec3 cameraNormal;
    float fragmentDepth;

    #ifdef dApproximate
        vec3 pointDir = -vPointViewPosition - vPoint;
        if (dot(pointDir, pointDir) > vRadius * vRadius) discard;
        vec3 vViewPosition = -vPointViewPosition;
        fragmentDepth = gl_FragCoord.z;
        #if !defined(dIgnoreLight) || defined(dXrayShaded) || defined(dRenderVariant_tracing)
            pointDir.z -= cos(length(pointDir)) * vRadius * 0.5;
            cameraNormal = -normalize(pointDir);
        #endif
        interior = false;
    #else
        vec3 modelPos;
        vec3 cameraPos;
        bool hit = SphereImpostor(modelPos, cameraPos, cameraNormal, interior, fragmentDepth);
        if (!hit) discard;

        if (fragmentDepth < 0.0) discard;
        if (fragmentDepth > 1.0) discard;

        gl_FragDepthEXT = fragmentDepth;

        vec3 vModelPosition = modelPos;
        vec3 vViewPosition = cameraPos;
    #endif

    #include fade_lod
    #if !defined(dClipPrimitive) && defined(dClipVariant_pixel) && dClipObjectCount != 0
        #include clip_pixel
    #endif

    #ifdef dNeedsNormal
        vec3 normal = -cameraNormal;
    #endif

    #include assign_material_color

    #if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        if (uRenderMask == MaskTransparent && uAlphaThickness > 0.0) {
            material.a *= min(1.0, vRadius / (uAlphaThickness * uModelScale));
        }
    #endif

    #include check_transparency

    #if defined(dRenderVariant_pick)
        #include check_picking_alpha
        #ifdef requiredDrawBuffers
            gl_FragColor = vObject;
            gl_FragData[1] = vInstance;
            gl_FragData[2] = vGroup;
            gl_FragData[3] = packDepthToRGBA(fragmentDepth);
        #else
            gl_FragColor = vColor;
        #endif
    #elif defined(dRenderVariant_depth)
        gl_FragColor = material;
    #elif defined(dRenderVariant_marking)
        gl_FragColor = material;
    #elif defined(dRenderVariant_emissive)
        gl_FragColor = material;
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        #include apply_interior_color
        #include apply_light_color
        #include apply_marker_color

        #if defined(dRenderVariant_color)
            #include apply_fog
            #include wboit_write
            #include dpoit_write
        #elif defined(dRenderVariant_tracing)
            gl_FragData[1] = vec4(normal, emissive);
            gl_FragData[2] = vec4(material.rgb, uDensity);
        #endif
    #endif
}
`,L=`
precision highp float;
precision highp int;

#include common
#include read_from_texture
#include common_vert_params
#include color_vert_params
#include size_vert_params
#include common_clip
#include common_animation

uniform mat4 uModelView;

attribute mat4 aTransform;
attribute float aInstance;
attribute float aGroup;

attribute vec3 aMapping;
attribute vec3 aStart;
attribute vec3 aEnd;
attribute float aScale;
attribute float aCap;
attribute float aColorMode;

varying mat4 vTransform;
varying vec3 vStart;
varying vec3 vEnd;
varying float vSize;
varying float vCap;

uniform float uIsOrtho;
uniform vec3 uCameraDir;

void main() {
    int vertexId = VertexID;

    #include assign_group
    #include assign_color_varying
    #include assign_marker_varying
    #include assign_clipping_varying
    #include assign_size

    mat4 transform = applyTumble(aTransform, aInstance, float(uObjectId));
    vec3 wigStart = applyWiggle(aStart, aGroup, aInstance);
    vec3 wigEnd = applyWiggle(aEnd, aGroup, aInstance);
    mat4 modelTransform = uModel * transform;

    vTransform = modelTransform;
    vStart = (modelTransform * vec4(wigStart, 1.0)).xyz;
    vEnd = (modelTransform * vec4(wigEnd, 1.0)).xyz;
    vSize = size * aScale * uModelScale;
    vCap = aCap;

    vModelPosition = (vStart + vEnd) * 0.5;
    vec3 camDir = -mix(normalize(vModelPosition - uCameraPosition), uCameraDir, uIsOrtho);
    vec3 dir = vEnd - vStart;
    float f = aMapping.x > 0.0 ? 1.0 : 0.0;
    // ensure cylinder 'dir' is pointing towards the camera
    if(dot(camDir, dir) < 0.0) {
        dir = -dir;
        f = 1.0 - f;
    }

    vec3 left = cross(camDir, dir);
    vec3 up = cross(left, dir);
    left = vSize * normalize(left);
    up = vSize * normalize(up);

    // move vertex in object-space from center to corner
    vModelPosition += aMapping.x * dir + aMapping.y * left + aMapping.z * up;

    vec4 mvPosition = uView * vec4(vModelPosition, 1.0);
    vViewPosition = mvPosition.xyz;
    gl_Position = uProjection * mvPosition;

    if (gl_Position.z < -gl_Position.w) {
        mvPosition.z -= 2.0 * (length(vEnd - vStart) + vSize); // avoid clipping
        gl_Position.z = (uProjection * mvPosition).z;
    }

    #if defined(dDualColor) && defined(dRenderVariant_color) && (defined(dColorType_group) || defined(dColorType_groupInstance))
        // dual-color mixing
        // - for aColorMode between 0 and 1 use aColorMode to interpolate
        // - for aColorMode == 2 do nothing, i.e., use vColor
        // - for aColorMode == 3 use position on cylinder axis to interpolate
        if (aColorMode <= 1.0){
            vColor.rgb = mix(vColor.rgb, color2.rgb, aColorMode);
        } else if (aColorMode == 3.0) {
            vColor.rgb = mix(vColor.rgb, color2.rgb, mix(-0.25, 1.25, f / 1.5));
        }
    #endif

    #include clip_instance
}
`,j=`
precision highp float;
precision highp int;

#define bumpEnabled

uniform mat4 uView;

varying mat4 vTransform;
varying vec3 vStart;
varying vec3 vEnd;
varying float vSize;
varying float vCap;

uniform vec3 uCameraDir;
uniform vec3 uCameraPosition;
uniform mat4 uInvView;

uniform vec4 uInteriorColor;
uniform vec4 uInteriorSubstance;

#include common
#include common_frag_params
#include color_frag_params
#include light_frag_params
#include common_clip

#ifdef dSolidInterior
    const bool solidInterior = true;
#else
    const bool solidInterior = false;
#endif

// adapted from https://www.shadertoy.com/view/4lcSRn
// The MIT License, Copyright 2016 Inigo Quilez
bool CylinderImpostor(
    in vec3 rayOrigin, in vec3 rayDir,
    in vec3 start, in vec3 end, in float radius,
    out vec3 cameraNormal, out bool interior,
    out vec3 modelPosition, out vec3 viewPosition, out float fragmentDepth
){
    vec3 ba = end - start;
    vec3 oc = rayOrigin - start;

    float baba = dot(ba, ba);
    float bard = dot(ba, rayDir);
    float baoc = dot(ba, oc);

    float k2 = baba - bard * bard;
    float k1 = baba * dot(oc, rayDir) - baoc * bard;
    float k0 = baba * dot(oc, oc) - baoc * baoc - radius * radius * baba;

    float h = k1 * k1 - k2 * k0;
    if (h < 0.0) return false;

    bool topCap = (vCap > 0.9 && vCap < 1.1) || vCap >= 2.9;
    bool bottomCap = (vCap > 1.9 && vCap < 2.1) || vCap >= 2.9;

    #ifdef dSolidInterior
        bool topInterior = !topCap;
        bool bottomInterior = !bottomCap;
        topCap = true;
        bottomCap = true;
    #else
        bool topInterior = false;
        bool bottomInterior = false;
    #endif

    bool clipped = false;
    bool objectClipped = false;

    // body outside
    h = sqrt(h);
    float t = (-k1 - h) / k2;
    float y = baoc + t * bard;
    if (y > 0.0 && y < baba) {
        interior = false;
        cameraNormal = (oc + t * rayDir - ba * y / baba) / radius;
        modelPosition = rayOrigin + t * rayDir;
        viewPosition = (uView * vec4(modelPosition, 1.0)).xyz;
        fragmentDepth = calcDepth(viewPosition);
        #if defined(dClipVariant_pixel) && dClipObjectCount != 0
            if (clipTest(modelPosition)) {
                objectClipped = true;
                fragmentDepth = -1.0;
                #ifdef dSolidInterior
                    topCap = !topInterior;
                    bottomCap = !bottomInterior;
                #endif
            }
        #endif
        if (fragmentDepth > 0.0) return true;
        clipped = true;
    }

    if (!clipped) {
        if (topCap && y < 0.0) {
            // top cap
            t = -baoc / bard;
            if (abs(k1 + k2 * t) < h) {
                interior = topInterior;
                cameraNormal = -ba / baba;
                modelPosition = rayOrigin + t * rayDir;
                viewPosition = (uView * vec4(modelPosition, 1.0)).xyz;
                fragmentDepth = calcDepth(viewPosition);
                #if defined(dClipVariant_pixel) && dClipObjectCount != 0
                    if (clipTest(modelPosition)) {
                        objectClipped = true;
                        fragmentDepth = -1.0;
                        #ifdef dSolidInterior
                            topCap = !topInterior;
                            bottomCap = !bottomInterior;
                        #endif
                    }
                #endif
                if (fragmentDepth > 0.0) {
                    #ifdef dSolidInterior
                        if (interior) cameraNormal = -rayDir;
                    #endif
                    #if defined(dClipVariant_pixel) && dClipObjectCount != 0
                        return true;
                    #else
                        return !interior;
                    #endif
                }
            }
        } else if (bottomCap && y >= 0.0) {
            // bottom cap
            t = (baba - baoc) / bard;
            if (abs(k1 + k2 * t) < h) {
                interior = bottomInterior;
                cameraNormal = ba / baba;
                modelPosition = rayOrigin + t * rayDir;
                viewPosition = (uView * vec4(modelPosition, 1.0)).xyz;
                fragmentDepth = calcDepth(viewPosition);
                #if defined(dClipVariant_pixel) && dClipObjectCount != 0
                    if (clipTest(modelPosition)) {
                        objectClipped = true;
                        fragmentDepth = -1.0;
                        #ifdef dSolidInterior
                            topCap = !topInterior;
                            bottomCap = !bottomInterior;
                        #endif
                    }
                #endif
                if (fragmentDepth > 0.0) {
                    #ifdef dSolidInterior
                        if (interior) cameraNormal = -rayDir;
                    #endif
                    #if defined(dClipVariant_pixel) && dClipObjectCount != 0
                        return true;
                    #else
                        return !interior;
                    #endif
                }
            }
        }
    }

    if (uDoubleSided || solidInterior) {
        // body inside
        h = -h;
        t = (-k1 - h) / k2;
        y = baoc + t * bard;
        if (y > 0.0 && y < baba) {
            interior = true;
            cameraNormal = -(oc + t * rayDir - ba * y / baba) / radius;
            modelPosition = rayOrigin + t * rayDir;
            viewPosition = (uView * vec4(modelPosition, 1.0)).xyz;
            fragmentDepth = calcDepth(viewPosition);
            if (fragmentDepth > 0.0) {
                #ifdef dSolidInterior
                    if (!objectClipped) {
                        fragmentDepth = 0.0 + (0.0000002 / vSize);
                        cameraNormal = -rayDir;

                        // intersection of ray in model space with near plane in camera space
                        vec3 cameraRayOrigin = (uView * vec4(rayOrigin, 1.0)).xyz;
                        vec3 cameraRayDir = (uView * vec4(rayDir, 0.0)).xyz;
                        float nearT = - (uNear + cameraRayOrigin.z) / cameraRayDir.z;
                        viewPosition = cameraRayOrigin + nearT * cameraRayDir;
                        modelPosition = (uInvView * vec4(viewPosition, 1.0)).xyz;
                    }
                #endif
                return true;
            }
        }

        if (topCap && y < 0.0) {
            // top cap
            t = -baoc / bard;
            if (abs(k1 + k2 * t) < -h) {
                interior = true;
                cameraNormal = ba / baba;
                modelPosition = rayOrigin + t * rayDir;
                viewPosition = (uView * vec4(modelPosition, 1.0)).xyz;
                fragmentDepth = calcDepth(viewPosition);
                if (fragmentDepth > 0.0) {
                    #ifdef dSolidInterior
                        if (!objectClipped) {
                            fragmentDepth = 0.0 + (0.0000002 / vSize);
                            cameraNormal = -rayDir;

                            // intersection of ray in model space with near plane in camera space
                            vec3 cameraRayOrigin = (uView * vec4(rayOrigin, 1.0)).xyz;
                            vec3 cameraRayDir = (uView * vec4(rayDir, 0.0)).xyz;
                            float nearT = - (uNear + cameraRayOrigin.z) / cameraRayDir.z;
                            viewPosition = cameraRayOrigin + nearT * cameraRayDir;
                            modelPosition = (uInvView * vec4(viewPosition, 1.0)).xyz;
                        }
                    #endif
                    return true;
                }
            }
        } else if (bottomCap && y >= 0.0) {
            // bottom cap
            t = (baba - baoc) / bard;
            if (abs(k1 + k2 * t) < -h) {
                interior = true;
                cameraNormal = -ba / baba;
                modelPosition = rayOrigin + t * rayDir;
                viewPosition = (uView * vec4(modelPosition, 1.0)).xyz;
                fragmentDepth = calcDepth(viewPosition);
                if (fragmentDepth > 0.0) {
                    #ifdef dSolidInterior
                        if (!objectClipped) {
                            fragmentDepth = 0.0 + (0.0000002 / vSize);
                            cameraNormal = -rayDir;

                            // intersection of ray in model space with near plane in camera space
                            vec3 cameraRayOrigin = (uView * vec4(rayOrigin, 1.0)).xyz;
                            vec3 cameraRayDir = (uView * vec4(rayDir, 0.0)).xyz;
                            float nearT = - (uNear + cameraRayOrigin.z) / cameraRayDir.z;
                            viewPosition = cameraRayOrigin + nearT * cameraRayDir;
                            modelPosition = (uInvView * vec4(viewPosition, 1.0)).xyz;
                        }
                    #endif
                    return true;
                }
            }
        }
    }

    return false;
}

void main() {
    vec3 rayOrigin = vModelPosition;
    vec3 rayDir = mix(normalize(vModelPosition - uCameraPosition), uCameraDir, uIsOrtho);

    vec3 cameraNormal;
    vec3 modelPosition;
    vec3 viewPosition;
    float fragmentDepth;
    bool hit = CylinderImpostor(rayOrigin, rayDir, vStart, vEnd, vSize, cameraNormal, interior, modelPosition, viewPosition, fragmentDepth);
    if (!hit) discard;

    if (fragmentDepth < 0.0) discard;
    if (fragmentDepth > 1.0) discard;

    gl_FragDepthEXT = fragmentDepth;

    vec3 vViewPosition = viewPosition;
    vec3 vModelPosition = modelPosition;

    #include fade_lod
    #include clip_pixel

    #ifdef dNeedsNormal
        mat3 normalMatrix = adjoint(uView);
        vec3 normal = normalize(normalMatrix * -normalize(cameraNormal));
    #endif

    #include assign_material_color
    #include check_transparency

    #if defined(dRenderVariant_pick)
        #include check_picking_alpha
        #ifdef requiredDrawBuffers
            gl_FragColor = vObject;
            gl_FragData[1] = vInstance;
            gl_FragData[2] = vGroup;
            gl_FragData[3] = packDepthToRGBA(fragmentDepth);
        #else
            gl_FragColor = vColor;
        #endif
    #elif defined(dRenderVariant_depth)
        gl_FragColor = material;
    #elif defined(dRenderVariant_marking)
        gl_FragColor = material;
    #elif defined(dRenderVariant_emissive)
        gl_FragColor = material;
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        #include apply_interior_color
        #include apply_light_color
        #include apply_marker_color

        #if defined(dRenderVariant_color)
            #include apply_fog
            #include wboit_write
            #include dpoit_write
        #elif defined(dRenderVariant_tracing)
            gl_FragData[1] = vec4(normal, emissive);
            gl_FragData[2] = vec4(material.rgb, uDensity);
        #endif
    #endif
}
`,q=`
precision highp float;
precision highp int;

#include common
#include read_from_texture
#include common_vert_params
#include color_vert_params
#include size_vert_params
#include common_clip

uniform mat4 uModelView;

attribute vec3 aPosition;
attribute vec2 aMapping;
attribute float aDepth;
attribute vec2 aTexCoord;
attribute mat4 aTransform;
attribute float aInstance;
attribute float aGroup;

uniform float uOffsetX;
uniform float uOffsetY;
uniform float uOffsetZ;

uniform float uIsOrtho;
uniform float uPixelRatio;
uniform vec4 uViewport;
uniform mat4 uInvHeadRotation;
uniform bool uHasHeadRotation;
uniform mat4 uModelViewEye;
uniform mat4 uInvModelViewEye;
uniform bool uHasEyeCamera;

varying vec2 vTexCoord;

void main(void){
    int vertexId = VertexID;

    #include assign_group
    #include assign_color_varying
    #include assign_marker_varying
    #include assign_clipping_varying
    #include assign_size

    vTexCoord = aTexCoord;

    float scale = uModelScale;

    float offsetX = uOffsetX * scale;
    float offsetY = uOffsetY * scale;
    float offsetZ = (uOffsetZ + aDepth * 0.95) * scale;

    vec4 position4 = vec4(aPosition, 1.0);
    vec4 mvPosition = uHasEyeCamera
         ? uModelViewEye * aTransform * position4
         : uModelView * aTransform * position4;

    vModelPosition = (uModel * aTransform * position4).xyz; // for clipping in frag shader

    // TODO
    // #ifdef FIXED_SIZE
    //     if (ortho) {
    //         scale /= pixelRatio * ((uViewport.w / 2.0) / -uCameraPosition.z) * 0.1;
    //     } else {
    //         scale /= pixelRatio * ((uViewport.w / 2.0) / -mvPosition.z) * 0.1;
    //     }
    // #endif

    vec4 mvCenter = vec4(mvPosition.xyz, 1.0);

    if (vTexCoord.x == 10.0) { // indicates background plane
        // move a bit to the back, taking distance to camera into account to avoid z-fighting
        offsetZ -= 0.001 * distance(uCameraPosition, (uProjection * mvCenter).xyz);
    }

    // apply Z offset in view space
    if (!uHasEyeCamera) {
        if (uIsOrtho == 1.0) {
            mvCenter.z += offsetZ;
        } else {
            mvCenter.xyz += normalize(-mvCenter.xyz) * offsetZ;
        }
    }

    if (uHasEyeCamera) {
        mvCenter = uModelView * uInvModelViewEye * mvCenter;
    }

    // project center to clip space
    vec4 clip = uProjection * mvCenter;

    // compute corner offset in screen-space units
    vec2 cornerOffset = aMapping * size * scale;
    cornerOffset.x += offsetX;
    cornerOffset.y += offsetY;

    if (uHasHeadRotation) {
        vec3 rotatedOffset = (uInvHeadRotation * vec4(cornerOffset, 0.0, 0.0)).xyz;
        clip += uProjection * vec4(rotatedOffset, 0.0);
    } else {
        // apply offset in clip space to avoid perspective distortion on the quad
        clip.xy += vec2(uProjection[0][0], uProjection[1][1]) * cornerOffset;
    }

    gl_Position = clip;

    vViewPosition = -mvCenter.xyz;

    #include clip_instance
}
`,U=`
precision highp float;
precision highp int;

#include common
#include common_frag_params
#include color_frag_params
#include common_clip

uniform sampler2D tFont;

uniform vec3 uBorderColor;
uniform float uBorderWidth;
uniform vec3 uBackgroundColor;
uniform float uBackgroundOpacity;

varying vec2 vTexCoord;

void main(){
    #include fade_lod
    #include clip_pixel

    float fragmentDepth = gl_FragCoord.z;

    // determine if this is a background or glyph fragment
    bool isBackground = vTexCoord.x > 1.0;

    // discard background for pick/marking/emissive, but keep it in depth
    #if !defined(dRenderVariant_color) && !defined(dRenderVariant_tracing) && !defined(dRenderVariant_depth)
        if (isBackground) discard;
    #endif

    // SDF test for glyph fragments — discard pixels outside glyph+border
    float rawSdf = 0.0;
    if (!isBackground) {
        rawSdf = texture2D(tFont, vTexCoord).a;
        float sdf = rawSdf + min(uBorderWidth, 0.49); // clamp to avoid exceeding max SDF range
        if (sdf < 0.5) discard;
    }

    #ifdef enabledFragDepth
        gl_FragDepthEXT = fragmentDepth;
    #endif

    // background writes its own opacity into depth alpha; glyphs stay opaque
    #define dHasMaterialOpacity
    float materialOpacity = isBackground ? uBackgroundOpacity : 1.0;
    #include assign_material_color

    if (isBackground) {
        #if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
            material = vec4(uBackgroundColor, uBackgroundOpacity * material.a);
        #endif
    } else {
        #if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
            if (uBorderWidth > 0.0 && rawSdf < 0.5) {
                material.xyz = uBorderColor;
            } else {
                // push text fragments forward in depth so they render in front of border
                #ifdef enabledFragDepth
                    gl_FragDepthEXT = fragmentDepth - 0.0001;
                #endif
            }
        #endif
    }

    #include check_transparency

    #if defined(dRenderVariant_pick)
        #include check_picking_alpha
        #ifdef requiredDrawBuffers
            gl_FragColor = vObject;
            gl_FragData[1] = vInstance;
            gl_FragData[2] = vGroup;
            gl_FragData[3] = packDepthToRGBA(fragmentDepth);
        #else
            gl_FragColor = vColor;
        #endif
    #elif defined(dRenderVariant_depth)
        gl_FragColor = material;
    #elif defined(dRenderVariant_marking)
        gl_FragColor = material;
    #elif defined(dRenderVariant_emissive)
        gl_FragColor = material;
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        gl_FragColor = material;
        #include apply_marker_color

        #if defined(dRenderVariant_color)
            #include apply_fog
            #include wboit_write
            #include dpoit_write
        #elif defined(dRenderVariant_tracing)
            gl_FragData[1] = vec4(-normalize(vViewPosition), emissive);
            gl_FragData[2] = vec4(material.rgb, uDensity);
        #endif
    #endif
}
`,Z=`
precision highp float;
precision highp int;

#include common
#include read_from_texture
#include common_vert_params
#include color_vert_params
#include size_vert_params
#include common_clip
#include common_animation

uniform float uPixelRatio;
uniform vec4 uViewport;

attribute mat4 aTransform;
attribute float aInstance;
attribute float aGroup;

attribute vec2 aMapping;
attribute vec3 aStart;
attribute vec3 aEnd;

void trimSegment(const in vec4 start, inout vec4 end) {
    // trim end segment so it terminates between the camera plane and the near plane
    // conservative estimate of the near plane
    float a = uProjection[2][2];  // 3rd entry in 3rd column
    float b = uProjection[3][2];  // 3rd entry in 4th column
    float nearEstimate = -0.5 * b / a;
    float alpha = (nearEstimate - start.z) / (end.z - start.z);
    end.xyz = mix(start.xyz, end.xyz, alpha);
}

void main(){
    float aspect = uViewport.z / uViewport.w;
    int vertexId = VertexID;

    #include assign_group
    #include assign_color_varying
    #include assign_marker_varying
    #include assign_clipping_varying
    #include assign_size

    mat4 transform = applyTumble(aTransform, aInstance, float(uObjectId));
    vec3 wigStart = applyWiggle(aStart, group, aInstance);
    vec3 wigEnd = applyWiggle(aEnd, group, aInstance);
    mat4 modelView = uView * uModel * transform;

    // camera space
    vec4 start = modelView * vec4(wigStart, 1.0);
    vec4 end = modelView * vec4(wigEnd, 1.0);

    // assign position
    vec4 position4 = vec4((aMapping.y < 0.5) ? wigStart : wigEnd, 1.0);
    vViewPosition = (aMapping.y < 0.5) ? start.xyz : end.xyz;

    vModelPosition = (uModel * transform * position4).xyz; // for clipping in frag shader

    // special case for perspective projection, and segments that terminate either in, or behind, the camera plane
    // clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
    // but we need to perform ndc-space calculations in the shader, so we must address this issue directly
    // perhaps there is a more elegant solution -- WestLangley
    bool perspective = (uProjection[2][3] == -1.0); // 4th entry in the 3rd column
    if (perspective) {
        if (start.z < 0.0 && end.z >= 0.0) {
            trimSegment(start, end);
        } else if (end.z < 0.0 && start.z >= 0.0) {
            trimSegment(end, start);
        }
    }

    // clip space
    vec4 clipStart = uProjection * start;
    vec4 clipEnd = uProjection * end;

    // ndc space
    vec2 ndcStart = clipStart.xy / clipStart.w;
    vec2 ndcEnd = clipEnd.xy / clipEnd.w;

    // direction
    vec2 dir = ndcEnd - ndcStart;

    // account for clip-space aspect ratio
    dir.x *= aspect;
    dir = normalize(dir);

    // perpendicular to dir
    vec2 offset = vec2(dir.y, - dir.x);

    // undo aspect ratio adjustment
    dir.x /= aspect;
    offset.x /= aspect;

    // sign flip
    if (aMapping.x < 0.0) offset *= -1.0;

    // calculate linewidth
    float linewidth;
    #ifdef dLineSizeAttenuation
        linewidth = size * uPixelRatio * ((uViewport.w / 2.0) / -start.z) * 5.0;
    #else
        linewidth = size * uPixelRatio;
    #endif
    linewidth = max(1.0, linewidth);

    // adjust for linewidth
    offset *= linewidth;

    // adjust for clip-space to screen-space conversion
    offset /= uViewport.w;

    // select end
    vec4 clip = (aMapping.y < 0.5) ? clipStart : clipEnd;

    // back to clip space
    offset *= clip.w;
    clip.xy += offset;
    gl_Position = clip;

    #include clip_instance
}
`,W=`
precision highp float;
precision highp int;

#include common
#include common_frag_params
#include color_frag_params
#include common_clip

void main(){
    #include fade_lod
    #include clip_pixel

    float fragmentDepth = gl_FragCoord.z;
    #include assign_material_color
    #include check_transparency

    #if defined(dRenderVariant_pick)
        #include check_picking_alpha
        #ifdef requiredDrawBuffers
            gl_FragColor = vObject;
            gl_FragData[1] = vInstance;
            gl_FragData[2] = vGroup;
            gl_FragData[3] = packDepthToRGBA(fragmentDepth);
        #else
            gl_FragColor = vColor;
        #endif
    #elif defined(dRenderVariant_depth)
        gl_FragColor = material;
    #elif defined(dRenderVariant_marking)
        gl_FragColor = material;
    #elif defined(dRenderVariant_emissive)
        gl_FragColor = material;
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        gl_FragColor = material;
        #include apply_marker_color

        #if defined(dRenderVariant_color)
            #include apply_fog
            #include wboit_write
            #include dpoit_write
        #elif defined(dRenderVariant_tracing)
            gl_FragData[1] = vec4(normalize(vViewPosition), emissive);
            gl_FragData[2] = vec4(material.rgb, uDensity);
        #endif
    #endif
}
`,Y=`
precision highp float;
precision highp int;
precision highp sampler2D;

#include common
#include read_from_texture
#include common_vert_params
#include color_vert_params
#include common_clip
#include common_animation
#include texture3d_from_2d_linear

#ifdef dGeometryType_textureMesh
    uniform vec2 uGeoTexDim;
    uniform sampler2D tPosition;
    uniform sampler2D tGroup;
    uniform sampler2D tNormal;
#else
    attribute vec3 aPosition;
    attribute float aGroup;
    attribute vec3 aNormal;
#endif
attribute mat4 aTransform;
attribute float aInstance;

varying vec3 vNormal;

void main(){
    int vertexId = VertexID;

    #include assign_group
    #include assign_marker_varying
    #include assign_clipping_varying
    #include assign_position
    #include assign_color_varying
    #include clip_instance

    #ifdef dGeometryType_textureMesh
        vec3 normal = readFromTexture(tNormal, vertexId, uGeoTexDim).xyz;
    #else
        vec3 normal = aNormal;
    #endif
    mat3 normalMatrix = adjoint(modelView);
    vec3 transformedNormal = normalize(normalMatrix * normalize(normal));
    #if defined(dFlipSided)
        if (!uDoubleSided) { // TODO checking uDoubleSided should not be required, ASR
            transformedNormal = -transformedNormal;
        }
    #endif
    vNormal = transformedNormal;
}
`,H=`
precision highp float;
precision highp int;

#define bumpEnabled

#include common
#include common_frag_params
#include color_frag_params
#include light_frag_params
#include normal_frag_params
#include common_clip

uniform vec4 uInteriorColor;
uniform vec4 uInteriorSubstance;

void main() {
    #include fade_lod
    #include clip_pixel

    interior = !gl_FrontFacing;

    float fragmentDepth = gl_FragCoord.z;

    #ifdef dNeedsNormal
        #if defined(dFlatShaded)
            vec3 fdx = dFdx(vViewPosition);
            vec3 fdy = dFdy(vViewPosition);
            vec3 normal = -normalize(cross(fdx,fdy));
        #else
            vec3 normal = -normalize(vNormal);
            if (uDoubleSided) normal *= float(gl_FrontFacing) * 2.0 - 1.0;
        #endif

        #if defined(dFlipSided)
            normal *= -1.0;
        #endif
    #endif

    #include assign_material_color
    #include check_transparency

    #if defined(dRenderVariant_pick)
        #include check_picking_alpha
        #ifdef requiredDrawBuffers
            gl_FragColor = vObject;
            gl_FragData[1] = vInstance;
            gl_FragData[2] = vGroup;
            gl_FragData[3] = packDepthToRGBA(fragmentDepth);
        #else
            gl_FragColor = vColor;
        #endif
    #elif defined(dRenderVariant_depth)
        gl_FragColor = material;
    #elif defined(dRenderVariant_marking)
        gl_FragColor = material;
    #elif defined(dRenderVariant_emissive)
        gl_FragColor = material;
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        #include apply_interior_color
        #include apply_light_color
        #include apply_marker_color

        #if defined(dRenderVariant_color)
            #include apply_fog
            #include wboit_write
            #include dpoit_write
        #elif defined(dRenderVariant_tracing)
            gl_FragData[1] = vec4(normal, emissive);
            gl_FragData[2] = vec4(material.rgb, uDensity);
        #endif
    #endif
}
`,X=`
precision highp float;

attribute vec3 aPosition;
attribute mat4 aTransform;
attribute float aInstance;

uniform mat4 uModel;
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform vec4 uInvariantBoundingSphere;
uniform float uModelScale;

varying vec3 vModelPosition;
varying float vInstance;
varying vec4 vBoundingSphere;
varying mat4 vTransform;

uniform vec3 uBboxSize;
uniform vec3 uBboxMin;
uniform vec3 uBboxMax;
uniform vec3 uGridDim;
uniform mat4 uTransform;

uniform mat4 uUnitToCartn;

void main() {
    vec4 unitCoord = vec4(aPosition + vec3(0.5), 1.0);
    vec4 mvPosition = uModelView * aTransform * uUnitToCartn * unitCoord;

    vModelPosition = (uModel * aTransform * uUnitToCartn * unitCoord).xyz;
    vInstance = aInstance;
    vBoundingSphere = vec4(
        (uModel * aTransform * vec4(uInvariantBoundingSphere.xyz, 1.0)).xyz,
        uModelScale * uInvariantBoundingSphere.w
    );
    vTransform = aTransform;

    gl_Position = uProjection * mvPosition;

    // move z position to near clip plane (but not too close to get precision issues)
    gl_Position.z = gl_Position.w - 0.01;
}
`,$=`
precision highp float;
precision highp int;

#include common
#include light_frag_params

#if dClipObjectCount != 0
    uniform int uClipObjectType[dClipObjectCount];
    uniform bool uClipObjectInvert[dClipObjectCount];
    uniform vec3 uClipObjectPosition[dClipObjectCount];
    uniform vec4 uClipObjectRotation[dClipObjectCount];
    uniform vec3 uClipObjectScale[dClipObjectCount];
    uniform mat4 uClipObjectTransform[dClipObjectCount];
#endif
#include common_clip

#include read_from_texture
#include texture3d_from_1d_trilinear
#include texture3d_from_2d_nearest
#include texture3d_from_2d_linear

uniform mat4 uProjection, uTransform, uModelView, uModel, uView;
uniform vec3 uCameraDir;
uniform float uModelScale;

uniform sampler2D tDepth;
uniform vec2 uDrawingBufferSize;

varying vec3 vModelPosition;
varying float vInstance;
varying vec4 vBoundingSphere;
varying mat4 vTransform;

uniform mat4 uInvView;
uniform vec3 uGridDim;
uniform vec3 uBboxSize;
uniform sampler2D tTransferTex;
uniform float uTransferScale;
uniform float uStepScale;
uniform float uJumpLength;

uniform int uObjectId;
uniform int uVertexCount;
uniform int uInstanceCount;
uniform int uGroupCount;

#if defined(dColorMarker)
    uniform vec3 uHighlightColor;
    uniform vec3 uSelectColor;
    uniform vec3 uDimColor;
    uniform float uHighlightStrength;
    uniform float uSelectStrength;
    uniform float uDimStrength;
    uniform int uMarkerPriority;
    uniform float uMarkerAverage;

    uniform float uMarker;
    uniform vec2 uMarkerTexDim;
    uniform sampler2D tMarker;
#endif

uniform float uMetalness;
uniform float uRoughness;
uniform float uEmissive;

// Density value to estimate object thickness
uniform float uDensity;

uniform bool uFog;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;

uniform float uAlpha;
uniform bool uTransparentBackground;
uniform float uXrayEdgeFalloff;
uniform float uCelSteps;
uniform float uExposure;

uniform int uRenderMask;

uniform float uNear;
uniform float uFar;
uniform float uIsOrtho;

uniform vec3 uCellDim;
uniform vec3 uCameraPosition;
uniform mat4 uCartnToUnit;

#if __VERSION__ != 100
    // for webgl1 this is given as a 'define'
    uniform int uMaxSteps;
#endif

#if defined(dGridTexType_2d)
    precision highp sampler2D;
    uniform sampler2D tGridTex;
    uniform vec3 uGridTexDim;
#elif defined(dGridTexType_3d)
    precision highp sampler3D;
    uniform sampler3D tGridTex;
#endif

#if defined(dColorType_uniform)
    uniform vec3 uColor;
#elif defined(dColorType_texture)
    uniform vec2 uColorTexDim;
    uniform sampler2D tColor;
#endif

#ifdef dOverpaint
    #if defined(dOverpaintType_groupInstance) || defined(dOverpaintType_vertexInstance)
        uniform vec2 uOverpaintTexDim;
        uniform sampler2D tOverpaint;
    #endif
#endif

#ifdef dUsePalette
    uniform vec2 uPaletteDomain;
    uniform sampler2D tPalette;
#endif

#if defined(dGridTexType_2d)
    vec4 textureVal(vec3 pos) {
        return texture3dFrom2dLinear(tGridTex, pos + (vec3(0.5, 0.5, 0.0) / uGridDim), uGridDim, uGridTexDim.xy);
    }
    vec4 textureGroup(vec3 pos) {
        return texture3dFrom2dNearest(tGridTex, pos + (vec3(0.5, 0.5, 0.0) / uGridDim), uGridDim, uGridTexDim.xy);
    }
#elif defined(dGridTexType_3d)
    vec4 textureVal(vec3 pos) {
        return texture(tGridTex, pos + (vec3(0.5) / uGridDim));
    }
    vec4 textureGroup(vec3 pos) {
        return texelFetch(tGridTex, ivec3(pos * uGridDim), 0);
    }
#endif

float calcDepth(const in vec3 pos) {
    vec2 clipZW = pos.z * uProjection[2].zw + uProjection[3].zw;
    return 0.5 + 0.5 * clipZW.x / clipZW.y;
}

float transferFunction(float value) {
    return texture2D(tTransferTex, vec2(value, 0.0)).a;
}

float getDepth(const in vec2 coords) {
    #ifdef depthTextureSupport
        return texture2D(tDepth, coords).r;
    #else
        return unpackRGBAToDepth(texture2D(tDepth, coords));
    #endif
}

const float gradOffset = 0.5;

vec3 v3m4(vec3 p, mat4 m) {
    return (m * vec4(p, 1.0)).xyz;
}

float preFogAlphaBlended = 0.0;

vec4 raymarch(vec3 startLoc, vec3 step, vec3 rayDir) {
    mat3 normalMatrix = adjoint(uModelView * vTransform);
    mat4 cartnToUnit = uCartnToUnit * inverse4(vTransform);
    #if defined(dClipVariant_pixel) && dClipObjectCount != 0
        mat4 modelTransform = uModel * vTransform * uTransform;
    #endif
    mat4 modelViewTransform = uModelView * vTransform * uTransform;

    vec3 scaleVol = vec3(1.0) / uGridDim;
    vec3 pos = startLoc;
    vec4 cell;
    float prevValue = -1.0;
    float value = 0.0;
    vec4 src = vec4(0.0);
    vec4 dst = vec4(0.0);
    float fragmentDepth;

    vec3 posMin = vec3(0.0);
    vec3 posMax = vec3(1.0) - vec3(1.0) / uGridDim;

    vec3 unitPos;

    vec3 nextPos;
    float nextValue;

    vec4 material;
    vec4 overpaint;
    float metalness = uMetalness;
    float roughness = uRoughness;
    float emissive = uEmissive;

    vec3 gradient = vec3(1.0);
    vec3 dx = vec3(gradOffset * scaleVol.x, 0.0, 0.0);
    vec3 dy = vec3(0.0, gradOffset * scaleVol.y, 0.0);
    vec3 dz = vec3(0.0, 0.0, gradOffset * scaleVol.z);

    float maxDist = min(vBoundingSphere.w * 2.0, uFar - uNear);
    float maxDistSq = maxDist * maxDist;

    for (int i = 0; i < uMaxSteps; ++i) {
        // break when beyond bounding-sphere or far-plane
        vec3 distVec = startLoc - pos;
        if (dot(distVec, distVec) > maxDistSq) break;

        unitPos = v3m4(pos / uModelScale, cartnToUnit);

        // continue when outside of grid
        if (unitPos.x > posMax.x || unitPos.y > posMax.y || unitPos.z > posMax.z ||
            unitPos.x < posMin.x || unitPos.y < posMin.y || unitPos.z < posMin.z
        ) {
            prevValue = value;
            pos += step;
            continue;
        }

        cell = textureVal(unitPos);
        value = cell.a; // current voxel value

        if (uJumpLength > 0.0 && value < 0.01) {
            nextPos = pos + rayDir * uJumpLength;
            nextValue = textureVal(v3m4(nextPos / uModelScale, cartnToUnit)).a;
            if (nextValue < 0.01) {
                prevValue = nextValue;
                pos = nextPos;
                continue;
            }
        }

        vec4 mvPosition = modelViewTransform * vec4(unitPos * uGridDim, 1.0);
        if (calcDepth(mvPosition.xyz) > getDepth(gl_FragCoord.xy / uDrawingBufferSize))
            break;

        #if defined(dClipVariant_pixel) && dClipObjectCount != 0
            vec3 modelPosition = v3m4(unitPos * uGridDim, modelTransform);
            if (clipTest(modelPosition)) {
                prevValue = value;
                pos += step;
                continue;
            }
        #endif

        vec3 vViewPosition = mvPosition.xyz;
        material.a = transferFunction(value);

        #ifdef dPackedGroup
            float group = unpackRGBToInt(textureGroup(floor(unitPos * uGridDim + 0.5) / uGridDim).rgb);
        #else
            vec3 g = floor(unitPos * uGridDim + 0.5);
            // note that we swap x and z because the texture is flipped around y
            #if defined(dAxisOrder_012)
                float group = g.z + g.y * uGridDim.z + g.x * uGridDim.z * uGridDim.y; // 210
            #elif defined(dAxisOrder_021)
                float group = g.y + g.z * uGridDim.y + g.x * uGridDim.y * uGridDim.z; // 120
            #elif defined(dAxisOrder_102)
                float group = g.z + g.x * uGridDim.z + g.y * uGridDim.z * uGridDim.x; // 201
            #elif defined(dAxisOrder_120)
                float group = g.x + g.z * uGridDim.x + g.y * uGridDim.x * uGridDim.z; // 021
            #elif defined(dAxisOrder_201)
                float group = g.y + g.x * uGridDim.y + g.z * uGridDim.y * uGridDim.x; // 102
            #elif defined(dAxisOrder_210)
                float group = g.x + g.y * uGridDim.x + g.z * uGridDim.x * uGridDim.y; // 012
            #endif
        #endif

        #if defined(dColorType_direct) && defined(dUsePalette)
            float paletteValue = (value - uPaletteDomain[0]) / (uPaletteDomain[1] - uPaletteDomain[0]);
            material.rgb = texture2D(tPalette, vec2(clamp(paletteValue, 0.0, 1.0), 0.0)).rgb;
        #elif defined(dColorType_uniform)
            material.rgb = uColor;
        #elif defined(dColorType_instance)
            material.rgb = readFromTexture(tColor, vInstance, uColorTexDim).rgb;
        #elif defined(dColorType_group)
            material.rgb = readFromTexture(tColor, group, uColorTexDim).rgb;
        #elif defined(dColorType_groupInstance)
            material.rgb = readFromTexture(tColor, vInstance * float(uGroupCount) + group, uColorTexDim).rgb;
        #elif defined(dColorType_vertex)
            material.rgb = texture3dFrom1dTrilinear(tColor, unitPos, uGridDim, uColorTexDim, 0.0).rgb;
        #elif defined(dColorType_vertexInstance)
            material.rgb = texture3dFrom1dTrilinear(tColor, unitPos, uGridDim, uColorTexDim, vInstance * float(uVertexCount)).rgb;
        #endif

        #ifdef dOverpaint
            #if defined(dOverpaintType_groupInstance)
                overpaint = readFromTexture(tOverpaint, vInstance * float(uGroupCount) + group, uOverpaintTexDim);
            #elif defined(dOverpaintType_vertexInstance)
                overpaint = texture3dFrom1dTrilinear(tOverpaint, unitPos, uGridDim, uOverpaintTexDim, vInstance * float(uVertexCount));
            #endif

            material.rgb = mix(material.rgb, overpaint.rgb, overpaint.a);
        #endif

        #if defined(dIgnoreLight)
            gl_FragColor.rgb = material.rgb;
        #else
            if (material.a >= 0.01) {
                #ifdef dPackedGroup
                    // compute gradient by central differences
                    gradient.x = textureVal(unitPos - dx).a - textureVal(unitPos + dx).a;
                    gradient.y = textureVal(unitPos - dy).a - textureVal(unitPos + dy).a;
                    gradient.z = textureVal(unitPos - dz).a - textureVal(unitPos + dz).a;
                #else
                    gradient = cell.xyz * 2.0 - 1.0;
                #endif
                vec3 normal = -normalize(normalMatrix * normalize(gradient));
                #include apply_light_color
            } else {
                gl_FragColor.rgb = material.rgb;
            }
        #endif

        gl_FragColor.a = material.a * uAlpha * uTransferScale;

        #if defined(dColorMarker)
            float marker = uMarker;
            if (uMarker == -1.0) {
                marker = readFromTexture(tMarker, vInstance * float(uGroupCount) + group, uMarkerTexDim).a;
                marker = floor(marker * 255.0 + 0.5); // rounding required to work on some cards on win
            }
        #endif
        #include apply_marker_color

        preFogAlphaBlended = (1.0 - preFogAlphaBlended) * gl_FragColor.a + preFogAlphaBlended;
        fragmentDepth = calcDepth(mvPosition.xyz);
        #include apply_fog

        src = gl_FragColor;

        if (!uTransparentBackground || !uFog) {
            // done in 'apply_fog' otherwise
            src.rgb *= src.a;
        }
        dst = (1.0 - dst.a) * src + dst; // standard blending

        // break if the color is opaque enough
        if (dst.a > 0.95)
            break;

        pos += step;
    }

    return dst;
}

// TODO: support float texture for higher precision values???
// TODO: support clipping exclusion texture support

void main() {
    #if defined(dRenderVariant_tracing) || defined(dRenderVariant_emissive)
        discard;
    #else
        if (gl_FrontFacing)
            discard;

        vec3 rayDir = mix(normalize(vModelPosition - uCameraPosition), uCameraDir, uIsOrtho);
        vec3 step = rayDir * uStepScale * uModelScale;

        float boundingSphereNear = distance(vBoundingSphere.xyz, uCameraPosition) - vBoundingSphere.w;
        float d = max(uNear, boundingSphereNear) - mix(0.0, distance(vModelPosition, uCameraPosition), uIsOrtho);
        vec3 start = mix(uCameraPosition, vModelPosition, uIsOrtho) + (d * rayDir);
        gl_FragColor = raymarch(start, step, rayDir);

        float fragmentDepth = calcDepth((uView * vec4(start, 1.0)).xyz);
        float preFogAlpha = clamp(preFogAlphaBlended, 0.0, 1.0);
        #include wboit_write
    #endif
}
`,J=`
precision highp float;
precision highp int;

#include common
#include common_vert_params

attribute vec3 aPosition;
attribute vec2 aUv;
attribute mat4 aTransform;
attribute float aInstance;

varying vec2 vUv;
varying float vInstance;
varying vec3 vPosition;

void main() {
    int vertexId = VertexID;

    #include assign_position

    vUv = aUv;
    vInstance = aInstance;
    vPosition = aPosition;
}
`,K=`
precision highp float;
precision highp int;

#include common
#include read_from_texture
#include common_frag_params
#include common_clip

uniform float uEmissive;

// Density value to estimate object thickness
uniform float uDensity;

#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
    #ifdef dOverpaint
        #if defined(dOverpaintType_instance) || defined(dOverpaintType_groupInstance)
            varying vec4 vOverpaint;
            uniform vec2 uOverpaintTexDim;
            uniform sampler2D tOverpaint;
        #endif
        uniform float uOverpaintStrength;
    #endif
#endif

#if defined(dRenderVariant_color) || defined(dRenderVariant_tracing) || defined(dRenderVariant_emissive)
    #ifdef dEmissive
        #if defined(dEmissiveType_instance) || defined(dEmissiveType_groupInstance)
            varying float vEmissive;
            uniform vec2 uEmissiveTexDim;
            uniform sampler2D tEmissive;
        #endif
        uniform float uEmissiveStrength;
    #endif
#endif

#ifdef dTransparency
    #if defined(dTransparencyType_instance) || defined(dTransparencyType_groupInstance)
        varying float vTransparency;
        uniform vec2 uTransparencyTexDim;
        uniform sampler2D tTransparency;
    #endif
    uniform float uTransparencyStrength;
#endif

uniform vec2 uImageTexDim;
uniform sampler2D tImageTex;
uniform sampler2D tGroupTex;
uniform sampler2D tValueTex;

uniform vec2 uMarkerTexDim;
uniform sampler2D tMarker;

varying vec2 vUv;
varying float vInstance;
varying vec3 vPosition;

#ifdef dUsePalette
    uniform sampler2D tPalette;
    uniform vec3 uPaletteDefault;
#endif

uniform int uTrimType;
uniform vec3 uTrimCenter;
uniform vec4 uTrimRotation;
uniform vec3 uTrimScale;
uniform mat4 uTrimTransform;

uniform float uIsoLevel;

#if defined(dInterpolation_catmulrom) || defined(dInterpolation_mitchell) || defined(dInterpolation_bspline)
    #define dInterpolation_cubic
#endif

#if defined(dInterpolation_cubic)
    #if defined(dInterpolation_catmulrom) || defined(dInterpolation_mitchell)
        #if defined(dInterpolation_catmulrom)
            const float B = 0.0;
            const float C = 0.5;
        #elif defined(dInterpolation_mitchell)
            const float B = 0.333;
            const float C = 0.333;
        #endif

        float cubicFilter(float x){
            float f = x;
            if (f < 0.0) {
                f = -f;
            }
            if (f < 1.0) {
                return ((12.0 - 9.0 * B - 6.0 * C) * (f * f * f) +
                    (-18.0 + 12.0 * B + 6.0 * C) * (f * f) +
                    (6.0 - 2.0 * B)) / 6.0;
            }else if (f >= 1.0 && f < 2.0){
                return ((-B - 6.0 * C) * ( f * f * f)
                    + (6.0 * B + 30.0 * C) * (f * f) +
                    (-(12.0 * B) - 48.0 * C) * f +
                    8.0 * B + 24.0 * C) / 6.0;
            }else{
                return 0.0;
            }
        }
    #elif defined(dInterpolation_bspline)
        float cubicFilter(float x) {
            float f = x;
            if (f < 0.0) {
                f = -f;
            }
            if (f >= 0.0 && f <= 1.0){
                return (2.0 / 3.0) + (0.5) * (f * f * f) - (f * f);
            } else if (f > 1.0 && f <= 2.0) {
                return 1.0 / 6.0 * pow((2.0 - f), 3.0);
            }
            return 1.0;
        }
    #endif

    vec4 biCubic(sampler2D tex, vec2 texCoord) {
        vec2 texelSize = 1.0 / uImageTexDim;
        texCoord -= texelSize / 2.0;
        vec4 nSum = vec4(0.0);
        float nDenom = 0.0;
        vec2 cell = fract(texCoord * uImageTexDim);
        for (float m = -1.0; m <= 2.0; ++m) {
            for (float n = -1.0; n <= 2.0; ++n) {
                vec4 vecData = texture2D(tex, texCoord + texelSize * vec2(m, n));
                float c = abs(cubicFilter(m - cell.x) * cubicFilter(-n + cell.y));
                nSum += vecData * c;
                nDenom += c;
            }
        }
        return nSum / nDenom;
    }
#endif

void main() {
    if (uTrimType != 0 && getSignedDistance(vPosition, uTrimType, uTrimCenter, uTrimRotation, uTrimScale, uTrimTransform) > 0.0) discard;

    #include fade_lod
    #include clip_pixel

    #if defined(dInterpolation_cubic)
        #ifdef dUsePalette
            vec4 material = texture2D(tImageTex, vUv);
            if (material.rgb != vec3(1.0)) {
                material = biCubic(tImageTex, vUv);
            }
        #else
            vec4 material = biCubic(tImageTex, vUv);
        #endif
    #else
        vec4 material = texture2D(tImageTex, vUv);
    #endif

    if (uIsoLevel >= 0.0) {
        if (texture2D(tValueTex, vUv).r < uIsoLevel) discard;

        material.a = uAlpha;
    } else {
        if (material.a == 0.0) discard;

        material.a *= uAlpha;
    }

    float fragmentDepth = gl_FragCoord.z;

    vec3 packedGroup = texture2D(tGroupTex, vUv).rgb;
    float group = packedGroup == vec3(0.0) ? -1.0 : unpackRGBToInt(packedGroup);

    // apply per-group transparency
    #if defined(dTransparency) && (defined(dRenderVariant_pick) || defined(dRenderVariant_color) || defined(dRenderVariant_emissive) || defined(dRenderVariant_tracing))
        float transparency = 0.0;
        #if defined(dTransparencyType_instance)
            transparency = readFromTexture(tTransparency, vInstance, uTransparencyTexDim).a;
        #elif defined(dTransparencyType_groupInstance)
            transparency = readFromTexture(tTransparency, vInstance * float(uGroupCount) + group, uTransparencyTexDim).a;
        #endif
        transparency *= uTransparencyStrength;

        float ta = 1.0 - transparency;
        if (transparency < 0.09) ta = 1.0; // hard cutoff looks better

        #if defined(dRenderVariant_pick)
            if (ta * uAlpha < uPickingAlphaThreshold)
                discard; // ignore so the element below can be picked
        #elif defined(dRenderVariant_emissive)
            if (ta < 1.0)
                discard; // emissive not supported with transparency
        #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
            material.a *= ta;
        #endif
    #endif

    if ((uRenderMask == MaskOpaque && material.a < 1.0) ||
        (uRenderMask == MaskTransparent && material.a == 1.0)
    ) {
        discard;
    }

    #if defined(dNeedsMarker)
        float marker = uMarker;
        if (group == -1.0) {
            marker = 0.0;
        } else if (uMarker == -1.0) {
            marker = readFromTexture(tMarker, vInstance * float(uGroupCount) + group, uMarkerTexDim).a;
            marker = floor(marker * 255.0 + 0.5); // rounding required to work on some cards on win
        }
    #endif

    #if defined(dRenderVariant_color) || defined(dRenderVariant_tracing) || defined(dRenderVariant_emissive)
        float emissive = uEmissive;
        if (group == -1.0) {
            emissive = 0.0;
        } else {
            #ifdef dEmissive
                #if defined(dEmissiveType_instance)
                    emissive += readFromTexture(tEmissive, vInstance, uEmissiveTexDim).a * uEmissiveStrength;
                #elif defined(dEmissiveType_groupInstance)
                    emissive += readFromTexture(tEmissive, vInstance * float(uGroupCount) + group, uEmissiveTexDim).a * uEmissiveStrength;
                #endif
            #endif
        }
    #endif

    #if defined(dRenderVariant_pick)
        if (group == -1.0) discard;

        #include check_picking_alpha
        #ifdef requiredDrawBuffers
            gl_FragColor = vec4(packIntToRGB(float(uObjectId)), 1.0);
            gl_FragData[1] = vec4(packIntToRGB(vInstance), 1.0);
            gl_FragData[2] = vec4(packIntToRGB(group), 1.0);
            gl_FragData[3] = packDepthToRGBA(fragmentDepth);
        #else
            gl_FragColor = vColor;
            if (uPickType == 1) {
                gl_FragColor = vec4(packIntToRGB(float(uObjectId)), 1.0);
            } else if (uPickType == 2) {
                gl_FragColor = vec4(packIntToRGB(vInstance), 1.0);
            } else {
                gl_FragColor = vec4(packIntToRGB(group), 1.0);
            }
        #endif
    #elif defined(dRenderVariant_depth)
        if (uRenderMask == MaskOpaque) {
            gl_FragColor = packDepthToRGBA(fragmentDepth);
        } else if (uRenderMask == MaskTransparent) {
            gl_FragColor = packDepthWithAlphaToRGBA(fragmentDepth, material.a);
        }
    #elif defined(dRenderVariant_marking)
        if (uMarkingType == 1) {
            if (marker > 0.0)
                discard;
            gl_FragColor = packDepthToRGBA(fragmentDepth);
        } else {
            if (marker == 0.0)
                discard;
            float depthTest = 1.0;
            if (uMarkingDepthTest) {
                depthTest = (fragmentDepth >= getDepthPacked(gl_FragCoord.xy / uDrawingBufferSize)) ? 1.0 : 0.0;
            }
            bool isHighlight = intMod(marker, 2.0) > 0.1;
            float viewZ = depthToViewZ(uIsOrtho, fragmentDepth, uNear, uFar);
            float fogFactor = smoothstep(uFogNear, uFogFar, abs(viewZ));
            if (fogFactor == 1.0)
                discard;
            gl_FragColor = vec4(0.0, depthTest, isHighlight ? 1.0 : 0.0, 1.0 - fogFactor);
        }
    #elif defined(dRenderVariant_emissive)
        gl_FragColor = vec4(emissive);
    #elif defined(dRenderVariant_color) || defined(dRenderVariant_tracing)
        #ifdef dUsePalette
            if (material.rgb == vec3(1.0)) {
                material.rgb = uPaletteDefault;
            } else {
                float v = ((material.r * 256.0 * 256.0 * 255.0 + material.g * 256.0 * 255.0 + material.b * 255.0) - 1.0) / PALETTE_SCALE;
                material.rgb = texture2D(tPalette, vec2(v, 0.0)).rgb;
            }
        #endif

        // mix material with overpaint
        #if defined(dOverpaint)
            vec4 overpaint = vec4(0.0);
            if (group != -1.0) {
                #if defined(dOverpaintType_instance)
                    overpaint = readFromTexture(tOverpaint, vInstance, uOverpaintTexDim);
                #elif defined(dOverpaintType_groupInstance)
                    overpaint = readFromTexture(tOverpaint, vInstance * float(uGroupCount) + group, uOverpaintTexDim);
                #endif
                overpaint *= uOverpaintStrength;
            }
            material.rgb = mix(material.rgb, overpaint.rgb, overpaint.a);
        #endif

        gl_FragColor = material;
        #include apply_marker_color

        #if defined(dRenderVariant_color)
            #include apply_fog
            #include wboit_write
            #include dpoit_write
        #elif defined(dRenderVariant_tracing)
            gl_FragData[1] = vec4(normalize(vViewPosition), emissive);
            gl_FragData[2] = vec4(material.rgb, uDensity);
        #endif
    #endif
}
`,ee=(0,t.q)(),er={apply_fog:a,apply_interior_color:n,apply_light_color:o,apply_marker_color:l,assign_clipping_varying:d,assign_color_varying:c,assign_group:f,assign_marker_varying:s,assign_material_color:u,assign_position:m,assign_size:p,check_picking_alpha:g,check_transparency:v,clip_instance:h,clip_pixel:y,color_frag_params:x,color_vert_params:b,common_animation:_,common_clip:I,common_frag_params:C,common_vert_params:D,common:T,fade_lod:S,float_to_rgba:P,light_frag_params:w,normal_frag_params:F,read_from_texture:k,rgba_to_float:B,size_vert_params:z,texture3d_from_1d_trilinear:O,texture3d_from_2d_linear:R,texture3d_from_2d_nearest:A,wboit_write:G,dpoit_write:V},ei=/^(?!\/\/)\s*#include\s+(\S+)/gm,et=/[ \t]*\/\/.*\n/g,ea=/[ \t]*\/\*[\s\S]*?\*\//g,en=/\n{2,}/g;function eo(e){return e.replace(ei,(e,r)=>{let i=er[r];if(!i)throw Error(`empty chunk, '${r}'`);return i}).trim().replace(et,"\n").replace(ea,"\n").replace(en,"\n")}function el(e,r,i,t={},a={},n){return{id:ee(),name:e,vert:eo(r),frag:eo(i),extensions:t,outTypes:a,ignoreDefine:n}}function ed(e,r,i){var t;if(r.startsWith("color")||"tracing"===r){if("dLightCount"===e)return!!(null==(t=i.dIgnoreLight)?void 0:t.ref.value)}else{let i=["dSubstanceType","dSubstance","dColorMarker","dCelShaded","dLightCount"];return"depth"===r||r.startsWith("pick")||i.push("dXrayShaded"),"emissive"!==r&&i.push("dColorType","dUsePalette","dOverpaintType","dOverpaint","dEmissiveType","dEmissive"),i.includes(e)}return!1}function ec(e,r,i){return"dLightCount"===e||ed(e,r,i)}el("points",M,E,{drawBuffers:"optional"},{},ec),el("spheres",Q,N,{fragDepth:"required",drawBuffers:"optional"},{},ed),el("cylinders",L,j,{fragDepth:"required",drawBuffers:"optional"},{},ed),el("text",q,U,{fragDepth:"optional",drawBuffers:"optional"},{},ec),el("lines",Z,W,{drawBuffers:"optional"},{},ec),el("mesh",Y,H,{drawBuffers:"optional"},{},ed),el("direct-volume",X,$,{fragDepth:"optional",drawBuffers:"optional"},{},ed),el("image",J,K,{drawBuffers:"optional"},{},ec)},90070:(e,r,i)=>{i.d(r,{Gg:()=>d,MD:()=>m,Ti:()=>s,UG:()=>l,dn:()=>c,m6:()=>f});var t=i(66615),a=i(9566),n=i(23155),o=i(99603);function l(e,r,i,t){for(let a=r;a<i;++a)e[a]=255*t;return!0}function d(e,r){if(0===r||e.length<r)return 0;let i=0;for(let t=0;t<r;++t)i+=e[t];return i/(255*r)}function c(e,r){if(0===r||e.length<r)return 1;let i=255;for(let t=0;t<r;++t)e[t]>0&&e[t]<i&&(i=e[t]);return i/255}function f(e,r,i){e.fill(0,r,i)}function s(e,r,i){let l=(0,n.xg)(Math.max(1,e),1,Uint8Array,i&&i.tTransparency.ref.value.array);return i?(t.IQ.update(i.tTransparency,l),t.IQ.update(i.uTransparencyTexDim,a.ZY.create(l.width,l.height)),t.IQ.updateIfChanged(i.dTransparency,e>0),t.IQ.updateIfChanged(i.transparencyAverage,d(l.array,e)),t.IQ.updateIfChanged(i.transparencyMin,c(l.array,e)),t.IQ.updateIfChanged(i.dTransparencyType,r),i):{tTransparency:t.IQ.create(l),uTransparencyTexDim:t.IQ.create(a.ZY.create(l.width,l.height)),dTransparency:t.IQ.create(e>0),transparencyAverage:t.IQ.create(0),transparencyMin:t.IQ.create(1),tTransparencyGrid:t.IQ.create((0,o.z6)()),uTransparencyGridDim:t.IQ.create(a.eB.create(1,1,1)),uTransparencyGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dTransparencyType:t.IQ.create(r),uTransparencyStrength:t.IQ.create(1)}}let u={array:new Uint8Array(1),width:1,height:1};function m(e){return e?(t.IQ.update(e.tTransparency,u),t.IQ.update(e.uTransparencyTexDim,a.ZY.create(1,1)),e):{tTransparency:t.IQ.create(u),uTransparencyTexDim:t.IQ.create(a.ZY.create(1,1)),dTransparency:t.IQ.create(!1),transparencyAverage:t.IQ.create(0),transparencyMin:t.IQ.create(1),tTransparencyGrid:t.IQ.create((0,o.z6)()),uTransparencyGridDim:t.IQ.create(a.eB.create(1,1,1)),uTransparencyGridTransform:t.IQ.create(a.Zb.create(0,0,0,1)),dTransparencyType:t.IQ.create("groupInstance"),uTransparencyStrength:t.IQ.create(1)}}},99603:(e,r,i)=>{i.d(r,{NP:()=>o,z1:()=>n,z6:()=>l}),i(20430);var t=i(37897);i(3766),i(61500),i(20361);let a=(0,t.q)();function n(e,r,i){let{resources:t}=e,a=[];return Object.keys(r).forEach(e=>{let n=r[e];if("texture"===n.type){let r=i[e];if(r)if("texture"===n.kind)a[a.length]=[e,r.ref.value];else{let i=t.texture(n.kind,n.format,n.dataType,n.filter);i.load(r.ref.value),a[a.length]=[e,i]}}}),a}function o(e){return -1===e.format}function l(e){var r;let i=null!=(r=null==e?void 0:e.TEXTURE_2D)?r:3553;return{id:a(),target:i,format:-1,internalFormat:0,type:0,filter:0,getWidth:()=>0,getHeight:()=>0,getDepth:()=>0,getByteCount:()=>0,define:()=>{},load:()=>{},mipmap:()=>{},bind:r=>{e&&(e.activeTexture(e.TEXTURE0+r),e.bindTexture(i,null))},unbind:r=>{e&&(e.activeTexture(e.TEXTURE0+r),e.bindTexture(i,null))},attachFramebuffer:()=>{throw Error("cannot attach null-texture to a framebuffer")},detachFramebuffer:()=>{throw Error("cannot detach null-texture from a framebuffer")},reset:()=>{},destroy:()=>{}}}}}]);