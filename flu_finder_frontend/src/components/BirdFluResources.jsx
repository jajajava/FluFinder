import React from "react";
import { useMediaQuery } from "@mui/material";

const BirdFluResources = () => {
  const isMobile = useMediaQuery("(max-width:768px)");

  const resources = [
    {
      title: "CDC H5 Bird Flu: Current Situation",
      description: "Situation summary of confirmed and probable human cases since 2024.",
      link: "https://www.cdc.gov/bird-flu/situation-summary/index.html",
      logo: "/assets/cdc-logo.jpg",
    },
    {
      title: "WOAH Avian Influenza",
      description: "Understanding new spread patterns to better combat the disease.",
      link: "https://www.woah.org/en/disease/avian-influenza/#ui-id-5",
      logo: "/assets/woah-logo.png",
    },
    {
      title: "USDA Avian Influenza",
      description: "United States Department of Agriculture's HPAI guidelines.",
      link: "https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza",
      logo: "/assets/usda-logo.png",
    },
    {
      title: "CDC Avian Influenza in Birds: Causes and How It Spreads",
      description: "Learn more about relevant terminology and transmission factors.",
      link: "https://www.cdc.gov/bird-flu/virus-transmission/avian-in-birds.html",
      logo: "/assets/cdc-logo.jpg"
    },
    {
      title: "CDC Reported H5N1 Bird Flu in Poultry",
      description: "Information about affected poultry, updated daily. Source of FluFinder's data.",
      link: "https://www.cdc.gov/bird-flu/situation-summary/data-map-commercial.html",
      logo: "/assets/cdc-logo.jpg"
    },
    // Removed this one cause it's not aligned with the latest infections table on my computer
    // If it aligns better on your end, you can put it back in
    // {
    //   title: "WHO Influenza (Avian and Other Zoonotic)",
    //   description: "Telling apart flu types, assessing their risks, and more.",
    //   link: "https://www.who.int/news-room/fact-sheets/detail/influenza-(avian-and-other-zoonotic)",
    //   logo: "/assets/who-logo.png"
    // }
  ];

  return (
    <div style={{
      padding: isMobile ? "0.5rem" : "0.625rem",
      height: "100%",
      overflowY: "auto"
    }}>
      <h2 style={{
        fontSize: isMobile ? "1.25rem" : "1.5rem",
        marginBottom: "0.625rem",
        marginTop: "0"
      }}>
        Bird Flu Resources
      </h2>
      <p style={{
        fontSize: isMobile ? "0.875rem" : "1rem",
        marginBottom: "0.85rem",
        lineHeight: "1.5"
      }}>
        Below are trusted resources for information on avian influenza (bird flu). These links provide official guidelines and updates on the disease.
      </p>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.9375rem"
      }}>
        {resources.map((resource, index) => (
          <div
            key={index}
            style={{
              border: "0.0625rem solid #ccc",
              borderRadius: "0.5rem",
              padding: isMobile ? "0.75rem" : "1rem",
              backgroundColor: "#2a2a2a",
              boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem"
            }}>
              {resource.logo && (
                <img
                  src={resource.logo}
                  alt={`${resource.title} logo`}
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    objectFit: "contain",
                    borderRadius: "0.25rem"
                  }}
                />
              )}
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#4dabf5",
                  textDecoration: "none",
                  fontSize: isMobile ? "1rem" : "1.125rem",
                  fontWeight: "bold",
                  display: "block"
                }}
              >
                {resource.title}
              </a>
            </div>
            <p style={{
              fontSize: isMobile ? "0.875rem" : "1rem",
              margin: "0",
              lineHeight: "1.4"
            }}>
              {resource.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BirdFluResources;
