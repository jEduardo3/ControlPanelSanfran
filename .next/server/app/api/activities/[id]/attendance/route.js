"use strict";(()=>{var e={};e.id=620,e.ids=[620],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},1282:e=>{e.exports=require("child_process")},4770:e=>{e.exports=require("crypto")},665:e=>{e.exports=require("dns")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},9801:e=>{e.exports=require("os")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},1568:e=>{e.exports=require("zlib")},885:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>v,patchFetch:()=>b,requestAsyncStorage:()=>h,routeModule:()=>g,serverHooks:()=>y,staticGenerationAsyncStorage:()=>m});var a={};r.r(a),r.d(a,{GET:()=>p,POST:()=>f});var s=r(3278),i=r(5002),n=r(4877),o=r(1309),l=r(3154),d=r(526),c=r(4691),u=r(1418);async function p(e,{params:t}){try{let e=await (0,d.t)();if(!e)return o.NextResponse.json({error:"No autenticado"},{status:401});if(!((0,c.F)(e.permissions,"attendance.view")||(0,c.F)(e.permissions,"attendance.view.own")))return o.NextResponse.json({error:"Sin permisos para ver asistencia"},{status:403});let r=t.id,a=await l._.activity.findUnique({where:{id:r},select:{id:!0,title:!0,activityDate:!0,location:!0,assignedUsers:{include:{user:{select:{id:!0,fullName:!0,email:!0}}},orderBy:{user:{fullName:"asc"}}}}});if(!a)return o.NextResponse.json({error:"Actividad no encontrada"},{status:404});let s=await l._.attendance.findMany({where:{activityId:r},select:{id:!0,userId:!0,status:!0,notes:!0}}),i=await l._.excuse.findMany({where:{activityId:r,status:"APROBADA"},select:{userId:!0}}),n=new Map(s.map(e=>[e.userId,e])),u=new Set(i.map(e=>e.userId)),p=a.assignedUsers.map(e=>{let t=n.get(e.user.id),r=u.has(e.user.id);return{user:e.user,attendanceId:t?.id??null,status:t?.status??(r?"EXCUSADO":"AUSENTE"),notes:t?.notes??"",hasApprovedExcuse:r}});return o.NextResponse.json({data:{activity:{id:a.id,title:a.title,activityDate:a.activityDate,location:a.location},users:p}})}catch(e){return console.error("GET /api/activities/[id]/attendance error:",e),o.NextResponse.json({error:"Error cargando asistencia",details:String(e)},{status:500})}}async function f(e,{params:t}){try{let r=await (0,d.t)();if(!r)return o.NextResponse.json({error:"No autenticado"},{status:401});let a=(0,c.F)(r.permissions,"attendance.create"),s=(0,c.F)(r.permissions,"attendance.update");if(!a&&!s)return o.NextResponse.json({error:"No tienes permiso para pasar asistencia"},{status:403});let i=t.id,n=(await e.json()).records;if(!Array.isArray(n))return o.NextResponse.json({error:"records debe ser un arreglo"},{status:400});let p=(await l._.activityAssignment.findMany({where:{activityId:i},select:{userId:!0}})).map(e=>e.userId),f=await l._.excuse.findMany({where:{activityId:i,status:"APROBADA"},select:{userId:!0}}),g=new Set(f.map(e=>e.userId)),h=new Map(n.map(e=>[e.userId,e]));await l._.$transaction(async e=>{for(let t of p){let a=h.get(t),s=g.has(t)?"EXCUSADO":a?.status??"AUSENTE";await e.attendance.upsert({where:{userId_activityId:{userId:t,activityId:i}},create:{userId:t,activityId:i,status:s,notes:a?.notes??"",registeredById:r.id},update:{status:s,notes:a?.notes??"",registeredById:r.id}})}});let m=await l._.activity.findUnique({where:{id:i},select:{title:!0,activityDate:!0,location:!0}}),y=await l._.user.findMany({where:{id:{in:p},isActive:!0},select:{id:!0,fullName:!0,email:!0}});return m&&await (0,u.hp)({items:y,batchSize:8,delayMs:1500,send:async e=>{let t=h.get(e.id),r=g.has(e.id)?"EXCUSADO":t?.status??"AUSENTE";await (0,u.Pu)({to:e.email,fullName:e.fullName,activityTitle:m.title,activityDate:new Date(m.activityDate),location:m.location,status:r,notes:t?.notes??""})},onError:(e,t)=>{console.error(`Error enviando correo de asistencia a ${e.email}:`,t)}}),o.NextResponse.json({message:"Asistencia guardada correctamente"})}catch(e){return console.error("POST /api/activities/[id]/attendance error:",e),o.NextResponse.json({error:"Error guardando asistencia",details:String(e)},{status:500})}}let g=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/activities/[id]/attendance/route",pathname:"/api/activities/[id]/attendance",filename:"route",bundlePath:"app/api/activities/[id]/attendance/route"},resolvedPagePath:"C:\\Users\\Eduardo\\Desktop\\Proyects\\tesoreria-system\\src\\app\\api\\activities\\[id]\\attendance\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:y}=g,v="/api/activities/[id]/attendance/route";function b(){return(0,n.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:m})}},2845:(e,t,r)=>{var a=r(4115);r.o(a,"cookies")&&r.d(t,{cookies:function(){return a.cookies}})},568:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return i}});let a=r(5869),s=r(4869);class i{get isEnabled(){return this._provider.isEnabled}enable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=a.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},4115:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cookies:function(){return p},draftMode:function(){return f},headers:function(){return u}});let a=r(1576),s=r(8044),i=r(5911),n=r(2934),o=r(568),l=r(4869),d=r(5869),c=r(4580);function u(){let e="headers",t=d.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return s.HeadersAdapter.seal(new Headers({}));(0,l.trackDynamicDataAccessed)(t,e)}return(0,c.getExpectedRequestStore)(e).headers}function p(){let e="cookies",t=d.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return a.RequestCookiesAdapter.seal(new i.RequestCookies(new Headers({})));(0,l.trackDynamicDataAccessed)(t,e)}let r=(0,c.getExpectedRequestStore)(e),s=n.actionAsyncStorage.getStore();return(null==s?void 0:s.isAction)||(null==s?void 0:s.isAppRoute)?r.mutableCookies:r.cookies}function f(){let e=(0,c.getExpectedRequestStore)("draftMode");return new o.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},8044:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{HeadersAdapter:function(){return i},ReadonlyHeadersError:function(){return s}});let a=r(4203);class s extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new s}}class i extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,r,s){if("symbol"==typeof r)return a.ReflectAdapter.get(t,r,s);let i=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===i);if(void 0!==n)return a.ReflectAdapter.get(t,n,s)},set(t,r,s,i){if("symbol"==typeof r)return a.ReflectAdapter.set(t,r,s,i);let n=r.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===n);return a.ReflectAdapter.set(t,o??r,s,i)},has(t,r){if("symbol"==typeof r)return a.ReflectAdapter.has(t,r);let s=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0!==i&&a.ReflectAdapter.has(t,i)},deleteProperty(t,r){if("symbol"==typeof r)return a.ReflectAdapter.deleteProperty(t,r);let s=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0===i||a.ReflectAdapter.deleteProperty(t,i)}})}static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"append":case"delete":case"set":return s.callable;default:return a.ReflectAdapter.get(e,t,r)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new i(e)}append(e,t){let r=this.headers[e];"string"==typeof r?this.headers[e]=[r,t]:Array.isArray(r)?r.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[r,a]of this.entries())e.call(t,a,r,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),r=this.get(t);yield[t,r]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},1576:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{MutableRequestCookiesAdapter:function(){return u},ReadonlyRequestCookiesError:function(){return n},RequestCookiesAdapter:function(){return o},appendMutableCookies:function(){return c},getModifiedCookieValues:function(){return d}});let a=r(5911),s=r(4203),i=r(5869);class n extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new n}}class o{static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"clear":case"delete":case"set":return n.callable;default:return s.ReflectAdapter.get(e,t,r)}}})}}let l=Symbol.for("next.mutated.cookies");function d(e){let t=e[l];return t&&Array.isArray(t)&&0!==t.length?t:[]}function c(e,t){let r=d(t);if(0===r.length)return!1;let s=new a.ResponseCookies(e),i=s.getAll();for(let e of r)s.set(e);for(let e of i)s.set(e);return!0}class u{static wrap(e,t){let r=new a.ResponseCookies(new Headers);for(let t of e.getAll())r.set(t);let n=[],o=new Set,d=()=>{let e=i.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),n=r.getAll().filter(e=>o.has(e.name)),t){let e=[];for(let t of n){let r=new a.ResponseCookies(new Headers);r.set(t),e.push(r.toString())}t(e)}};return new Proxy(r,{get(e,t,r){switch(t){case l:return n;case"delete":return function(...t){o.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{d()}};case"set":return function(...t){o.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{d()}};default:return s.ReflectAdapter.get(e,t,r)}}})}}},5713:(e,t,r)=>{r.d(t,{Oe:()=>d,c_:()=>l,fT:()=>c,WX:()=>u});let a=require("bcrypt");var s=r.n(a),i=r(7390),n=r.n(i);let o=process.env.JWT_SECRET||"dev_secret";async function l(e){return s().hash(e,10)}async function d(e,t){return s().compare(e,t)}function c(e){return n().sign(e,o,{expiresIn:"8h"})}function u(e){try{return n().verify(e,o)}catch{return null}}},1418:(e,t,r)=>{r.d(t,{HE:()=>p,NX:()=>f,Pu:()=>g,So:()=>m,gw:()=>c,hp:()=>y,ki:()=>h,tJ:()=>u});var a=r(6742);let s=process.env.SMTP_HOST,i=Number(process.env.SMTP_PORT??587),n=process.env.SMTP_USER,o=process.env.SMTP_PASS,l=process.env.SMTP_FROM;function d(){if(!s||!n||!o||!l)throw Error("Faltan variables SMTP en .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM");return a.createTransport({host:s,port:i,secure:465===i,auth:{user:n,pass:o}})}async function c(e){let t=d(),r=process.env.APP_BASE_URL??"http://localhost:3000",a=e.receiptUrl?`${r}${e.receiptUrl}`:null,s=`Q ${e.amountPaid.toFixed(2)}`,i=`Q ${e.remainingBalance.toFixed(2)}`,n=e.paymentDate.toLocaleString("es-GT"),o=function(e){switch(e){case"PAGADO":return"Pagado completamente";case"PARCIAL":return"Pago parcial";default:return"Pendiente"}}(e.obligationStatus),c="PAGADO"===e.obligationStatus?`<p style="color:#166534;"><strong>Tu obligaci\xf3n ha sido pagada completamente.</strong></p>`:`<p style="color:#92400e;"><strong>Tu obligaci\xf3n a\xfan tiene saldo pendiente.</strong></p>`;await t.sendMail({from:l,to:e.to,subject:"Recibo de pago - Sistema de Tesorer\xeda",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Pago registrado correctamente</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado un pago en el sistema de tesorer\xeda.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Monto pagado:</strong> ${s}</li>
          <li><strong>Saldo restante:</strong> ${i}</li>
          <li><strong>Estado actual:</strong> ${o}</li>
          <li><strong>M\xe9todo de pago:</strong> ${e.paymentMethod??"No especificado"}</li>
          <li><strong>Fecha:</strong> ${n}</li>
        </ul>

        ${c}

        ${a?`<p>
                Puedes ver tu recibo aqu\xed:<br />
                <a href="${a}" target="_blank" rel="noreferrer">${a}</a>
              </p>`:""}

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function u(e){let t=d(),r=`Q ${e.amount.toFixed(2)}`,a=e.dueDate.toLocaleDateString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva Responsabilidad Asignada",html:`
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
    `})}async function p(e){let t=d(),r=e.activityDate.toLocaleString("es-GT"),a="APROBADA"===e.status?"Aprobada":"Rechazada",s="APROBADA"===e.status?"#166534":"#991b1b",i="APROBADA"===e.status?"Tu excusa fue aprobada por administraci\xf3n.":"Tu excusa fue rechazada por administraci\xf3n.";await t.sendMail({from:l,to:e.to,subject:`Excusa ${a.toLowerCase()} - Sistema de Tesorer\xeda`,html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualizaci\xf3n de excusa</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p style="color:${s};"><strong>${i}</strong></p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha de actividad:</strong> ${r}</li>
          <li><strong>Estado:</strong> ${a}</li>
          <li><strong>Justificaci\xf3n enviada:</strong> ${e.reason}</li>
        </ul>

        <p>Si tienes dudas, puedes comunicarte con la administraci\xf3n.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function f(e){let t=d(),r=e.activityDate.toLocaleString("es-GT");await t.sendMail({from:l,to:e.to,subject:"Nueva actividad asignada - Sistema de Hermandad",html:`
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
    `})}async function g(e){let t=d(),r=e.activityDate.toLocaleString("es-GT"),a="PRESENTE"===e.status?"Asisti\xf3":"AUSENTE"===e.status?"No asisti\xf3":"Excusado";await t.sendMail({from:l,to:e.to,subject:"Registro de asistencia a actividad",html:`
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
    `})}async function h(e){let t=d();await t.sendMail({from:l,to:e.to,subject:"Credenciales de acceso al sistema",html:`
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
    `})}async function m(e){let t=d();await t.sendMail({from:l,to:e.to,subject:"Restablece tu contrase\xf1a",html:`
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
    `})}async function y({items:e,batchSize:t=10,delayMs:r=1e3,send:a,onError:s}){for(let i=0;i<e.length;i+=t){let n=e.slice(i,i+t);await Promise.all(n.map(async e=>{try{await a(e)}catch(t){s?s(e,t):console.error("Error enviando correo:",t)}})),i+t<e.length&&await function(e){return new Promise(t=>setTimeout(t,e))}(r)}}},4691:(e,t,r)=>{function a(e,t){return e.includes(t)}r.d(t,{F:()=>a})},3154:(e,t,r)=>{r.d(t,{_:()=>s});let a=require("@prisma/client"),s=globalThis.prisma??new a.PrismaClient({log:["error"]})},526:(e,t,r)=>{r.d(t,{Z:()=>n,t:()=>o});var a=r(2845),s=r(5713);let i="tesoreria_token";function n(){return i}async function o(){let e=await (0,a.cookies)(),t=e.get(i)?.value;return t?(0,s.WX)(t):null}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[787,68,742],()=>r(885));module.exports=a})();