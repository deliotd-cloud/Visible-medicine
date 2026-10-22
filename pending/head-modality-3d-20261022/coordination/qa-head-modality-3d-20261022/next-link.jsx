import React from 'react';
// Test boundary only. The attribute identifies links which use Next in production.
export default function Link({href,prefetch,replace,scroll,...props}){
  return <a data-client-link="true" href={href} {...props}/>;
}
