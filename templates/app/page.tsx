import { site } from "@/lib/site";
import type { Section } from "@/lib/types";

import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import Trustbar from "@/components/sections/Trustbar";
import Services from "@/components/sections/Services";
import Features from "@/components/sections/Features";
import About from "@/components/sections/About";
import Process from "@/components/sections/Process";
import Portfolio from "@/components/sections/Portfolio";
import Pricing from "@/components/sections/Pricing";
import Team from "@/components/sections/Team";
import Reviews from "@/components/sections/Reviews";
import Faq from "@/components/sections/Faq";
import Cta from "@/components/sections/Cta";
import Contacts from "@/components/sections/Contacts";
import Footer from "@/components/sections/Footer";

// Реестр: type из site.json → компонент секции.
const REGISTRY: Record<string, React.ComponentType<{ data: Section }>> = {
  header: Header, hero: Hero, trustbar: Trustbar, services: Services,
  features: Features, about: About, process: Process, portfolio: Portfolio,
  pricing: Pricing, team: Team, reviews: Reviews, faq: Faq, cta: Cta,
  contacts: Contacts, footer: Footer,
};

export default function Page() {
  return (
    <>
      {site.sections.map((section, i) => {
        const Cmp = REGISTRY[section.type];
        if (!Cmp) {
          if (process.env.NODE_ENV !== "production") {
            return (
              <div key={section.id ?? i} style={{ padding: 24, color: "#b91c1c" }}>
                Неизвестный тип секции: <b>{section.type}</b>
              </div>
            );
          }
          return null;
        }
        return <Cmp key={section.id ?? i} data={section} />;
      })}
    </>
  );
}
