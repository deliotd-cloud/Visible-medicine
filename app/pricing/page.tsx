import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Plans",
  description: "The proposed individual and institutional commercial model for Visible Medicine.",
};

const plans = [
  { name: "Explorer", price: "Free access", audience: "For discovering the platform", features: ["Selected Atlas modules", "Public educational resources", "Official course previews", "No institutional publishing"] },
  { name: "Individual", price: "Annual subscription", audience: "For independent learners", features: ["Full published Atlas", "Visible Medicine official courses", "Bookmarks and saved progress", "Practice and revision tools"] },
  { name: "Institution", price: "Annual platform licence", audience: "For universities, hospitals and societies", features: ["Private organisation workspace", "Studio authoring and assessments", "Educator and learner roles", "Engagement and completion reporting"] },
  { name: "Enterprise", price: "Custom agreement", audience: "For multi-school or complex deployments", features: ["Multiple organisations", "Advanced identity and LMS integration", "Higher storage and support tiers", "Contracted governance requirements"] },
];

export default function PricingPage() {
  return (
    <main className="inner-page pricing-page">
      <section className="page-hero pricing-page-hero"><p className="eyebrow"><span /> Commercial model</p><h1>Access for learners.<br />A platform for institutions.</h1><p>The initial model combines discoverable educational content with paid individual access and annual institutional licences. Final prices will follow bounded pilot evidence rather than being invented before usage and support costs are known.</p></section>
      <section className="plan-grid">
        {plans.map((plan, index) => <article className={plan.name === "Institution" ? "featured-plan" : ""} key={plan.name}><span>0{index + 1}</span><h2>{plan.name}</h2><b>{plan.price}</b><p>{plan.audience}</p><ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></article>)}
      </section>
      <section className="pricing-factors"><div><p className="section-index">Institutional pricing</p><h2>Simple inputs, predictable annual cost.</h2><p>The recommended institutional fee is a base platform licence plus transparent bands for active learners, authorised educators, managed media storage and optional integration or support requirements.</p></div><div className="factor-list">{["Active learner band", "Educator and administrator band", "Publication-cleared media storage", "SSO, LMS and support tier"].map((factor, index) => <div key={factor}><span>0{index + 1}</span><b>{factor}</b></div>)}</div></section>
      <section className="pricing-boundary"><div><p className="section-index">Always outside the licence</p><h2>No clinical access is bundled or implied.</h2></div><p>Payment for Visible Medicine never grants access to Didanix PACS, clinical archives, diagnostic functionality, patient worklists or a clinical identity. The products remain commercially and technically separate.</p></section>
      <section className="pricing-cta"><div><p className="section-index">Founding pilots</p><h2>Validate value before setting permanent prices.</h2><p>Begin with a small number of institutions, bounded cohorts and explicit success measures for educator time, learner engagement, support load and storage.</p></div><Link className="primary-button" href="/institutions#pilot-path">Plan a pilot <span>→</span></Link></section>
    </main>
  );
}
