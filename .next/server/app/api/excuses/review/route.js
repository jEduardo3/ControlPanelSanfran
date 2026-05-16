"use strict";(()=>{var e={};e.id=330,e.ids=[330],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},1282:e=>{e.exports=require("child_process")},4770:e=>{e.exports=require("crypto")},665:e=>{e.exports=require("dns")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},9801:e=>{e.exports=require("os")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},1568:e=>{e.exports=require("zlib")},5779:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>v,requestAsyncStorage:()=>g,routeModule:()=>f,serverHooks:()=>m,staticGenerationAsyncStorage:()=>h});var a={};r.r(a),r.d(a,{PATCH:()=>p});var s=r(3278),o=r(5002),i=r(4877),n=r(1309),l=r(3154),c=r(526),d=r(4691),u=r(1418);async function p(e){try{let t=await (0,c.t)();if(!t)return n.NextResponse.json({error:"No autenticado"},{status:401});if(!(0,d.F)(t.permissions,"excuses.review"))return n.NextResponse.json({error:"No tienes permiso para revisar excusas"},{status:403});let{excuseId:r,status:a}=await e.json();if(!r||!a)return n.NextResponse.json({error:"excuseId y status son obligatorios"},{status:400});if(!["APROBADA","RECHAZADA"].includes(a))return n.NextResponse.json({error:"Estado inv\xe1lido para revisi\xf3n"},{status:400});let s=await l._.excuse.findUnique({where:{id:r},include:{user:{select:{id:!0,fullName:!0,email:!0}},activity:{select:{id:!0,title:!0,activityDate:!0}}}});if(!s)return n.NextResponse.json({error:"Excusa no encontrada"},{status:404});let o=await l._.excuse.update({where:{id:r},data:{status:a,reviewedById:t.id,reviewedAt:new Date},include:{user:{select:{id:!0,fullName:!0,email:!0}},activity:{select:{id:!0,title:!0,activityDate:!0}},reviewedBy:{select:{id:!0,fullName:!0,email:!0}}}});try{await (0,u.HE)({to:o.user.email,fullName:o.user.fullName,activityTitle:o.activity.title,activityDate:new Date(o.activity.activityDate),reason:s.reason,status:a})}catch(e){console.error(`Error enviando correo de resoluci\xf3n de excusa a ${o.user.email}:`,e)}return n.NextResponse.json({message:"APROBADA"===a?"Excusa aprobada correctamente":"Excusa rechazada correctamente",data:o})}catch(e){return console.error("PATCH /api/excuses/review error:",e),n.NextResponse.json({error:"Error revisando excusa",details:String(e)},{status:500})}}let f=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/excuses/review/route",pathname:"/api/excuses/review",filename:"route",bundlePath:"app/api/excuses/review/route"},resolvedPagePath:"C:\\Users\\Eduardo\\Desktop\\Proyects\\tesoreria-system\\src\\app\\api\\excuses\\review\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:g,staticGenerationAsyncStorage:h,serverHooks:m}=f,y="/api/excuses/review/route";function v(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:h})}},2845:(e,t,r)=>{var a=r(4115);r.o(a,"cookies")&&r.d(t,{cookies:function(){return a.cookies}})},568:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return o}});let a=r(5869),s=r(4869);class o{get isEnabled(){return this._provider.isEnabled}enable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},4115:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cookies:function(){return p},draftMode:function(){return f},headers:function(){return u}});let a=r(1576),s=r(8044),o=r(5911),i=r(2934),n=r(568),l=r(4869),c=r(5869),d=r(4580);function u(){let e="headers",t=c.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return s.HeadersAdapter.seal(new Headers({}));(0,l.trackDynamicDataAccessed)(t,e)}return(0,d.getExpectedRequestStore)(e).headers}function p(){let e="cookies",t=c.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return a.RequestCookiesAdapter.seal(new o.RequestCookies(new Headers({})));(0,l.trackDynamicDataAccessed)(t,e)}let r=(0,d.getExpectedRequestStore)(e),s=i.actionAsyncStorage.getStore();return(null==s?void 0:s.isAction)||(null==s?void 0:s.isAppRoute)?r.mutableCookies:r.cookies}function f(){let e=(0,d.getExpectedRequestStore)("draftMode");return new n.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},8044:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{HeadersAdapter:function(){return o},ReadonlyHeadersError:function(){return s}});let a=r(4203);class s extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new s}}class o extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,r,s){if("symbol"==typeof r)return a.ReflectAdapter.get(t,r,s);let o=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===o);if(void 0!==i)return a.ReflectAdapter.get(t,i,s)},set(t,r,s,o){if("symbol"==typeof r)return a.ReflectAdapter.set(t,r,s,o);let i=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===i);return a.ReflectAdapter.set(t,n??r,s,o)},has(t,r){if("symbol"==typeof r)return a.ReflectAdapter.has(t,r);let s=r.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0!==o&&a.ReflectAdapter.has(t,o)},deleteProperty(t,r){if("symbol"==typeof r)return a.ReflectAdapter.deleteProperty(t,r);let s=r.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0===o||a.ReflectAdapter.deleteProperty(t,o)}})}static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"append":case"delete":case"set":return s.callable;default:return a.ReflectAdapter.get(e,t,r)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new o(e)}append(e,t){let r=this.headers[e];"string"==typeof r?this.headers[e]=[r,t]:Array.isArray(r)?r.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[r,a]of this.entries())e.call(t,a,r,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),r=this.get(t);yield[t,r]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},1576:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{MutableRequestCookiesAdapter:function(){return u},ReadonlyRequestCookiesError:function(){return i},RequestCookiesAdapter:function(){return n},appendMutableCookies:function(){return d},getModifiedCookieValues:function(){return c}});let a=r(5911),s=r(4203),o=r(5869);class i extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new i}}class n{static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"clear":case"delete":case"set":return i.callable;default:return s.ReflectAdapter.get(e,t,r)}}})}}let l=Symbol.for("next.mutated.cookies");function c(e){let t=e[l];return t&&Array.isArray(t)&&0!==t.length?t:[]}function d(e,t){let r=c(t);if(0===r.length)return!1;let s=new a.ResponseCookies(e),o=s.getAll();for(let e of r)s.set(e);for(let e of o)s.set(e);return!0}class u{static wrap(e,t){let r=new a.ResponseCookies(new Headers);for(let t of e.getAll())r.set(t);let i=[],n=new Set,c=()=>{let e=o.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),i=r.getAll().filter(e=>n.has(e.name)),t){let e=[];for(let t of i){let r=new a.ResponseCookies(new Headers);r.set(t),e.push(r.toString())}t(e)}};return new Proxy(r,{get(e,t,r){switch(t){case l:return i;case"delete":return function(...t){n.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{c()}};case"set":return function(...t){n.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{c()}};default:return s.ReflectAdapter.get(e,t,r)}}})}}},5713:(e,t,r)=>{r.d(t,{Oe:()=>c,c_:()=>l,fT:()=>d,WX:()=>u});let a=require("bcrypt");var s=r.n(a),o=r(7390),i=r.n(o);let n=process.env.JWT_SECRET||"dev_secret";async function l(e){return s().hash(e,10)}async function c(e,t){return s().compare(e,t)}function d(e){return i().sign(e,n,{expiresIn:"8h"})}function u(e){try{return i().verify(e,n)}catch{return null}}},1418:(e,t,r)=>{r.d(t,{HE:()=>p,NX:()=>f,Pu:()=>g,So:()=>m,gw:()=>d,hp:()=>y,ki:()=>h,tJ:()=>u});var a=r(6742);let s=process.env.SMTP_HOST,o=Number(process.env.SMTP_PORT??587),i=process.env.SMTP_USER,n=process.env.SMTP_PASS,l=process.env.SMTP_FROM;function c(){if(!s||!i||!n||!l)throw Error("Faltan variables SMTP en .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM");return a.createTransport({host:s,port:o,secure:465===o,auth:{user:i,pass:n}})}async function d(e){let t=c(),r=process.env.APP_BASE_URL??"http://localhost:3000",a=e.receiptUrl?`${r}${e.receiptUrl}`:null,s=`Q ${e.amountPaid.toFixed(2)}`,o=`Q ${e.remainingBalance.toFixed(2)}`,i=e.paymentDate.toLocaleString("es-GT"),n=function(e){switch(e){case"PAGADO":return"Pagado completamente";case"PARCIAL":return"Pago parcial";default:return"Pendiente"}}(e.obligationStatus),d="PAGADO"===e.obligationStatus?`<p style="color:#166534;"><strong>Tu obligaci\xf3n ha sido pagada completamente.</strong></p>`:`<p style="color:#92400e;"><strong>Tu obligaci\xf3n a\xfan tiene saldo pendiente.</strong></p>`;await t.sendMail({from:l,to:e.to,subject:"Recibo de pago - Sistema de Tesorer\xeda",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Pago registrado correctamente</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado un pago en el sistema de tesorer\xeda.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Monto pagado:</strong> ${s}</li>
          <li><strong>Saldo restante:</strong> ${o}</li>
          <li><strong>Estado actual:</strong> ${n}</li>
          <li><strong>M\xe9todo de pago:</strong> ${e.paymentMethod??"No especificado"}</li>
          <li><strong>Fecha:</strong> ${i}</li>
        </ul>

        ${d}

        ${a?`<p>
                Puedes ver tu recibo aqu\xed:<br />
                <a href="${a}" target="_blank" rel="noreferrer">${a}</a>
              </p>`:""}

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function u(e){let t=c(),r=`Q ${e.amount.toFixed(2)}`,a=e.dueDate.toLocaleDateString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva Responsabilidad Asignada",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva Responsabilidad Asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

       <p>Se te ha asignado una nueva responsabilidad dentro de la hermandad.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Monto:</strong> ${r}</li>
          <li><strong>Fecha l\xedmite:</strong> ${a}</li>
        </ul>

        <p>Por favor revisa tu panel de tesorer\xeda para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function p(e){let t=c(),r=e.activityDate.toLocaleString("es-GT"),a="APROBADA"===e.status?"Aprobada":"Rechazada",s="APROBADA"===e.status?"#166534":"#991b1b",o="APROBADA"===e.status?"Tu excusa fue aprobada por administraci\xf3n.":"Tu excusa fue rechazada por administraci\xf3n.";await t.sendMail({from:l,to:e.to,subject:`Excusa ${a.toLowerCase()} - Sistema de Tesorer\xeda`,html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualizaci\xf3n de excusa</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p style="color:${s};"><strong>${o}</strong></p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha de actividad:</strong> ${r}</li>
          <li><strong>Estado:</strong> ${a}</li>
          <li><strong>Justificaci\xf3n enviada:</strong> ${e.reason}</li>
        </ul>

        <p>Si tienes dudas, puedes comunicarte con la administraci\xf3n.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function f(e){let t=c(),r=e.activityDate.toLocaleString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva actividad asignada - Sistema de Hermandad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva actividad asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se te ha asignado una nueva actividad dentro del sistema de la hermandad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Fecha y hora:</strong> ${r}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
        </ul>

        <p>Por favor revisa tu panel para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function g(e){let t=c(),r=e.activityDate.toLocaleString("es-GT"),a="PRESENTE"===e.status?"Asisti\xf3":"AUSENTE"===e.status?"No asisti\xf3":"Excusado";await t.sendMail({from:l,to:e.to,subject:"Registro de asistencia a actividad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Registro de asistencia</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado tu asistencia para esta actividad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha y hora:</strong> ${r}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
          <li><strong>Estado:</strong> ${a}</li>
          <li><strong>Notas:</strong> ${e.notes||"Sin notas"}</li>
        </ul>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function h(e){let t=c();await t.sendMail({from:l,to:e.to,subject:"Credenciales de acceso al sistema",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Credenciales de acceso</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha creado tu usuario para ingresar al sistema interno de la hermandad.</p>

        <ul>
          <li><strong>Usuario:</strong> ${e.username}</li>
          <li><strong>Contrase\xf1a:</strong> ${e.password}</li>
        </ul>

        <p>Por favor conserva esta informaci\xf3n de forma segura.</p>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function m(e){let t=c();await t.sendMail({from:l,to:e.to,subject:"Restablece tu contrase\xf1a",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Restablece tu contrase\xf1a</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha generado una contrase\xf1a temporal para tu usuario.</p>

        <ul>
          <li><strong>Usuario:</strong> ${e.username}</li>
          <li><strong>Contrase\xf1a temporal:</strong> ${e.temporaryPassword}</li>
        </ul>

        <p>Al ingresar al sistema, deber\xe1s cambiar esta contrase\xf1a por una nueva.</p>

        <p>Saludos,<br />Hermandad de San Francisco el grande</p>
      </div>
    `})}async function y({items:e,batchSize:t=10,delayMs:r=1e3,send:a,onError:s}){for(let o=0;o<e.length;o+=t){let i=e.slice(o,o+t);await Promise.all(i.map(async e=>{try{await a(e)}catch(t){s?s(e,t):console.error("Error enviando correo:",t)}})),o+t<e.length&&await function(e){return new Promise(t=>setTimeout(t,e))}(r)}}},4691:(e,t,r)=>{function a(e,t){return e.includes(t)}r.d(t,{F:()=>a})},3154:(e,t,r)=>{r.d(t,{_:()=>s});let a=require("@prisma/client"),s=globalThis.prisma??new a.PrismaClient({log:["error"]})},526:(e,t,r)=>{r.d(t,{Z:()=>i,t:()=>n});var a=r(2845),s=r(5713);let o="tesoreria_token";function i(){return o}async function n(){let e=await (0,a.cookies)(),t=e.get(o)?.value;return t?(0,s.WX)(t):null}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[787,68,742],()=>r(5779));module.exports=a})();