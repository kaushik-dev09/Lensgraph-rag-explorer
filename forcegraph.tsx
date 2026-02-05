
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink } from '../services/types';

interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick: (node: GraphNode) => void;
}

const COLORS: Record<string, string> = {
  photo: '#8b5cf6', // violet
  location: '#10b981', // emerald
  date: '#f59e0b', // amber
  tag: '#3b82f6', // blue
  description: '#64748b' // slate
};

export const ForceGraph: React.FC<ForceGraphProps> = ({ nodes, links, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll("*").remove(); // Clear previous

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const link = g.append('g')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (_event, d) => onNodeClick(d));

    // Circle for non-photo nodes
    node.filter(d => d.type !== 'photo')
      .append('circle')
      .attr('r', 12)
      .attr('fill', d => COLORS[d.type] || '#fff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Images for photo nodes
    node.filter(d => d.type === 'photo')
      .append('image')
      .attr('href', d => d.imageUrl || '')
      .attr('x', -30)
      .attr('y', -30)
      .attr('width', 60)
      .attr('height', 60)
      .attr('style', 'clip-path: circle(50%)');
    
    // Borders for images
    node.filter(d => d.type === 'photo')
      .append('circle')
      .attr('r', 32)
      .attr('fill', 'none')
      .attr('stroke', COLORS.photo)
      .attr('stroke-width', 3);

    // Labels
    node.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, onNodeClick]);

  return (
    <svg 
      ref={svgRef} 
      className="w-full h-full"
    />
  );
};

