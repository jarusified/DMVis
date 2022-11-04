import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
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

	function process(cct) {
		const _nodes = cct["nodes"];
		const _links = cct["links"];
		let node_dict = {};

		_nodes.forEach((node) => {
			node.links_idx = { source: [], target: [] };
			node_dict[node.id] = node;
		});

         for(let i = 0; i < links.length; i++){
            let l = _links[i];
            // console.log(l.source, node_dict, node_dict[l.source]);
            node_dict[l.source].links_idx.source.push(i);
            node_dict[l.target].links_idx.target.push(i);
        }

        // Find the coordinates.
        let distance_scale = d3.scaleLinear()
            .domain([1,10])
            .range([30,120])

        _links.forEach(l=>{
            let source_size = l.source.split(".").length;
            let target_size = l.target.split(".").length;
            l.distance = distance_scale(Math.min((source_size+target_size)/2, 10));
        })

        const simulation = d3.forceSimulation(_nodes)
            .force("link", d3.forceLink(_links).distance(d => d.distance).id(d => d.id))
            // .force("charge", d3.forceManyBody(-500))
            .force("center", d3.forceCenter(0, 0))
            .force("x", d3.forceX().strength(0.02))
            .force("y", d3.forceY().strength(0.03))
            .stop();
        simulation.tick(300);

		console.log("here", node_dict);

		setNodes(_nodes);
		setLinks(_links);
		setNodesDict(node_dict);
	}

	useEffect(() => {
		if (nodes.length == 0) {
			process(cct);
		}
	}, [cct])

    return (
		<Grid container>
			{Object.keys(nodesDict).length > 0 ? (
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
    )
}