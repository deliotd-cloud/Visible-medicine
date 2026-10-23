import React from 'react';
// Fixture-only native navigation: production Next/entitlement routes are untouched.
export default function FixtureLink({prefetch,children,...props}:any){return <a {...props}>{children}</a>;}
