import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchCCT } from "../actions";
import D3HyperGraph from "../ui/d3-hyper-graph";

export default function CCTWrapper() {
	const dispatch = useDispatch();

	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const cct = useSelector((store) => store.cct);

	const [nodes, setNodes] = useState([]);
	const [links, setLinks] = useState([]);
	const [nodesDict, setNodesDict] = useState({});

	const containerID = useRef("cct-view");
	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 40,
		width: window.innerWidth / 3 - 30,
		height: window.innerHeight / 3 - 50
	};

	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchCCT());
		}
	}, [selectedExperiment]);

	// Collapse the node and all it's children
	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}

	function process(cct) {
		var treeData = {
			name: "cudaGetDeviceProperties",
			cat: "cuda",
			children: [
				{
					name: "fill_col_format",
					cat: "cpu_compute",
					children: [
						{
							name: "sgemm_v2",
							cat: "gpu_compute"
						}
					]
				},
				{
					name: "cudaMemcpy",
					cat: "data_mov",
					children: [
						{
							name: "Memcpy HtoD",
							cat: "data_mov",
							children: [
								{
									name: "Memcpy DtoH",
									cat: "data_mov"
								}
							]
						}
					]
				},
				{
					name: "cudaMalloc",
					cat: "data_mov",
					children: [
						{
							name: "cudaDeviceSynchronize",
							cat: "cuda",
							children: [
								{
									name: "cudaLaunchKernel",
									cat: "cuda",
									children: [
										{
											name: "cudaFree",
											cat: "cuda",
											children: [
												{
													name: "cudaFreeHost",
													cat: "cuda"
												}
											]
										}
									]
								}
							]
						}
					]
				}
			]
		};

		const treemap = d3.tree().size([style.height, style.width]);

		const root = d3.hierarchy(treeData);

		// Assigns the x and y position for the nodes
		var treeData = treemap(root);

		console.log(treeData);

		// // Compute the new tree layout.
		var _nodes = treeData.descendants(),
			_links = treeData.descendants().slice(1);

		console.log(_nodes, _links);
		root.children.forEach(collapse);

		const simulation = d3
			.forceSimulation(_nodes)
			.force(
				"link",
				d3
					.forceLink(_links)
					.id((d) => d.name)
					.distance(0)
					.strength(1)
			)
			.force("charge", d3.forceManyBody().strength(-50))
			.force("x", d3.forceX())
			.force("y", d3.forceY());

		console.log(_nodes, _links);

		setNodes(_nodes);
		setLinks(_links);
	}

	function process_linkage(cct) {
		const _nodes = cct["nodes"];
		const _links = cct["links"];
		let node_dict = {};

		_nodes.forEach((node) => {
			node.links_idx = { source: [], target: [] };
			node_dict[node.id] = node;
		});

		for (let i = 0; i < links.length; i++) {
			let l = _links[i];
			node_dict[l.source].links_idx.source.push(i);
			node_dict[l.target].links_idx.target.push(i);
		}

		// Find the coordinates.
		let distance_scale = d3.scaleLinear().domain([0, 4]).range([0, 120]);

		_links.forEach((l) => {
			l.distance = distance_scale(l.depth);
		});

		const simulation = d3
			.forceSimulation(_nodes)
			.force(
				"link",
				d3
					.forceLink(_links)
					.distance((d) => d.distance)
					.id((d) => d.id)
			)
			.force("charge", d3.forceManyBody(50))
			.force("center", d3.forceCenter(0, 0))
			.force("x", d3.forceX().strength(0.02))
			.force("y", d3.forceY().strength(0.03))
			.stop();
		simulation.tick(300);

		setNodes(_nodes);
		setLinks(_links);
		setNodesDict(node_dict);
	}

	useEffect(() => {
		if (nodes.length == 0) {
			process(cct);
		}
	}, [cct]);

	return (
		<Grid container>
			{nodes.length > 0 ? (
				<Card style={{ borderColor: "gray" }}>
					<D3HyperGraph
						containerName={containerID.current}
						style={style}
						nodes={nodes}
						links={links}
						node_dict={nodesDict}
					/>
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
