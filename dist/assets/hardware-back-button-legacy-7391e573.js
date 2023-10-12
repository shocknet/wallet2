System.register([],(function(t,e){"use strict";return{execute:function(){
/*!
       * (C) Ionic http://ionicframework.com - MIT License
       */
t("blockHardwareBackButton",(()=>{document.addEventListener("backbutton",(()=>{}))})),t("startHardwareBackButton",(()=>{const t=document;let e=!1;t.addEventListener("backbutton",(()=>{if(e)return;let n=0,r=[];const i=new CustomEvent("ionBackButton",{bubbles:!1,detail:{register(t,e){r.push({priority:t,handler:e,id:n++})}}});t.dispatchEvent(i);const o=()=>{if(r.length>0){let t={priority:Number.MIN_SAFE_INTEGER,handler:()=>{},id:-1};r.forEach((e=>{e.priority>=t.priority&&(t=e)})),e=!0,r=r.filter((e=>e.id!==t.id)),(async t=>{try{if(null==t?void 0:t.handler){const e=t.handler(o);null!=e&&await e}}catch(e){console.error(e)}})(t).then((()=>e=!1))}};o()}))})),t("OVERLAY_BACK_BUTTON_PRIORITY",100),t("MENU_BACK_BUTTON_PRIORITY",99)}}}));
