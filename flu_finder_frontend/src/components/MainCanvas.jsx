import React from "react";
import MapCanvas from "./MapCanvas";
import LatestInfections from "./LatestInfections";
import BirdFluResources from "./BirdFluResources";

const MainCanvas = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1 }}>
        <MapCanvas />
      </div>
      <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
        <div style={{ flex: 1 }}>
          <LatestInfections />
        </div>
        <div style={{ flex: 1 }}>
          <BirdFluResources />
        </div>
      </div>
    </div>
  );
};

export default MainCanvas;
