"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6247],{15729:(e,t,n)=>{n.d(t,{default:()=>i.a});var r=n(34474),i=n.n(r)},18244:(e,t,n)=>{function r({moduleIds:e}){return null}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"PreloadChunks",{enumerable:!0,get:function(){return r}}),n(77116),n(40193),n(74003),n(44474),n(5206)},27485:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0});var n={bindSnapshot:function(){return u},createAsyncLocalStorage:function(){return s},createSnapshot:function(){return l}};for(var r in n)Object.defineProperty(t,r,{enumerable:!0,get:n[r]});let i=Object.defineProperty(Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"),"__NEXT_ERROR_CODE",{value:"E504",enumerable:!1,configurable:!0});class o{disable(){throw i}getStore(){}run(){throw i}exit(){throw i}enterWith(){throw i}static bind(e){return e}}let a="u">typeof globalThis&&globalThis.AsyncLocalStorage;function s(){return a?new a:new o}function u(e){return a?a.bind(e):o.bind(e)}function l(){return a?a.snapshot():function(e,...t){return e(...t)}}},34474:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return i}});let r=n(46604)._(n(47706));function i(e,t){let n={};"function"==typeof e&&(n.loader=e);let i={...n,...t};return(0,r.default)({...i,modules:i.loadableGenerated?.modules})}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},47706:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"default",{enumerable:!0,get:function(){return u}});let r=n(77116),i=n(59600),o=n(82361);function a(e){return{default:e&&"default"in e?e.default:e}}n(18244);let s={loader:()=>Promise.resolve(a(()=>null)),loading:null,ssr:!0},u=function(e){let t={...s,...e},n=(0,i.lazy)(()=>t.loader().then(a)),u=t.loading;function l(e){let a=u?(0,r.jsx)(u,{isLoading:!0,pastDelay:!0,error:null}):null,s=!t.ssr||!!t.loading,l=s?i.Suspense:i.Fragment,d=t.ssr?(0,r.jsxs)(r.Fragment,{children:[null,(0,r.jsx)(n,{...e})]}):(0,r.jsx)(o.BailoutToCSR,{reason:"next/dynamic",children:(0,r.jsx)(n,{...e})});return(0,r.jsx)(l,{...s?{fallback:a}:{},children:d})}return l.displayName="LoadableComponent",l}},50910:(e,t,n)=>{var r,i;function o(e,t,n){function r(n,r){if(n._zod||Object.defineProperty(n,"_zod",{value:{def:r,constr:a,traits:new Set},enumerable:!1}),n._zod.traits.has(e))return;n._zod.traits.add(e),t(n,r);let i=a.prototype,o=Object.keys(i);for(let e=0;e<o.length;e++){let t=o[e];t in n||(n[t]=i[t].bind(n))}}let i=n?.Parent??Object;class o extends i{}function a(e){var t;let i=n?.Parent?new o:this;for(let n of(r(i,e),(t=i._zod).deferred??(t.deferred=[]),i._zod.deferred))n();return i}return Object.defineProperty(o,"name",{value:e}),Object.defineProperty(a,"init",{value:r}),Object.defineProperty(a,Symbol.hasInstance,{value:t=>!!n?.Parent&&t instanceof n.Parent||t?._zod?.traits?.has(e)}),Object.defineProperty(a,"name",{value:e}),a}n.d(t,{EB:()=>nl,YO:()=>nL,k5:()=>nW,ai:()=>nP,Ik:()=>nM,g1:()=>nJ,Yj:()=>nu}),Symbol("zod_brand");class a extends Error{constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}}class s extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`),this.name="ZodEncodeError"}}(r=globalThis).__zod_globalConfig??(r.__zod_globalConfig={});let u=globalThis.__zod_globalConfig;function l(e){return e&&Object.assign(u,e),u}let d=/^[cC][0-9a-z]{6,}$/,c=/^[0-9a-z]+$/,f=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,p=/^[0-9a-vA-V]{20}$/,h=/^[A-Za-z0-9]{27}$/,m=/^[a-zA-Z0-9_-]{21}$/,v=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,y=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,g=e=>e?RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`):/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,_=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,b=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,z=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,w=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,S=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,k=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,x=/^[A-Za-z0-9_-]*$/,O=/^https?$/,E=/^\+[1-9]\d{6,14}$/,$="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",A=RegExp(`^${$}$`);function P(e){let t="(?:[01]\\d|2[0-3]):[0-5]\\d";return"number"==typeof e.precision?-1===e.precision?`${t}`:0===e.precision?`${t}:[0-5]\\d`:`${t}:[0-5]\\d\\.\\d{${e.precision}}`:`${t}(?::[0-5]\\d(?:\\.\\d+)?)?`}let T=/^-?\d+$/,j=/^-?\d+(?:\.\d+)?$/,Z=/^[^A-Z]*$/,N=/^[^a-z]*$/;function U(e){let t=Object.values(e).filter(e=>"number"==typeof e);return Object.entries(e).filter(([e,n])=>-1===t.indexOf(+e)).map(([e,t])=>t)}function I(e,t){return"bigint"==typeof t?t.toString():t}function L(e){return{get value(){{let t=e();return Object.defineProperty(this,"value",{value:t}),t}}}}function C(e){let t=+!!e.startsWith("^"),n=e.endsWith("$")?e.length-1:e.length;return e.slice(t,n)}let M=Symbol("evaluating");function R(e,t,n){let r;Object.defineProperty(e,t,{get(){if(r!==M)return void 0===r&&(r=M,r=n()),r},set(n){Object.defineProperty(e,t,{value:n})},configurable:!0})}function D(e,t,n){Object.defineProperty(e,t,{value:n,writable:!0,enumerable:!0,configurable:!0})}function F(...e){let t={};for(let n of e)Object.assign(t,Object.getOwnPropertyDescriptors(n));return Object.defineProperties({},t)}function J(e){return JSON.stringify(e)}let B="captureStackTrace"in Error?Error.captureStackTrace:(...e)=>{};function W(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}let H=L(()=>{if(u.jitless||"u">typeof navigator&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{return Function(""),!0}catch(e){return!1}});function V(e){if(!1===W(e))return!1;let t=e.constructor;if(void 0===t||"function"!=typeof t)return!0;let n=t.prototype;return!1!==W(n)&&!1!==Object.prototype.hasOwnProperty.call(n,"isPrototypeOf")}function q(e){return V(e)?{...e}:Array.isArray(e)?[...e]:e instanceof Map?new Map(e):e instanceof Set?new Set(e):e}let G=new Set(["string","number","symbol"]);function K(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function X(e,t,n){let r=new e._zod.constr(t??e._zod.def);return(!t||n?.parent)&&(r._zod.parent=e),r}function Q(e){if(!e)return{};if("string"==typeof e)return{error:()=>e};if(e?.message!==void 0){if(e?.error!==void 0)throw Error("Cannot specify both `message` and `error` params");e.error=e.message}return(delete e.message,"string"==typeof e.error)?{...e,error:()=>e.error}:e}let Y={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-0x80000000,0x7fffffff],uint32:[0,0xffffffff],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]};function ee(e,t=0){if(!0===e.aborted)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue!==!0)return!0;return!1}function et(e,t){return t.map(t=>(t.path??(t.path=[]),t.path.unshift(e),t))}function en(e){return"string"==typeof e?e:e?.message}function er(e,t,n){let r=e.message?e.message:en(e.inst?._zod.def?.error?.(e))??en(t?.error?.(e))??en(n.customError?.(e))??en(n.localeError?.(e))??"Invalid input",{inst:i,continue:o,input:a,...s}=e;return s.path??(s.path=[]),s.message=r,t?.reportInput&&(s.input=a),s}function ei(e){return Array.isArray(e)?"array":"string"==typeof e?"string":"unknown"}function eo(...e){let[t,n,r]=e;return"string"==typeof t?{message:t,code:"custom",input:n,inst:r}:{...t}}let ea=o("$ZodCheck",(e,t)=>{var n;e._zod??(e._zod={}),e._zod.def=t,(n=e._zod).onattach??(n.onattach=[])}),es={number:"number",bigint:"bigint",object:"date"},eu=o("$ZodCheckLessThan",(e,t)=>{ea.init(e,t);let n=es[typeof t.value];e._zod.onattach.push(e=>{let n=e._zod.bag,r=(t.inclusive?n.maximum:n.exclusiveMaximum)??1/0;t.value<r&&(t.inclusive?n.maximum=t.value:n.exclusiveMaximum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value<=t.value:r.value<t.value)||r.issues.push({origin:n,code:"too_big",maximum:"object"==typeof t.value?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),el=o("$ZodCheckGreaterThan",(e,t)=>{ea.init(e,t);let n=es[typeof t.value];e._zod.onattach.push(e=>{let n=e._zod.bag,r=(t.inclusive?n.minimum:n.exclusiveMinimum)??-1/0;t.value>r&&(t.inclusive?n.minimum=t.value:n.exclusiveMinimum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value>=t.value:r.value>t.value)||r.issues.push({origin:n,code:"too_small",minimum:"object"==typeof t.value?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),ed=o("$ZodCheckMultipleOf",(e,t)=>{ea.init(e,t),e._zod.onattach.push(e=>{var n;(n=e._zod.bag).multipleOf??(n.multipleOf=t.value)}),e._zod.check=n=>{let r,i,o;if(typeof n.value!=typeof t.value)throw Error("Cannot mix number and bigint in multiple_of check.");("bigint"==typeof n.value?n.value%t.value===BigInt(0):0==(i=Math.round(r=n.value/t.value),o=Number.EPSILON*Math.max(Math.abs(r),1),Math.abs(r-i)<o?0:r-i))||n.issues.push({origin:typeof n.value,code:"not_multiple_of",divisor:t.value,input:n.value,inst:e,continue:!t.abort})}}),ec=o("$ZodCheckNumberFormat",(e,t)=>{ea.init(e,t),t.format=t.format||"float64";let n=t.format?.includes("int"),r=n?"int":"number",[i,o]=Y[t.format];e._zod.onattach.push(e=>{let r=e._zod.bag;r.format=t.format,r.minimum=i,r.maximum=o,n&&(r.pattern=T)}),e._zod.check=a=>{let s=a.value;if(n){if(!Number.isInteger(s))return void a.issues.push({expected:r,format:t.format,code:"invalid_type",continue:!1,input:s,inst:e});if(!Number.isSafeInteger(s))return void(s>0?a.issues.push({input:s,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:r,inclusive:!0,continue:!t.abort}):a.issues.push({input:s,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:r,inclusive:!0,continue:!t.abort}))}s<i&&a.issues.push({origin:"number",input:s,code:"too_small",minimum:i,inclusive:!0,inst:e,continue:!t.abort}),s>o&&a.issues.push({origin:"number",input:s,code:"too_big",maximum:o,inclusive:!0,inst:e,continue:!t.abort})}}),ef=o("$ZodCheckMaxLength",(e,t)=>{var n;ea.init(e,t),(n=e._zod.def).when??(n.when=e=>{let t=e.value;return null!=t&&void 0!==t.length}),e._zod.onattach.push(e=>{let n=e._zod.bag.maximum??1/0;t.maximum<n&&(e._zod.bag.maximum=t.maximum)}),e._zod.check=n=>{let r=n.value;if(r.length<=t.maximum)return;let i=ei(r);n.issues.push({origin:i,code:"too_big",maximum:t.maximum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),ep=o("$ZodCheckMinLength",(e,t)=>{var n;ea.init(e,t),(n=e._zod.def).when??(n.when=e=>{let t=e.value;return null!=t&&void 0!==t.length}),e._zod.onattach.push(e=>{let n=e._zod.bag.minimum??-1/0;t.minimum>n&&(e._zod.bag.minimum=t.minimum)}),e._zod.check=n=>{let r=n.value;if(r.length>=t.minimum)return;let i=ei(r);n.issues.push({origin:i,code:"too_small",minimum:t.minimum,inclusive:!0,input:r,inst:e,continue:!t.abort})}}),eh=o("$ZodCheckLengthEquals",(e,t)=>{var n;ea.init(e,t),(n=e._zod.def).when??(n.when=e=>{let t=e.value;return null!=t&&void 0!==t.length}),e._zod.onattach.push(e=>{let n=e._zod.bag;n.minimum=t.length,n.maximum=t.length,n.length=t.length}),e._zod.check=n=>{let r=n.value,i=r.length;if(i===t.length)return;let o=ei(r),a=i>t.length;n.issues.push({origin:o,...a?{code:"too_big",maximum:t.length}:{code:"too_small",minimum:t.length},inclusive:!0,exact:!0,input:n.value,inst:e,continue:!t.abort})}}),em=o("$ZodCheckStringFormat",(e,t)=>{var n,r;ea.init(e,t),e._zod.onattach.push(e=>{let n=e._zod.bag;n.format=t.format,t.pattern&&(n.patterns??(n.patterns=new Set),n.patterns.add(t.pattern))}),t.pattern?(n=e._zod).check??(n.check=n=>{t.pattern.lastIndex=0,t.pattern.test(n.value)||n.issues.push({origin:"string",code:"invalid_format",format:t.format,input:n.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})}):(r=e._zod).check??(r.check=()=>{})}),ev=o("$ZodCheckRegex",(e,t)=>{em.init(e,t),e._zod.check=n=>{t.pattern.lastIndex=0,t.pattern.test(n.value)||n.issues.push({origin:"string",code:"invalid_format",format:"regex",input:n.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),ey=o("$ZodCheckLowerCase",(e,t)=>{t.pattern??(t.pattern=Z),em.init(e,t)}),eg=o("$ZodCheckUpperCase",(e,t)=>{t.pattern??(t.pattern=N),em.init(e,t)}),e_=o("$ZodCheckIncludes",(e,t)=>{ea.init(e,t);let n=K(t.includes),r=new RegExp("number"==typeof t.position?`^.{${t.position}}${n}`:n);t.pattern=r,e._zod.onattach.push(e=>{let t=e._zod.bag;t.patterns??(t.patterns=new Set),t.patterns.add(r)}),e._zod.check=n=>{n.value.includes(t.includes,t.position)||n.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:t.includes,input:n.value,inst:e,continue:!t.abort})}}),eb=o("$ZodCheckStartsWith",(e,t)=>{ea.init(e,t);let n=RegExp(`^${K(t.prefix)}.*`);t.pattern??(t.pattern=n),e._zod.onattach.push(e=>{let t=e._zod.bag;t.patterns??(t.patterns=new Set),t.patterns.add(n)}),e._zod.check=n=>{n.value.startsWith(t.prefix)||n.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:t.prefix,input:n.value,inst:e,continue:!t.abort})}}),ez=o("$ZodCheckEndsWith",(e,t)=>{ea.init(e,t);let n=RegExp(`.*${K(t.suffix)}$`);t.pattern??(t.pattern=n),e._zod.onattach.push(e=>{let t=e._zod.bag;t.patterns??(t.patterns=new Set),t.patterns.add(n)}),e._zod.check=n=>{n.value.endsWith(t.suffix)||n.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:t.suffix,input:n.value,inst:e,continue:!t.abort})}}),ew=o("$ZodCheckOverwrite",(e,t)=>{ea.init(e,t),e._zod.check=e=>{e.value=t.tx(e.value)}});class eS{constructor(e=[]){this.content=[],this.indent=0,this&&(this.args=e)}indented(e){this.indent+=1,e(this),this.indent-=1}write(e){if("function"==typeof e){e(this,{execution:"sync"}),e(this,{execution:"async"});return}let t=e.split("\n").filter(e=>e),n=Math.min(...t.map(e=>e.length-e.trimStart().length));for(let e of t.map(e=>e.slice(n)).map(e=>" ".repeat(2*this.indent)+e))this.content.push(e)}compile(){return Function(...this?.args,[...(this?.content??[""]).map(e=>`  ${e}`)].join("\n"))}}let ek=(e,t)=>{e.name="$ZodError",Object.defineProperty(e,"_zod",{value:e._zod,enumerable:!1}),Object.defineProperty(e,"issues",{value:t,enumerable:!1}),e.message=JSON.stringify(t,I,2),Object.defineProperty(e,"toString",{value:()=>e.message,enumerable:!1})},ex=o("$ZodError",ek),eO=o("$ZodError",ek,{Parent:Error}),eE=e=>(t,n,r,i)=>{let o=r?{...r,async:!1}:{async:!1},s=t._zod.run({value:n,issues:[]},o);if(s instanceof Promise)throw new a;if(s.issues.length){let t=new(i?.Err??e)(s.issues.map(e=>er(e,o,l())));throw B(t,i?.callee),t}return s.value},e$=e=>async(t,n,r,i)=>{let o=r?{...r,async:!0}:{async:!0},a=t._zod.run({value:n,issues:[]},o);if(a instanceof Promise&&(a=await a),a.issues.length){let t=new(i?.Err??e)(a.issues.map(e=>er(e,o,l())));throw B(t,i?.callee),t}return a.value},eA=e=>(t,n,r)=>{let i=r?{...r,async:!1}:{async:!1},o=t._zod.run({value:n,issues:[]},i);if(o instanceof Promise)throw new a;return o.issues.length?{success:!1,error:new(e??ex)(o.issues.map(e=>er(e,i,l())))}:{success:!0,data:o.value}},eP=eA(eO),eT=e=>async(t,n,r)=>{let i=r?{...r,async:!0}:{async:!0},o=t._zod.run({value:n,issues:[]},i);return o instanceof Promise&&(o=await o),o.issues.length?{success:!1,error:new e(o.issues.map(e=>er(e,i,l())))}:{success:!0,data:o.value}},ej=eT(eO),eZ={major:4,minor:4,patch:3},eN=o("$ZodType",(e,t)=>{var n;e??(e={}),e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=eZ;let r=[...e._zod.def.checks??[]];for(let t of(e._zod.traits.has("$ZodCheck")&&r.unshift(e),r))for(let n of t._zod.onattach)n(e);if(0===r.length)(n=e._zod).deferred??(n.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{let t=(e,t,n)=>{let r,i=ee(e);for(let o of t){if(o._zod.def.when){if(function(e,t=0){if(!0===e.aborted)return!0;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue===!1)return!0;return!1}(e)||!o._zod.def.when(e))continue}else if(i)continue;let t=e.issues.length,s=o._zod.check(e);if(s instanceof Promise&&n?.async===!1)throw new a;if(r||s instanceof Promise)r=(r??Promise.resolve()).then(async()=>{await s,e.issues.length!==t&&(i||(i=ee(e,t)))});else{if(e.issues.length===t)continue;i||(i=ee(e,t))}}return r?r.then(()=>e):e},n=(n,i,o)=>{if(ee(n))return n.aborted=!0,n;let s=t(i,r,o);if(s instanceof Promise){if(!1===o.async)throw new a;return s.then(t=>e._zod.parse(t,o))}return e._zod.parse(s,o)};e._zod.run=(i,o)=>{if(o.skipChecks)return e._zod.parse(i,o);if("backward"===o.direction){let t=e._zod.parse({value:i.value,issues:[]},{...o,skipChecks:!0});return t instanceof Promise?t.then(e=>n(e,i,o)):n(t,i,o)}let s=e._zod.parse(i,o);if(s instanceof Promise){if(!1===o.async)throw new a;return s.then(e=>t(e,r,o))}return t(s,r,o)}}R(e,"~standard",()=>({validate:t=>{try{let n=eP(e,t);return n.success?{value:n.data}:{issues:n.error?.issues}}catch(n){return ej(e,t).then(e=>e.success?{value:e.data}:{issues:e.error?.issues})}},vendor:"zod",version:1}))}),eU=o("$ZodString",(e,t)=>{var n;let r;eN.init(e,t),e._zod.pattern=[...e?._zod.bag?.patterns??[]].pop()??(r=(n=e._zod.bag)?`[\\s\\S]{${n?.minimum??0},${n?.maximum??""}}`:"[\\s\\S]*",RegExp(`^${r}$`)),e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=String(n.value)}catch(e){}return"string"==typeof n.value||n.issues.push({expected:"string",code:"invalid_type",input:n.value,inst:e}),n}}),eI=o("$ZodStringFormat",(e,t)=>{em.init(e,t),eU.init(e,t)}),eL=o("$ZodGUID",(e,t)=>{t.pattern??(t.pattern=y),eI.init(e,t)}),eC=o("$ZodUUID",(e,t)=>{if(t.version){let e={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(void 0===e)throw Error(`Invalid UUID version: "${t.version}"`);t.pattern??(t.pattern=g(e))}else t.pattern??(t.pattern=g());eI.init(e,t)}),eM=o("$ZodEmail",(e,t)=>{t.pattern??(t.pattern=_),eI.init(e,t)}),eR=o("$ZodURL",(e,t)=>{eI.init(e,t),e._zod.check=n=>{try{let r=n.value.trim();if(!t.normalize&&t.protocol?.source===O.source&&!/^https?:\/\//i.test(r))return void n.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:n.value,inst:e,continue:!t.abort});let i=new URL(r);t.hostname&&(t.hostname.lastIndex=0,t.hostname.test(i.hostname)||n.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:t.hostname.source,input:n.value,inst:e,continue:!t.abort})),t.protocol&&(t.protocol.lastIndex=0,t.protocol.test(i.protocol.endsWith(":")?i.protocol.slice(0,-1):i.protocol)||n.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:t.protocol.source,input:n.value,inst:e,continue:!t.abort})),t.normalize?n.value=i.href:n.value=r;return}catch(r){n.issues.push({code:"invalid_format",format:"url",input:n.value,inst:e,continue:!t.abort})}}}),eD=o("$ZodEmoji",(e,t)=>{t.pattern??(t.pattern=RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$","u")),eI.init(e,t)}),eF=o("$ZodNanoID",(e,t)=>{t.pattern??(t.pattern=m),eI.init(e,t)}),eJ=o("$ZodCUID",(e,t)=>{t.pattern??(t.pattern=d),eI.init(e,t)}),eB=o("$ZodCUID2",(e,t)=>{t.pattern??(t.pattern=c),eI.init(e,t)}),eW=o("$ZodULID",(e,t)=>{t.pattern??(t.pattern=f),eI.init(e,t)}),eH=o("$ZodXID",(e,t)=>{t.pattern??(t.pattern=p),eI.init(e,t)}),eV=o("$ZodKSUID",(e,t)=>{t.pattern??(t.pattern=h),eI.init(e,t)}),eq=o("$ZodISODateTime",(e,t)=>{let n,r,i;t.pattern??(n=P({precision:t.precision}),r=["Z"],t.local&&r.push(""),t.offset&&r.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)"),i=`${n}(?:${r.join("|")})`,t.pattern=RegExp(`^${$}T(?:${i})$`)),eI.init(e,t)}),eG=o("$ZodISODate",(e,t)=>{t.pattern??(t.pattern=A),eI.init(e,t)}),eK=o("$ZodISOTime",(e,t)=>{t.pattern??(t.pattern=RegExp(`^${P(t)}$`)),eI.init(e,t)}),eX=o("$ZodISODuration",(e,t)=>{t.pattern??(t.pattern=v),eI.init(e,t)}),eQ=o("$ZodIPv4",(e,t)=>{t.pattern??(t.pattern=b),eI.init(e,t),e._zod.bag.format="ipv4"}),eY=o("$ZodIPv6",(e,t)=>{t.pattern??(t.pattern=z),eI.init(e,t),e._zod.bag.format="ipv6",e._zod.check=n=>{try{new URL(`http://[${n.value}]`)}catch{n.issues.push({code:"invalid_format",format:"ipv6",input:n.value,inst:e,continue:!t.abort})}}}),e0=o("$ZodCIDRv4",(e,t)=>{t.pattern??(t.pattern=w),eI.init(e,t)}),e1=o("$ZodCIDRv6",(e,t)=>{t.pattern??(t.pattern=S),eI.init(e,t),e._zod.check=n=>{let r=n.value.split("/");try{if(2!==r.length)throw Error();let[e,t]=r;if(!t)throw Error();let n=Number(t);if(`${n}`!==t||n<0||n>128)throw Error();new URL(`http://[${e}]`)}catch{n.issues.push({code:"invalid_format",format:"cidrv6",input:n.value,inst:e,continue:!t.abort})}}});function e2(e){if(""===e)return!0;if(/\s/.test(e)||e.length%4!=0)return!1;try{return atob(e),!0}catch{return!1}}let e4=o("$ZodBase64",(e,t)=>{t.pattern??(t.pattern=k),eI.init(e,t),e._zod.bag.contentEncoding="base64",e._zod.check=n=>{e2(n.value)||n.issues.push({code:"invalid_format",format:"base64",input:n.value,inst:e,continue:!t.abort})}}),e3=o("$ZodBase64URL",(e,t)=>{t.pattern??(t.pattern=x),eI.init(e,t),e._zod.bag.contentEncoding="base64url",e._zod.check=n=>{!function(e){if(!x.test(e))return!1;let t=e.replace(/[-_]/g,e=>"-"===e?"+":"/");return e2(t.padEnd(4*Math.ceil(t.length/4),"="))}(n.value)&&n.issues.push({code:"invalid_format",format:"base64url",input:n.value,inst:e,continue:!t.abort})}}),e9=o("$ZodE164",(e,t)=>{t.pattern??(t.pattern=E),eI.init(e,t)}),e6=o("$ZodJWT",(e,t)=>{eI.init(e,t),e._zod.check=n=>{!function(e,t=null){try{let n=e.split(".");if(3!==n.length)return!1;let[r]=n;if(!r)return!1;let i=JSON.parse(atob(r));if("typ"in i&&i?.typ!=="JWT"||!i.alg||t&&(!("alg"in i)||i.alg!==t))return!1;return!0}catch{return!1}}(n.value,t.alg)&&n.issues.push({code:"invalid_format",format:"jwt",input:n.value,inst:e,continue:!t.abort})}}),e5=o("$ZodNumber",(e,t)=>{eN.init(e,t),e._zod.pattern=e._zod.bag.pattern??j,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=Number(n.value)}catch(e){}let i=n.value;if("number"==typeof i&&!Number.isNaN(i)&&Number.isFinite(i))return n;let o="number"==typeof i?Number.isNaN(i)?"NaN":Number.isFinite(i)?void 0:"Infinity":void 0;return n.issues.push({expected:"number",code:"invalid_type",input:i,inst:e,...o?{received:o}:{}}),n}}),e7=o("$ZodNumberFormat",(e,t)=>{ec.init(e,t),e5.init(e,t)}),e8=o("$ZodUnknown",(e,t)=>{eN.init(e,t),e._zod.parse=e=>e}),te=o("$ZodNever",(e,t)=>{eN.init(e,t),e._zod.parse=(t,n)=>(t.issues.push({expected:"never",code:"invalid_type",input:t.value,inst:e}),t)});function tt(e,t,n){e.issues.length&&t.issues.push(...et(n,e.issues)),t.value[n]=e.value}let tn=o("$ZodArray",(e,t)=>{eN.init(e,t),e._zod.parse=(n,r)=>{let i=n.value;if(!Array.isArray(i))return n.issues.push({expected:"array",code:"invalid_type",input:i,inst:e}),n;n.value=Array(i.length);let o=[];for(let e=0;e<i.length;e++){let a=i[e],s=t.element._zod.run({value:a,issues:[]},r);s instanceof Promise?o.push(s.then(t=>tt(t,n,e))):tt(s,n,e)}return o.length?Promise.all(o).then(()=>n):n}});function tr(e,t,n,r,i,o){let a=n in r;if(e.issues.length){if(i&&o&&!a)return;t.issues.push(...et(n,e.issues))}if(!a&&!i){e.issues.length||t.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[n]});return}void 0===e.value?a&&(t.value[n]=void 0):t.value[n]=e.value}function ti(e){var t;let n=Object.keys(e.shape);for(let t of n)if(!e.shape?.[t]?._zod?.traits?.has("$ZodType"))throw Error(`Invalid element at key "${t}": expected a Zod schema`);let r=Object.keys(t=e.shape).filter(e=>"optional"===t[e]._zod.optin&&"optional"===t[e]._zod.optout);return{...e,keys:n,keySet:new Set(n),numKeys:n.length,optionalKeys:new Set(r)}}function to(e,t,n,r,i,o){let a=[],s=i.keySet,u=i.catchall._zod,l=u.def.type,d="optional"===u.optin,c="optional"===u.optout;for(let i in t){if("__proto__"===i||s.has(i))continue;if("never"===l){a.push(i);continue}let o=u.run({value:t[i],issues:[]},r);o instanceof Promise?e.push(o.then(e=>tr(e,n,i,t,d,c))):tr(o,n,i,t,d,c)}return(a.length&&n.issues.push({code:"unrecognized_keys",keys:a,input:t,inst:o}),e.length)?Promise.all(e).then(()=>n):n}let ta=o("$ZodObject",(e,t)=>{let n;eN.init(e,t);let r=Object.getOwnPropertyDescriptor(t,"shape");if(!r?.get){let e=t.shape;Object.defineProperty(t,"shape",{get:()=>{let n={...e};return Object.defineProperty(t,"shape",{value:n}),n}})}let i=L(()=>ti(t));R(e._zod,"propValues",()=>{let e=t.shape,n={};for(let t in e){let r=e[t]._zod;if(r.values)for(let e of(n[t]??(n[t]=new Set),r.values))n[t].add(e)}return n});let o=t.catchall;e._zod.parse=(t,r)=>{n??(n=i.value);let a=t.value;if(!W(a))return t.issues.push({expected:"object",code:"invalid_type",input:a,inst:e}),t;t.value={};let s=[],u=n.shape;for(let e of n.keys){let n=u[e],i="optional"===n._zod.optin,o="optional"===n._zod.optout,l=n._zod.run({value:a[e],issues:[]},r);l instanceof Promise?s.push(l.then(n=>tr(n,t,e,a,i,o))):tr(l,t,e,a,i,o)}return o?to(s,a,t,r,i.value,e):s.length?Promise.all(s).then(()=>t):t}}),ts=o("$ZodObjectJIT",(e,t)=>{let n,r;ta.init(e,t);let i=e._zod.parse,o=L(()=>ti(t)),a=!u.jitless,s=a&&H.value,l=t.catchall;e._zod.parse=(u,d)=>{r??(r=o.value);let c=u.value;return W(c)?a&&s&&d?.async===!1&&!0!==d.jitless?(n||(n=(e=>{let t=new eS(["shape","payload","ctx"]),n=o.value,r=e=>{let t=J(e);return`shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`};t.write("const input = payload.value;");let i=Object.create(null),a=0;for(let e of n.keys)i[e]=`key_${a++}`;for(let o of(t.write("const newResult = {};"),n.keys)){let n=i[o],a=J(o),s=e[o],u=s?._zod?.optin==="optional",l=s?._zod?.optout==="optional";t.write(`const ${n} = ${r(o)};`),u&&l?t.write(`
        if (${n}.issues.length) {
          if (${a} in input) {
            payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${a}, ...iss.path] : [${a}]
            })));
          }
        }
        
        if (${n}.value === undefined) {
          if (${a} in input) {
            newResult[${a}] = undefined;
          }
        } else {
          newResult[${a}] = ${n}.value;
        }
        
      `):u?t.write(`
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${a}, ...iss.path] : [${a}]
          })));
        }
        
        if (${n}.value === undefined) {
          if (${a} in input) {
            newResult[${a}] = undefined;
          }
        } else {
          newResult[${a}] = ${n}.value;
        }
        
      `):t.write(`
        const ${n}_present = ${a} in input;
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${a}, ...iss.path] : [${a}]
          })));
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${a}]
          });
        }

        if (${n}_present) {
          if (${n}.value === undefined) {
            newResult[${a}] = undefined;
          } else {
            newResult[${a}] = ${n}.value;
          }
        }

      `)}t.write("payload.value = newResult;"),t.write("return payload;");let s=t.compile();return(t,n)=>s(e,t,n)})(t.shape)),u=n(u,d),l)?to([],c,u,d,r,e):u:i(u,d):(u.issues.push({expected:"object",code:"invalid_type",input:c,inst:e}),u)}});function tu(e,t,n,r){for(let n of e)if(0===n.issues.length)return t.value=n.value,t;let i=e.filter(e=>!ee(e));return 1===i.length?(t.value=i[0].value,i[0]):(t.issues.push({code:"invalid_union",input:t.value,inst:n,errors:e.map(e=>e.issues.map(e=>er(e,r,l())))}),t)}let tl=o("$ZodUnion",(e,t)=>{eN.init(e,t),R(e._zod,"optin",()=>t.options.some(e=>"optional"===e._zod.optin)?"optional":void 0),R(e._zod,"optout",()=>t.options.some(e=>"optional"===e._zod.optout)?"optional":void 0),R(e._zod,"values",()=>{if(t.options.every(e=>e._zod.values))return new Set(t.options.flatMap(e=>Array.from(e._zod.values)))}),R(e._zod,"pattern",()=>{if(t.options.every(e=>e._zod.pattern)){let e=t.options.map(e=>e._zod.pattern);return RegExp(`^(${e.map(e=>C(e.source)).join("|")})$`)}});let n=1===t.options.length?t.options[0]._zod.run:null;e._zod.parse=(r,i)=>{if(n)return n(r,i);let o=!1,a=[];for(let e of t.options){let t=e._zod.run({value:r.value,issues:[]},i);if(t instanceof Promise)a.push(t),o=!0;else{if(0===t.issues.length)return t;a.push(t)}}return o?Promise.all(a).then(t=>tu(t,r,e,i)):tu(a,r,e,i)}}),td=o("$ZodIntersection",(e,t)=>{eN.init(e,t),e._zod.parse=(e,n)=>{let r=e.value,i=t.left._zod.run({value:r,issues:[]},n),o=t.right._zod.run({value:r,issues:[]},n);return i instanceof Promise||o instanceof Promise?Promise.all([i,o]).then(([t,n])=>tc(e,t,n)):tc(e,i,o)}});function tc(e,t,n){let r,i=new Map;for(let n of t.issues)if("unrecognized_keys"===n.code)for(let e of(r??(r=n),n.keys))i.has(e)||i.set(e,{}),i.get(e).l=!0;else e.issues.push(n);for(let t of n.issues)if("unrecognized_keys"===t.code)for(let e of t.keys)i.has(e)||i.set(e,{}),i.get(e).r=!0;else e.issues.push(t);let o=[...i].filter(([,e])=>e.l&&e.r).map(([e])=>e);if(o.length&&r&&e.issues.push({...r,keys:o}),ee(e))return e;let a=function e(t,n){if(t===n||t instanceof Date&&n instanceof Date&&+t==+n)return{valid:!0,data:t};if(V(t)&&V(n)){let r=Object.keys(n),i=Object.keys(t).filter(e=>-1!==r.indexOf(e)),o={...t,...n};for(let r of i){let i=e(t[r],n[r]);if(!i.valid)return{valid:!1,mergeErrorPath:[r,...i.mergeErrorPath]};o[r]=i.data}return{valid:!0,data:o}}if(Array.isArray(t)&&Array.isArray(n)){if(t.length!==n.length)return{valid:!1,mergeErrorPath:[]};let r=[];for(let i=0;i<t.length;i++){let o=e(t[i],n[i]);if(!o.valid)return{valid:!1,mergeErrorPath:[i,...o.mergeErrorPath]};r.push(o.data)}return{valid:!0,data:r}}return{valid:!1,mergeErrorPath:[]}}(t.value,n.value);if(!a.valid)throw Error(`Unmergable intersection. Error path: ${JSON.stringify(a.mergeErrorPath)}`);return e.value=a.data,e}let tf=o("$ZodRecord",(e,t)=>{eN.init(e,t),e._zod.parse=(n,r)=>{let i=n.value;if(!V(i))return n.issues.push({expected:"record",code:"invalid_type",input:i,inst:e}),n;let o=[],a=t.keyType._zod.values;if(a){let s;n.value={};let u=new Set;for(let s of a)if("string"==typeof s||"number"==typeof s||"symbol"==typeof s){u.add("number"==typeof s?s.toString():s);let a=t.keyType._zod.run({value:s,issues:[]},r);if(a instanceof Promise)throw Error("Async schemas not supported in object keys currently");if(a.issues.length){n.issues.push({code:"invalid_key",origin:"record",issues:a.issues.map(e=>er(e,r,l())),input:s,path:[s],inst:e});continue}let d=a.value,c=t.valueType._zod.run({value:i[s],issues:[]},r);c instanceof Promise?o.push(c.then(e=>{e.issues.length&&n.issues.push(...et(s,e.issues)),n.value[d]=e.value})):(c.issues.length&&n.issues.push(...et(s,c.issues)),n.value[d]=c.value)}for(let e in i)u.has(e)||(s=s??[]).push(e);s&&s.length>0&&n.issues.push({code:"unrecognized_keys",input:i,inst:e,keys:s})}else for(let a of(n.value={},Reflect.ownKeys(i))){if("__proto__"===a||!Object.prototype.propertyIsEnumerable.call(i,a))continue;let s=t.keyType._zod.run({value:a,issues:[]},r);if(s instanceof Promise)throw Error("Async schemas not supported in object keys currently");if("string"==typeof a&&j.test(a)&&s.issues.length){let e=t.keyType._zod.run({value:Number(a),issues:[]},r);if(e instanceof Promise)throw Error("Async schemas not supported in object keys currently");0===e.issues.length&&(s=e)}if(s.issues.length){"loose"===t.mode?n.value[a]=i[a]:n.issues.push({code:"invalid_key",origin:"record",issues:s.issues.map(e=>er(e,r,l())),input:a,path:[a],inst:e});continue}let u=t.valueType._zod.run({value:i[a],issues:[]},r);u instanceof Promise?o.push(u.then(e=>{e.issues.length&&n.issues.push(...et(a,e.issues)),n.value[s.value]=e.value})):(u.issues.length&&n.issues.push(...et(a,u.issues)),n.value[s.value]=u.value)}return o.length?Promise.all(o).then(()=>n):n}}),tp=o("$ZodEnum",(e,t)=>{eN.init(e,t);let n=U(t.entries),r=new Set(n);e._zod.values=r,e._zod.pattern=RegExp(`^(${n.filter(e=>G.has(typeof e)).map(e=>"string"==typeof e?K(e):e.toString()).join("|")})$`),e._zod.parse=(t,i)=>{let o=t.value;return r.has(o)||t.issues.push({code:"invalid_value",values:n,input:o,inst:e}),t}}),th=o("$ZodTransform",(e,t)=>{eN.init(e,t),e._zod.optin="optional",e._zod.parse=(n,r)=>{if("backward"===r.direction)throw new s(e.constructor.name);let i=t.transform(n.value,n);if(r.async)return(i instanceof Promise?i:Promise.resolve(i)).then(e=>(n.value=e,n.fallback=!0,n));if(i instanceof Promise)throw new a;return n.value=i,n.fallback=!0,n}});function tm(e,t){return void 0===t&&(e.issues.length||e.fallback)?{issues:[],value:void 0}:e}let tv=o("$ZodOptional",(e,t)=>{eN.init(e,t),e._zod.optin="optional",e._zod.optout="optional",R(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,void 0]):void 0),R(e._zod,"pattern",()=>{let e=t.innerType._zod.pattern;return e?RegExp(`^(${C(e.source)})?$`):void 0}),e._zod.parse=(e,n)=>{if("optional"===t.innerType._zod.optin){let r=e.value,i=t.innerType._zod.run(e,n);return i instanceof Promise?i.then(e=>tm(e,r)):tm(i,r)}return void 0===e.value?e:t.innerType._zod.run(e,n)}}),ty=o("$ZodExactOptional",(e,t)=>{tv.init(e,t),R(e._zod,"values",()=>t.innerType._zod.values),R(e._zod,"pattern",()=>t.innerType._zod.pattern),e._zod.parse=(e,n)=>t.innerType._zod.run(e,n)}),tg=o("$ZodNullable",(e,t)=>{eN.init(e,t),R(e._zod,"optin",()=>t.innerType._zod.optin),R(e._zod,"optout",()=>t.innerType._zod.optout),R(e._zod,"pattern",()=>{let e=t.innerType._zod.pattern;return e?RegExp(`^(${C(e.source)}|null)$`):void 0}),R(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,null]):void 0),e._zod.parse=(e,n)=>null===e.value?e:t.innerType._zod.run(e,n)}),t_=o("$ZodDefault",(e,t)=>{eN.init(e,t),e._zod.optin="optional",R(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(e,n)=>{if("backward"===n.direction)return t.innerType._zod.run(e,n);if(void 0===e.value)return e.value=t.defaultValue,e;let r=t.innerType._zod.run(e,n);return r instanceof Promise?r.then(e=>tb(e,t)):tb(r,t)}});function tb(e,t){return void 0===e.value&&(e.value=t.defaultValue),e}let tz=o("$ZodPrefault",(e,t)=>{eN.init(e,t),e._zod.optin="optional",R(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(e,n)=>("backward"===n.direction||void 0===e.value&&(e.value=t.defaultValue),t.innerType._zod.run(e,n))}),tw=o("$ZodNonOptional",(e,t)=>{eN.init(e,t),R(e._zod,"values",()=>{let e=t.innerType._zod.values;return e?new Set([...e].filter(e=>void 0!==e)):void 0}),e._zod.parse=(n,r)=>{let i=t.innerType._zod.run(n,r);return i instanceof Promise?i.then(t=>tS(t,e)):tS(i,e)}});function tS(e,t){return e.issues.length||void 0!==e.value||e.issues.push({code:"invalid_type",expected:"nonoptional",input:e.value,inst:t}),e}let tk=o("$ZodCatch",(e,t)=>{eN.init(e,t),e._zod.optin="optional",R(e._zod,"optout",()=>t.innerType._zod.optout),R(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(e,n)=>{if("backward"===n.direction)return t.innerType._zod.run(e,n);let r=t.innerType._zod.run(e,n);return r instanceof Promise?r.then(r=>(e.value=r.value,r.issues.length&&(e.value=t.catchValue({...e,error:{issues:r.issues.map(e=>er(e,n,l()))},input:e.value}),e.issues=[],e.fallback=!0),e)):(e.value=r.value,r.issues.length&&(e.value=t.catchValue({...e,error:{issues:r.issues.map(e=>er(e,n,l()))},input:e.value}),e.issues=[],e.fallback=!0),e)}}),tx=o("$ZodPipe",(e,t)=>{eN.init(e,t),R(e._zod,"values",()=>t.in._zod.values),R(e._zod,"optin",()=>t.in._zod.optin),R(e._zod,"optout",()=>t.out._zod.optout),R(e._zod,"propValues",()=>t.in._zod.propValues),e._zod.parse=(e,n)=>{if("backward"===n.direction){let r=t.out._zod.run(e,n);return r instanceof Promise?r.then(e=>tO(e,t.in,n)):tO(r,t.in,n)}let r=t.in._zod.run(e,n);return r instanceof Promise?r.then(e=>tO(e,t.out,n)):tO(r,t.out,n)}});function tO(e,t,n){return e.issues.length?(e.aborted=!0,e):t._zod.run({value:e.value,issues:e.issues,fallback:e.fallback},n)}let tE=o("$ZodReadonly",(e,t)=>{eN.init(e,t),R(e._zod,"propValues",()=>t.innerType._zod.propValues),R(e._zod,"values",()=>t.innerType._zod.values),R(e._zod,"optin",()=>t.innerType?._zod?.optin),R(e._zod,"optout",()=>t.innerType?._zod?.optout),e._zod.parse=(e,n)=>{if("backward"===n.direction)return t.innerType._zod.run(e,n);let r=t.innerType._zod.run(e,n);return r instanceof Promise?r.then(t$):t$(r)}});function t$(e){return e.value=Object.freeze(e.value),e}let tA=o("$ZodCustom",(e,t)=>{ea.init(e,t),eN.init(e,t),e._zod.parse=(e,t)=>e,e._zod.check=n=>{let r=n.value,i=t.fn(r);if(i instanceof Promise)return i.then(t=>tP(t,n,r,e));tP(i,n,r,e)}});function tP(e,t,n,r){if(!e){let e={code:"custom",input:n,inst:r,path:[...r._zod.def.path??[]],continue:!r._zod.def.abort};r._zod.def.params&&(e.params=r._zod.def.params),t.issues.push(eo(e))}}Symbol("ZodOutput"),Symbol("ZodInput");class tT{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){let n=t[0];return this._map.set(e,n),n&&"object"==typeof n&&"id"in n&&this._idmap.set(n.id,e),this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){let t=this._map.get(e);return t&&"object"==typeof t&&"id"in t&&this._idmap.delete(t.id),this._map.delete(e),this}get(e){let t=e._zod.parent;if(t){let n={...this.get(t)??{}};delete n.id;let r={...n,...this._map.get(e)};return Object.keys(r).length?r:void 0}return this._map.get(e)}has(e){return this._map.has(e)}}(i=globalThis).__zod_globalRegistry??(i.__zod_globalRegistry=new tT);let tj=globalThis.__zod_globalRegistry;function tZ(e,t){return new e({type:"string",format:"guid",check:"string_format",abort:!1,...Q(t)})}function tN(e,t){return new eu({check:"less_than",...Q(t),value:e,inclusive:!1})}function tU(e,t){return new eu({check:"less_than",...Q(t),value:e,inclusive:!0})}function tI(e,t){return new el({check:"greater_than",...Q(t),value:e,inclusive:!1})}function tL(e,t){return new el({check:"greater_than",...Q(t),value:e,inclusive:!0})}function tC(e,t){return new ed({check:"multiple_of",...Q(t),value:e})}function tM(e,t){return new ef({check:"max_length",...Q(t),maximum:e})}function tR(e,t){return new ep({check:"min_length",...Q(t),minimum:e})}function tD(e,t){return new eh({check:"length_equals",...Q(t),length:e})}function tF(e){return new ew({check:"overwrite",tx:e})}function tJ(e){let t=e?.target??"draft-2020-12";return"draft-4"===t&&(t="draft-04"),"draft-7"===t&&(t="draft-07"),{processors:e.processors??{},metadataRegistry:e?.metadata??tj,target:t,unrepresentable:e?.unrepresentable??"throw",override:e?.override??(()=>{}),io:e?.io??"output",counter:0,seen:new Map,cycles:e?.cycles??"ref",reused:e?.reused??"inline",external:e?.external??void 0}}function tB(e,t,n={path:[],schemaPath:[]}){var r;let i=e._zod.def,o=t.seen.get(e);if(o)return o.count++,n.schemaPath.includes(e)&&(o.cycle=n.path),o.schema;let a={schema:{},count:1,cycle:void 0,path:n.path};t.seen.set(e,a);let s=e._zod.toJSONSchema?.();if(s)a.schema=s;else{let r={...n,schemaPath:[...n.schemaPath,e],path:n.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,a.schema,r);else{let n=a.schema,o=t.processors[i.type];if(!o)throw Error(`[toJSONSchema]: Non-representable type encountered: ${i.type}`);o(e,t,n,r)}let o=e._zod.parent;o&&(a.ref||(a.ref=o),tB(o,t,r),t.seen.get(o).isParent=!0)}let u=t.metadataRegistry.get(e);return u&&Object.assign(a.schema,u),"input"===t.io&&function e(t,n){let r=n??{seen:new Set};if(r.seen.has(t))return!1;r.seen.add(t);let i=t._zod.def;if("transform"===i.type)return!0;if("array"===i.type)return e(i.element,r);if("set"===i.type)return e(i.valueType,r);if("lazy"===i.type)return e(i.getter(),r);if("promise"===i.type||"optional"===i.type||"nonoptional"===i.type||"nullable"===i.type||"readonly"===i.type||"default"===i.type||"prefault"===i.type)return e(i.innerType,r);if("intersection"===i.type)return e(i.left,r)||e(i.right,r);if("record"===i.type||"map"===i.type)return e(i.keyType,r)||e(i.valueType,r);if("pipe"===i.type)return!!t._zod.traits.has("$ZodCodec")||e(i.in,r)||e(i.out,r);if("object"===i.type){for(let t in i.shape)if(e(i.shape[t],r))return!0;return!1}if("union"===i.type){for(let t of i.options)if(e(t,r))return!0;return!1}if("tuple"===i.type){for(let t of i.items)if(e(t,r))return!0;if(i.rest&&e(i.rest,r))return!0}return!1}(e)&&(delete a.schema.examples,delete a.schema.default),"input"===t.io&&"_prefault"in a.schema&&((r=a.schema).default??(r.default=a.schema._prefault)),delete a.schema._prefault,t.seen.get(e).schema}function tW(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");let r=new Map;for(let t of e.seen.entries()){let n=e.metadataRegistry.get(t[0])?.id;if(n){let e=r.get(n);if(e&&e!==t[0])throw Error(`Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);r.set(n,t[0])}}let i=t=>{if(t[1].schema.$ref)return;let r=t[1],{ref:i,defId:o}=(t=>{let r="draft-2020-12"===e.target?"$defs":"definitions";if(e.external){let n=e.external.registry.get(t[0])?.id,i=e.external.uri??(e=>e);if(n)return{ref:i(n)};let o=t[1].defId??t[1].schema.id??`schema${e.counter++}`;return t[1].defId=o,{defId:o,ref:`${i("__shared")}#/${r}/${o}`}}if(t[1]===n)return{ref:"#"};let i=`#/${r}/`,o=t[1].schema.id??`__schema${e.counter++}`;return{defId:o,ref:i+o}})(t);r.def={...r.schema},o&&(r.defId=o);let a=r.schema;for(let e in a)delete a[e];a.$ref=i};if("throw"===e.cycles)for(let t of e.seen.entries()){let e=t[1];if(e.cycle)throw Error(`Cycle detected: #/${e.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let n of e.seen.entries()){let r=n[1];if(t===n[0]){i(n);continue}if(e.external){let r=e.external.registry.get(n[0])?.id;if(t!==n[0]&&r){i(n);continue}}if(e.metadataRegistry.get(n[0])?.id||r.cycle||r.count>1&&"ref"===e.reused){i(n);continue}}}function tH(e,t){let n=e.seen.get(t);if(!n)throw Error("Unprocessed schema. This is a bug in Zod.");let r=t=>{let n=e.seen.get(t);if(null===n.ref)return;let i=n.def??n.schema,o={...i},a=n.ref;if(n.ref=null,a){r(a);let n=e.seen.get(a),s=n.schema;if(s.$ref&&("draft-07"===e.target||"draft-04"===e.target||"openapi-3.0"===e.target)?(i.allOf=i.allOf??[],i.allOf.push(s)):Object.assign(i,s),Object.assign(i,o),t._zod.parent===a)for(let e in i)"$ref"!==e&&"allOf"!==e&&(e in o||delete i[e]);if(s.$ref&&n.def)for(let e in i)"$ref"!==e&&"allOf"!==e&&e in n.def&&JSON.stringify(i[e])===JSON.stringify(n.def[e])&&delete i[e]}let s=t._zod.parent;if(s&&s!==a){r(s);let t=e.seen.get(s);if(t?.schema.$ref&&(i.$ref=t.schema.$ref,t.def))for(let e in i)"$ref"!==e&&"allOf"!==e&&e in t.def&&JSON.stringify(i[e])===JSON.stringify(t.def[e])&&delete i[e]}e.override({zodSchema:t,jsonSchema:i,path:n.path??[]})};for(let t of[...e.seen.entries()].reverse())r(t[0]);let i={};if("draft-2020-12"===e.target?i.$schema="https://json-schema.org/draft/2020-12/schema":"draft-07"===e.target?i.$schema="http://json-schema.org/draft-07/schema#":"draft-04"===e.target?i.$schema="http://json-schema.org/draft-04/schema#":e.target,e.external?.uri){let n=e.external.registry.get(t)?.id;if(!n)throw Error("Schema is missing an `id` property");i.$id=e.external.uri(n)}Object.assign(i,n.def??n.schema);let o=e.metadataRegistry.get(t)?.id;void 0!==o&&i.id===o&&delete i.id;let a=e.external?.defs??{};for(let t of e.seen.entries()){let e=t[1];e.def&&e.defId&&(e.def.id===e.defId&&delete e.def.id,a[e.defId]=e.def)}e.external||Object.keys(a).length>0&&("draft-2020-12"===e.target?i.$defs=a:i.definitions=a);try{let n=JSON.parse(JSON.stringify(i));return Object.defineProperty(n,"~standard",{value:{...t["~standard"],jsonSchema:{input:tV(t,"input",e.processors),output:tV(t,"output",e.processors)}},enumerable:!1,writable:!1}),n}catch(e){throw Error("Error converting schema to JSON.")}}let tV=(e,t,n={})=>r=>{let{libraryOptions:i,target:o}=r??{},a=tJ({...i??{},target:o,io:t,processors:n});return tB(e,a),tW(a,e),tH(a,e)},tq={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},tG=(e,t,n,r)=>{let i=e._zod.def;tB(i.innerType,t,r),t.seen.get(e).ref=i.innerType},tK=o("ZodISODateTime",(e,t)=>{eq.init(e,t),nl.init(e,t)}),tX=o("ZodISODate",(e,t)=>{eG.init(e,t),nl.init(e,t)}),tQ=o("ZodISOTime",(e,t)=>{eK.init(e,t),nl.init(e,t)}),tY=o("ZodISODuration",(e,t)=>{eX.init(e,t),nl.init(e,t)}),t0=o("ZodError",(e,t)=>{ex.init(e,t),e.name="ZodError",Object.defineProperties(e,{format:{value:t=>(function(e,t=e=>e.message){let n={_errors:[]},r=(e,i=[])=>{for(let o of e.issues)if("invalid_union"===o.code&&o.errors.length)o.errors.map(e=>r({issues:e},[...i,...o.path]));else if("invalid_key"===o.code)r({issues:o.issues},[...i,...o.path]);else if("invalid_element"===o.code)r({issues:o.issues},[...i,...o.path]);else{let e=[...i,...o.path];if(0===e.length)n._errors.push(t(o));else{let r=n,i=0;for(;i<e.length;){let n=e[i];i===e.length-1?(r[n]=r[n]||{_errors:[]},r[n]._errors.push(t(o))):r[n]=r[n]||{_errors:[]},r=r[n],i++}}}};return r(e),n})(e,t)},flatten:{value:t=>(function(e,t=e=>e.message){let n={},r=[];for(let i of e.issues)i.path.length>0?(n[i.path[0]]=n[i.path[0]]||[],n[i.path[0]].push(t(i))):r.push(t(i));return{formErrors:r,fieldErrors:n}})(e,t)},addIssue:{value:t=>{e.issues.push(t),e.message=JSON.stringify(e.issues,I,2)}},addIssues:{value:t=>{e.issues.push(...t),e.message=JSON.stringify(e.issues,I,2)}},isEmpty:{get:()=>0===e.issues.length}})},{Parent:Error}),t1=eE(t0),t2=e$(t0),t4=eA(t0),t3=eT(t0),t9=(e,t,n)=>{let r=n?{...n,direction:"backward"}:{direction:"backward"};return eE(t0)(e,t,r)},t6=(e,t,n)=>eE(t0)(e,t,n),t5=async(e,t,n)=>{let r=n?{...n,direction:"backward"}:{direction:"backward"};return e$(t0)(e,t,r)},t7=async(e,t,n)=>e$(t0)(e,t,n),t8=(e,t,n)=>{let r=n?{...n,direction:"backward"}:{direction:"backward"};return eA(t0)(e,t,r)},ne=(e,t,n)=>eA(t0)(e,t,n),nt=async(e,t,n)=>{let r=n?{...n,direction:"backward"}:{direction:"backward"};return eT(t0)(e,t,r)},nn=async(e,t,n)=>eT(t0)(e,t,n),nr=new WeakMap;function ni(e,t,n){let r=Object.getPrototypeOf(e),i=nr.get(r);if(i||(i=new Set,nr.set(r,i)),!i.has(t))for(let e in i.add(t),n){let t=n[e];Object.defineProperty(r,e,{configurable:!0,enumerable:!1,get(){let n=t.bind(this);return Object.defineProperty(this,e,{configurable:!0,writable:!0,enumerable:!0,value:n}),n},set(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,enumerable:!0,value:t})}})}}let no=o("ZodType",(e,t)=>(eN.init(e,t),Object.assign(e["~standard"],{jsonSchema:{input:tV(e,"input"),output:tV(e,"output")}}),e.toJSONSchema=((e,t={})=>n=>{let r=tJ({...n,processors:t});return tB(e,r),tW(r,e),tH(r,e)})(e,{}),e.def=t,e.type=t.type,Object.defineProperty(e,"_def",{value:t}),e.parse=(t,n)=>t1(e,t,n,{callee:e.parse}),e.safeParse=(t,n)=>t4(e,t,n),e.parseAsync=async(t,n)=>t2(e,t,n,{callee:e.parseAsync}),e.safeParseAsync=async(t,n)=>t3(e,t,n),e.spa=e.safeParseAsync,e.encode=(t,n)=>t9(e,t,n),e.decode=(t,n)=>t6(e,t,n),e.encodeAsync=async(t,n)=>t5(e,t,n),e.decodeAsync=async(t,n)=>t7(e,t,n),e.safeEncode=(t,n)=>t8(e,t,n),e.safeDecode=(t,n)=>ne(e,t,n),e.safeEncodeAsync=async(t,n)=>nt(e,t,n),e.safeDecodeAsync=async(t,n)=>nn(e,t,n),ni(e,"ZodType",{check(...e){let t=this.def;return this.clone(F(t,{checks:[...t.checks??[],...e.map(e=>"function"==typeof e?{_zod:{check:e,def:{check:"custom"},onattach:[]}}:e)]}),{parent:!0})},with(...e){return this.check(...e)},clone(e,t){return X(this,e,t)},brand(){return this},register(e,t){return e.add(this,t),this},refine(e,t){return this.check(function(e,t={}){return new n9({type:"custom",check:"custom",fn:e,...Q(t)})}(e,t))},superRefine(e,t){return this.check(function(e,t){var n;let r,i;return n=t=>(t.addIssue=e=>{"string"==typeof e?t.issues.push(eo(e,t.value,r._zod.def)):(e.fatal&&(e.continue=!1),e.code??(e.code="custom"),e.input??(e.input=t.value),e.inst??(e.inst=r),e.continue??(e.continue=!r._zod.def.abort),t.issues.push(eo(e)))},e(t.value,t)),(i=new ea({check:"custom",...Q(t)}))._zod.check=n,r=i}(e,t))},overwrite(e){return this.check(tF(e))},optional(){return nq(this)},exactOptional(){var e;return e=this,new nG({type:"optional",innerType:e})},nullable(){return nX(this)},nullish(){return nq(nX(this))},nonoptional(e){var t;return t=this,new n0({type:"nonoptional",innerType:t,...Q(e)})},array(){return nL(this)},or(e){return new nR({type:"union",options:[this,e],...Q(void 0)})},and(e){var t;return t=this,new nD({type:"intersection",left:t,right:e})},transform(e){return n4(this,new nH({type:"transform",transform:e}))},default(e){var t,n;return t=this,n=e,new nQ({type:"default",innerType:t,get defaultValue(){return"function"==typeof n?n():q(n)}})},prefault(e){var t,n;return t=this,n=e,new nY({type:"prefault",innerType:t,get defaultValue(){return"function"==typeof n?n():q(n)}})},catch(e){var t,n;return t=this,new n1({type:"catch",innerType:t,catchValue:"function"==typeof(n=e)?n:()=>n})},pipe(e){return n4(this,e)},readonly(){var e;return e=this,new n3({type:"readonly",innerType:e})},describe(e){let t=this.clone();return tj.add(t,{description:e}),t},meta(...e){if(0===e.length)return tj.get(this);let t=this.clone();return tj.add(t,e[0]),t},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(e){return e(this)}}),Object.defineProperty(e,"description",{get:()=>tj.get(e)?.description,configurable:!0}),e)),na=o("_ZodString",(e,t)=>{eU.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>((e,t,n)=>{n.type="string";let{minimum:r,maximum:i,format:o,patterns:a,contentEncoding:s}=e._zod.bag;if("number"==typeof r&&(n.minLength=r),"number"==typeof i&&(n.maxLength=i),o&&(n.format=tq[o]??o,""===n.format&&delete n.format,"time"===o&&delete n.format),s&&(n.contentEncoding=s),a&&a.size>0){let e=[...a];1===e.length?n.pattern=e[0].source:e.length>1&&(n.allOf=[...e.map(e=>({..."draft-07"===t.target||"draft-04"===t.target||"openapi-3.0"===t.target?{type:"string"}:{},pattern:e.source}))])}})(e,t,n);let n=e._zod.bag;e.format=n.format??null,e.minLength=n.minimum??null,e.maxLength=n.maximum??null,ni(e,"_ZodString",{regex(...e){return this.check(function(e,t){return new ev({check:"string_format",format:"regex",...Q(t),pattern:e})}(...e))},includes(...e){return this.check(function(e,t){return new e_({check:"string_format",format:"includes",...Q(t),includes:e})}(...e))},startsWith(...e){return this.check(function(e,t){return new eb({check:"string_format",format:"starts_with",...Q(t),prefix:e})}(...e))},endsWith(...e){return this.check(function(e,t){return new ez({check:"string_format",format:"ends_with",...Q(t),suffix:e})}(...e))},min(...e){return this.check(tR(...e))},max(...e){return this.check(tM(...e))},length(...e){return this.check(tD(...e))},nonempty(...e){return this.check(tR(1,...e))},lowercase(e){return this.check(new ey({check:"string_format",format:"lowercase",...Q(e)}))},uppercase(e){return this.check(new eg({check:"string_format",format:"uppercase",...Q(e)}))},trim(){return this.check(tF(e=>e.trim()))},normalize(...e){return this.check(function(e){return tF(t=>t.normalize(e))}(...e))},toLowerCase(){return this.check(tF(e=>e.toLowerCase()))},toUpperCase(){return this.check(tF(e=>e.toUpperCase()))},slugify(){return this.check(tF(e=>e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")))}})}),ns=o("ZodString",(e,t)=>{eU.init(e,t),na.init(e,t),e.email=t=>e.check(new nd({type:"string",format:"email",check:"string_format",abort:!1,...Q(t)})),e.url=t=>e.check(new np({type:"string",format:"url",check:"string_format",abort:!1,...Q(t)})),e.jwt=t=>e.check(new n$({type:"string",format:"jwt",check:"string_format",abort:!1,...Q(t)})),e.emoji=t=>e.check(new nh({type:"string",format:"emoji",check:"string_format",abort:!1,...Q(t)})),e.guid=t=>e.check(tZ(nc,t)),e.uuid=t=>e.check(new nf({type:"string",format:"uuid",check:"string_format",abort:!1,...Q(t)})),e.uuidv4=t=>e.check(new nf({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...Q(t)})),e.uuidv6=t=>e.check(new nf({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...Q(t)})),e.uuidv7=t=>e.check(new nf({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...Q(t)})),e.nanoid=t=>e.check(new nm({type:"string",format:"nanoid",check:"string_format",abort:!1,...Q(t)})),e.guid=t=>e.check(tZ(nc,t)),e.cuid=t=>e.check(new nv({type:"string",format:"cuid",check:"string_format",abort:!1,...Q(t)})),e.cuid2=t=>e.check(new ny({type:"string",format:"cuid2",check:"string_format",abort:!1,...Q(t)})),e.ulid=t=>e.check(new ng({type:"string",format:"ulid",check:"string_format",abort:!1,...Q(t)})),e.base64=t=>e.check(new nx({type:"string",format:"base64",check:"string_format",abort:!1,...Q(t)})),e.base64url=t=>e.check(new nO({type:"string",format:"base64url",check:"string_format",abort:!1,...Q(t)})),e.xid=t=>e.check(new n_({type:"string",format:"xid",check:"string_format",abort:!1,...Q(t)})),e.ksuid=t=>e.check(new nb({type:"string",format:"ksuid",check:"string_format",abort:!1,...Q(t)})),e.ipv4=t=>e.check(new nz({type:"string",format:"ipv4",check:"string_format",abort:!1,...Q(t)})),e.ipv6=t=>e.check(new nw({type:"string",format:"ipv6",check:"string_format",abort:!1,...Q(t)})),e.cidrv4=t=>e.check(new nS({type:"string",format:"cidrv4",check:"string_format",abort:!1,...Q(t)})),e.cidrv6=t=>e.check(new nk({type:"string",format:"cidrv6",check:"string_format",abort:!1,...Q(t)})),e.e164=t=>e.check(new nE({type:"string",format:"e164",check:"string_format",abort:!1,...Q(t)})),e.datetime=t=>e.check(new tK({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...Q(t)})),e.date=t=>e.check(new tX({type:"string",format:"date",check:"string_format",...Q(t)})),e.time=t=>e.check(new tQ({type:"string",format:"time",check:"string_format",precision:null,...Q(t)})),e.duration=t=>e.check(new tY({type:"string",format:"duration",check:"string_format",...Q(t)}))});function nu(e){return new ns({type:"string",...Q(e)})}let nl=o("ZodStringFormat",(e,t)=>{eI.init(e,t),na.init(e,t)}),nd=o("ZodEmail",(e,t)=>{eM.init(e,t),nl.init(e,t)}),nc=o("ZodGUID",(e,t)=>{eL.init(e,t),nl.init(e,t)}),nf=o("ZodUUID",(e,t)=>{eC.init(e,t),nl.init(e,t)}),np=o("ZodURL",(e,t)=>{eR.init(e,t),nl.init(e,t)}),nh=o("ZodEmoji",(e,t)=>{eD.init(e,t),nl.init(e,t)}),nm=o("ZodNanoID",(e,t)=>{eF.init(e,t),nl.init(e,t)}),nv=o("ZodCUID",(e,t)=>{eJ.init(e,t),nl.init(e,t)}),ny=o("ZodCUID2",(e,t)=>{eB.init(e,t),nl.init(e,t)}),ng=o("ZodULID",(e,t)=>{eW.init(e,t),nl.init(e,t)}),n_=o("ZodXID",(e,t)=>{eH.init(e,t),nl.init(e,t)}),nb=o("ZodKSUID",(e,t)=>{eV.init(e,t),nl.init(e,t)}),nz=o("ZodIPv4",(e,t)=>{eQ.init(e,t),nl.init(e,t)}),nw=o("ZodIPv6",(e,t)=>{eY.init(e,t),nl.init(e,t)}),nS=o("ZodCIDRv4",(e,t)=>{e0.init(e,t),nl.init(e,t)}),nk=o("ZodCIDRv6",(e,t)=>{e1.init(e,t),nl.init(e,t)}),nx=o("ZodBase64",(e,t)=>{e4.init(e,t),nl.init(e,t)}),nO=o("ZodBase64URL",(e,t)=>{e3.init(e,t),nl.init(e,t)}),nE=o("ZodE164",(e,t)=>{e9.init(e,t),nl.init(e,t)}),n$=o("ZodJWT",(e,t)=>{e6.init(e,t),nl.init(e,t)}),nA=o("ZodNumber",(e,t)=>{e5.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>((e,t,n)=>{let{minimum:r,maximum:i,format:o,multipleOf:a,exclusiveMaximum:s,exclusiveMinimum:u}=e._zod.bag;"string"==typeof o&&o.includes("int")?n.type="integer":n.type="number";let l="number"==typeof u&&u>=(r??-1/0),d="number"==typeof s&&s<=(i??1/0),c="draft-04"===t.target||"openapi-3.0"===t.target;l?c?(n.minimum=u,n.exclusiveMinimum=!0):n.exclusiveMinimum=u:"number"==typeof r&&(n.minimum=r),d?c?(n.maximum=s,n.exclusiveMaximum=!0):n.exclusiveMaximum=s:"number"==typeof i&&(n.maximum=i),"number"==typeof a&&(n.multipleOf=a)})(e,t,n),ni(e,"ZodNumber",{gt(e,t){return this.check(tI(e,t))},gte(e,t){return this.check(tL(e,t))},min(e,t){return this.check(tL(e,t))},lt(e,t){return this.check(tN(e,t))},lte(e,t){return this.check(tU(e,t))},max(e,t){return this.check(tU(e,t))},int(e){return this.check(nj(e))},safe(e){return this.check(nj(e))},positive(e){return this.check(tI(0,e))},nonnegative(e){return this.check(tL(0,e))},negative(e){return this.check(tN(0,e))},nonpositive(e){return this.check(tU(0,e))},multipleOf(e,t){return this.check(tC(e,t))},step(e,t){return this.check(tC(e,t))},finite(){return this}});let n=e._zod.bag;e.minValue=Math.max(n.minimum??-1/0,n.exclusiveMinimum??-1/0)??null,e.maxValue=Math.min(n.maximum??1/0,n.exclusiveMaximum??1/0)??null,e.isInt=(n.format??"").includes("int")||Number.isSafeInteger(n.multipleOf??.5),e.isFinite=!0,e.format=n.format??null});function nP(e){return new nA({type:"number",checks:[],...Q(e)})}let nT=o("ZodNumberFormat",(e,t)=>{e7.init(e,t),nA.init(e,t)});function nj(e){return new nT({type:"number",check:"number_format",abort:!1,format:"safeint",...Q(e)})}let nZ=o("ZodUnknown",(e,t)=>{e8.init(e,t),no.init(e,t),e._zod.processJSONSchema=(e,t,n)=>void 0});function nN(){return new nZ({type:"unknown"})}let nU=o("ZodNever",(e,t)=>{te.init(e,t),no.init(e,t),e._zod.processJSONSchema=(e,t,n)=>{t.not={}}}),nI=o("ZodArray",(e,t)=>{tn.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>((e,t,n,r)=>{let i=e._zod.def,{minimum:o,maximum:a}=e._zod.bag;"number"==typeof o&&(n.minItems=o),"number"==typeof a&&(n.maxItems=a),n.type="array",n.items=tB(i.element,t,{...r,path:[...r.path,"items"]})})(e,t,n,r),e.element=t.element,ni(e,"ZodArray",{min(e,t){return this.check(tR(e,t))},nonempty(e){return this.check(tR(1,e))},max(e,t){return this.check(tM(e,t))},length(e,t){return this.check(tD(e,t))},unwrap(){return this.element}})});function nL(e,t){return new nI({type:"array",element:e,...Q(t)})}let nC=o("ZodObject",(e,t)=>{ts.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>((e,t,n,r)=>{let i=e._zod.def;n.type="object",n.properties={};let o=i.shape;for(let e in o)n.properties[e]=tB(o[e],t,{...r,path:[...r.path,"properties",e]});let a=new Set([...new Set(Object.keys(o))].filter(e=>{let n=i.shape[e]._zod;return"input"===t.io?void 0===n.optin:void 0===n.optout}));a.size>0&&(n.required=Array.from(a)),i.catchall?._zod.def.type==="never"?n.additionalProperties=!1:i.catchall?i.catchall&&(n.additionalProperties=tB(i.catchall,t,{...r,path:[...r.path,"additionalProperties"]})):"output"===t.io&&(n.additionalProperties=!1)})(e,t,n,r),R(e,"shape",()=>t.shape),ni(e,"ZodObject",{keyof(){return nW(Object.keys(this._zod.def.shape))},catchall(e){return this.clone({...this._zod.def,catchall:e})},passthrough(){return this.clone({...this._zod.def,catchall:nN()})},loose(){return this.clone({...this._zod.def,catchall:nN()})},strict(){return this.clone({...this._zod.def,catchall:new nU({type:"never",...Q(void 0)})})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(e){return function(e,t){if(!V(t))throw Error("Invalid input to extend: expected a plain object");let n=e._zod.def.checks;if(n&&n.length>0){let n=e._zod.def.shape;for(let e in t)if(void 0!==Object.getOwnPropertyDescriptor(n,e))throw Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}let r=F(e._zod.def,{get shape(){let n={...e._zod.def.shape,...t};return D(this,"shape",n),n}});return X(e,r)}(this,e)},safeExtend(e){var t=this;if(!V(e))throw Error("Invalid input to safeExtend: expected a plain object");let n=F(t._zod.def,{get shape(){let n={...t._zod.def.shape,...e};return D(this,"shape",n),n}});return X(t,n)},merge(e){var t=this;if(t._zod.def.checks?.length)throw Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let n=F(t._zod.def,{get shape(){let n={...t._zod.def.shape,...e._zod.def.shape};return D(this,"shape",n),n},get catchall(){return e._zod.def.catchall},checks:e._zod.def.checks??[]});return X(t,n)},pick(e){return function(e,t){let n=e._zod.def,r=n.checks;if(r&&r.length>0)throw Error(".pick() cannot be used on object schemas containing refinements");let i=F(e._zod.def,{get shape(){let e={};for(let r in t){if(!(r in n.shape))throw Error(`Unrecognized key: "${r}"`);t[r]&&(e[r]=n.shape[r])}return D(this,"shape",e),e},checks:[]});return X(e,i)}(this,e)},omit(e){return function(e,t){let n=e._zod.def,r=n.checks;if(r&&r.length>0)throw Error(".omit() cannot be used on object schemas containing refinements");let i=F(e._zod.def,{get shape(){let r={...e._zod.def.shape};for(let e in t){if(!(e in n.shape))throw Error(`Unrecognized key: "${e}"`);t[e]&&delete r[e]}return D(this,"shape",r),r},checks:[]});return X(e,i)}(this,e)},partial(...e){return function(e,t,n){let r=t._zod.def.checks;if(r&&r.length>0)throw Error(".partial() cannot be used on object schemas containing refinements");let i=F(t._zod.def,{get shape(){let r=t._zod.def.shape,i={...r};if(n)for(let t in n){if(!(t in r))throw Error(`Unrecognized key: "${t}"`);n[t]&&(i[t]=e?new e({type:"optional",innerType:r[t]}):r[t])}else for(let t in r)i[t]=e?new e({type:"optional",innerType:r[t]}):r[t];return D(this,"shape",i),i},checks:[]});return X(t,i)}(nV,this,e[0])},required(...e){var t,n;let r;return t=this,n=e[0],r=F(t._zod.def,{get shape(){let e=t._zod.def.shape,r={...e};if(n)for(let t in n){if(!(t in r))throw Error(`Unrecognized key: "${t}"`);n[t]&&(r[t]=new n0({type:"nonoptional",innerType:e[t]}))}else for(let t in e)r[t]=new n0({type:"nonoptional",innerType:e[t]});return D(this,"shape",r),r}}),X(t,r)}})});function nM(e,t){return new nC({type:"object",shape:e??{},...Q(t)})}let nR=o("ZodUnion",(e,t)=>{tl.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i,o,a;return o=!1===(i=e._zod.def).inclusive,a=i.options.map((e,n)=>tB(e,t,{...r,path:[...r.path,o?"oneOf":"anyOf",n]})),void(o?n.oneOf=a:n.anyOf=a)},e.options=t.options}),nD=o("ZodIntersection",(e,t)=>{td.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i,o,a,s;return o=tB((i=e._zod.def).left,t,{...r,path:[...r.path,"allOf",0]}),a=tB(i.right,t,{...r,path:[...r.path,"allOf",1]}),void(n.allOf=[...(s=e=>"allOf"in e&&1===Object.keys(e).length)(o)?o.allOf:[o],...s(a)?a.allOf:[a]])}}),nF=o("ZodRecord",(e,t)=>{tf.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>((e,t,n,r)=>{let i=e._zod.def;n.type="object";let o=i.keyType,a=o._zod.bag,s=a?.patterns;if("loose"===i.mode&&s&&s.size>0){let e=tB(i.valueType,t,{...r,path:[...r.path,"patternProperties","*"]});for(let t of(n.patternProperties={},s))n.patternProperties[t.source]=e}else("draft-07"===t.target||"draft-2020-12"===t.target)&&(n.propertyNames=tB(i.keyType,t,{...r,path:[...r.path,"propertyNames"]})),n.additionalProperties=tB(i.valueType,t,{...r,path:[...r.path,"additionalProperties"]});let u=o._zod.values;if(u){let e=[...u].filter(e=>"string"==typeof e||"number"==typeof e);e.length>0&&(n.required=e)}})(e,t,n,r),e.keyType=t.keyType,e.valueType=t.valueType});function nJ(e,t,n){return new nF(t&&t._zod?{type:"record",keyType:e,valueType:t,...Q(n)}:{type:"record",keyType:nu(),valueType:e,...Q(t)})}let nB=o("ZodEnum",(e,t)=>{tp.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i;(i=U(e._zod.def.entries)).every(e=>"number"==typeof e)&&(n.type="number"),i.every(e=>"string"==typeof e)&&(n.type="string"),n.enum=i},e.enum=t.entries,e.options=Object.values(t.entries);let n=new Set(Object.keys(t.entries));e.extract=(e,r)=>{let i={};for(let r of e)if(n.has(r))i[r]=t.entries[r];else throw Error(`Key ${r} not found in enum`);return new nB({...t,checks:[],...Q(r),entries:i})},e.exclude=(e,r)=>{let i={...t.entries};for(let t of e)if(n.has(t))delete i[t];else throw Error(`Key ${t} not found in enum`);return new nB({...t,checks:[],...Q(r),entries:i})}});function nW(e,t){return new nB({type:"enum",entries:Array.isArray(e)?Object.fromEntries(e.map(e=>[e,e])):e,...Q(t)})}let nH=o("ZodTransform",(e,t)=>{th.init(e,t),no.init(e,t),e._zod.processJSONSchema=(e,t,n)=>(e=>{if("throw"===e.unrepresentable)throw Error("Transforms cannot be represented in JSON Schema")})(e),e._zod.parse=(n,r)=>{if("backward"===r.direction)throw new s(e.constructor.name);n.addIssue=r=>{"string"==typeof r?n.issues.push(eo(r,n.value,t)):(r.fatal&&(r.continue=!1),r.code??(r.code="custom"),r.input??(r.input=n.value),r.inst??(r.inst=e),n.issues.push(eo(r)))};let i=t.transform(n.value,n);return i instanceof Promise?i.then(e=>(n.value=e,n.fallback=!0,n)):(n.value=i,n.fallback=!0,n)}}),nV=o("ZodOptional",(e,t)=>{tv.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>tG(e,t,n,r),e.unwrap=()=>e._zod.def.innerType});function nq(e){return new nV({type:"optional",innerType:e})}let nG=o("ZodExactOptional",(e,t)=>{ty.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>tG(e,t,n,r),e.unwrap=()=>e._zod.def.innerType}),nK=o("ZodNullable",(e,t)=>{tg.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i,o,a;return o=tB((i=e._zod.def).innerType,t,r),a=t.seen.get(e),void("openapi-3.0"===t.target?(a.ref=i.innerType,n.nullable=!0):n.anyOf=[o,{type:"null"}])},e.unwrap=()=>e._zod.def.innerType});function nX(e){return new nK({type:"nullable",innerType:e})}let nQ=o("ZodDefault",(e,t)=>{t_.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i;tB((i=e._zod.def).innerType,t,r),t.seen.get(e).ref=i.innerType,n.default=JSON.parse(JSON.stringify(i.defaultValue))},e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap}),nY=o("ZodPrefault",(e,t)=>{tz.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i;tB((i=e._zod.def).innerType,t,r),t.seen.get(e).ref=i.innerType,"input"===t.io&&(n._prefault=JSON.parse(JSON.stringify(i.defaultValue)))},e.unwrap=()=>e._zod.def.innerType}),n0=o("ZodNonOptional",(e,t)=>{tw.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i;tB((i=e._zod.def).innerType,t,r),t.seen.get(e).ref=i.innerType},e.unwrap=()=>e._zod.def.innerType}),n1=o("ZodCatch",(e,t)=>{tk.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>((e,t,n,r)=>{let i,o=e._zod.def;tB(o.innerType,t,r),t.seen.get(e).ref=o.innerType;try{i=o.catchValue(void 0)}catch{throw Error("Dynamic catch values are not supported in JSON Schema")}n.default=i})(e,t,n,r),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap}),n2=o("ZodPipe",(e,t)=>{tx.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i,o,a;return o=(i=e._zod.def).in._zod.traits.has("$ZodTransform"),void(tB(a="input"===t.io?o?i.out:i.in:i.out,t,r),t.seen.get(e).ref=a)},e.in=t.in,e.out=t.out});function n4(e,t){return new n2({type:"pipe",in:e,out:t})}let n3=o("ZodReadonly",(e,t)=>{tE.init(e,t),no.init(e,t),e._zod.processJSONSchema=(t,n,r)=>{let i;tB((i=e._zod.def).innerType,t,r),t.seen.get(e).ref=i.innerType,n.readOnly=!0},e.unwrap=()=>e._zod.def.innerType}),n9=o("ZodCustom",(e,t)=>{tA.init(e,t),no.init(e,t),e._zod.processJSONSchema=(e,t,n)=>(e=>{if("throw"===e.unrepresentable)throw Error("Custom types cannot be represented in JSON Schema")})(e)})},74003:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"workAsyncStorage",{enumerable:!0,get:function(){return r.workAsyncStorageInstance}});let r=n(86311)},79670:(e,t,n)=>{let r,i;n.d(t,{N:()=>Z});var o=n(65969),a=n(59600),s=n(96635),u=n(36937);let l=new s.NRn,d=new s.Pq0;class c extends s.CmU{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new s.qtW([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new s.qtW([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new s.LuO(t,6,1);return this.setAttribute("instanceStart",new s.eHs(n,3,0)),this.setAttribute("instanceEnd",new s.eHs(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let r=new s.LuO(n,2*t,1);return this.setAttribute("instanceColorStart",new s.eHs(r,t,0)),this.setAttribute("instanceColorEnd",new s.eHs(r,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new s.XJ7(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new s.NRn);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),l.setFromBufferAttribute(t),this.boundingBox.union(l))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new s.iyt),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,o=e.count;i<o;i++)d.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(d)),d.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(d));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var f=n(22588);let p=parseInt(s.sPf.replace(/\D+/g,""));class h extends s.BKk{constructor(e){super({type:"LineMaterial",uniforms:s.LlO.clone(s.LlO.merge([f.UniformsLib.common,f.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new s.I9Y(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${p>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let m=p>=125?"uv1":"uv2",v=new s.IUQ,y=new s.Pq0,g=new s.Pq0,_=new s.IUQ,b=new s.IUQ,z=new s.IUQ,w=new s.Pq0,S=new s.kn4,k=new s.cZY,x=new s.Pq0,O=new s.NRn,E=new s.iyt,$=new s.IUQ;function A(e,t,n){return $.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),$.multiplyScalar(1/$.w),$.x=i/n.width,$.y=i/n.height,$.applyMatrix4(e.projectionMatrixInverse),$.multiplyScalar(1/$.w),Math.abs(Math.max($.x,$.y))}class P extends s.eaF{constructor(e=new c,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,o=t.count;e<o;e++,i+=2)y.fromBufferAttribute(t,e),g.fromBufferAttribute(n,e),r[i]=0===i?0:r[i-1],r[i+1]=r[i]+y.distanceTo(g);let i=new s.LuO(r,2,1);return e.setAttribute("instanceDistanceStart",new s.eHs(i,1,0)),e.setAttribute("instanceDistanceEnd",new s.eHs(i,1,1)),this}raycast(e,t){let n,o,a=this.material.worldUnits,u=e.camera;null!==u||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;r=e.ray;let d=this.matrixWorld,c=this.geometry,f=this.material;if(i=f.linewidth+l,null===c.boundingSphere&&c.computeBoundingSphere(),E.copy(c.boundingSphere).applyMatrix4(d),a)n=.5*i;else{let e=Math.max(u.near,E.distanceToPoint(r.origin));n=A(u,e,f.resolution)}if(E.radius+=n,!1!==r.intersectsSphere(E)){if(null===c.boundingBox&&c.computeBoundingBox(),O.copy(c.boundingBox).applyMatrix4(d),a)o=.5*i;else{let e=Math.max(u.near,O.distanceToPoint(r.origin));o=A(u,e,f.resolution)}O.expandByScalar(o),!1!==r.intersectsBox(O)&&(a?function(e,t){let n=e.matrixWorld,o=e.geometry,a=o.attributes.instanceStart,u=o.attributes.instanceEnd,l=Math.min(o.instanceCount,a.count);for(let o=0;o<l;o++){k.start.fromBufferAttribute(a,o),k.end.fromBufferAttribute(u,o),k.applyMatrix4(n);let l=new s.Pq0,d=new s.Pq0;r.distanceSqToSegment(k.start,k.end,d,l),d.distanceTo(l)<.5*i&&t.push({point:d,pointOnLine:l,distance:r.origin.distanceTo(d),object:e,face:null,faceIndex:o,uv:null,[m]:null})}}(this,t):function(e,t,n){let o=t.projectionMatrix,a=e.material.resolution,u=e.matrixWorld,l=e.geometry,d=l.attributes.instanceStart,c=l.attributes.instanceEnd,f=Math.min(l.instanceCount,d.count),p=-t.near;r.at(1,z),z.w=1,z.applyMatrix4(t.matrixWorldInverse),z.applyMatrix4(o),z.multiplyScalar(1/z.w),z.x*=a.x/2,z.y*=a.y/2,z.z=0,w.copy(z),S.multiplyMatrices(t.matrixWorldInverse,u);for(let t=0;t<f;t++){if(_.fromBufferAttribute(d,t),b.fromBufferAttribute(c,t),_.w=1,b.w=1,_.applyMatrix4(S),b.applyMatrix4(S),_.z>p&&b.z>p)continue;if(_.z>p){let e=_.z-b.z,t=(_.z-p)/e;_.lerp(b,t)}else if(b.z>p){let e=b.z-_.z,t=(b.z-p)/e;b.lerp(_,t)}_.applyMatrix4(o),b.applyMatrix4(o),_.multiplyScalar(1/_.w),b.multiplyScalar(1/b.w),_.x*=a.x/2,_.y*=a.y/2,b.x*=a.x/2,b.y*=a.y/2,k.start.copy(_),k.start.z=0,k.end.copy(b),k.end.z=0;let l=k.closestPointToPointParameter(w,!0);k.at(l,x);let f=s.cj9.lerp(_.z,b.z,l),h=f>=-1&&f<=1,v=w.distanceTo(x)<.5*i;if(h&&v){k.start.fromBufferAttribute(d,t),k.end.fromBufferAttribute(c,t),k.start.applyMatrix4(u),k.end.applyMatrix4(u);let i=new s.Pq0,o=new s.Pq0;r.distanceSqToSegment(k.start,k.end,o,i),n.push({point:o,pointOnLine:i,distance:r.origin.distanceTo(o),object:e,face:null,faceIndex:t,uv:null,[m]:null})}}}(this,u,t))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(v),this.material.uniforms.resolution.value.set(v.z,v.w))}}class T extends c{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,r=new Float32Array(2*n);if(3===t)for(let i=0;i<n;i+=t)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5];else for(let i=0;i<n;i+=t)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5],r[2*i+6]=e[i+6],r[2*i+7]=e[i+7];return super.setColors(r,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class j extends P{constructor(e=new T,t=new h({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let Z=a.forwardRef(function({points:e,color:t=0xffffff,vertexColors:n,linewidth:r,lineWidth:i,segments:l,dashed:d,...f},p){var m,v;let y=(0,u.C)(e=>e.size),g=a.useMemo(()=>l?new P:new j,[l]),[_]=a.useState(()=>new h),b=(null==n||null==(m=n[0])?void 0:m.length)===4?4:3,z=a.useMemo(()=>{let r=l?new c:new T,i=e.map(e=>{let t=Array.isArray(e);return e instanceof s.Pq0||e instanceof s.IUQ?[e.x,e.y,e.z]:e instanceof s.I9Y?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(r.setPositions(i.flat()),n){t=0xffffff;let e=n.map(e=>e instanceof s.Q1f?e.toArray():e);r.setColors(e.flat(),b)}return r},[e,l,n,b]);return a.useLayoutEffect(()=>{g.computeLineDistances()},[e,g]),a.useLayoutEffect(()=>{d?_.defines.USE_DASH="":delete _.defines.USE_DASH,_.needsUpdate=!0},[d,_]),a.useEffect(()=>()=>{z.dispose(),_.dispose()},[z]),a.createElement("primitive",(0,o.A)({object:g,ref:p},f),a.createElement("primitive",{object:z,attach:"geometry"}),a.createElement("primitive",(0,o.A)({object:_,attach:"material",color:t,vertexColors:!!n,resolution:[y.width,y.height],linewidth:null!=(v=null!=r?r:i)?v:1,dashed:d,transparent:4===b},f)))})},82361:(e,t,n)=>{function r({reason:e,children:t}){return t}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"BailoutToCSR",{enumerable:!0,get:function(){return r}}),n(91181)},86311:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"workAsyncStorageInstance",{enumerable:!0,get:function(){return r}});let r=(0,n(27485).createAsyncLocalStorage)()}}]);