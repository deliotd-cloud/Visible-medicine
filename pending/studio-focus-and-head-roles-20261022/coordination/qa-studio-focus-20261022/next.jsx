import React from 'react';
export function useSearchParams(){return new URLSearchParams(window.location.search);}
export default function Link({href,children,...rest}){return <a {...rest} href={href} onClick={e=>e.preventDefault()}>{children}</a>;}
