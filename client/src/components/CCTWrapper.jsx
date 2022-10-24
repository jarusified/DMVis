import React, { useEffect, useRef } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import { useDispatch, useSelector } from "react-redux";

import { fetchCCT } from "../actions";
import D3HyperGraph from "../ui/d3-hyper-graph";

function CCTWrapper() {
	const dispatch = useDispatch();

	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const cct = useSelector((store) => store.cct);
	
	const containerID = useRef("cct-view");
	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 40,
		width: window.innerWidth / 3,
		height: window.innerHeight / 3
	};
	
	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchCCT());
		}
	}, [selectedExperiment]);

    return (
		<Grid container>
			{Object.keys(cct).length > 0 ? (
				<Card style={{ borderColor: "gray" }}>
					<D3HyperGraph
						containerName={containerID.current}
						style={style}
						nodes={cct['nodes']}
                        links={cct['links']}
					/>
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
    )
}       

export default CCTWrapper;
