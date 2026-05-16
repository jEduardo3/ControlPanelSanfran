"use strict";(()=>{var e={};e.id=118,e.ids=[118],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},1282:e=>{e.exports=require("child_process")},4770:e=>{e.exports=require("crypto")},665:e=>{e.exports=require("dns")},7702:e=>{e.exports=require("events")},2048:e=>{e.exports=require("fs")},2615:e=>{e.exports=require("http")},5240:e=>{e.exports=require("https")},8216:e=>{e.exports=require("net")},9801:e=>{e.exports=require("os")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},2452:e=>{e.exports=require("tls")},7360:e=>{e.exports=require("url")},1764:e=>{e.exports=require("util")},1568:e=>{e.exports=require("zlib")},8864:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>h,patchFetch:()=>v,requestAsyncStorage:()=>g,routeModule:()=>p,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var r={};t.r(r),t.d(r,{POST:()=>c});var s=t(3278),o=t(5002),i=t(4877),n=t(1309),l=t(3154),d=t(5713),u=t(1418);async function c(e){try{let a=await e.json(),t=String(a.email??"").trim().toLowerCase();if(!t)return n.NextResponse.json({error:"El correo es obligatorio"},{status:400});let r=await l._.user.findFirst({where:{email:{equals:t,mode:"insensitive"},isActive:!0}});if(!r)return n.NextResponse.json({error:"No existe un usuario activo con ese correo"},{status:404});let s=`Hmdad-${Math.floor(1e5+9e5*Math.random())}`,o=await (0,d.c_)(s);return await l._.user.update({where:{id:r.id},data:{passwordHash:o,mustChangePassword:!0}}),await (0,u.So)({to:r.email,fullName:r.fullName,username:r.username,temporaryPassword:s}),n.NextResponse.json({message:"Se ha enviado una contrase\xf1a temporal a tu correo."})}catch(e){return console.error("POST /api/auth/forgot-password error:",e),n.NextResponse.json({error:"Error restableciendo contrase\xf1a",details:String(e)},{status:500})}}let p=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/auth/forgot-password/route",pathname:"/api/auth/forgot-password",filename:"route",bundlePath:"app/api/auth/forgot-password/route"},resolvedPagePath:"C:\\Users\\Eduardo\\Desktop\\Proyects\\tesoreria-system\\src\\app\\api\\auth\\forgot-password\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:g,staticGenerationAsyncStorage:m,serverHooks:f}=p,h="/api/auth/forgot-password/route";function v(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},5713:(e,a,t)=>{t.d(a,{Oe:()=>d,c_:()=>l,fT:()=>u,WX:()=>c});let r=require("bcrypt");var s=t.n(r),o=t(7390),i=t.n(o);let n=process.env.JWT_SECRET||"dev_secret";async function l(e){return s().hash(e,10)}async function d(e,a){return s().compare(e,a)}function u(e){return i().sign(e,n,{expiresIn:"8h"})}function c(e){try{return i().verify(e,n)}catch{return null}}},1418:(e,a,t)=>{t.d(a,{HE:()=>p,NX:()=>g,Pu:()=>m,So:()=>h,gw:()=>u,hp:()=>v,ki:()=>f,tJ:()=>c});var r=t(6742);let s=process.env.SMTP_HOST,o=Number(process.env.SMTP_PORT??587),i=process.env.SMTP_USER,n=process.env.SMTP_PASS,l=process.env.SMTP_FROM;function d(){if(!s||!i||!n||!l)throw Error("Faltan variables SMTP en .env: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM");return r.createTransport({host:s,port:o,secure:465===o,auth:{user:i,pass:n}})}async function u(e){let a=d(),t=process.env.APP_BASE_URL??"http://localhost:3000",r=e.receiptUrl?`${t}${e.receiptUrl}`:null,s=`Q ${e.amountPaid.toFixed(2)}`,o=`Q ${e.remainingBalance.toFixed(2)}`,i=e.paymentDate.toLocaleString("es-GT"),n=function(e){switch(e){case"PAGADO":return"Pagado completamente";case"PARCIAL":return"Pago parcial";default:return"Pendiente"}}(e.obligationStatus),u="PAGADO"===e.obligationStatus?`<p style="color:#166534;"><strong>Tu obligaci\xf3n ha sido pagada completamente.</strong></p>`:`<p style="color:#92400e;"><strong>Tu obligaci\xf3n a\xfan tiene saldo pendiente.</strong></p>`;await a.sendMail({from:l,to:e.to,subject:"Recibo de pago - Sistema de Tesorer\xeda",html:`
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

        ${u}

        ${r?`<p>
                Puedes ver tu recibo aqu\xed:<br />
                <a href="${r}" target="_blank" rel="noreferrer">${r}</a>
              </p>`:""}

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function c(e){let a=d(),t=`Q ${e.amount.toFixed(2)}`,r=e.dueDate.toLocaleDateString("es-GT");await a.sendMail({from:l,to:e.to,subject:"Nueva Responsabilidad Asignada",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva Responsabilidad Asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

       <p>Se te ha asignado una nueva responsabilidad dentro de la hermandad.</p>

        <ul>
          <li><strong>Responsabilidad:</strong> ${e.obligationTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Monto:</strong> ${t}</li>
          <li><strong>Fecha l\xedmite:</strong> ${r}</li>
        </ul>

        <p>Por favor revisa tu panel de tesorer\xeda para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function p(e){let a=d(),t=e.activityDate.toLocaleString("es-GT"),r="APROBADA"===e.status?"Aprobada":"Rechazada",s="APROBADA"===e.status?"#166534":"#991b1b",o="APROBADA"===e.status?"Tu excusa fue aprobada por administraci\xf3n.":"Tu excusa fue rechazada por administraci\xf3n.";await a.sendMail({from:l,to:e.to,subject:`Excusa ${r.toLowerCase()} - Sistema de Tesorer\xeda`,html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Actualizaci\xf3n de excusa</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p style="color:${s};"><strong>${o}</strong></p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha de actividad:</strong> ${t}</li>
          <li><strong>Estado:</strong> ${r}</li>
          <li><strong>Justificaci\xf3n enviada:</strong> ${e.reason}</li>
        </ul>

        <p>Si tienes dudas, puedes comunicarte con la administraci\xf3n.</p>

        <p>Saludos,<br />Sistema de Tesorer\xeda</p>
      </div>
    `})}async function g(e){let a=d(),t=e.activityDate.toLocaleString("es-GT");await a.sendMail({from:l,to:e.to,subject:"Nueva actividad asignada - Sistema de Hermandad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Nueva actividad asignada</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se te ha asignado una nueva actividad dentro del sistema de la hermandad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Descripci\xf3n:</strong> ${e.description??"Sin descripci\xf3n"}</li>
          <li><strong>Fecha y hora:</strong> ${t}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
        </ul>

        <p>Por favor revisa tu panel para m\xe1s detalles.</p>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function m(e){let a=d(),t=e.activityDate.toLocaleString("es-GT"),r="PRESENTE"===e.status?"Asisti\xf3":"AUSENTE"===e.status?"No asisti\xf3":"Excusado";await a.sendMail({from:l,to:e.to,subject:"Registro de asistencia a actividad",html:`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Registro de asistencia</h2>

        <p>Hola <strong>${e.fullName}</strong>,</p>

        <p>Se ha registrado tu asistencia para esta actividad.</p>

        <ul>
          <li><strong>Actividad:</strong> ${e.activityTitle}</li>
          <li><strong>Fecha y hora:</strong> ${t}</li>
          <li><strong>Ubicaci\xf3n:</strong> ${e.location??"Sin ubicaci\xf3n definida"}</li>
          <li><strong>Estado:</strong> ${r}</li>
          <li><strong>Notas:</strong> ${e.notes||"Sin notas"}</li>
        </ul>

        <p>Saludos,<br />Sistema de Hermandad</p>
      </div>
    `})}async function f(e){let a=d();await a.sendMail({from:l,to:e.to,subject:"Credenciales de acceso al sistema",html:`
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
    `})}async function h(e){let a=d();await a.sendMail({from:l,to:e.to,subject:"Restablece tu contrase\xf1a",html:`
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
    `})}async function v({items:e,batchSize:a=10,delayMs:t=1e3,send:r,onError:s}){for(let o=0;o<e.length;o+=a){let i=e.slice(o,o+a);await Promise.all(i.map(async e=>{try{await r(e)}catch(a){s?s(e,a):console.error("Error enviando correo:",a)}})),o+a<e.length&&await function(e){return new Promise(a=>setTimeout(a,e))}(t)}}},3154:(e,a,t)=>{t.d(a,{_:()=>s});let r=require("@prisma/client"),s=globalThis.prisma??new r.PrismaClient({log:["error"]})}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[787,68,742],()=>t(8864));module.exports=r})();