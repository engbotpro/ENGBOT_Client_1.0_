import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import worldGeoJSON from "./../assets/countries.geo.json"; // Certifique-se de ter o GeoJSON

const WorldMapWithContours = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const svg = d3.select(svgRef.current)
                  .attr("width", width)
                  .attr("height", height);

    const projection = d3.geoMercator()
                         .scale(150)
                         .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Renderiza os contornos do mapa
    svg.selectAll("path")
       .data(worldGeoJSON.features)
       .enter()
       .append("path")
       .attr("d", path as any)
       .attr("fill", "none")
       .attr("stroke", "#fff")
       .attr("stroke-width", 1)
       .attr("opacity", 0.8);

    // Você pode adicionar animações com D3 ou CSS aqui

  }, []);

  return <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} />;
};

export default WorldMapWithContours;
