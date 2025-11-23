import{b as d,e as f}from"https://st-p.rmcdn1.net/fb5a3d71/dist/c/c-6KH6X3XY.js";import{k as e,l as c,p as l,r as t,v as s}from"https://st-p.rmcdn1.net/fb5a3d71/dist/c/c-XLELSLJ5.js";import{a as o,j as p}from"https://st-p.rmcdn1.net/fb5a3d71/dist/c/c-F7HHU2GW.js";import{a as n}from"https://st-p.rmcdn1.net/fb5a3d71/dist/c/c-ZYG7ZY5I.js";var a,m,u,i=n(()=>{"use strict";c();s();p();f();a=d.withComponent(t("button")`
  border: none;
  display: inline-block;
  text-align: center;
  text-decoration: none;
  background: transparent;
  transition: 0.1s color;
  cursor: pointer;
  color: inherit;

  font-family: ${({theme:r})=>r.fonts.main};

  &:active,
  &:focus {
    outline: none;
  }

  ${({disabled:r})=>r?"pointer-events: none;":""};

  &:disabled {
    opacity: 0.4;
  }

  ${l({primary:{color:o.red,"&:hover, &:focus":{color:o.black}},secondary:{color:o.black,"&:hover, &:focus":{color:o.red,"& path":{fill:o.red}}},tertiary:{color:o.gray,"&:hover, &:focus":{color:o.red,"& path":{fill:o.red}}},bordered:{color:o.black,"&:hover, &:focus":{color:o.red,"& svg":{color:o.red},"& path":{fill:o.red}},border:`1px solid ${e(.92,o.black)}`,borderRadius:"8px","&:disabled":{opacity:"1 !important",color:`${e(.6,o.black)}`,border:`1px solid ${e(.92,o.black)}`}},unstyled:{},clean:{"&:hover,&:focus":{opacity:.8}}})}
`);a.defaultProps={textStyle:"regular",variant:"secondary",margin:0,padding:0};m=t(a)`
  transition: color 0.1s, background 0.1s;

  margin-left: ${r=>r.marginLeft!==void 0?r.marginLeft:"-34px"};
  padding: ${r=>r.padding?r.padding:"8px 34px 18px"};
  background: ${({theme:r})=>r.colors.lightGray};
  @media (pointer: fine) {
    &:hover {
      color: ${({theme:r})=>r.colors.white};
      background: ${({theme:r})=>r.colors.tomato};
    }
  }
`;m.defaultProps={textStyle:"heading",color:"tomato",borderRadius:40};u=a});var b=n(()=>{"use strict";i();i()});export{a,u as b,b as c};
